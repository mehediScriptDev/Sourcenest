"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  TrendingUp,
  TrendingDown,
  Eye,
  MessageSquare,
  FileText,
  Users,
  Globe,
  BarChart3,
  Package,
  Loader2
} from "lucide-react"
import {
  LineChart,
  Line,
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
import { 
  getManufacturerAnalyticsMetrics, 
  getManufacturerAnalyticsPerformance,
  getManufacturerAnalyticsFunnel,
  AnalyticsMetricItem,
  AnalyticsPerformanceItem,
  AnalyticsFunnelStep
} from "@/lib/api/manufacturer-analytics"
import ManufacturerStatCard from "@/components/manufacturer/manufacturer-stat-card"

const metricIcons: Record<string, React.ComponentType<any>> = {
  profile_views: Eye,
  inquiries_received: FileText,
  messages: MessageSquare,
  quote_requests: Package,
}

const periodApiMap: Record<string, string> = {
  "7": "last_7_days",
  "30": "last_30_days",
  "90": "last_90_days",
  "365": "last_year"
}

const chartConfig = {
  profile_views: {
    label: "Profile Views",
    color: "var(--chart-1)",
  },
  inquiries: {
    label: "Inquiries Received",
    color: "var(--chart-2)",
  },
  messages: {
    label: "Messages",
    color: "var(--chart-3)",
  },
  quote_requests: {
    label: "Quote Requests",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

const topProducts = [
  { name: "TWS Wireless Earbuds Pro", views: 1234, inquiries: 45 },
  { name: "Smart Fitness Tracker V3", views: 987, inquiries: 38 },
  { name: "Bluetooth Speaker 20W", views: 756, inquiries: 29 },
  { name: "USB-C Fast Charger 65W", views: 654, inquiries: 24 },
  { name: "Wireless Mouse Ergonomic", views: 543, inquiries: 18 },
]

const topCountries = [
  { country: "United States", flag: "US", percentage: 35 },
  { country: "Germany", flag: "DE", percentage: 18 },
  { country: "United Kingdom", flag: "GB", percentage: 15 },
  { country: "Australia", flag: "AU", percentage: 12 },
  { country: "Canada", flag: "CA", percentage: 10 },
  { country: "Other", flag: "OT", percentage: 10 },
]

export default function ManufacturerAnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetricItem[]>([])
  const [performanceData, setPerformanceData] = useState<AnalyticsPerformanceItem[]>([])
  const [funnelSteps, setFunnelSteps] = useState<AnalyticsFunnelStep[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(true)
  const [isFunnelLoading, setIsFunnelLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  const loadAnalytics = useCallback(async (selectedPeriod: string) => {
    const apiPeriod = periodApiMap[selectedPeriod] || "last_30_days"
    
    // Fetch metrics
    try {
      setIsLoading(true)
      const res = await getManufacturerAnalyticsMetrics({ period: apiPeriod })
      if (res.success && res.data?.metrics) {
        setMetrics(res.data.metrics)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }

    // Fetch performance data
    try {
      setIsChartLoading(true)
      const res = await getManufacturerAnalyticsPerformance({ period: apiPeriod })
      if (res.success && res.data) {
        // Reverse array to render chronologically (oldest to newest)
        setPerformanceData([...res.data].reverse())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsChartLoading(false)
    }

    // Fetch funnel data
    try {
      setIsFunnelLoading(true)
      const res = await getManufacturerAnalyticsFunnel({ period: apiPeriod })
      if (res.success && res.data?.steps) {
        setFunnelSteps(res.data.steps)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsFunnelLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics(period)
  }, [period, loadAnalytics])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Track your performance and buyer engagement
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="h-5 w-12 rounded bg-muted" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-8 w-20 rounded bg-muted" />
                  <div className="h-4 w-28 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric) => {
            const Icon = metricIcons[metric.key] || Eye
            return (
              <ManufacturerStatCard
                key={metric.key}
                title={metric.label}
                value={metric.value}
                icon={Icon}
                iconClassName="text-muted-foreground"
                iconWrapperClassName="bg-muted"
                trend={{
                  value: metric.change,
                  direction: metric.trend
                }}
              />
            )
          })
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              {isChartLoading ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading performance data...</p>
                </div>
              ) : performanceData.length === 0 ? (
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">No data available for this period</p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart
                    data={performanceData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ paddingTop: "10px" }} />
                    <Line 
                      type="monotone" 
                      dataKey="profile_views" 
                      stroke="var(--color-profile_views)" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inquiries" 
                      stroke="var(--color-inquiries)" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="var(--color-messages)" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="quote_requests" 
                      stroke="var(--color-quote_requests)" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.views.toLocaleString()} views • {product.inquiries} inquiries
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Buyer Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCountries.map((item) => (
                <div key={item.country} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item.country}</span>
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
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
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFunnelLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading funnel metrics...</span>
              </div>
            ) : funnelSteps.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No funnel data available for this period.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-4">
                {funnelSteps.map((step) => (
                  <div key={step.key} className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{step.value_formatted}</p>
                    <p className="text-sm text-muted-foreground">{step.label}</p>
                    {step.conversion_label && (
                      <p className="text-xs text-secondary mt-1">{step.conversion_label}</p>
                    )}
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
