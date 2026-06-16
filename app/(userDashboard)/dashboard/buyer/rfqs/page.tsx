"use client"

import { useState, useEffect } from "react"
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
import { getBuyerRFQs, type BuyerRFQ } from "@/lib/api/rfqs"
import { format } from "date-fns"

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  "quoted": { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle, label: "Quoted" },
  "pending": { color: "bg-amber-100 text-amber-700", icon: Clock, label: "Pending" },
  "in review": { color: "bg-blue-100 text-blue-700", icon: Eye, label: "In Review" },
  "expired": { color: "bg-gray-100 text-gray-700", icon: AlertCircle, label: "Expired" },
  "accepted": { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "Accepted" },
  "rejected": { color: "bg-red-100 text-red-700", icon: AlertCircle, label: "Rejected" },
}

export default function BuyerRFQsPage() {
  const router = useRouter()
  const [rfqs, setRfqs] = useState<BuyerRFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    async function loadRFQs() {
      const response = await getBuyerRFQs()
      if (response.success && response.data) {
        setRfqs(response.data)
      }
      setLoading(false)
    }
    loadRFQs()
  }, [])

  const filteredRFQs = rfqs.filter(rfq => {
    const productName = rfq.product?.name || ""
    const supplierName = rfq.supplier?.company_name || ""
    const rfqNumber = rfq.rfq_number || ""
    
    if (searchQuery && !productName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !supplierName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !rfqNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter && statusFilter !== "all" && rfq.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false
    }
    return true
  })

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
          <h1 className="font-serif text-2xl font-medium text-foreground">Request for Quotes</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track your RFQ submissions
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/rfq/new">
            <Plus className="h-4 w-4" />
            New RFQ
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-foreground">{rfqs.length}</div>
          <p className="text-sm text-muted-foreground">Total RFQs</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-emerald-600">{rfqs.filter(r => r.status.toLowerCase() === "quoted").length}</div>
          <p className="text-sm text-muted-foreground">Quoted</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-amber-600">{rfqs.filter(r => r.status.toLowerCase() === "pending").length}</div>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-blue-600">{rfqs.filter(r => r.status.toLowerCase() === "in review").length}</div>
          <p className="text-sm text-muted-foreground">In Review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by product, supplier, or RFQ ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in review">In Review</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* RFQ Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm">
                <th className="px-5 py-3 font-medium text-muted-foreground">RFQ ID</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Product</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Supplier</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Quantity</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Quote</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRFQs.map((rfq) => {
                const statusKey = rfq.status.toLowerCase()
                const StatusIcon = statusConfig[statusKey]?.icon || Clock
                const statusColor = statusConfig[statusKey]?.color || "bg-gray-100 text-gray-700"
                const statusLabel = statusConfig[statusKey]?.label || rfq.status
                
                return (
                  <tr key={rfq.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/buyer/rfqs/${rfq.id}`)}>
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{rfq.rfq_number}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{rfq.product?.name || 'Unknown'}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{rfq.supplier?.company_name || 'No supplier'}</td>
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
            <h3 className="mt-4 font-semibold text-foreground">No RFQs found</h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery || statusFilter ? "Try adjusting your filters" : "Submit your first RFQ to get started"}
            </p>
            {!searchQuery && !statusFilter && (
              <Button className="mt-4 gap-2" asChild>
                <Link href="/rfq/new">
                  <Plus className="h-4 w-4" />
                  Submit RFQ
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
