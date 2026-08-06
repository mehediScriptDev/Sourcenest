"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n"
import { getBuyerDashboard } from "@/lib/api/buyer-dashboard"
import { queryKeys } from "@/lib/query-keys"
import { BuyerActivityList } from "@/components/buyer/buyer-activity-list"
import { 
  MessageSquare, 
  FileText, 
  Heart,
  ArrowRight,
  Factory,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Loader2
} from "lucide-react"

export default function BuyerDashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()

  const dashboardQuery = useQuery({
    queryKey: queryKeys.buyerDashboard(),
    queryFn: getBuyerDashboard,
  })

  const data = dashboardQuery.data?.success ? dashboardQuery.data.data : null
  const loading = dashboardQuery.isLoading
  
  const userDisplayName = data?.welcome?.first_name || data?.welcome?.name || user?.firstName || user?.name || t.buyer.layout.buyer

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

  if (!data) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-muted-foreground">{t.buyer.dashboard.failedToLoad}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
          {t.buyer.dashboard.welcome.replace("{name}", userDisplayName)}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t.buyer.dashboard.subtitle}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <MessageSquare className="h-5 w-5 text-secondary" />
            </div>
            {data.stats.active_conversations.badge && (
              <Badge variant="secondary" className="text-xs">{data.stats.active_conversations.badge}</Badge>
            )}
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground">{data.stats.active_conversations.value}</div>
            <p className="text-sm text-muted-foreground">{t.buyer.dashboard.stats.activeConversations}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
            {data.stats.rfqs_submitted.badge && (
              <Badge variant="secondary" className="text-xs">{data.stats.rfqs_submitted.badge}</Badge>
            )}
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground">{data.stats.rfqs_submitted.value}</div>
            <p className="text-sm text-muted-foreground">{t.buyer.dashboard.stats.rfqsSubmitted}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <Heart className="h-5 w-5 text-secondary" />
            </div>
            {data.stats.saved_suppliers.badge && (
              <Badge variant="secondary" className="text-xs">{data.stats.saved_suppliers.badge}</Badge>
            )}
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground">{data.stats.saved_suppliers.value}</div>
            <p className="text-sm text-muted-foreground">{t.buyer.dashboard.stats.savedSuppliers}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <TrendingUp className="h-5 w-5 text-secondary" />
            </div>
            {data.stats.products_viewed.badge && (
              <Badge variant="secondary" className="text-xs">{data.stats.products_viewed.badge}</Badge>
            )}
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-foreground">{data.stats.products_viewed.value}</div>
            <p className="text-sm text-muted-foreground">{t.buyer.dashboard.stats.productsViewed}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Messages */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card min-w-0">
          <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
            <h2 className="font-semibold text-foreground">{t.buyer.dashboard.recentMessages.title}</h2>
            <Button variant="ghost" size="sm" className="gap-1 text-secondary" asChild>
              <Link href="/dashboard/buyer/messages">
                {t.buyer.dashboard.recentMessages.viewAll}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {data.recent_messages.length > 0 ? (
              data.recent_messages.map((msg, i) => (
                <Link 
                  key={i} 
                  href="/dashboard/buyer/messages"
                  className="flex items-start gap-3 p-3 sm:p-4 hover:bg-muted/50 transition-colors min-w-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Factory className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`font-medium truncate ${msg.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {msg.name}
                      </p>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground truncate">{msg.message}</p>
                  </div>
                  {msg.unread && (
                    <div className="h-2 w-2 rounded-full bg-secondary shrink-0 mt-2" />
                  )}
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>{t.buyer.dashboard.recentMessages.noMessages}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-semibold text-foreground">{t.buyer.dashboard.quickActions.title}</h2>
          <div className="mt-4 space-y-3">
            <Button className="w-full justify-start gap-2" variant="outline" asChild>
              <Link href="/suppliers">
                <Factory className="h-4 w-4" />
                {t.buyer.dashboard.quickActions.findSuppliers}
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" asChild>
              <Link href="/products">
                <Package className="h-4 w-4" />
                {t.buyer.dashboard.quickActions.browseProducts}
              </Link>
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" asChild>
              <Link href="/dashboard/buyer/rfqs">
                <FileText className="h-4 w-4" />
                {t.buyer.dashboard.quickActions.submitRfq}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card min-w-0">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <h2 className="font-semibold text-foreground">{t.buyer.dashboard.recentActivity.title}</h2>
          <Button variant="ghost" size="sm" className="gap-1 text-secondary" asChild>
            <Link href="/dashboard/buyer/activity">
              {t.buyer.dashboard.recentActivity.viewAll}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
        <BuyerActivityList
          activities={data.recent_activity}
          emptyMessage={t.buyer.dashboard.recentActivity.noActivity}
          getLabel={getActivityLabel}
          compact
        />
      </div>

      {/* RFQ Status */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <h2 className="font-semibold text-foreground">{t.buyer.dashboard.rfqStatus.title}</h2>
          <Button variant="ghost" size="sm" className="gap-1 text-secondary" asChild>
            <Link href="/dashboard/buyer/rfqs">
              {t.buyer.dashboard.rfqStatus.viewAll}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm">
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.dashboard.rfqStatus.rfqId}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.dashboard.rfqStatus.product}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.dashboard.rfqStatus.supplier}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.dashboard.rfqStatus.status}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.dashboard.rfqStatus.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recent_rfqs.length > 0 ? (
                data.recent_rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{rfq.id}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{rfq.product}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{rfq.supplier}</td>
                    <td className="px-5 py-4">
                      <Badge 
                        variant={rfq.status_value === "quoted" ? "default" : rfq.status_value === "in_review" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {rfq.status_value === "quoted" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {rfq.status_value === "in_review" && <Clock className="mr-1 h-3 w-3" />}
                        {rfq.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{rfq.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    {t.buyer.dashboard.rfqStatus.noRfqs}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile RFQ cards */}
        <div className="md:hidden p-4 space-y-3">
          {data.recent_rfqs.length > 0 ? (
            data.recent_rfqs.map((rfq) => (
              <div key={rfq.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{rfq.id} • {rfq.product}</p>
                    <p className="text-sm text-muted-foreground truncate">{rfq.supplier}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={rfq.status_value === "quoted" ? "default" : rfq.status_value === "in_review" ? "secondary" : "outline"} className="text-xs">
                      {rfq.status_value === "quoted" && <CheckCircle className="mr-1 h-3 w-3" />}
                      {rfq.status_value === "in_review" && <Clock className="mr-1 h-3 w-3" />}
                      {rfq.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{rfq.date}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground p-4">
              {t.buyer.dashboard.rfqStatus.noRfqs}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Suppliers */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-semibold text-foreground">{t.buyer.dashboard.recommended.title}</h2>
          <Button variant="ghost" size="sm" className="gap-1 text-secondary" asChild>
            <Link href="/suppliers">
              {t.buyer.dashboard.recommended.exploreAll}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.recommended_suppliers.length > 0 ? (
            data.recommended_suppliers.map((supplier) => (
              <Link 
                key={supplier.id}
                href={`/suppliers/${supplier.slug}`}
                className="rounded-lg border border-border bg-card p-4 hover:border-secondary transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Factory className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground">{supplier.location.city}, {supplier.location.country}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{supplier.rating}</span>
                      <span className="text-muted-foreground">• {t.buyer.dashboard.recommended.products.replace("{count}", supplier.product_count.toLocaleString())}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-muted-foreground">
              {t.buyer.dashboard.recommended.noSuppliers}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
