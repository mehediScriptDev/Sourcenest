"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { type ReactNode } from "react"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_FLOW,
  getStatusLabel,
  formatCurrency,
  formatOrderDate,
  type OrderStatus,
} from "@/lib/orders-context"
import {
  getAdminOrder,
  getBuyerOrder,
  summarizeOrderItems,
  type ApiOrder,
  type OrderStatusUpdate,
} from "@/lib/api/orders"
import { queryKeys } from "@/lib/query-keys"
import { OrderLineItemsTable } from "@/components/orders/order-line-items-table"
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
  StickyNote,
  ImageIcon,
  MessageSquare,
  Loader2,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

const statusStyles: Record<string, { color: string; icon: typeof Clock }> = {
  created: { color: "bg-blue-100 text-blue-700", icon: Clock },
  "in-production": { color: "bg-amber-100 text-amber-700", icon: Hammer },
  ready: { color: "bg-violet-100 text-violet-700", icon: PackageCheck },
  shipped: { color: "bg-cyan-100 text-cyan-700", icon: Truck },
  completed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { color: "bg-gray-100 text-gray-600", icon: XCircle },
}

export type OrderDetailRole = "buyer" | "admin"

export interface OrderDetailViewProps {
  orderId: string
  role: OrderDetailRole
  basePath: string
}

function StatusStepper({ status }: { status: string }) {
  const cancelled = status === "cancelled"
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status as OrderStatus)

  const translateStatus = (s: string) => getStatusLabel(s)

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
                {translateStatus(s)}
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
  value: ReactNode
}) {
  if (value == null || value === "") return null
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}

function UpdateEntry({
  update,
  isLast,
}: {
  update: OrderStatusUpdate
  isLast: boolean
}) {
  const style = statusStyles[update.status] || { color: "bg-gray-100 text-gray-700", icon: Clock }
  const Icon = style.icon

  const translateStatus = (s: string) => getStatusLabel(s)

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
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
          <p className="font-medium text-foreground">{translateStatus(update.status)}</p>
          <span className="text-xs text-muted-foreground">{formatOrderDate(update.createdAt)}</span>
          {update.author && (
            <Badge variant="outline" className="text-[10px] capitalize">
              {update.author}
            </Badge>
          )}
        </div>
        {update.notes && <p className="mt-1 text-sm text-muted-foreground">{update.notes}</p>}

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

async function fetchOrderByRole(role: OrderDetailRole, numericId: number) {
  if (role === "admin") {
    return getAdminOrder(numericId)
  }
  return getBuyerOrder(numericId)
}

export function OrderDetailView({ orderId, role, basePath }: OrderDetailViewProps) {
  const { t } = useTranslation()
  const numericId = Number.parseInt(orderId, 10)
  const isValidId = !Number.isNaN(numericId)

  const labels =
    role === "admin"
      ? {
          back: t.admin.pages.orders.title,
          notFound: t.admin.pages.orders.noMatching,
          failedToLoad: "Failed to load order.",
          invalidId: "Invalid order ID.",
          orderDetails: "Order details",
          documents: "Documents",
          statusUpdates: "Status updates",
          noDocuments: "No documents attached.",
          noUpdates: "No status updates yet.",
        }
      : {
          back: t.buyer.orders.details.backToOrders,
          notFound: t.buyer.orders.details.notFound,
          failedToLoad: t.buyer.orders.details.failedToLoad,
          invalidId: t.buyer.orders.details.invalidId,
          orderDetails: t.buyer.orders.details.orderDetails,
          documents: t.buyer.orders.details.documents,
          statusUpdates: t.buyer.orders.details.statusUpdates,
          noDocuments: t.buyer.orders.details.noDocuments,
          noUpdates: t.buyer.orders.details.noUpdates,
          orderPlaced: t.buyer.orders.details.orderPlaced,
          products: "Products",
          documentsHelp: "Invoices, quotations, and product files shared by the manufacturer.",
          updatesHelp: "Photos, documents, and notes posted as your order moves forward.",
          cancelled: "This order has been cancelled.",
          messageManufacturer: "Message Manufacturer",
        }

  const orderQueryKey =
    role === "admin"
      ? queryKeys.adminOrderDetail(orderId)
      : queryKeys.buyerOrderDetail(orderId)

  const orderQuery = useQuery({
    queryKey: orderQueryKey,
    queryFn: () => fetchOrderByRole(role, numericId),
    enabled: isValidId && Boolean(orderId),
  })

  const order = orderQuery.data?.success ? orderQuery.data.data : null
  const isLoading = orderQuery.isLoading
  const error = !isValidId
    ? labels.invalidId
    : orderQuery.data?.success === false
      ? orderQuery.data.message || labels.failedToLoad
      : !isLoading && !order
        ? labels.notFound
        : null

  if (!isValidId) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">{labels.invalidId}</p>
        <Button asChild variant="outline">
          <Link href={basePath}>{labels.back}</Link>
        </Button>
      </div>
    )
  }

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
        <p className="text-muted-foreground">{error || labels.notFound}</p>
        <Button asChild variant="outline">
          <Link href={basePath}>{labels.back}</Link>
        </Button>
      </div>
    )
  }

  const style = statusStyles[order.status] || { color: "bg-gray-100 text-gray-700", icon: Clock }
  const StatusIcon = style.icon
  const reversedUpdates = [...order.statusUpdates].reverse()

  const statusLabel = getStatusLabel(order.status)
  const itemsSummary = summarizeOrderItems(order.items, {
    quantity: order.quantity,
    quantityUnit: order.quantityUnit,
    productName: order.productName !== "N/A" ? order.productName : undefined,
  })

  return (
    <div className="w-full">
      <Link
        href={basePath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {labels.back}
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{order.orderNumber}</span>
              <Badge className={cn("gap-1 text-xs", style.color)}>
                <StatusIcon className="h-3 w-3" />
                {statusLabel}
              </Badge>
            </div>
            <h1 className="mt-1.5 font-serif text-2xl font-medium text-foreground">{order.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {role === "buyer" && "orderPlaced" in labels && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {labels.orderPlaced} {formatOrderDate(order.createdAt)}
                </span>
              )}
              {role !== "buyer" && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatOrderDate(order.createdAt)}
                </span>
              )}
              {role === "admin" && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {order.buyerCompany || order.buyerName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Factory className="h-4 w-4" />
                {order.manufacturerName}
              </span>
              {itemsSummary.lineCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {role === "buyer" && itemsSummary.lineCount === 1 && order.items[0]?.productId ? (
                    <Link
                      href={`/products/${encodeURIComponent(order.items[0].productSlug || String(order.items[0].productId))}`}
                      className="transition-colors hover:text-secondary"
                    >
                      {itemsSummary.productLabel}
                    </Link>
                  ) : (
                    itemsSummary.productLabel
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="font-serif text-2xl font-medium text-foreground">
              {formatCurrency(order.totalAmount, order.currencyCode)}
            </p>
            <p className="text-xs text-muted-foreground">{itemsSummary.quantityLabel}</p>
            {role === "buyer" && order.manufacturerId && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/buyer/messages?manufacturer=${order.manufacturerId}`}>
                  <MessageSquare className="h-4 w-4" />
                  {"messageManufacturer" in labels ? labels.messageManufacturer : "Message Manufacturer"}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {order.status !== "cancelled" ? (
          <div className="mt-6 border-t border-border pt-6">
            <StatusStepper status={order.status} />
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            {"cancelled" in labels ? labels.cancelled : "This order has been cancelled."}
          </div>
        )}
      </div>

      <div className="mt-6">
        <OrderLineItemsTable
          items={order.items}
          currencyCode={order.currencyCode}
          totalAmount={order.totalAmount}
          linkableProducts={role === "buyer"}
          title={role === "buyer" && "products" in labels ? labels.products : "Products"}
          labels={
            role === "buyer"
              ? {
                  product: t.buyer.orders.details.productName,
                  quantity: t.buyer.orders.details.quantity,
                  unitPrice: t.buyer.orders.details.unitPrice,
                  lineTotal: "Line total",
                  orderTotal: t.buyer.orders.details.totalAmount,
                }
              : {
                  quantity: "Quantity",
                  orderTotal: "Order total",
                }
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium text-foreground">{labels.orderDetails}</h2>
            <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
              <DetailRow
                icon={Package}
                label={role === "buyer" ? "Products" : "Line items"}
                value={
                  itemsSummary.lineCount > 1
                    ? `${itemsSummary.lineCount} products`
                    : role === "buyer" && order.items[0]?.productId
                      ? (
                          <Link
                            href={`/products/${encodeURIComponent(order.items[0].productSlug || String(order.items[0].productId))}`}
                            className="text-secondary hover:underline"
                          >
                            {itemsSummary.productLabel}
                          </Link>
                        )
                      : itemsSummary.productLabel
                }
              />
              <DetailRow
                icon={Package}
                label={role === "buyer" ? t.buyer.orders.details.quantity : "Total quantity"}
                value={itemsSummary.quantityLabel}
              />
              <DetailRow
                icon={CreditCard}
                label={role === "buyer" ? t.buyer.orders.details.totalAmount : "Total amount"}
                value={formatCurrency(order.totalAmount, order.currencyCode)}
              />
              <DetailRow icon={Clock} label="Production time" value={order.productionLead} />
              <DetailRow
                icon={Calendar}
                label={role === "buyer" ? t.buyer.orders.details.estimatedDelivery : "Estimated delivery"}
                value={formatOrderDate(order.estimatedDeliveryAt)}
              />
              <DetailRow
                icon={CreditCard}
                label={role === "buyer" ? t.buyer.orders.details.paymentMethod : "Payment terms"}
                value={order.paymentTerms}
              />
              <DetailRow
                icon={Ship}
                label={role === "buyer" ? t.buyer.orders.details.shippingDetails : "Shipping terms"}
                value={order.shippingTerms}
              />
              <DetailRow
                icon={MapPin}
                label={role === "buyer" ? t.buyer.orders.details.shippingAddress : "Destination"}
                value={order.destination}
              />
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

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium text-foreground">{labels.documents}</h2>
            {role === "buyer" && "documentsHelp" in labels && (
              <p className="mt-0.5 text-xs text-muted-foreground">{labels.documentsHelp}</p>
            )}
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
                <p className="py-6 text-center text-sm text-muted-foreground">{labels.noDocuments}</p>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium text-foreground">{labels.statusUpdates}</h2>
            {role === "buyer" && "updatesHelp" in labels && (
              <p className="mt-0.5 text-xs text-muted-foreground">{labels.updatesHelp}</p>
            )}
            <div className="mt-5">
              {reversedUpdates.length > 0 ? (
                reversedUpdates.map((update, i) => (
                  <UpdateEntry
                    key={update.id}
                    update={update}
                    isLast={i === reversedUpdates.length - 1}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">{labels.noUpdates}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
