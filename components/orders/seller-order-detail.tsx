"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  formatCurrency,
  formatOrderDate,
  getStatusLabel,
  ORDER_STATUS_FLOW,
  type OrderStatus,
} from "@/lib/orders-context"
import { useMessages } from "@/lib/messages-context"
import { getManufacturerOrder, summarizeOrderItems, updateManufacturerOrderStatus, type OrderDetailResponse, type OrderStatusUpdate } from "@/lib/api/orders"
import { queryKeys, queryKeyFamilies } from "@/lib/query-keys"
import { OrderLineItemsTable } from "@/components/orders/order-line-items-table"
import { useTranslation } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  Hammer,
  PackageCheck,
  XCircle,
  Plus,
  ImageIcon,
  Send,
  Download,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, { color: string; icon: typeof Clock }> = {
  created: { color: "bg-blue-100 text-blue-700", icon: Clock },
  "in-production": { color: "bg-amber-100 text-amber-700", icon: Hammer },
  ready: { color: "bg-violet-100 text-violet-700", icon: PackageCheck },
  shipped: { color: "bg-cyan-100 text-cyan-700", icon: Truck },
  completed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { color: "bg-gray-100 text-gray-600", icon: XCircle },
}

interface DetailConfig {
  kind: string
  basePath: string
  author: string
}

export function SellerOrderDetail({ orderId, config }: { orderId: string; config: DetailConfig }) {
  const { postOrderUpdate } = useMessages()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const numericId = Number.parseInt(orderId, 10)
  const isValidId = !Number.isNaN(numericId)
  const orderQueryKey = queryKeys.manufacturerOrderDetail(orderId)

  const orderQuery = useQuery({
    queryKey: orderQueryKey,
    queryFn: () => getManufacturerOrder(numericId),
    enabled: isValidId && Boolean(orderId),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (payload: {
      status: string
      notes?: string
      photos: File[]
      attachments: File[]
    }) =>
      updateManufacturerOrderStatus(numericId, {
        status: payload.status,
        notes: payload.notes,
        photos: payload.photos,
        attachments: payload.attachments,
      }),
  })

  const order = orderQuery.data?.success ? orderQuery.data.data : null
  const isLoading = orderQuery.isLoading
  const error = !isValidId
    ? t.mfg.orderDetails.notFound || "Invalid order ID"
    : orderQuery.data?.success === false
      ? orderQuery.data.message || t.mfg.orderDetails.notFound || "Failed to load order details"
      : !isLoading && !order
        ? t.mfg.orderDetails.notFound || "Failed to load order details"
        : null

  const [showForm, setShowForm] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("in-production")
  const [note, setNote] = useState("")
  
  // Real file attachment state
  const [photos, setPhotos] = useState<File[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSubmitting = updateStatusMutation.isPending
  const isService = config.kind === "service"

  useEffect(() => {
    if (order?.status) {
      setNewStatus(order.status)
    }
  }, [order?.status])

  const getLocalizedStatusLabel = (s: string) => {
    switch (s) {
      case "created": return isService ? "Engagement Started" : (t.mfg.orders.statusPending || "Pending");
      case "in-production": return isService ? "In Progress" : (t.mfg.orders.statusProcessing || "Processing");
      case "ready": return isService ? "Deliverables Ready" : "Ready for Shipment";
      case "shipped": return isService ? "Delivered" : (t.mfg.orders.statusShipped || "Shipped");
      case "completed": return t.mfg.orders.statusDelivered || "Completed";
      case "cancelled": return t.mfg.orders.statusCancelled || "Cancelled";
      default: return s;
    }
  }

  if (!isValidId) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center sm:py-16">
        <h1 className="font-serif text-xl font-medium text-foreground">{t.mfg.orderDetails.notFound}</h1>
        <Button asChild variant="outline" className="mt-4">
          <Link href={config.basePath}>{t.mfg.orderDetails.backToList}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center sm:py-16">
        <h1 className="font-serif text-xl font-medium text-foreground">{error || t.mfg.orderDetails.notFound}</h1>
        <Button asChild variant="outline" className="mt-4">
          <Link href={config.basePath}>{t.mfg.orderDetails.backToList}</Link>
        </Button>
      </div>
    )
  }

  const style = statusStyles[order.status] || { color: "bg-gray-100 text-gray-700", icon: Clock }
  const StatusIcon = style.icon
  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status as OrderStatus)
  const itemsSummary = summarizeOrderItems(order.items, {
    quantity: order.quantity,
    quantityUnit: order.quantityUnit,
    productName: order.productName !== "N/A" ? order.productName : undefined,
  })

  const submitUpdate = async () => {
    if (!order) return
    if (!note.trim() && order.status === newStatus) return

    const trimmedNote = note.trim()

    const res = await updateStatusMutation.mutateAsync({
      status: newStatus,
      notes: trimmedNote || undefined,
      photos,
      attachments,
    })

    if (res.success && res.data) {
      queryClient.setQueryData(orderQueryKey, (previous: OrderDetailResponse | undefined) => {
        if (!previous) return previous
        return { ...previous, success: true, data: res.data }
      })
      void queryClient.invalidateQueries({ queryKey: queryKeyFamilies.manufacturerOrders })
      void queryClient.invalidateQueries({ queryKey: queryKeys.manufacturerOrderStats() })

      try {
        postOrderUpdate(res.data as unknown as Parameters<typeof postOrderUpdate>[0], {
          status: newStatus as OrderStatus,
          note: trimmedNote,
          photos: photos.map((f) => f.name),
          files: attachments.map((f) => f.name),
          createdAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Failed to post message", e)
      }

      setNote("")
      setPhotos([])
      setAttachments([])
      setShowForm(false)
    } else {
      alert(res.message || "Failed to post update")
    }
  }

  return (
    <div className="w-full">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground">
        <Link href={config.basePath}>
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
      </Button>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{order.orderNumber}</span>
              <Badge className={cn("gap-1 text-xs", style.color)}>
                <StatusIcon className="h-3 w-3" />
                {getLocalizedStatusLabel(order.status)}
              </Badge>
            </div>
            <h1 className="mt-1.5 font-serif text-2xl font-medium text-foreground">{order.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {order.buyerCompany} · {order.buyerName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl font-medium text-foreground">
              {formatCurrency(order.totalAmount, order.currencyCode)}
            </p>
            <p className="text-xs text-muted-foreground">{itemsSummary.quantityLabel}</p>
          </div>
        </div>

        {/* Stepper */}
        {order.status !== "cancelled" && (
          <div className="mt-6 flex items-center">
            {ORDER_STATUS_FLOW.map((s, i) => {
              const reached = currentIndex >= 0 && i <= currentIndex
              return (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                        reached
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {reached ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className="mt-1.5 hidden text-center text-[10px] leading-tight text-muted-foreground sm:block">
                      {getLocalizedStatusLabel(s)}
                    </span>
                  </div>
                  {i < ORDER_STATUS_FLOW.length - 1 && (
                    <div className={cn("mx-1 h-0.5 flex-1", reached && i < currentIndex ? "bg-secondary" : "bg-border")} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <OrderLineItemsTable
          items={order.items}
          currencyCode={order.currencyCode}
          totalAmount={order.totalAmount}
          title={t.mfg.orderDetails.items}
          labels={{
            product: t.mfg.orderNew.selectProduct,
            quantity: t.mfg.orderDetails.quantity,
            unitPrice: t.mfg.orderNew.unitPrice,
            lineTotal: t.mfg.orderNew.lineTotal,
            orderTotal: t.mfg.orderDetails.total,
            notes: t.mfg.inquiryDetails.notes || "Notes",
          }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Add update */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-medium text-foreground">{t.mfg.orderDetails.progressUpdates}</h2>
              {order.status !== "completed" && order.status !== "cancelled" && (
                <Button size="sm" variant={showForm ? "outline" : "default"} className="gap-1.5" onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4" />
                  {showForm ? t.common.cancel : t.mfg.orderDetails.addUpdate}
                </Button>
              )}
            </div>

            {showForm && (
              <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label className="text-sm">{t.mfg.orderDetails.setStatus}</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_FLOW.concat("cancelled" as OrderStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {getLocalizedStatusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t.mfg.orderDetails.updateNote}</Label>
                  <Textarea
                    placeholder={
                      isService
                        ? "Share progress, milestones, or what you completed for the client..."
                        : "Share production progress, photos, QC notes, or shipping details..."
                    }
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
                {/* Real file attachments */}
                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={photoInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        setPhotos((prev) => [...prev, ...Array.from(e.target.files as FileList)])
                      }
                      e.target.value = ""
                    }}
                  />
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        setAttachments((prev) => [...prev, ...Array.from(e.target.files as FileList)])
                      }
                      e.target.value = ""
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                    {t.mfg.orderDetails.addPhoto}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-4 w-4" />
                    {t.mfg.orderDetails.attachFile}
                  </Button>
                </div>
                {(photos.length > 0 || attachments.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {photos.map((p, i) => (
                      <Badge key={`p-${i}`} variant="secondary" className="gap-1 text-xs">
                        <ImageIcon className="h-3 w-3" />
                        {p.name}
                        <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="ml-1">
                          <XCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                    {attachments.map((f, i) => (
                      <Badge key={`f-${i}`} variant="secondary" className="gap-1 text-xs">
                        <FileText className="h-3 w-3" />
                        {f.name}
                        <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="ml-1">
                          <XCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Button onClick={submitUpdate} disabled={isSubmitting || (!note.trim() && order.status === newStatus)} className="gap-1.5">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t.mfg.orderDetails.postUpdate}
                </Button>
              </div>
            )}

            {/* Timeline */}
            <div className="mt-5 space-y-5">
              {[...order.statusUpdates].reverse().map((u) => {
                const uStyle = statusStyles[u.status] || { color: "bg-gray-100 text-gray-700", icon: Clock }
                const UIcon = uStyle.icon
                return (
                  <div key={u.id} className="relative flex gap-3 pb-1">
                    <div className="flex flex-col items-center">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", uStyle.color)}>
                        <UIcon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{getLocalizedStatusLabel(u.status)}</span>
                        <span className="text-xs text-muted-foreground">{formatOrderDate(u.createdAt)}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{u.author}</Badge>
                      </div>
                      {u.notes && <p className="mt-1 text-sm text-muted-foreground">{u.notes}</p>}
                      {u.photos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {u.photos.map((p, i) => (
                            <a key={i} href={p} target="_blank" rel="noopener noreferrer">
                              <Badge variant="secondary" className="gap-1 text-xs hover:bg-secondary/80">
                                <ImageIcon className="h-3 w-3" />
                                {p.split('/').pop()}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      )}
                      {u.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {u.attachments.map((f) => (
                            <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer">
                              <Badge variant="secondary" className="gap-1 text-xs hover:bg-secondary/80">
                                <FileText className="h-3 w-3" />
                                {f.name}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {order.statusUpdates.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center text-sm text-muted-foreground">
                  <Clock className="mb-2 h-6 w-6 opacity-20" />
                  {t.mfg.orderDetails.noUpdatesYet}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-medium text-foreground">{t.mfg.orderDetails.details || "Details"}</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Row label={isService ? (t.mfg.orderDetails.scope || "Scope") : "Products"} value={itemsSummary.lineCount > 1 ? `${itemsSummary.lineCount} products` : itemsSummary.productLabel} />
              <Row label={isService ? (t.mfg.orderDetails.scope || "Scope") : t.mfg.orderDetails.quantity} value={itemsSummary.quantityLabel} />
              <Row label={t.mfg.orderDetails.total} value={formatCurrency(order.totalAmount, order.currencyCode)} />
              <Row label={isService ? "Timeline" : t.mfg.orderDetails.productionTime} value={order.productionLead || "N/A"} />
              <Row label={isService ? "Delivery date" : t.mfg.orderDetails.estDelivery} value={formatOrderDate(order.estimatedDeliveryAt)} icon={Calendar} />
              <Row label={t.mfg.orderDetails.paymentTerms} value={order.paymentTerms || "N/A"} />
              {!isService && <Row label={t.mfg.orderDetails.shippingTerms} value={order.shippingTerms || "N/A"} />}
              {!isService && <Row label={t.mfg.orderDetails.destination} value={order.destination || "N/A"} />}
            </dl>
            {order.notes && (
              <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">{order.notes}</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-medium text-foreground">{t.mfg.orderDetails.documents}</h2>
            <div className="mt-3 space-y-2">
              {order.attachments.length === 0 && (
                <p className="text-sm text-muted-foreground">{t.mfg.orderDetails.noDocuments}</p>
              )}
              {order.attachments.map((doc) => (
                <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 hover:bg-muted/50 transition-colors">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{doc.name}</span>
                  </span>
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Calendar }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5 text-right font-medium text-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value}
      </dd>
    </div>
  )
}
