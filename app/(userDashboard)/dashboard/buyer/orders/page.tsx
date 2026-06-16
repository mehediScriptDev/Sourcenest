"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_FLOW,
  getStatusLabel,
  formatCurrency,
  formatOrderDate,
  type OrderStatus,
} from "@/lib/orders-context"
import { getBuyerOrders, getBuyerOrderStats, type ApiOrder, type OrderStats } from "@/lib/api/orders"
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
  Package,
  Search,
  Factory,
  MapPin,
  ChevronRight,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  Hammer,
  PackageCheck,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, { color: string; icon: typeof Clock }> = {
  created: { color: "bg-blue-100 text-blue-700", icon: Clock },
  "in-production": { color: "bg-amber-100 text-amber-700", icon: Hammer },
  ready: { color: "bg-violet-100 text-violet-700", icon: PackageCheck },
  shipped: { color: "bg-cyan-100 text-cyan-700", icon: Truck },
  completed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { color: "bg-gray-100 text-gray-600", icon: XCircle },
}

function OrderProgress({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" />
        Order cancelled
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
          title={ORDER_STATUS_LABELS[s]}
        />
      ))}
    </div>
  )
}

function OrderCard({ order }: { order: ApiOrder }) {
  const style = statusStyles[order.status] || { color: "bg-gray-100 text-gray-700", icon: Clock }
  const StatusIcon = style.icon

  return (
    <Link
      href={`/dashboard/buyer/orders/${order.id}`}
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
              <Factory className="h-3.5 w-3.5" />
              {order.manufacturerName}
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              {order.quantity} {order.quantityUnit}
            </span>
            {order.destination && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {order.destination}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="font-serif text-lg font-medium text-foreground">
            {formatCurrency(order.totalAmount, order.currencyCode)}
          </span>
          {order.estimatedDeliveryAt && (
            <span className="text-xs text-muted-foreground">Est. {formatOrderDate(order.estimatedDeliveryAt)}</span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <OrderProgress status={order.status} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {order.attachments.length} document{order.attachments.length === 1 ? "" : "s"}
          {order.statusUpdates.length > 0 && ` · ${order.statusUpdates.length} update${order.statusUpdates.length === 1 ? "" : "s"}`}
        </span>
        <span className="flex items-center gap-1 font-medium text-secondary opacity-0 transition-opacity group-hover:opacity-100">
          View details
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function fetchStats() {
      const res = await getBuyerOrderStats()
      if (res.success && res.data) {
        setStats(res.data)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true)
      const res = await getBuyerOrders({
        page: 1,
        per_page: 15,
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      
      if (res.success) {
        setOrders(res.data)
        setHasMore(res.meta ? res.meta.currentPage < res.meta.lastPage : false)
        setPage(1)
      }
      setIsLoading(false)
    }
    
    fetchOrders()
  }, [debouncedSearch, statusFilter])

  const loadMore = async () => {
    const nextPage = page + 1
    const res = await getBuyerOrders({
      page: nextPage,
      per_page: 15,
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
    
    if (res.success) {
      setOrders(prev => [...prev, ...res.data])
      setHasMore(res.meta ? res.meta.currentPage < res.meta.lastPage : false)
      setPage(nextPage)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track production, shipping, documents, and progress updates for your confirmed orders.
        </p>
      </div>

      {/* Summary */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total orders</p>
            <p className="mt-1 font-serif text-2xl font-medium text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">In progress</p>
            <p className="mt-1 font-serif text-2xl font-medium text-foreground">{stats.active}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-card p-4 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Total value</p>
            <p className="mt-1 font-serif text-2xl font-medium text-foreground">
              {formatCurrency(stats.totalValue, "USD")}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order, product, or manufacturer..."
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
            {ORDER_STATUS_FLOW.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </SelectItem>
            ))}
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading && page === 1 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          
          {hasMore && (
            <div className="pt-4 text-center">
              <Button variant="outline" onClick={loadMore}>
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-medium text-foreground">
            No orders match your filters
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search or status filter.
          </p>
        </div>
      )}
    </div>
  )
}
