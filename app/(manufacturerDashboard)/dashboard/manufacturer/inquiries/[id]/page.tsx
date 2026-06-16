"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Swal from 'sweetalert2'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowLeft,
  Building2,
  Package,
  Calendar,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Send,
  Clock,
  CheckCircle,
  DollarSign,
  Sparkles,
  Layers,
  Award,
  Tag,
  Truck,
  CreditCard,
  AlertCircle,
  Lightbulb,
  Loader2,
  Upload,
  Image as ImageIcon,
  File,
  X,
  Paperclip
} from "lucide-react"

import { getManufacturerRFQ, type ManufacturerRFQ } from "@/lib/api/rfqs"
import { format } from "date-fns"

export default function InquiryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [inquiry, setInquiry] = useState<ManufacturerRFQ | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInquiry() {
      const response = await getManufacturerRFQ(id)
      if (response.success && response.data) {
        setInquiry(response.data)
      }
      setLoading(false)
    }
    loadInquiry()
  }, [id])
  
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [reply, setReply] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quoteSubmitted, setQuoteSubmitted] = useState(false)
  const [quoteData, setQuoteData] = useState({
    unitPrice: "",
    moq: "",
    leadTime: "",
    validUntil: "",
    shippingTerms: "FOB",
    paymentTerms: "30-70",
    sampleCost: "",
    sampleLeadTime: "",
    packagingDetails: "",
    certifications: [] as string[],
    notes: ""
  })
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File, name: string; type: string; size: string }[]>([])
  const [uploadedImages, setUploadedImages] = useState<{ file: File, name: string; preview: string }[]>([])
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        file,
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : file.type.includes('doc') ? 'DOC' : 'File',
        size: `${(file.size / 1024).toFixed(1)} KB`
      }))
      setUploadedFiles(prev => [...prev, ...newFiles])
    }
  }
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setUploadedImages(prev => [...prev, { file, name: file.name, preview: reader.result as string }])
        }
        reader.readAsDataURL(file)
      })
    }
  }
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }
  
  const toggleCertification = (cert: string) => {
    setQuoteData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }))
  }

  // AI suggestion for pricing
  const [showAISuggestion, setShowAISuggestion] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  const generateAISuggestion = async () => {
    setIsAIThinking(true)
    setShowAISuggestion(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const suggestions: Record<string, string> = {
      "1": `**Pricing Recommendation for Toilet Paper:**\n\n**Suggested Unit Price:** $0.95 - $1.05 per roll\n- This is competitive within the buyer's target range\n- Leaves room for negotiation\n\n**MOQ:** 10,000 rolls minimum\n- Standard for this product category\n\n**Lead Time:** 25-30 days\n- Accounts for FSC certification requirements\n\n**Key Points to Highlight:**\n- FSC certification availability\n- Private label capabilities\n- Quality control processes`,
      "2": `**Pricing Recommendation for Organic Shampoo:**\n\n**Suggested Unit Price:** $4.20 - $4.50 per unit\n- Competitive for COSMOS certified products\n- Premium positioning for organic market\n\n**MOQ:** 3,000 units\n- Standard for cosmetics industry\n\n**Lead Time:** 45-50 days\n- Includes certification verification\n\n**Key Points to Highlight:**\n- COSMOS and Cruelty-Free certifications\n- Sulfate-free formulation\n- Recyclable packaging options`,
      "3": `**Pricing Recommendation for TWS Earbuds:**\n\n**Suggested Unit Price:** $13.50 per unit\n- Mid-range of buyer's target\n- Competitive for ANC feature\n\n**MOQ:** 1,000 units\n- Lower barrier for trial order\n\n**Lead Time:** 20-25 days\n- Fast turnaround for electronics\n\n**Key Points to Highlight:**\n- Bluetooth 5.3 technology\n- Battery performance\n- FCC/CE compliance`,
      "4": `**Pricing Recommendation for LED Smart Bulbs:**\n\n**Suggested Unit Price:** $4.80 - $5.20 per unit\n- Competitive for WiFi + Bluetooth combo\n- Good margin for volume\n\n**MOQ:** 5,000 units\n- Standard for LED products\n\n**Lead Time:** 35-40 days\n- Includes CE testing\n\n**Key Points to Highlight:**\n- Voice assistant compatibility\n- CE/RoHS certifications\n- Energy efficiency ratings`
    }
    
    setAiSuggestion(suggestions[id] || suggestions["1"])
    setIsAIThinking(false)
  }

  const handleSubmitQuote = async () => {
    setIsSubmitting(true)
    
    // Parse numeric fields safely
    const quoted_price = parseFloat(quoteData.unitPrice.replace(/[^0-9.]/g, '')) || 0
    const minimum_order_quantity = parseInt(quoteData.moq.replace(/[^0-9]/g, ''), 10) || 0
    const lead_time_days = parseInt(quoteData.leadTime.replace(/[^0-9]/g, ''), 10) || 0
    
    const formData = new FormData()
    formData.append('quoted_price', quoted_price.toString())
    formData.append('quote_currency_code', 'USD') // Assuming USD for now
    formData.append('minimum_order_quantity', minimum_order_quantity.toString())
    formData.append('lead_time_days', lead_time_days.toString())
    formData.append('lead_time', quoteData.leadTime)
    formData.append('quote_valid_until', quoteData.validUntil || new Date().toISOString().split('T')[0])
    formData.append('quote_shipping_terms', quoteData.shippingTerms)
    formData.append('quote_payment_terms', quoteData.paymentTerms)
    formData.append('sample_cost', quoteData.sampleCost)
    formData.append('sample_lead_time', quoteData.sampleLeadTime)
    formData.append('quote_packaging_details', quoteData.packagingDetails)
    
    quoteData.certifications.forEach(cert => {
      formData.append('quote_certifications[]', cert)
    })
    
    formData.append('quote_notes', quoteData.notes)

    uploadedImages.forEach((img, index) => {
      formData.append(`photos[${index}]`, img.file)
    })

    uploadedFiles.forEach((doc, index) => {
      formData.append(`attachments[${index}]`, doc.file)
    })

    try {
      const { submitManufacturerQuote } = await import("@/lib/api/rfqs")
      const response = await submitManufacturerQuote(id, formData)

      if (response.success) {
        setShowQuoteDialog(false)
        Swal.fire({
          title: 'Success! 🎉',
          text: `Your quote for Inquiry #${inquiry?.rfq_number} has been sent successfully.`,
          icon: 'success',
          confirmButtonColor: 'hsl(var(--primary))',
          confirmButtonText: 'Great!'
        }).then(() => {
          // Refresh the inquiry data
          window.location.reload()
        })
      } else {
        Swal.fire({
          title: 'Error',
          text: response.message || "Failed to submit quote",
          icon: 'error',
          confirmButtonColor: 'hsl(var(--destructive))',
        })
      }
    } catch (error) {
      console.error(error)
      Swal.fire({
        title: 'Error',
        text: "An unexpected error occurred.",
        icon: 'error',
        confirmButtonColor: 'hsl(var(--destructive))',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusColors: Record<string, string> = {
    "pending": "bg-amber-100 text-amber-700",
    "quoted": "bg-emerald-100 text-emerald-700",
    "accepted": "bg-blue-100 text-blue-700",
    "rejected": "bg-red-100 text-red-700",
    "expired": "bg-gray-100 text-gray-700"
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading inquiry details...</div>
  }

  if (!inquiry) {
    return <div className="py-12 text-center text-muted-foreground">Inquiry not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/manufacturer/inquiries">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-medium text-foreground">
                Inquiry {inquiry.rfq_number}
              </h1>
              <Badge className={statusColors[inquiry.status] || ""}>{inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              Received {format(new Date(inquiry.created_at), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Message Buyer
          </Button>
          <Button className="gap-2" onClick={() => setShowQuoteDialog(true)}>
            <FileText className="h-4 w-4" />
            Send Quote
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted border border-border">
                  <Package className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{inquiry.product.name}</h3>
                  <p className="text-secondary font-medium">{inquiry.quantity} {inquiry.quantity_unit}</p>
                </div>
              </div>

              <Separator />

              {/* Specifications Grid */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Specifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  {inquiry.packaging_details && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Packaging</p>
                        <p className="font-medium text-foreground">{inquiry.packaging_details}</p>
                      </div>
                    </div>
                  )}
                  {inquiry.target_price && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Target Price</p>
                        <p className="font-medium text-foreground">{inquiry.target_price} {inquiry.target_currency_code}</p>
                      </div>
                    </div>
                  )}
                  {inquiry.required_delivery_date && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Delivery Timeline</p>
                        <p className="font-medium text-foreground">{format(new Date(inquiry.required_delivery_date), 'PP')}</p>
                      </div>
                    </div>
                  )}
                  {inquiry.shipping_terms && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Shipping Terms</p>
                        <p className="font-medium text-foreground">{inquiry.shipping_terms}</p>
                      </div>
                    </div>
                  )}
                  {inquiry.destination_port_city && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Destination Port</p>
                        <p className="font-medium text-foreground">{inquiry.destination_port_city}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Buyer Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{inquiry.additional_requirements || "No additional requirements provided."}</p>
            </CardContent>
          </Card>

          {/* Structured Offer Form */}
          <Card className="border-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Submit Your Offer
              </CardTitle>
              <p className="text-sm text-muted-foreground">Fill in all details - buyer will see exactly what you submit</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {quoteSubmitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Offer Submitted!</h3>
                  <p className="text-muted-foreground">Your offer has been sent to the buyer.</p>
                </div>
              ) : (
                <>
                  {/* Pricing Section */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Unit Price <span className="text-destructive">*</span></Label>
                        <Input 
                          placeholder="e.g. $0.95 per roll"
                          value={quoteData.unitPrice}
                          onChange={(e) => setQuoteData({ ...quoteData, unitPrice: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>MOQ <span className="text-destructive">*</span></Label>
                        <Input 
                          placeholder="e.g. 10,000 units"
                          value={quoteData.moq}
                          onChange={(e) => setQuoteData({ ...quoteData, moq: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Production & Delivery */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Production & Delivery
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Lead Time <span className="text-destructive">*</span></Label>
                        <Input 
                          placeholder="e.g. 25-30 days"
                          value={quoteData.leadTime}
                          onChange={(e) => setQuoteData({ ...quoteData, leadTime: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Shipping Terms</Label>
                        <Select 
                          value={quoteData.shippingTerms} 
                          onValueChange={(value) => setQuoteData({ ...quoteData, shippingTerms: value })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FOB">FOB</SelectItem>
                            <SelectItem value="CIF">CIF</SelectItem>
                            <SelectItem value="EXW">EXW</SelectItem>
                            <SelectItem value="DDP">DDP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Terms */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Terms
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Payment Structure</Label>
                        <Select 
                          value={quoteData.paymentTerms} 
                          onValueChange={(value) => setQuoteData({ ...quoteData, paymentTerms: value })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30-70">30% deposit, 70% before shipping</SelectItem>
                            <SelectItem value="50-50">50% deposit, 50% before shipping</SelectItem>
                            <SelectItem value="100-advance">100% in advance</SelectItem>
                            <SelectItem value="LC">Letter of Credit</SelectItem>
                            <SelectItem value="net30">Net 30</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quote Valid Until</Label>
                        <Input 
                          type="date"
                          value={quoteData.validUntil}
                          onChange={(e) => setQuoteData({ ...quoteData, validUntil: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Packaging Details */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Packaging Details
                    </h4>
                    <Textarea 
                      placeholder="Describe your packaging (e.g., 24 rolls per case, custom branding available, recyclable materials...)"
                      value={quoteData.packagingDetails}
                      onChange={(e) => setQuoteData({ ...quoteData, packagingDetails: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <Separator />

                  {/* Certifications */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certifications Available
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["ISO 9001", "ISO 14001", "FSC", "BSCI", "CE", "FCC", "RoHS", "COSMOS", "GMP", "FDA"].map((cert) => (
                        <Badge 
                          key={cert}
                          variant={quoteData.certifications.includes(cert) ? "default" : "outline"}
                          className="cursor-pointer transition-colors"
                          onClick={() => toggleCertification(cert)}
                        >
                          {quoteData.certifications.includes(cert) && <CheckCircle className="h-3 w-3 mr-1" />}
                          {cert}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Click to select certifications you can provide</p>
                  </div>

                  <Separator />

                  {/* Sample Options */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Sample Options
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Sample Cost</Label>
                        <Input 
                          placeholder="e.g. $50 including shipping"
                          value={quoteData.sampleCost}
                          onChange={(e) => setQuoteData({ ...quoteData, sampleCost: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Sample Lead Time</Label>
                        <Input 
                          placeholder="e.g. 7 days"
                          value={quoteData.sampleLeadTime}
                          onChange={(e) => setQuoteData({ ...quoteData, sampleLeadTime: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* File Attachments */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </h4>
                    
                    {/* Image Upload */}
                    <div className="mb-4">
                      <Label className="text-sm text-muted-foreground">Product Images</Label>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {uploadedImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <div className="w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted">
                              <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-secondary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/50">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            className="hidden" 
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Document Upload */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Documents (PDF, Quotation, Certificates)</Label>
                      <div className="mt-2 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{file.name}</span>
                              <Badge variant="outline" className="text-[10px]">{file.type}</Badge>
                              <span className="text-xs text-muted-foreground">{file.size}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="w-6 h-6 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors"
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        ))}
                        <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-secondary/50 cursor-pointer transition-colors bg-muted/30">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Upload documents</span>
                          <input 
                            type="file" 
                            accept=".pdf,.doc,.docx,.xls,.xlsx" 
                            multiple 
                            className="hidden" 
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Notes */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Additional Notes
                    </h4>
                    <Textarea 
                      placeholder="Any additional information for the buyer..."
                      value={quoteData.notes}
                      onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={handleSubmitQuote}
                    disabled={!quoteData.unitPrice || !quoteData.moq || !quoteData.leadTime || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit Offer to Buyer
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Buyer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{"Not Specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium">{inquiry.buyer.name}</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{inquiry.destination_country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{inquiry.buyer.email}</span>
              </div>
            </CardContent>
          </Card>


          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                    <FileText className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Inquiry received</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(inquiry.created_at), 'PPP')}</p>
                  </div>
                </div>
                {inquiry.status !== "pending" && inquiry.quoted_at && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Quote sent</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(inquiry.quoted_at), 'PPP')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quote Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Send Quotation
            </DialogTitle>
            <DialogDescription>
              Provide your offer for {inquiry.product.name} ({inquiry.quantity} {inquiry.quantity_unit})
            </DialogDescription>
          </DialogHeader>
          
          {quoteSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Quote Sent Successfully!</h3>
              <p className="mt-2 text-sm text-muted-foreground">The buyer will be notified of your offer.</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {/* Pricing Section */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Unit Price (USD) *</Label>
                      <Input 
                        placeholder="e.g. $1.00"
                        value={quoteData.unitPrice}
                        onChange={(e) => setQuoteData({ ...quoteData, unitPrice: e.target.value })}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Buyer target: {inquiry.target_price} {inquiry.target_currency_code}
                      </p>
                    </div>
                    <div>
                      <Label>Minimum Order Qty *</Label>
                      <Input 
                        placeholder="e.g. 10,000 units"
                        value={quoteData.moq}
                        onChange={(e) => setQuoteData({ ...quoteData, moq: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Production & Delivery */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Production & Delivery
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Lead Time *</Label>
                      <Input 
                        placeholder="e.g. 30 days"
                        value={quoteData.leadTime}
                        onChange={(e) => setQuoteData({ ...quoteData, leadTime: e.target.value })}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Buyer needs: {format(new Date(inquiry.required_delivery_date), 'PP')}
                      </p>
                    </div>
                    <div>
                      <Label>Shipping Terms</Label>
                      <Select 
                        value={quoteData.shippingTerms} 
                        onValueChange={(value) => setQuoteData({ ...quoteData, shippingTerms: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXW">EXW (Ex Works)</SelectItem>
                          <SelectItem value="FOB">FOB (Free on Board)</SelectItem>
                          <SelectItem value="CIF">CIF (Cost, Insurance, Freight)</SelectItem>
                          <SelectItem value="DDP">DDP (Delivered Duty Paid)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Terms */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Terms
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Payment Terms</Label>
                      <Select 
                        value={quoteData.paymentTerms} 
                        onValueChange={(value) => setQuoteData({ ...quoteData, paymentTerms: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30-70">30% Deposit, 70% Before Shipment</SelectItem>
                          <SelectItem value="50-50">50% Deposit, 50% Before Shipment</SelectItem>
                          <SelectItem value="100-lc">100% L/C at Sight</SelectItem>
                          <SelectItem value="tt">T/T (Full Payment Before Production)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quote Valid Until</Label>
                      <Input 
                        type="date"
                        value={quoteData.validUntil}
                        onChange={(e) => setQuoteData({ ...quoteData, validUntil: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sample Options */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Sample Options
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sample Cost</Label>
                      <Input 
                        placeholder="e.g. $50 including shipping"
                        value={quoteData.sampleCost}
                        onChange={(e) => setQuoteData({ ...quoteData, sampleCost: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Sample Lead Time</Label>
                      <Input 
                        placeholder="e.g. 7 days"
                        value={quoteData.sampleLeadTime}
                        onChange={(e) => setQuoteData({ ...quoteData, sampleLeadTime: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Packaging Details */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Packaging Details
                  </h4>
                  <Textarea 
                    placeholder="Describe your packaging options (e.g., box size, units per carton, custom branding options...)"
                    value={quoteData.packagingDetails}
                    onChange={(e) => setQuoteData({ ...quoteData, packagingDetails: e.target.value })}
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Certifications */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications Available
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["ISO 9001", "ISO 14001", "FSC", "BSCI", "CE", "FCC", "RoHS", "COSMOS", "GMP", "FDA"].map((cert) => (
                      <Badge 
                        key={cert}
                        variant={quoteData.certifications.includes(cert) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleCertification(cert)}
                      >
                        {quoteData.certifications.includes(cert) && <CheckCircle className="h-3 w-3 mr-1" />}
                        {cert}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Click to select certifications you can provide</p>
                </div>

                <Separator />

                {/* File Attachments */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                  </h4>
                  
                  {/* Image Upload */}
                  <div className="mb-4">
                    <Label className="text-sm text-muted-foreground">Product Images</Label>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <div className="w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted">
                            <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-secondary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/50">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Documents (PDF, Quotation, Certificates)</Label>
                    <div className="mt-2 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{file.name}</span>
                            <Badge variant="outline" className="text-[10px]">{file.type}</Badge>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="w-6 h-6 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors"
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                      <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-secondary/50 cursor-pointer transition-colors bg-muted/30">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload documents</span>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.xls,.xlsx" 
                          multiple 
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Notes */}
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea 
                    placeholder="Include any additional terms, customization options, volume discounts, or special conditions..."
                    value={quoteData.notes}
                    onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Please ensure all pricing and terms are accurate. Once submitted, the buyer will receive this quote immediately.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitQuote}
                  disabled={!quoteData.unitPrice || !quoteData.moq || !quoteData.leadTime || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Quote
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
