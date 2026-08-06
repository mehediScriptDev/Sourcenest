"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  formatCurrency,
  formatOrderDate,
  ORDER_STATUS_FLOW,
} from "@/lib/orders-context"
import { getAdminOrders, getAdminOrderStats, type OrderStats } from "@/lib/api/orders"
import { useTranslation } from "@/lib/i18n"
import { queryKeys } from "@/lib/query-keys"
import {
  PackageCheck,
  Package,
  Briefcase,
  Factory,
  User,
  Search,
  DollarSign,
  Layers,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminPagination } from "@/components/admin/admin-pagination"
import type { OrderMeta } from "@/lib/api/orders"

const statusColors: Record<string, string> = {
  created: "bg-blue-100 text-blue-700",
  "in-production": "bg-amber-100 text-amber-700",
  ready: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

export default function AdminOrdersPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.orders
  const c = t.admin.common
  const orderStatus = t.admin.orderStatus

  const getOrderStatusLabel = (status: string) => {
    const key = status.replace(/-/g, "_") as keyof typeof orderStatus
    return orderStatus[key] ?? status
  }

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const perPage = 20
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  const statsQuery = useQuery({
    queryKey: queryKeys.adminOrderStats(),
    queryFn: () => getAdminOrderStats(),
  })

  const ordersQuery = useQuery({
    queryKey: queryKeys.adminOrders(page, perPage, debouncedSearch, statusFilter),
    queryFn: () =>
      getAdminOrders({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    placeholderData: (previousData) => previousData,
  })

  const isLoading = ordersQuery.isLoading
  const stats: OrderStats | null = statsQuery.data?.success ? statsQuery.data.data : null
  const orders = ordersQuery.data?.success ? ordersQuery.data.data : []
  const meta: OrderMeta | null = ordersQuery.data?.success ? (ordersQuery.data.meta ?? null) : null
  const ordersError =
    ordersQuery.data?.success === false ? (ordersQuery.data.message || c.loadFailed) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {p.subtitle}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
          <AdminStatCard 
            icon={Layers} 
            title={p.totalOrders} 
            value={stats.total} 
            layout="vertical"
            contentClassName="pt-6 pb-6 px-6"
          />
          <AdminStatCard 
            icon={Clock} 
            title={p.activeOrders} 
            value={stats.active} 
            layout="vertical"
            contentClassName="pt-6 pb-6 px-6"
          />
          <AdminStatCard 
            icon={CheckCircle2} 
            title={p.completedOrders} 
            value={stats.completed} 
            layout="vertical"
            contentClassName="pt-6 pb-6 px-6"
          />
          <AdminStatCard 
            icon={DollarSign} 
            title={p.totalValue} 
            value={formatCurrency(stats.totalValue, "USD")} 
            layout="vertical"
            contentClassName="pt-6 pb-6 px-6"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={c.searchOrders}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{orderStatus.all}</option>
            {ORDER_STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {getOrderStatusLabel(s)}
              </option>
            ))}
            <option value="cancelled">{orderStatus.cancelled}</option>
          </select>
        </div>
      </div>

      {/* Mobile Orders Cards */}
      <div className="block sm:hidden space-y-4">
        {ordersError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{ordersError}</div>
        )}
        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">{"Loading..."}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <PackageCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">{p.noMatching}</p>
          </div>
        ) : (
          orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="block rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/50 transition-colors">
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">{o.orderNumber}</span>
                  </div>
                  <Badge className={statusColors[o.status] || statusColors.created} variant="secondary">
                    {getOrderStatusLabel(o.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary")}>
                    <Package className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground line-clamp-1">{o.title}</p>
                    <p className="text-sm text-muted-foreground">{c.productOrder}</p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p.tableBuyer}</span>
                    <span className="font-medium text-foreground truncate max-w-[150px] text-right">{o.buyerCompany || o.buyerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p.tableSeller}</span>
                    <span className="font-medium text-foreground truncate max-w-[150px] text-right">{o.manufacturerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p.tableValue}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(o.totalAmount, o.currencyCode)}</span>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-3 text-xs text-muted-foreground text-center">
                  {formatOrderDate(o.createdAt)}
                </div>
              </div>
            </Link>
          ))
        )}
        
        {/* Mobile Pagination */}
        {!isLoading && orders.length > 0 && (
          <AdminPagination
            page={page}
            meta={meta}
            itemCount={orders.length}
            onPageChange={setPage}
            variant="card"
          />
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-card">
        {ordersError && (
          <div className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-700">{ordersError}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">{p.tableId}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">{p.tableTitle}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden md:table-cell">{p.tableBuyer}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden lg:table-cell">{p.tableSeller}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground hidden sm:table-cell">{p.tableValue}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">{p.tableStatus}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden xl:table-cell">{p.tableCreated}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <PackageCheck className="h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">{p.noMatching}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  return (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-mono text-sm text-foreground hover:text-primary"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="block">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                                "bg-primary/10 text-primary",
                              )}
                            >
                              <Package className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{o.title}</p>
                              <p className="text-xs text-muted-foreground">{c.productOrder}</p>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate" title={o.buyerEmail}>{o.buyerCompany || o.buyerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Factory className="h-3 w-3" />
                          <span className="truncate">{o.manufacturerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground hidden sm:table-cell">
                        {formatCurrency(o.totalAmount, o.currencyCode)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[o.status] || statusColors.created} variant="secondary">
                          {getOrderStatusLabel(o.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden xl:table-cell">
                        {formatOrderDate(o.createdAt)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          <AdminPagination
            page={page}
            meta={meta}
            itemCount={orders.length}
            onPageChange={setPage}
            variant="footer"
          />
        </div>
      </div>
    </div>
  )
}