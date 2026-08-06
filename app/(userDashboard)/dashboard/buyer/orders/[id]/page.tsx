"use client"

import { use } from "react"
import { OrderDetailView } from "@/components/orders/order-detail-view"

export default function BuyerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <OrderDetailView
      orderId={id}
      role="buyer"
      basePath="/dashboard/buyer/orders"
    />
  )
}
