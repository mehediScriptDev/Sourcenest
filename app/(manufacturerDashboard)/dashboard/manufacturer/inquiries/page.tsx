"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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

import { getManufacturerRFQs, type ManufacturerRFQ } from "@/lib/api/rfqs"
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
  
  const [inquiries, setInquiries] = useState<ManufacturerRFQ[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInquiries() {
      const response = await getManufacturerRFQs()
      if (response.success && response.data) {
        setInquiries(response.data)
      }
      setLoading(false)
    }
    loadInquiries()
  }, [])

  const filteredInquiries = inquiries.filter(inquiry => {
    const searchString = searchQuery.toLowerCase()
    if (searchQuery && 
        !inquiry.product.name.toLowerCase().includes(searchString) && 
        !inquiry.buyer.name.toLowerCase().includes(searchString) &&
        !inquiry.rfq_number.toLowerCase().includes(searchString)) {
      return false
    }
    if (statusFilter && statusFilter !== "all" && inquiry.status !== statusFilter) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">Buyer Inquiries</h1>
        <p className="mt-1 text-muted-foreground">
          Manage and respond to buyer requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-foreground">{inquiries.length}</div>
          <p className="text-sm text-muted-foreground">Total Inquiries</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-secondary">{inquiries.filter(i => i.status === "pending").length}</div>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-emerald-600">{inquiries.filter(i => i.status === "quoted").length}</div>
          <p className="text-sm text-muted-foreground">Quoted</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-2xl font-bold text-blue-600">{inquiries.filter(i => i.status === "accepted").length}</div>
          <p className="text-sm text-muted-foreground">Accepted</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by buyer, product, or inquiry ID..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading inquiries...
        </div>
      ) : (
      <div className="space-y-4">
        {filteredInquiries.map((inquiry) => {
          const StatusIcon = statusConfig[inquiry.status]?.icon || Clock
          return (
            <div 
              key={inquiry.id} 
              className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md"
            >

              
              <div className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">{inquiry.rfq_number}</span>
                      <Badge className={statusConfig[inquiry.status]?.color || "bg-gray-100 text-gray-700"}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                      </Badge>
                    </div>
                    
                    {/* Buyer Info */}
                    <h3 className="font-semibold text-foreground text-lg">{inquiry.buyer.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {inquiry.destination_country}
                    </div>
                    
                    {/* Product & Specs Card */}
                    <div className="mt-4 rounded-lg bg-muted/50 border border-border p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{inquiry.product.name}</p>
                          <p className="text-sm text-secondary font-medium">{inquiry.quantity} {inquiry.quantity_unit}</p>
                        </div>
                      </div>
                      
                      {/* Specifications */}
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        {inquiry.target_price && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Target Price:</span>
                            <span className="text-foreground">{inquiry.target_price} {inquiry.target_currency_code}</span>
                          </div>
                        )}
                        {inquiry.required_delivery_date && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Delivery By:</span>
                            <span className="text-foreground">{format(new Date(inquiry.required_delivery_date), 'PP')}</span>
                          </div>
                        )}
                        {inquiry.shipping_terms && (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Terms:</span>
                            <span className="text-foreground">{inquiry.shipping_terms}</span>
                          </div>
                        )}
                        {inquiry.destination_port_city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Port:</span>
                            <span className="text-foreground">{inquiry.destination_port_city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Buyer Message */}
                    {inquiry.additional_requirements && (
                      <p className="mt-3 text-sm text-muted-foreground">{inquiry.additional_requirements}</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col items-end gap-3 lg:ml-6">
                    <span className="text-xs text-muted-foreground">{format(new Date(inquiry.created_at), 'PP')}</span>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <Link href={`/dashboard/manufacturer/inquiries/${inquiry.id}`}>
                          <Eye className="h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <Link href={`/dashboard/manufacturer/messages?buyer=${inquiry.buyer.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Link>
                      </Button>
                      {inquiry.status === "pending" && (
                        <Button size="sm" className="gap-1" asChild>
                          <Link href={`/dashboard/manufacturer/inquiries/${inquiry.id}`}>
                            <Send className="h-4 w-4" />
                            Send Quote
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
          <h3 className="mt-4 font-semibold text-foreground">No inquiries found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? "Try adjusting your filters" 
              : "New buyer inquiries will appear here"}
          </p>
        </div>
      )}
    </div>
  )
}
