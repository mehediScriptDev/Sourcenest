// We keep this file to export shared formatting helpers, status flows, and labels.
// It no longer uses React Context or localStorage.

export type OrderStatus =
  | "created"
  | "in-production"
  | "ready"
  | "shipped"
  | "completed"
  | "cancelled"

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "created",
  "in-production",
  "ready",
  "shipped",
  "completed",
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Order Created",
  "in-production": "In Production",
  ready: "Ready for Shipment",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
}

export const SERVICE_STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Engagement Started",
  "in-production": "In Progress",
  ready: "Deliverables Ready",
  shipped: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
}

export type OrderKind = "product" | "service"

export function getStatusLabel(status: string | OrderStatus, kind: OrderKind = "product"): string {
  // Try to cast status back to OrderStatus to use our labels
  const s = status as OrderStatus;
  const map = kind === "service" ? SERVICE_STATUS_LABELS : ORDER_STATUS_LABELS;
  return map[s] || status;
}

export type OrderDocumentType =
  | "invoice"
  | "proforma"
  | "quotation"
  | "product-doc"
  | "other"

export const ORDER_DOCUMENT_LABELS: Record<string, string> = {
  invoice: "Invoice",
  proforma: "Proforma Invoice",
  quotation: "Quotation PDF",
  "product-doc": "Product Document",
  other: "Other",
}

export type OrderActor = "manufacturer" | "provider" | "buyer" | "admin" | string

export interface Order {
  id: string
  title: string
  kind: OrderKind
  quantity: string
  totalAmount: number
  currency: string
  estimatedDelivery: string
  providerId?: string
  manufacturerId?: string
  providerName?: string
  manufacturerName?: string
  buyerEmail: string
  buyerName: string
  buyerCompany: string
}

export interface OrderUpdate {
  status: OrderStatus
  note: string
  photos: string[]
  files: string[]
  createdAt: string
}

// Formatting helpers
export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatOrderDate(iso: string | null): string {
  if (!iso) return "N/A"
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso;
  }
}

// Dummy provider to not break existing layout if left intact while we transition.
// However, we recommend removing it from layout.tsx.
import { type ReactNode } from "react"
export function OrdersProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// We remove useOrders completely so it forces us to fix compile errors on pages that use it.
