"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus,
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  MessageSquare,
  Loader2
} from "lucide-react"
import { getBuyerRFQs } from "@/lib/api/rfqs"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"
import { format } from "date-fns"

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  "quoted": { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  "pending": { color: "bg-amber-100 text-amber-700", icon: Clock },
  "in review": { color: "bg-blue-100 text-blue-700", icon: Eye },
  "expired": { color: "bg-gray-100 text-gray-700", icon: AlertCircle },
  "accepted": { color: "bg-green-100 text-green-700", icon: CheckCircle },
  "rejected": { color: "bg-red-100 text-red-700", icon: AlertCircle },
}

export default function BuyerRFQsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const rfqsQuery = useQuery({
    queryKey: queryKeys.buyerRfqs(),
    queryFn: getBuyerRFQs,
  })

  const rfqs = rfqsQuery.data?.success ? rfqsQuery.data.data ?? [] : []
  const loading = rfqsQuery.isLoading

  const getStatusLabel = (status: string) => {
    const key = status.toLowerCase()
    if (key === "in review") return t.buyer.rfqs.status.inReview
    return t.buyer.rfqs.status[key as keyof typeof t.buyer.rfqs.status] || status
  }

  const filteredRFQs = useMemo(
    () =>
      rfqs.filter((rfq) => {
        const productName = rfq.product?.name || ""
        const supplierName = rfq.supplier?.company_name || ""
        const rfqNumber = rfq.rfq_number || ""

        if (
          searchQuery &&
          !productName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !supplierName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !rfqNumber.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false
        }
        if (
          statusFilter &&
          statusFilter !== "all" &&
          rfq.status.toLowerCase() !== statusFilter.toLowerCase()
        ) {
          return false
        }
        return true
      }),
    [rfqs, searchQuery, statusFilter]
  )

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{t.buyer.rfqs.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {t.buyer.rfqs.subtitle}
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/rfq/new">
            <Plus className="h-4 w-4" />
            {t.buyer.rfqs.newRfq}
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-foreground">{rfqs.length}</div>
          <p className="text-sm text-muted-foreground">{t.buyer.rfqs.stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-emerald-600">{rfqs.filter(r => r.status.toLowerCase() === "quoted").length}</div>
          <p className="text-sm text-muted-foreground">{t.buyer.rfqs.stats.quoted}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-amber-600">{rfqs.filter(r => r.status.toLowerCase() === "pending").length}</div>
          <p className="text-sm text-muted-foreground">{t.buyer.rfqs.stats.pending}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-blue-600">{rfqs.filter(r => r.status.toLowerCase() === "in review").length}</div>
          <p className="text-sm text-muted-foreground">{t.buyer.rfqs.stats.inReview}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t.buyer.rfqs.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t.buyer.rfqs.allStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.buyer.rfqs.allStatus}</SelectItem>
            <SelectItem value="quoted">{t.buyer.rfqs.status.quoted}</SelectItem>
            <SelectItem value="pending">{t.buyer.rfqs.status.pending}</SelectItem>
            <SelectItem value="in review">{t.buyer.rfqs.status.inReview}</SelectItem>
            <SelectItem value="expired">{t.buyer.rfqs.status.expired}</SelectItem>
            <SelectItem value="accepted">{t.buyer.rfqs.status.accepted}</SelectItem>
            <SelectItem value="rejected">{t.buyer.rfqs.status.rejected}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* RFQ Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm">
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.rfqs.table.rfqId}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.rfqs.table.product}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.rfqs.table.supplier}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.rfqs.table.quantity}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.rfqs.table.status}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.rfqs.table.quote}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.rfqs.table.date}</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">{t.buyer.rfqs.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRFQs.map((rfq) => {
                const statusKey = rfq.status.toLowerCase()
                const StatusIcon = statusConfig[statusKey]?.icon || Clock
                const statusColor = statusConfig[statusKey]?.color || "bg-gray-100 text-gray-700"
                const statusLabel = getStatusLabel(rfq.status)
                
                return (
                  <tr key={rfq.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/buyer/rfqs/${rfq.id}`)}>
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{rfq.rfq_number}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{rfq.product?.name || t.buyer.rfqs.table.unknown}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{rfq.supplier?.company_name || t.buyer.rfqs.table.noSupplier}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{rfq.quantity} {rfq.quantity_unit}</td>
                    <td className="px-5 py-4">
                      <Badge className={statusColor}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusLabel}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {rfq.quoted_price ? (
                        <span className="font-semibold text-foreground">{rfq.quoted_price} {rfq.quote_currency_code}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{format(new Date(rfq.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild onClick={(e) => e.stopPropagation()}>
                          <Link href={`/dashboard/buyer/rfqs/${rfq.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild onClick={(e) => e.stopPropagation()}>
                          <Link href={`/dashboard/buyer/messages?conversation=${rfq.conversation_id || ''}`}>
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredRFQs.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">{t.buyer.rfqs.empty.title}</h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery || statusFilter ? t.buyer.rfqs.empty.adjustFilters : t.buyer.rfqs.empty.getStarted}
            </p>
            {!searchQuery && !statusFilter && (
              <Button className="mt-4 gap-2" asChild>
                <Link href="/rfq/new">
                  <Plus className="h-4 w-4" />
                  {t.buyer.rfqs.empty.submitRfq}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
