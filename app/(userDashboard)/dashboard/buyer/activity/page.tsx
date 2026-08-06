"use client"

import { useQuery } from "@tanstack/react-query"
import { BuyerActivityList } from "@/components/buyer/buyer-activity-list"
import { getBuyerActivity } from "@/lib/api/buyer-dashboard"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"
import { FileText, Factory, Heart, Loader2 } from "lucide-react"

const ACTIVITY_LIMIT = 50

export default function BuyerActivityPage() {
  const { t } = useTranslation()

  const activityQuery = useQuery({
    queryKey: queryKeys.buyerActivity(ACTIVITY_LIMIT),
    queryFn: () => getBuyerActivity(ACTIVITY_LIMIT),
  })

  const activities = activityQuery.data?.success ? activityQuery.data.data?.activities ?? [] : []
  const summary = activityQuery.data?.success
    ? activityQuery.data.data?.summary ?? {
        suppliers_contacted: 0,
        rfqs_submitted: 0,
        suppliers_saved: 0,
      }
    : {
        suppliers_contacted: 0,
        rfqs_submitted: 0,
        suppliers_saved: 0,
      }
  const loading = activityQuery.isLoading

  const getActivityLabel = (type: string) => {
    return t.buyer.activity.labels[type as keyof typeof t.buyer.activity.labels] || type
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">{t.buyer.activity.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {t.buyer.activity.subtitle}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <BuyerActivityList
          activities={activities}
          emptyMessage={t.buyer.dashboard.recentActivity.noActivity}
          getLabel={getActivityLabel}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted">
            <Factory className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{summary.suppliers_contacted}</p>
          <p className="text-sm text-muted-foreground">{t.buyer.activity.stats.suppliersContacted}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{summary.rfqs_submitted}</p>
          <p className="text-sm text-muted-foreground">{t.buyer.activity.stats.rfqsSubmitted}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted">
            <Heart className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{summary.suppliers_saved}</p>
          <p className="text-sm text-muted-foreground">{t.buyer.activity.stats.suppliersSaved}</p>
        </div>
      </div>
    </div>
  )
}
