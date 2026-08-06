"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Factory,
  Package,
  FileText,
  MessageSquare,
  DollarSign,
  Globe,
  BarChart3,
  Loader2,
  type LucideIcon
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart"
import { getAdminAnalyticsMetrics, getAdminAnalyticsGrowth, getAdminAnalyticsCountries, getAdminAnalyticsIndustries, AdminAnalyticsMetricItem, GrowthItem, CountryDistributionItem, IndustryItem } from "@/lib/api/admin-analytics"
import { useTranslation } from "@/lib/i18n"
import { queryKeys } from "@/lib/query-keys"

const metricIcons: Record<string, LucideIcon> = {
  total_revenue: DollarSign,
  active_users: Users,
  active_suppliers: Factory,
  products_listed: Package,
  rfqs_this_month: FileText,
  messages_sent: MessageSquare,
}

export default function AdminAnalyticsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.analytics

  const chartConfig = {
    users: {
      label: p.users,
      color: "var(--chart-1)",
    },
    suppliers: {
      label: p.suppliers,
      color: "var(--chart-2)",
    },
    rfqs: {
      label: p.rfqs,
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig

  const metricsQuery = useQuery({
    queryKey: queryKeys.adminAnalyticsMetrics(),
    queryFn: () => getAdminAnalyticsMetrics(),
  })

  const growthQuery = useQuery({
    queryKey: queryKeys.adminAnalyticsGrowth(),
    queryFn: () => getAdminAnalyticsGrowth(),
  })

  const countriesQuery = useQuery({
    queryKey: queryKeys.adminAnalyticsCountries(),
    queryFn: () => getAdminAnalyticsCountries(),
  })

  const industriesQuery = useQuery({
    queryKey: queryKeys.adminAnalyticsIndustries(),
    queryFn: () => getAdminAnalyticsIndustries(),
  })

  const metrics: AdminAnalyticsMetricItem[] =
    metricsQuery.data?.success && metricsQuery.data.data?.metrics
      ? metricsQuery.data.data.metrics
      : []
  const growthData: GrowthItem[] =
    growthQuery.data?.success && growthQuery.data.data ? [...growthQuery.data.data].reverse() : []
  const countries: CountryDistributionItem[] =
    countriesQuery.data?.success && countriesQuery.data.data ? countriesQuery.data.data : []
  const industries: IndustryItem[] =
    industriesQuery.data?.success && industriesQuery.data.data ? industriesQuery.data.data : []

  const isLoading = metricsQuery.isLoading
  const isChartLoading = growthQuery.isLoading
  const isCountriesLoading = countriesQuery.isLoading
  const isIndustriesLoading = industriesQuery.isLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {p.subtitle}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="animate-pulse px-6 py-4 flex flex-col justify-between h-[120px]">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-8 w-8 rounded bg-muted" />
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="h-8 w-20 rounded bg-muted" />
                <div className="h-5 w-12 rounded bg-muted" />
              </div>
            </Card>
          ))
        ) : (
          metrics.map((metric) => {
            const Icon = metricIcons[metric.key] || DollarSign
            return (
              <AdminStatCard
                key={metric.key}
                title={metric.label}
                value={metric.value}
                icon={Icon}
                layout="vertical"
                trend={{
                  value: metric.change,
                  direction: (metric.trend === "up" || metric.trend === "down") ? metric.trend : "up"
                }}
                contentClassName="px-6 py-4"
              />
            )
          })
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Real Chart */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {p.platformGrowth}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-2">
            <div className="h-80 w-full min-w-0 flex items-center justify-center">
              {isChartLoading ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{p.loadingGrowth}</p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart
                    data={growthData}
                    margin={{
                      top: 20,
                      right: 10,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar dataKey="users" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="suppliers" fill="var(--color-suppliers)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rfqs" fill="var(--color-rfqs)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {p.userDistributionByCountry}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCountriesLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {countries.map((item) => (
                  <div key={item.country} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{item.country}</span>
                      <span className="text-sm text-muted-foreground">
                        {p.usersCountTemplate
                          .replace("{count}", String(item.users))
                          .replace("{percent}", String(item.percentage))}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div 
                        className="h-full rounded-full bg-secondary"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Industries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              {p.topIndustries}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isIndustriesLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {industries.map((item, index) => (
                  <div key={item.slug} className="flex items-center gap-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.industry}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.industryStatsTemplate
                          .replace("{suppliers}", String(item.suppliers))
                          .replace("{products}", item.products.toLocaleString())}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
