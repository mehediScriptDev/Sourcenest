"use client"

import { useEffect, useMemo, useState } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  formatCurrency,
  formatOrderDate,
  getStatusLabel,
  ORDER_STATUS_FLOW,
  type OrderStatus,
} from "@/lib/orders-context"
import { getManufacturerOrders, getManufacturerOrderStats, type ApiOrder } from "@/lib/api/orders"
import { queryKeys } from "@/lib/query-keys"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Search,
  ChevronRight,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  Hammer,
  PackageCheck,
  XCircle,
  Plus,
  Building2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ManufacturerStatCard from "@/components/manufacturer/manufacturer-stat-card"

const statusStyles: Record<string, { color: string; icon: typeof Clock }> = {
  created: { color: "bg-blue-100 text-blue-700", icon: Clock },
  "in-production": { color: "bg-amber-100 text-amber-700", icon: Hammer },
  ready: { color: "bg-violet-100 text-violet-700", icon: PackageCheck },
  shipped: { color: "bg-cyan-100 text-cyan-700", icon: Truck },
  completed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { color: "bg-gray-100 text-gray-600", icon: XCircle },
}

export interface SellerConfig {
  kind: string
  // Base path for links, e.g. /dashboard/manufacturer/orders
  basePath: string
  // The seller's account id used to filter their records
  sellerId: string | number
  // Copy
  listTitle: string
  listSubtitle: string
  noun: string // "order" | "engagement"
  nounPlural: string // "orders" | "engagements"
  createLabel: string
}

function Progress({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </div>
    )
  }
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status as OrderStatus)
  return (
    <div className="flex items-center gap-1.5">
      {ORDER_STATUS_FLOW.map((s, i) => (
        <div
          key={s}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            currentIndex >= 0 && i <= currentIndex ? "bg-secondary" : "bg-muted",
          )}
          title={getStatusLabel(s)}
        />
      ))}
    </div>
  )
}

function OrderCard({ order, config }: { order: ApiOrder; config: SellerConfig }) {
  const style = statusStyles[order.status] || { color: "bg-gray-100 text-gray-700", icon: Clock }
  const StatusIcon = style.icon
  return (
    <Link
      href={`${config.basePath}/${order.id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-secondary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{order.orderNumber}</span>
            <Badge className={cn("gap-1 text-xs", style.color)}>
              <StatusIcon className="h-3 w-3" />
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <h3 className="mt-1.5 truncate font-medium text-foreground">{order.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {order.buyerCompany}
            </span>
            <span className="flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5" />
              {order.quantity} {order.quantityUnit}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="font-serif text-lg font-medium text-foreground">
            {formatCurrency(order.totalAmount, order.currencyCode)}
          </span>
          {order.estimatedDeliveryAt && (
            <span className="text-xs text-muted-foreground">Due {formatOrderDate(order.estimatedDeliveryAt)}</span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Progress status={order.status} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {order.attachments.length} document{order.attachments.length === 1 ? "" : "s"}
          {order.statusUpdates.length > 0 && ` · ${order.statusUpdates.length} update${order.statusUpdates.length === 1 ? "" : "s"}`}
        </span>
        <span className="flex items-center gap-1 font-medium text-secondary opacity-0 transition-opacity group-hover:opacity-100">
          Manage
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

export function SellerOrdersList({ config }: { config: SellerConfig }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const statsQuery = useQuery({
    queryKey: queryKeys.manufacturerOrderStats(),
    queryFn: getManufacturerOrderStats,
  })

  const ordersQuery = useInfiniteQuery({
    queryKey: queryKeys.manufacturerOrders(debouncedSearch, statusFilter),
    queryFn: ({ pageParam }) =>
      getManufacturerOrders({
        page: pageParam,
        per_page: 15,
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.success || !lastPage.meta) {
        return undefined
      }
      return lastPage.meta.currentPage < lastPage.meta.lastPage
        ? lastPage.meta.currentPage + 1
        : undefined
    },
    placeholderData: (previousData) => previousData,
  })

  const orders = useMemo(
    () =>
      ordersQuery.data?.pages.flatMap((page) => (page.success ? page.data : [])) ?? [],
    [ordersQuery.data]
  )
  const stats = statsQuery.data?.success ? statsQuery.data.data : null
  const isLoading = ordersQuery.isLoading && !ordersQuery.data
  const hasMore = ordersQuery.hasNextPage ?? false

  const loadMore = () => {
    void ordersQuery.fetchNextPage()
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{config.listTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{config.listSubtitle}</p>
        </div>
        <Button asChild className="gap-2">
          <Link href={`${config.basePath}/new`}>
            <Plus className="h-4 w-4" />
            {config.createLabel}
          </Link>
        </Button>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ManufacturerStatCard
            title={`Total ${config.nounPlural}`}
            value={stats.total}
          />
          <ManufacturerStatCard
            title="Active"
            value={stats.active}
          />
          <ManufacturerStatCard
            className="col-span-2 sm:col-span-1"
            title="Total value"
            value={formatCurrency(stats.totalValue, "USD")}
          />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search by ${config.noun}, title, or client...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUS_FLOW.concat("cancelled" as OrderStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {getStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} config={config} />
          ))}

          {hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={ordersQuery.isFetchingNextPage}
              >
                {ordersQuery.isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Load More
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center sm:py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PackageCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-medium text-foreground">
            {stats && stats.total === 0 ? `No ${config.nounPlural} yet` : `No ${config.nounPlural} match your filters`}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {stats && stats.total === 0
              ? `Create a ${config.noun} once you and a client agree to proceed, then track progress and share updates here.`
              : "Try adjusting your search or status filter."}
          </p>
          {stats && stats.total === 0 && (
            <Button asChild className="mt-4 gap-2">
              <Link href={`${config.basePath}/new`}>
                <Plus className="h-4 w-4" />
                {config.createLabel}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
