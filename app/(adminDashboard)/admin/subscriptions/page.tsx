"use client"

import { useState, useEffect } from "react"

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
import { format } from "date-fns"
import { SubscriptionDetailModal } from "@/components/admin/subscription-detail-modal"

const statusConfig: Record<string, { color: string }> = {
  active: { color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  trialing: { color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  pending: { color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  canceled: { color: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  expired: { color: "bg-red-100 text-red-700 hover:bg-red-200" },
}

export default function AdminSubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([])
  const [stats, setStats] = useState<AdminSubscriptionStats | null>(null)
  
  const [selectedSubId, setSelectedSubId] = useState<number | string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      const [subsRes, statsRes] = await Promise.all([
        getAdminSubscriptions({
          page: 1, // You could add pagination state here if needed
          search: searchQuery || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        }),
        getAdminSubscriptionStats() // Fetches stats for current month by default
      ])

      if (subsRes.success) {
        setSubscriptions(subsRes.data)
      }
      if (statsRes.success) {
        setStats(statsRes.data)
      }

      setLoading(false)
    }

    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      fetchData()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">Subscriptions</h1>
        <p className="mt-1 text-muted-foreground">
          Monitor and manage manufacturer subscriptions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <AdminStatCard
          title="Active Subscriptions"
          value={stats ? stats.overview.total_active_subscriptions : "-"}
          icon={Users}
          iconClassName="text-secondary"
          iconWrapperClassName="bg-secondary/10"
        />
        <AdminStatCard
          title="Monthly Revenue"
          value={stats ? `$${stats.this_month.revenue.toLocaleString()}` : "-"}
          icon={DollarSign}
          iconClassName="text-emerald-700"
          iconWrapperClassName="bg-emerald-100"
        />
        <AdminStatCard
          title="All-Time Revenue"
          value={stats ? `$${stats.overview.total_revenue_all_time.toLocaleString()}` : "-"}
          icon={TrendingUp}
          iconClassName="text-blue-700"
          iconWrapperClassName="bg-blue-100"
        />
        <AdminStatCard
          title="New This Month"
          value={stats ? stats.this_month.new_subscriptions : "-"}
          icon={CreditCard}
          iconClassName="text-amber-700"
          iconWrapperClassName="bg-amber-100"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Company</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Plan</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden md:table-cell">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden lg:table-cell">Billing</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden lg:table-cell">Next Billing</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading subscriptions...</p>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No subscriptions found</p>
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
                        <p className="font-medium text-foreground">{sub.manufacturer?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          Since {sub.starts_at ? format(new Date(sub.starts_at), "MMM dd, yyyy") : "N/A"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-normal">
                      {sub.plan?.name || "Unknown"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-medium text-foreground">
                      ${sub.billing_interval === "year" 
                        ? sub.plan?.yearly_price?.amount 
                        : sub.plan?.monthly_price?.amount}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /{sub.billing_interval === "year" ? "yr" : "mo"}
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
                      {sub.status_label || sub.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedSubId(sub.id)}
                      title="View Details"
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

      <SubscriptionDetailModal
        subscriptionId={selectedSubId}
        isOpen={selectedSubId !== null}
        onClose={() => setSelectedSubId(null)}
      />
    </div>
  )
}
