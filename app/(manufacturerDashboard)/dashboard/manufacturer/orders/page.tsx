"use client"

import { useAuth } from "@/lib/auth-context"
import { SellerOrdersList } from "@/components/orders/seller-orders"
import { useTranslation } from "@/lib/i18n"

export default function ManufacturerOrdersPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const sellerId = user?.id ?? ""
  return (
    <SellerOrdersList
      config={{
        kind: "product",
        basePath: "/dashboard/manufacturer/orders",
        sellerId,
        listTitle: t.mfg.orders.title,
        listSubtitle: t.mfg.orders.subtitle,
        noun: "order",
        nounPlural: "orders",
        createLabel: t.mfg.orders.createOrder,
      }}
    />
  )
}
