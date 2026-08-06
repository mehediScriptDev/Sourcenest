"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/orders-context"
import type { OrderItem } from "@/lib/api/orders"
import { Package } from "lucide-react"

function productHref(line: OrderItem): string {
  const key = line.productSlug || String(line.productId)
  return `/products/${encodeURIComponent(key)}`
}

interface OrderLineItemsTableProps {
  items: OrderItem[]
  currencyCode: string
  totalAmount: number
  title?: string
  linkableProducts?: boolean
  labels?: {
    product?: string
    quantity?: string
    unitPrice?: string
    lineTotal?: string
    orderTotal?: string
    notes?: string
  }
}

export function OrderLineItemsTable({
  items,
  currencyCode,
  totalAmount,
  title = "Products",
  linkableProducts = false,
  labels = {},
}: OrderLineItemsTableProps) {
  const {
    product: productLabel = "Product",
    quantity: quantityLabel = "Quantity",
    unitPrice: unitPriceLabel = "Unit price",
    lineTotal: lineTotalLabel = "Line total",
    orderTotal: orderTotalLabel = "Order total",
    notes: notesLabel = "Notes",
  } = labels

  if (items.length === 0) {
    return null
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
      <h2 className="font-medium text-foreground">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">{productLabel}</th>
              <th className="pb-3 pr-4 font-medium">{quantityLabel}</th>
              <th className="pb-3 pr-4 font-medium text-right">{unitPriceLabel}</th>
              <th className="pb-3 font-medium text-right">{lineTotalLabel}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((line) => (
              <tr key={line.id} className="border-b border-border/60 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      {linkableProducts && line.productId > 0 ? (
                        <Link
                          href={productHref(line)}
                          className="font-medium text-foreground transition-colors hover:text-secondary"
                        >
                          {line.productName}
                        </Link>
                      ) : (
                        <p className="font-medium text-foreground">{line.productName}</p>
                      )}
                      {line.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {notesLabel}: {line.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-foreground">
                  {line.quantity.toLocaleString()} {line.quantityUnit}
                </td>
                <td className="py-3 pr-4 text-right text-foreground">
                  {formatCurrency(line.unitPrice, currencyCode)}
                </td>
                <td className="py-3 text-right font-medium text-foreground">
                  {formatCurrency(line.lineTotal, currencyCode)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-right font-medium text-muted-foreground">
                {orderTotalLabel}
              </td>
              <td className="pt-4 text-right font-serif text-lg font-medium text-foreground">
                {formatCurrency(totalAmount, currencyCode)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
