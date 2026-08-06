"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  useRfqs,
  RFQ_STATUS_LABELS,
  type Rfq,
  type RfqStatus,
} from "@/lib/rfqs-context"
import { getAdminRfqs, type AdminRfqItem, type AdminRfqMeta } from "@/lib/api/admin-rfqs"
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
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  PackageCheck,
  Building2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/orders-context"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { useTranslation } from "@/lib/i18n"
import { Loader2 } from "lucide-react"

const statusStyles: Record<RfqStatus, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-amber-100 text-amber-700", icon: Clock },
  in_review: { color: "bg-blue-100 text-blue-700", icon: Eye },
  quoted: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  accepted: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { color: "bg-red-100 text-red-700", icon: XCircle },
  expired: { color: "bg-gray-100 text-gray-600", icon: AlertCircle },
}

export interface RfqListConfig {
  basePath: string
  role: "buyer" | "manufacturer" | "admin"
  roleId?: string
  listTitle?: string
  listSubtitle?: string
  createLabel?: string
}

function Progress({ status, getLabel }: { status: RfqStatus; getLabel: (s: RfqStatus) => string }) {
  if (status === "cancelled" || status === "expired") {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" />
        {getLabel(status)}
      </div>
    )
  }
  const flow: RfqStatus[] = ["pending", "in_review", "quoted", "accepted"]
  const currentIndex = flow.indexOf(status)
  return (
    <div className="flex items-center gap-1.5">
      {flow.map((s, i) => (
        <div
          key={s}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i <= currentIndex ? "bg-secondary" : "bg-muted",
          )}
          title={getLabel(s)}
        />
      ))}
    </div>
  )
}

function RfqCard({ rfq, config, getLabel, common }: {
  rfq: Rfq
  config: RfqListConfig
  getLabel: (s: RfqStatus) => string
  common: {
    anySupplier: string
    neededBy: string
    updatesCount: string
    noUpdates: string
    viewDetailsLink: string
  }
}) {
  const StatusIcon = statusStyles[rfq.status].icon
  return (
    <Link
      href={`${config.basePath}/${rfq.id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-secondary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{rfq.id}</span>
            <Badge className={cn("gap-1 text-xs", statusStyles[rfq.status].color)}>
              <StatusIcon className="h-3 w-3" />
              {getLabel(rfq.status)}
            </Badge>
          </div>
          <h3 className="mt-1.5 truncate font-medium text-foreground">{rfq.productName}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {config.role === "buyer" ? (rfq.supplierCompanyName || common.anySupplier) : rfq.buyerCompany}
            </span>
            <span className="flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5" />
              {rfq.quantity.toLocaleString()} {rfq.quantityUnit}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="font-serif text-lg font-medium text-foreground">
            {formatCurrency(rfq.targetPrice, rfq.targetCurrencyCode)}
          </span>
          <span className="text-xs text-muted-foreground">
            {common.neededBy.replace("{date}", new Date(rfq.requiredDeliveryDate).toLocaleDateString())}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Progress status={rfq.status} getLabel={getLabel} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {rfq.updates.length > 0
            ? common.updatesCount.replace("{count}", String(rfq.updates.length))
            : common.noUpdates}
        </span>
        <span className="flex items-center gap-1 font-medium text-secondary opacity-0 transition-opacity group-hover:opacity-100">
          {common.viewDetailsLink}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

const ADMIN_PER_PAGE = 15

function mapAdminRfqToRfq(item: AdminRfqItem): Rfq {
  const targetPrice = Number.parseFloat(item.targetPrice) || 0

  return {
    id: String(item.id),
    productName: item.productName,
    quantity: item.quantity,
    quantityUnit: item.quantityUnit,
    targetPrice,
    targetCurrencyCode: item.targetCurrencyCode,
    destinationPortCity: "",
    destinationCountry: "",
    additionalRequirements: "",
    packagingDetails: "",
    shippingTerms: "",
    requiredDeliveryDate: item.requiredDeliveryDate || new Date().toISOString(),
    buyerEmail: "",
    buyerName: item.buyerName,
    buyerCompany: item.buyerName,
    supplierCompanyName: item.supplierCompanyName,
    status: item.status as RfqStatus,
    createdAt: item.createdAt || new Date().toISOString(),
    updates: [],
  }
}

export function RfqList({ config }: { config: RfqListConfig }) {
  const { t } = useTranslation()
  const adminPages = t.admin.pages.rfqs
  const adminRfqsCopy = t.admin.rfqs
  const common = t.admin.common
  const rfqStatus = t.admin.rfqStatus
  const isAdmin = config.role === "admin"
  const getLabel = (status: RfqStatus) =>
    isAdmin ? (rfqStatus[status as keyof typeof rfqStatus] || status) : RFQ_STATUS_LABELS[status]

  const listTitle = config.listTitle ?? adminPages.title
  const listSubtitle = config.listSubtitle ?? adminPages.subtitle
  const { getRfqsForBuyer, getRfqsForManufacturer } = useRfqs()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  const adminRfqsQuery = useQuery({
    queryKey: queryKeys.adminRfqs(page, ADMIN_PER_PAGE, statusFilter, debouncedSearch),
    queryFn: () =>
      getAdminRfqs({
        page,
        per_page: ADMIN_PER_PAGE,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    enabled: isAdmin,
    placeholderData: (previousData) => previousData,
  })

  const serverRfqs =
    isAdmin && adminRfqsQuery.data?.success
      ? adminRfqsQuery.data.data.map(mapAdminRfqToRfq)
      : []
  const adminMeta: AdminRfqMeta | null =
    isAdmin && adminRfqsQuery.data?.success ? adminRfqsQuery.data.meta : null
  const adminLoading = isAdmin && adminRfqsQuery.isLoading

  let myRfqs: Rfq[] = []
  if (isAdmin) {
    myRfqs = serverRfqs
  } else if (config.role === "buyer" && config.roleId) {
    myRfqs = getRfqsForBuyer(config.roleId)
  } else if (config.role === "manufacturer" && config.roleId) {
    myRfqs = getRfqsForManufacturer(config.roleId)
  }

  const filtered = isAdmin
    ? myRfqs
    : myRfqs.filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          return (
            r.productName.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            (r.buyerCompany && r.buyerCompany.toLowerCase().includes(q)) ||
            (r.supplierCompanyName && r.supplierCompanyName.toLowerCase().includes(q))
          )
        }
        return true
      })

  const activeCount = isAdmin
    ? filtered.filter(
        (r) => r.status === "pending" || r.status === "in_review" || r.status === "quoted",
      ).length
    : myRfqs.filter(
        (r) => r.status === "pending" || r.status === "in_review" || r.status === "quoted",
      ).length

  const totalRfqs = isAdmin ? (adminMeta?.total ?? filtered.length) : myRfqs.length

  const statusOptions = isAdmin
    ? (Object.keys(rfqStatus) as RfqStatus[])
    : (Object.keys(RFQ_STATUS_LABELS) as RfqStatus[])

  return (
    <div className={cn("mx-auto", config.role === "admin" ? "w-full" : "max-w-5xl")}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{listTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{listSubtitle}</p>
        </div>
        {config.role === "buyer" && config.createLabel && (
          <Button asChild className="gap-2">
            <Link href={`/rfq/new`}>
              <Plus className="h-4 w-4" />
              {config.createLabel}
            </Link>
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <AdminStatCard
            title={adminPages.totalRfqs}
            value={totalRfqs}
            layout="vertical"
            contentClassName="pt-6 pb-6 px-6"
          />
          <AdminStatCard
            title={adminPages.active}
            value={activeCount}
            layout="vertical"
            contentClassName="pt-6 pb-6 px-6"
          />
          <AdminStatCard
            title={adminPages.totalTargetValue}
            value={formatCurrency(
              myRfqs.reduce((sum, r) => sum + (r.targetPrice * r.quantity), 0),
              myRfqs[0]?.targetCurrencyCode ?? "USD",
            )}
            layout="vertical"
            className="sm:col-span-1 col-span-full"
            contentClassName="pt-6 pb-6 px-6"
          />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAdmin ? adminRfqsCopy.searchPlaceholder : common.searchRfqPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder={isAdmin ? adminRfqsCopy.allStatus : common.allStatuses} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAdmin ? adminRfqsCopy.allStatus : common.allStatuses}</SelectItem>
            {statusOptions.map((k) => (
              <SelectItem key={k} value={k}>
                {getLabel(k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isAdmin && adminLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">{common.loading}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} config={config} getLabel={getLabel} common={common} />
          ))}

          <AdminPagination
            page={page}
            meta={adminMeta}
            itemCount={filtered.length}
            onPageChange={setPage}
            variant="card"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-medium text-foreground">
            {totalRfqs === 0
              ? (isAdmin ? adminRfqsCopy.noRfqs : common.noRfqsYet)
              : (isAdmin ? adminRfqsCopy.noRfqs : common.noRfqsMatchFilters)}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {totalRfqs === 0
              ? (config.role === "buyer" ? common.submitFirstRfq : common.noRfqsAtThisTime)
              : common.adjustFilters}
          </p>
          {totalRfqs === 0 && config.role === "buyer" && (
            <Button asChild className="mt-4 gap-2">
              <Link href={`/rfq/new`}>
                <Plus className="h-4 w-4" />
                {config.createLabel || common.submitRfq}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
