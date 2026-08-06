"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search,
  CreditCard,
  TrendingUp,
  DollarSign,
  Users,
  Factory,
  MoreVertical,
  Eye,
  Loader2,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { 
  getAdminSubscriptions, 
  getAdminSubscriptionStats,
  AdminSubscription,
  AdminSubscriptionStats
} from "@/lib/api/admin-subscriptions"
import { useTranslation } from "@/lib/i18n"
import { format } from "date-fns"
import { SubscriptionDetailModal } from "@/components/admin/subscription-detail-modal"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { queryKeys } from "@/lib/query-keys"

const statusConfig: Record<string, { color: string }> = {
  active: { color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  trialing: { color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  pending: { color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  canceled: { color: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  expired: { color: "bg-red-100 text-red-700 hover:bg-red-200" },
}

export default function AdminSubscriptionsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.subscriptions
  const c = t.admin.common
  const ss = t.admin.subscriptionStatus
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const [page, setPage] = useState(1)
  const perPage = 15
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  
  const [selectedSubId, setSelectedSubId] = useState<number | string | null>(null)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.adminSubscriptions(page, perPage, statusFilter, debouncedSearchQuery),
    queryFn: () =>
      getAdminSubscriptions({
        page,
        per_page: perPage,
        search: debouncedSearchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    placeholderData: (previousData) => previousData,
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.adminSubscriptionStats(),
    queryFn: () => getAdminSubscriptionStats(),
  })

  const loading = subscriptionsQuery.isLoading
  const subscriptions: AdminSubscription[] = subscriptionsQuery.data?.success
    ? subscriptionsQuery.data.data
    : []
  const stats: AdminSubscriptionStats | null =
    statsQuery.data?.success && statsQuery.data.data ? statsQuery.data.data : null
  const meta = subscriptionsQuery.data?.success ? subscriptionsQuery.data.meta ?? null : null

  useEffect(() => {
    if (page > 1 && meta && page > meta.last_page) {
      setPage(meta.last_page)
    }
  }, [meta, page])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {p.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title={p.activeSubscriptions}
          value={stats ? stats.overview.total_active_subscriptions : "-"}
          icon={Users}
          iconClassName="text-secondary"
          iconWrapperClassName="bg-secondary/10"
        />
        <AdminStatCard
          title={p.monthlyRevenue}
          value={stats ? `$${stats.this_month.revenue.toLocaleString()}` : "-"}
          icon={DollarSign}
          iconClassName="text-emerald-700"
          iconWrapperClassName="bg-emerald-100"
        />
        <AdminStatCard
          title={p.allTimeRevenue}
          value={stats ? `$${stats.overview.total_revenue_all_time.toLocaleString()}` : "-"}
          icon={TrendingUp}
          iconClassName="text-blue-700"
          iconWrapperClassName="bg-blue-100"
        />
        <AdminStatCard
          title={p.newThisMonth}
          value={stats ? stats.this_month.new_subscriptions : "-"}
          icon={CreditCard}
          iconClassName="text-amber-700"
          iconWrapperClassName="bg-amber-100"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={c.searchByCompany}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={c.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{c.allStatusLabel}</SelectItem>
              <SelectItem value="active">{ss.active}</SelectItem>
              <SelectItem value="trialing">{ss.trialing}</SelectItem>
              <SelectItem value="pending">{ss.pending}</SelectItem>
              <SelectItem value="canceled">{ss.canceled}</SelectItem>
              <SelectItem value="expired">{ss.expired}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subscriptions List (Cards on Mobile, Table on Desktop) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Mobile Cards */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {loading ? (
             <div className="py-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">{p.loading}</p>
             </div>
          ) : subscriptions.length === 0 ? (
             <div className="py-12 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">{p.noSubscriptions}</p>
             </div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="flex flex-col gap-4 rounded-lg border border-border p-4 shadow-sm bg-card">
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Factory className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sub.manufacturer?.name || p.unknownCompany}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.starts_at ? c.sinceLabel.replace("{date}", format(new Date(sub.starts_at), "MMM dd, yyyy")) : c.na}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={statusConfig[sub.status]?.color || "bg-secondary text-secondary-foreground"}
                    >
                      {sub.status_label || ss[sub.status as keyof typeof ss] || sub.status}
                    </Badge>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 text-sm">
                   <div>
                     <p className="text-muted-foreground">{p.tablePlan}</p>
                     <p className="font-medium">{sub.plan?.name || c.unknown}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">{p.tableAmount}</p>
                     <p className="font-medium">
                       ${sub.billing_interval === "year" 
                          ? sub.plan?.yearly_price?.amount 
                          : sub.plan?.monthly_price?.amount} 
                       <span className="text-xs text-muted-foreground font-normal ml-1">
                          {sub.billing_interval === "year" ? c.perYearShort : c.perMonthShort}
                       </span>
                     </p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">{p.tableBilling}</p>
                     <p className="font-medium capitalize">{sub.billing_interval}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">{p.tableNextBilling}</p>
                     <p className="font-medium">{sub.ends_at ? format(new Date(sub.ends_at), "MMM dd, yyyy") : "-"}</p>
                   </div>
                 </div>

                 <Button 
                   variant="outline" 
                   className="w-full"
                   onClick={() => setSelectedSubId(sub.id)}
                 >
                   <Eye className="mr-2 h-4 w-4" />
                   {c.viewDetails}
                 </Button>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">{p.tableCompany}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">{p.tablePlan}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden md:table-cell">{p.tableAmount}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden lg:table-cell">{p.tableBilling}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden lg:table-cell">{p.tableNextBilling}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">{p.tableStatus}</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">{p.tableActions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">{p.loading}</p>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">{p.noSubscriptions}</p>
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Factory className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sub.manufacturer?.name || p.unknownCompany}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.starts_at
                            ? c.sinceLabel.replace("{date}", format(new Date(sub.starts_at), "MMM dd, yyyy"))
                            : c.na}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-normal">
                      {sub.plan?.name || c.unknown}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-medium text-foreground">
                      ${sub.billing_interval === "year" 
                        ? sub.plan?.yearly_price?.amount 
                        : sub.plan?.monthly_price?.amount}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {sub.billing_interval === "year" ? c.perYearShort : c.perMonthShort}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell capitalize">
                    {sub.billing_interval}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {sub.ends_at ? format(new Date(sub.ends_at), "MMM dd, yyyy") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="secondary"
                      className={statusConfig[sub.status]?.color || "bg-secondary text-secondary-foreground"}
                    >
                      {sub.status_label || ss[sub.status as keyof typeof ss] || sub.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedSubId(sub.id)}
                      title={c.viewDetails}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        <AdminPagination
          page={page}
          meta={meta}
          itemCount={subscriptions.length}
          onPageChange={setPage}
          variant="footer"
        />
      </div>

      <SubscriptionDetailModal
        subscriptionId={selectedSubId}
        isOpen={selectedSubId !== null}
        onClose={() => setSelectedSubId(null)}
      />
    </div>
  )
}
