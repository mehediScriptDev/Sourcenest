"use client"

import { use } from "react"
import { OrderDetailView } from "@/components/orders/order-detail-view"

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)

  return (
    <div className="py-6">
      <OrderDetailView
        orderId={resolvedParams.id}
        role="admin"
        basePath="/admin/orders"
      />
    </div>
  )
}
