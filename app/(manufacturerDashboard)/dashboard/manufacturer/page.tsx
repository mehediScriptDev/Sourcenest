"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getManufacturerDashboard, ManufacturerDashboardStats } from "@/lib/api/manufacturer-dashboard"
import ManufacturerStatCard from "@/components/manufacturer/manufacturer-stat-card"
import { 
  MessageSquare, 
  FileText, 
  Eye,
  ArrowRight,
  TrendingUp,
  Users,
  Package,
  Star,
  Clock,
  CheckCircle,
  DollarSign,
  Loader2,
  Bell
} from "lucide-react"

export default function ManufacturerDashboardPage() {
  const [data, setData] = useState<ManufacturerDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      const res = await getManufacturerDashboard()
      if (res.success && res.data) {
        setData(res.data)
      }
      setLoading(false)
    }
    fetchDashboard()
  }, [])

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
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-muted-foreground">
            Monitor your business performance and buyer inquiries.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1 bg-emerald-100 text-emerald-700">
          <CheckCircle className="h-3 w-3" />
          Profile {data.profile_completeness.percent}% Complete
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ManufacturerStatCard
          title={data.stats.new_inquiries_30d.label}
          value={data.stats.new_inquiries_30d.value}
          icon={FileText}
          trend={{
            value: data.stats.new_inquiries_30d.change,
            direction: data.stats.new_inquiries_30d.trend
          }}
        />

        <ManufacturerStatCard
          title={data.stats.profile_views_30d.label}
          value={data.stats.profile_views_30d.value.toLocaleString()}
          icon={Eye}
          trend={{
            value: data.stats.profile_views_30d.change,
            direction: data.stats.profile_views_30d.trend
          }}
          badgeClassName={data.stats.profile_views_30d.trend !== 'up' ? 'bg-gray-100 text-gray-700' : undefined}
        />

        <ManufacturerStatCard
          title={data.stats.quote_value_30d.label}
          value={data.stats.quote_value_30d.formatted}
          icon={DollarSign}
        />

        <ManufacturerStatCard
          title={`Average Rating (${data.stats.average_rating.review_count} reviews)`}
          icon={Star}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{data.stats.average_rating.value}</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 ${star <= data.stats.average_rating.value ? 'fill-amber-400 text-amber-400' : 'text-muted/30'}`} 
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Average Rating</p>
        </ManufacturerStatCard>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Inquiries */}
        <div className="md:col-span-2 lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-border p-5 min-w-0">
            <h2 className="font-semibold text-foreground truncate">Recent Inquiries</h2>
            <Button variant="ghost" size="sm" className="gap-1 text-secondary" asChild>
              <Link href="/dashboard/manufacturer/inquiries">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {data.recent_inquiries.length > 0 ? (
              data.recent_inquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-medium truncate text-foreground">{inquiry.buyer}</h3>
                        <Badge 
                          variant={inquiry.status_value === "pending" ? "default" : "secondary"}
                          className={inquiry.status_value === "pending" ? "bg-secondary shrink-0" : "shrink-0"}
                        >
                          {inquiry.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{inquiry.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground truncate">
                      {inquiry.product} • {inquiry.quantity}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Button size="sm" variant="outline" className="h-8 px-2 sm:h-9 sm:px-4" asChild>
                      <Link href={`/dashboard/manufacturer/inquiries/${inquiry.id}`}>
                        <span className="hidden sm:inline">View</span>
                        <Eye className="h-4 w-4 sm:hidden" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No recent inquiries.</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Stats & Quick Stats */}
        <div className="space-y-6 md:col-span-2 lg:col-span-1 min-w-0">
          {/* Response Rate */}
          <div className="rounded-xl border border-border bg-card p-5 w-full overflow-hidden">
            <h2 className="font-semibold text-foreground truncate">Response Metrics</h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                  <span className="text-muted-foreground truncate">Response Rate</span>
                  <span className="font-medium text-foreground shrink-0">{data.response_metrics.response_rate}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className={`h-full rounded-full bg-secondary`} style={{ width: `${Math.min(100, Math.max(0, data.response_metrics.response_rate))}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                  <span className="text-muted-foreground truncate">Quote Conversion</span>
                  <span className="font-medium text-foreground shrink-0">{data.response_metrics.quote_conversion}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className={`h-full rounded-full bg-secondary`} style={{ width: `${Math.min(100, Math.max(0, data.response_metrics.quote_conversion))}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 text-sm min-w-0">
                  <span className="text-muted-foreground truncate">On-time Delivery</span>
                  <span className="font-medium text-foreground shrink-0">
                    {data.response_metrics.on_time_delivery !== null ? `${data.response_metrics.on_time_delivery}%` : 'N/A'}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className={`h-full rounded-full bg-secondary`} style={{ width: `${data.response_metrics.on_time_delivery !== null ? Math.min(100, Math.max(0, data.response_metrics.on_time_delivery)) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-border bg-card p-5 w-full overflow-hidden">
            <h2 className="font-semibold text-foreground truncate">Quick Stats</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm text-muted-foreground truncate">Active Products</span>
                <span className="font-medium text-foreground shrink-0">{data.quick_stats.active_products}</span>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm text-muted-foreground truncate">Pending Quotes</span>
                <span className="font-medium text-foreground shrink-0">{data.quick_stats.pending_quotes}</span>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm text-muted-foreground truncate">Unread Messages</span>
                <span className="font-medium text-foreground shrink-0">{data.quick_stats.unread_messages}</span>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm text-muted-foreground truncate">Avg. Response Time</span>
                <span className="font-medium text-foreground shrink-0">
                  {data.quick_stats.avg_response_time || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card w-full overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border p-5 min-w-0">
          <h2 className="font-semibold text-foreground truncate">Recent Activity</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {data.recent_activity.length > 0 ? (
              data.recent_activity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
