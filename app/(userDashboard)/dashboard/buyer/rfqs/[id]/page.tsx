"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  DollarSign,
  Sparkles,
  Award,
  Truck,
  CreditCard,
  FileText,
  Download,
  MessageSquare,
  Image as ImageIcon,
  File,
  ExternalLink,
  ThumbsUp,
  AlertCircle,
  Loader2
} from "lucide-react"

import { getBuyerRFQ, respondToQuote, type BuyerRFQ } from "@/lib/api/rfqs"
import { format } from "date-fns"
import Swal from 'sweetalert2'

export default function BuyerRFQDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [rfq, setRfq] = useState<BuyerRFQ | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadRFQ = async () => {
    setLoading(true)
    const response = await getBuyerRFQ(id)
    if (response.success && response.data) {
      setRfq(response.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRFQ()
  }, [id])

  const handleAction = async (action: "accept" | "cancel") => {
    setIsSubmitting(true)
    try {
      const response = await respondToQuote(id, { action })
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Quote ${action}ed successfully.`,
          confirmButtonColor: '#10b981'
        })
        loadRFQ() // Reload data to show updated status
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || `Failed to ${action} quote.`,
          confirmButtonColor: '#ef4444'
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred.',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!rfq) {
    return (
      <div className="py-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-semibold text-foreground">RFQ Not Found</h3>
        <p className="mt-2 text-muted-foreground">The RFQ you are looking for does not exist or has been removed.</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/buyer/rfqs">Back to RFQs</Link>
        </Button>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    "quoted": "bg-emerald-100 text-emerald-700",
    "pending": "bg-amber-100 text-amber-700",
    "in review": "bg-blue-100 text-blue-700",
    "expired": "bg-gray-100 text-gray-700",
    "accepted": "bg-green-100 text-green-700",
    "rejected": "bg-red-100 text-red-700",
  }

  const hasQuote = ["quoted", "accepted", "rejected"].includes(rfq.status.toLowerCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/buyer/rfqs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-medium text-foreground">
                {rfq.rfq_number}
              </h1>
              <Badge className={statusColors[rfq.status.toLowerCase()] || ""}>{rfq.status}</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              Submitted on {format(new Date(rfq.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Request Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Your Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Product</p>
              <p className="font-semibold text-foreground">{rfq.product?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="font-semibold text-foreground">{rfq.quantity} {rfq.quantity_unit}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Price</p>
              <p className="font-semibold text-foreground">
                {rfq.target_price ? `${rfq.target_price} ${rfq.target_currency_code}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery</p>
              <p className="font-semibold text-foreground">
                {rfq.required_delivery_date ? format(new Date(rfq.required_delivery_date), 'MMM d, yyyy') : "N/A"}
              </p>
            </div>
          </div>
          {rfq.packaging_details && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Packaging Details</p>
              <p className="text-sm">{rfq.packaging_details}</p>
            </div>
          )}
          {rfq.additional_requirements && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Additional Requirements</p>
              <p className="text-sm">{rfq.additional_requirements}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Offer */}
      {hasQuote ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {rfq.supplier?.company_name || "Supplier Offer"}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {rfq.supplier?.location || "Unknown Location"}
                  {rfq.quoted_at && (
                    <>
                      <span className="mx-1">•</span>
                      Submitted {format(new Date(rfq.quoted_at), 'MMM d, yyyy')}
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">
                  {rfq.quoted_price} {rfq.quote_currency_code}
                </p>
                <p className="text-sm text-muted-foreground">per unit</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing & Terms Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  MOQ
                </p>
                <p className="font-semibold text-foreground mt-1">{rfq.minimum_order_quantity}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Lead Time
                </p>
                <p className="font-semibold text-foreground mt-1">{rfq.lead_time || `${rfq.lead_time_days} days`}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Valid Until
                </p>
                <p className="font-semibold text-foreground mt-1">
                  {rfq.quote_valid_until ? format(new Date(rfq.quote_valid_until), 'MMM d, yyyy') : "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total (Est.)
                </p>
                <p className="font-semibold text-foreground mt-1">
                  {rfq.quoted_price && rfq.quantity ? (parseFloat(rfq.quoted_price) * rfq.quantity).toFixed(2) : "N/A"} {rfq.quote_currency_code}
                </p>
              </div>
            </div>

            <Separator />

            {/* Shipping & Payment */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipping Terms
                </h4>
                <Badge variant="outline" className="text-sm">{rfq.quote_shipping_terms || rfq.shipping_terms}</Badge>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Terms
                </h4>
                <p className="text-sm text-foreground">{rfq.quote_payment_terms || "N/A"}</p>
              </div>
            </div>

            <Separator />

            {/* Packaging Details */}
            {rfq.quote_packaging_details && (
              <>
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Quote Packaging Details
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">{rfq.quote_packaging_details}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Certifications */}
            {rfq.quote_certifications && rfq.quote_certifications.length > 0 && (
              <>
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {rfq.quote_certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Sample Options */}
            {(rfq.sample_cost || rfq.sample_lead_time) && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Sample Cost</h4>
                    <p className="text-sm text-foreground">{rfq.sample_cost || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Sample Lead Time</h4>
                    <p className="text-sm text-foreground">{rfq.sample_lead_time || "N/A"}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Notes */}
            {(rfq.quote_notes || rfq.manufacturer_reply) && (
              <>
                <div>
                  <h4 className="font-medium text-foreground mb-3">Supplier Notes</h4>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-foreground leading-relaxed">
                    {rfq.quote_notes || rfq.manufacturer_reply}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Product Images */}
            {rfq.quote_photos && rfq.quote_photos.length > 0 && (
              <>
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Product Images
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {rfq.quote_photos.map((imgUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="w-24 h-24 rounded-lg border border-border overflow-hidden bg-muted">
                          <img 
                            src={imgUrl} 
                            alt={`Product photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Documents */}
            {rfq.quote_documents && rfq.quote_documents.length > 0 && (
              <>
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <File className="h-4 w-4" />
                    Documents
                  </h4>
                  <div className="space-y-2">
                    {rfq.quote_documents.map((file) => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.original_name}</p>
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {(file.size_bytes / 1024).toFixed(1)} KB
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Action Buttons */}
            {rfq.status.toLowerCase() === 'quoted' && (
              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction("accept")}
                  disabled={isSubmitting}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Accept Offer
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 gap-2"
                  onClick={() => handleAction("cancel")}
                  disabled={isSubmitting}
                >
                  <AlertCircle className="h-4 w-4" />
                  Reject Offer
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <Link href={`/dashboard/buyer/messages?conversation=${rfq.conversation_id || ''}`}>
                    <MessageSquare className="h-4 w-4" />
                    Message Supplier
                  </Link>
                </Button>
              </div>
            )}
            
            {rfq.status.toLowerCase() !== 'quoted' && (
              <div className="flex gap-3 pt-4">
                 <Button variant="outline" className="flex-1 gap-2" asChild>
                  <Link href={`/dashboard/buyer/messages?conversation=${rfq.conversation_id || ''}`}>
                    <MessageSquare className="h-4 w-4" />
                    Message Supplier
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">Waiting for Quote</h3>
            <p className="mt-2 text-muted-foreground">
              Your request has been sent to the supplier. You will be notified when they reply.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
