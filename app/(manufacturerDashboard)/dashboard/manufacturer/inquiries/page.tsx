"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ManufacturerStatCard from "@/components/manufacturer/manufacturer-stat-card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search,
  FileText,
  CheckCircle,
  Clock,
  MessageSquare,
  Eye,
  Send,
  Sparkles,
  Package,
  MapPin,
  Layers,
  Award,
  Tag
} from "lucide-react"

import { getManufacturerRFQs } from "@/lib/api/rfqs"
import { queryKeys } from "@/lib/query-keys"
import { format } from "date-fns"

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  "pending": { color: "bg-amber-100 text-amber-700", icon: Clock },
  "quoted": { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  "accepted": { color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  "rejected": { color: "bg-red-100 text-red-700", icon: CheckCircle },
  "expired": { color: "bg-gray-100 text-gray-700", icon: CheckCircle },
}

const priorityConfig: Record<string, string> = {
  "High": "bg-red-100 text-red-700",
  "Medium": "bg-amber-100 text-amber-700",
  "Low": "bg-gray-100 text-gray-700",
}

export default function ManufacturerInquiriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { t } = useTranslation()

  const inquiriesQuery = useQuery({
    queryKey: queryKeys.manufacturerRfqs(),
    queryFn: getManufacturerRFQs,
  })

  const inquiries = inquiriesQuery.data?.success ? inquiriesQuery.data.data ?? [] : []
  const loading = inquiriesQuery.isLoading

  const filteredInquiries = useMemo(
    () =>
      inquiries.filter((inquiry) => {
        const searchString = searchQuery.toLowerCase()
        if (
          searchQuery &&
          !inquiry.product.name.toLowerCase().includes(searchString) &&
          !inquiry.buyer.name.toLowerCase().includes(searchString) &&
          !inquiry.rfq_number.toLowerCase().includes(searchString)
        ) {
          return false
        }
        if (statusFilter && statusFilter !== "all" && inquiry.status !== statusFilter) {
          return false
        }
        return true
      }),
    [inquiries, searchQuery, statusFilter]
  )

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="font-serif text-xl font-medium text-foreground sm:text-2xl">{t.mfg.inquiries.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {t.mfg.inquiries.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ManufacturerStatCard
          title={t.mfg.inquiries.totalInquiries}
          value={inquiries.length}
        />
        <ManufacturerStatCard
          title={t.mfg.inquiries.pending}
          value={<span className="text-secondary">{inquiries.filter(i => i.status === "pending").length}</span>}
        />
        <ManufacturerStatCard
          title={t.mfg.inquiries.quoted}
          value={<span className="text-emerald-600">{inquiries.filter(i => i.status === "quoted").length}</span>}
        />
        <ManufacturerStatCard
          title={t.mfg.inquiries.accepted}
          value={<span className="text-blue-600">{inquiries.filter(i => i.status === "accepted").length}</span>}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t.mfg.inquiries.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t.mfg.inquiries.allStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.mfg.inquiries.allStatus}</SelectItem>
            <SelectItem value="pending">{t.mfg.inquiries.pending}</SelectItem>
            <SelectItem value="quoted">{t.mfg.inquiries.quoted}</SelectItem>
            <SelectItem value="accepted">{t.mfg.inquiries.accepted}</SelectItem>
            <SelectItem value="rejected">{t.mfg.inquiries.rejected}</SelectItem>
            <SelectItem value="expired">{t.mfg.inquiries.expired}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          {t.mfg.inquiries.loading}
        </div>
      ) : (
      <div className="space-y-4">
        {filteredInquiries.map((inquiry) => {
          const StatusIcon = statusConfig[inquiry.status]?.icon || Clock
          return (
            <div 
              key={inquiry.id} 
              className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Header */}
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">{inquiry.rfq_number}</span>
                      <Badge className={statusConfig[inquiry.status]?.color || "bg-gray-100 text-gray-700"}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {inquiry.status === "pending" ? t.mfg.inquiries.pending :
                         inquiry.status === "quoted" ? t.mfg.inquiries.quoted :
                         inquiry.status === "accepted" ? t.mfg.inquiries.accepted :
                         inquiry.status === "rejected" ? t.mfg.inquiries.rejected :
                         inquiry.status === "expired" ? t.mfg.inquiries.expired : inquiry.status}
                      </Badge>
                    </div>
                    
                    {/* Buyer Info */}
                    <h3 className="wrap-break-word text-base font-semibold text-foreground sm:text-lg">{inquiry.buyer.name}</h3>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{inquiry.destination_country}</span>
                    </div>
                    
                    {/* Product & Specs Card */}
                    <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 sm:p-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="wrap-break-word font-semibold text-foreground">{inquiry.product.name}</p>
                          <p className="text-sm font-medium text-secondary">{inquiry.quantity} {inquiry.quantity_unit}</p>
                        </div>
                      </div>
                      
                      {/* Specifications */}
                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        {inquiry.target_price && (
                          <div className="min-w-0">
                            <div className="flex items-start gap-2">
                              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="text-muted-foreground">{t.mfg.inquiries.targetPrice}</p>
                                <p className="wrap-break-word text-foreground">{inquiry.target_price} {inquiry.target_currency_code}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {inquiry.required_delivery_date && (
                          <div className="min-w-0">
                            <div className="flex items-start gap-2">
                              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="text-muted-foreground">{t.mfg.inquiries.deliveryBy}</p>
                                <p className="wrap-break-word text-foreground">{format(new Date(inquiry.required_delivery_date), 'PP')}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {inquiry.shipping_terms && (
                          <div className="min-w-0">
                            <div className="flex items-start gap-2">
                              <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="text-muted-foreground">{t.mfg.inquiries.terms}</p>
                                <p className="wrap-break-word text-foreground">{inquiry.shipping_terms}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {inquiry.destination_port_city && (
                          <div className="min-w-0 sm:col-span-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="text-muted-foreground">{t.mfg.inquiries.port}</p>
                                <p className="wrap-break-word text-foreground">{inquiry.destination_port_city}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Buyer Message */}
                    {inquiry.additional_requirements && (
                      <p className="mt-3 wrap-break-word text-sm text-muted-foreground">{inquiry.additional_requirements}</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex w-full flex-col gap-3 border-t border-border pt-4 lg:ml-6 lg:w-auto lg:border-0 lg:pt-0">
                    <span className="text-xs text-muted-foreground lg:text-end">{format(new Date(inquiry.created_at), 'PP')}</span>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                      <Button variant="outline" size="sm" className="w-full gap-1 sm:w-auto" asChild>
                        <Link href={`/dashboard/manufacturer/inquiries/${inquiry.id}`}>
                          <Eye className="h-4 w-4" />
                          {t.mfg.inquiries.viewDetails}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full gap-1 sm:w-auto" asChild>
                        <Link href={`/dashboard/manufacturer/messages?buyer=${inquiry.buyer.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          {t.mfg.inquiries.message}
                        </Link>
                      </Button>
                      {inquiry.status === "pending" && (
                        <Button size="sm" className="w-full gap-1 sm:w-auto" asChild>
                          <Link href={`/dashboard/manufacturer/inquiries/${inquiry.id}`}>
                            <Send className="h-4 w-4" />
                            {t.mfg.inquiries.sendQuote}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {!loading && filteredInquiries.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold text-foreground">{t.mfg.inquiries.noInquiriesFound}</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? t.mfg.inquiries.adjustFilters 
              : t.mfg.inquiries.newInquiriesAppear}
          </p>
        </div>
      )}
    </div>
  )
}
