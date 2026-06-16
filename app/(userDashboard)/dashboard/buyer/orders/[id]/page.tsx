"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_FLOW,
  formatCurrency,
  formatOrderDate,
  type OrderStatus,
} from "@/lib/orders-context"
import { getBuyerOrder, type ApiOrder, type OrderStatusUpdate } from "@/lib/api/orders"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Factory,
  Package,
  FileText,
  Download,
  MapPin,
  Clock,
  Hammer,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  Ship,
  Box,
  StickyNote,
  ImageIcon,
  MessageSquare,
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

function StatusStepper({ status }: { status: string }) {
  const cancelled = status === "cancelled"
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status as OrderStatus)

  return (
    <div className="flex items-center">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const done = !cancelled && i <= currentIndex
        const Icon = statusStyles[s]?.icon || Clock
        return (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                  done
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "max-w-[72px] text-center text-[11px] leading-tight",
                  done ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_LABELS[s]}
              </span>
            </div>
            {i < ORDER_STATUS_FLOW.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-5 h-0.5 flex-1 rounded-full transition-colors",
                  !cancelled && i < currentIndex ? "bg-secondary" : "bg-border",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string | number | null
}) {
  if (value == null) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function UpdateEntry({ update, isLast }: { update: OrderStatusUpdate; isLast: boolean }) {
  const style = statusStyles[update.status] || { color: "bg-gray-100 text-gray-700", icon: Clock }
  const Icon = style.icon
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* line */}
      {!isLast && <div className="absolute left-[15px] top-9 h-full w-0.5 bg-border" />}
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          style.color,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="font-medium text-foreground">{ORDER_STATUS_LABELS[update.status as OrderStatus] || update.status}</p>
          <span className="text-xs text-muted-foreground">{formatOrderDate(update.createdAt)}</span>
        </div>
        {update.notes && <p className="mt-1 text-sm text-muted-foreground">{update.notes}</p>}

        {/* Photos */}
        {update.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {update.photos.map((photo, i) => (
              <a
                key={i}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-video overflow-hidden rounded-lg border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo || "/placeholder.svg"}
                  alt={`${update.status} update photo ${i + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        )}

        {/* Files */}
        {update.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {update.attachments.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true)
      const numericId = parseInt(id, 10)
      if (isNaN(numericId)) {
        setError("Invalid order ID")
        setIsLoading(false)
        return
      }

      const res = await getBuyerOrder(numericId)
      if (res.success && res.data) {
        setOrder(res.data)
      } else {
        setError(res.message || "Failed to load order details")
      }
      setIsLoading(false)
    }

    fetchOrder()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{error || "Order not found"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/buyer/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  const style = statusStyles[order.status] || { color: "bg-gray-100 text-gray-700", icon: Clock }
  const StatusIcon = style.icon
  const reversedUpdates = [...order.statusUpdates].reverse()

  return (
    <div className="w-full">
      {/* Back */}
      <Link
        href="/dashboard/buyer/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{order.orderNumber}</span>
              <Badge className={cn("gap-1 text-xs", style.color)}>
                <StatusIcon className="h-3 w-3" />
                {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
              </Badge>
            </div>
            <h1 className="mt-1.5 font-serif text-2xl font-medium text-foreground">{order.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Factory className="h-4 w-4" />
                {order.manufacturerName}
              </span>
              {order.productId && (
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {order.productName}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/buyer/messages?manufacturer=${order.manufacturerId}`}>
              <MessageSquare className="h-4 w-4" />
              Message Manufacturer
            </Link>
          </Button>
        </div>

        {/* Stepper */}
        {order.status !== "cancelled" ? (
          <div className="mt-6 border-t border-border pt-6">
            <StatusStepper status={order.status} />
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            This order has been cancelled.
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Left: details + documents */}
        <div className="space-y-6 lg:col-span-3">
          {/* Order details */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium text-foreground">Order Details</h2>
            <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
              <DetailRow icon={Package} label="Quantity" value={`${order.quantity} ${order.quantityUnit}`} />
              <DetailRow
                icon={CreditCard}
                label="Total Amount"
                value={formatCurrency(order.totalAmount, order.currencyCode)}
              />
              <DetailRow icon={Clock} label="Production Time" value={order.productionLead} />
              <DetailRow
                icon={Calendar}
                label="Estimated Delivery"
                value={formatOrderDate(order.estimatedDeliveryAt)}
              />
              <DetailRow icon={CreditCard} label="Payment Terms" value={order.paymentTerms} />
              <DetailRow icon={Ship} label="Shipping Terms" value={order.shippingTerms} />
              <DetailRow icon={MapPin} label="Destination" value={order.destination} />
            </div>
            {order.notes && (
              <div className="mt-3 flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground">{order.notes}</p>
                </div>
              </div>
            )}
          </section>

          {/* Documents */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium text-foreground">Documents</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Invoices, quotations, and product files shared by the manufacturer.
            </p>
            <div className="mt-4 space-y-2">
              {order.attachments.length > 0 ? (
                order.attachments.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No documents attached.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right: progress timeline */}
        <div className="lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium text-foreground">Progress Updates</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Photos, documents, and notes posted as your order moves forward.
            </p>
            <div className="mt-5">
              {reversedUpdates.length > 0 ? (
                reversedUpdates.map((update, i) => (
                  <UpdateEntry key={update.id} update={update} isLast={i === reversedUpdates.length - 1} />
                ))
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No updates yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
