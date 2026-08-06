"use client"

import { useAuth } from "@/lib/auth-context"
import { SellerOrderCreate } from "@/components/orders/seller-order-create"
import { useTranslation } from "@/lib/i18n"

const DEMO_MANUFACTURER_ID = "mfr-1"

export default function ManufacturerCreateOrderPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  return (
    <SellerOrderCreate
      config={{
        kind: "product",
        basePath: "/dashboard/manufacturer/orders",
        sellerId: user?.id ?? DEMO_MANUFACTURER_ID,
        sellerName: user?.company ?? "Your Company",
        title: t.mfg.orderNew.title,
        subtitle: t.mfg.orderNew.subtitle,
        submitLabel: t.mfg.orderNew.placeOrder,
      }}
    />
  )
}
