"use client"

import { RfqList, type RfqListConfig } from "@/components/rfqs/rfq-list"
import { useTranslation } from "@/lib/i18n"

export default function AdminRfqsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.rfqs

  const config: RfqListConfig = {
    role: "admin",
    basePath: "/admin/rfqs",
    listTitle: p.title,
    listSubtitle: p.subtitle,
  }

  return (
    <div className="space-y-6">
      <RfqList config={config} />
    </div>
  )
}
