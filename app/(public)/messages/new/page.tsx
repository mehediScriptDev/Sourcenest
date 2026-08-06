"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { suppliers, getSupplierBySlug } from "@/lib/data/suppliers"
import { getProduct, type Product } from "@/lib/api/products"
import { getProductBySlug } from "@/lib/data/products"
import { useAuth } from "@/lib/auth-context"
import { createConversation, sendMessage } from "@/lib/api/messages"
import { 
  ArrowLeft,
  Factory,
  CheckCircle,
  Send,
  Star,
  Loader2,
  X,
  Package
} from "lucide-react"

function NewMessageForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supplierSlug = searchParams.get('supplier')
  const productSlug = searchParams.get('product')
  const fallbackImg = searchParams.get('productImage')
  const fallbackDesc = searchParams.get('productDesc')
  const supplier = supplierSlug ? getSupplierBySlug(supplierSlug) : null
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState(supplier)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSupplierSearch, setShowSupplierSearch] = useState(!supplier)
  const [loadingProduct, setLoadingProduct] = useState(!!productSlug)
  const [productData, setProductData] = useState<any | null>(null)
  const [includeProductReference, setIncludeProductReference] = useState(false)

  useEffect(() => {
    if (productSlug) {
      const fetchProduct = async () => {
        setLoadingProduct(true)
        const response = await getProduct(productSlug)
        if (response.success && response.data) {
          const prod = response.data
          setProductData({
            name: prod.name,
            description: prod.description,
            minOrder: prod.pricing_quantities?.minimum_order_quantity ? `${prod.pricing_quantities.minimum_order_quantity} ${prod.pricing_quantities.unit || 'pcs'}` : undefined,
            price: prod.price_display || (prod.price?.amount ? `$${prod.price.amount}` : undefined),
            url: `${window.location.origin}/products/${prod.id || prod.slug}`,
            images: prod.images?.length ? prod.images : (prod.image ? [prod.image] : undefined)
          })
          setIncludeProductReference(true)
          setSubject(`Inquiry about ${prod.name}`)
          setMessage(`Hello,\n\nI am interested in your product "${prod.name}".\n\nCould you please provide more details regarding pricing, minimum order quantity, and available shipping options?\n\nI look forward to hearing from you soon.\n\nBest regards.`)

          if (!supplier) {
            const found = suppliers.find(s => s.slug === prod.supplierSlug || s.id === prod.supplierId)
            if (found) {
              setSelectedSupplier(found)
              setShowSupplierSearch(false)
            } else {
              setSelectedSupplier({
                id: prod.supplierId || "1",
                name: prod.supplierName || "Admin (SourceNest Support)",
                slug: prod.supplierSlug || "admin",
                description: "Platform Administration and Support",
                shortDescription: "Platform Admin",
                industry: "Support",
                industrySlug: "support",
                categories: [],
                location: {
                  city: "Global",
                  country: "International",
                  countryCode: "INT"
                },
                reviewed: true,
                reviewedLevel: "enterprise",
                yearEstablished: new Date().getFullYear(),
                employeeCount: "10-50",
                productCount: 0,
                rating: 5.0,
                reviewCount: 0,
                responseRate: 100,
                responseTime: "Usually responds within 24h",
                onTimeDelivery: 100,
                certifications: [],
                mainProducts: [],
                exportMarkets: []
              })
              setShowSupplierSearch(false)
            }
          }
        } else {
          // Fallback to dummy data or query params
          const dummyProd = getProductBySlug(productSlug)
          const finalName = dummyProd?.name || searchParams.get('productName') || productSlug || "Product"
          const finalDesc = dummyProd?.shortDescription || dummyProd?.description || fallbackDesc || "No description available"
          const finalImg = dummyProd?.images || (fallbackImg ? [fallbackImg] : undefined)

          setProductData({
            name: finalName,
            description: finalDesc,
            minOrder: dummyProd?.moq ? `${dummyProd.moq} ${dummyProd.moqUnit || 'pcs'}` : undefined,
            price: dummyProd?.price ? `$${dummyProd.price.min}` : undefined,
            url: `${window.location.origin}/products/${productSlug}`,
            images: finalImg
          })
          setIncludeProductReference(true)
          setSubject(`Inquiry about ${finalName}`)
          setMessage(`Hello,\n\nI am interested in your product "${finalName}".\n\nCould you please provide more details regarding pricing, minimum order quantity, and available shipping options?\n\nI look forward to hearing from you soon.\n\nBest regards.`)

          if (!supplier && dummyProd) {
            const found = suppliers.find(s => s.slug === dummyProd.supplierSlug || s.id === dummyProd.supplierId)
            if (found) {
              setSelectedSupplier(found)
              setShowSupplierSearch(false)
            }
          }
        }
        setLoadingProduct(false)
      }
      fetchProduct()
    }
  }, [productSlug, supplier])

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.industry.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5)

  const [isSending, setIsSending] = useState(false)

  const { user, isAuthenticated } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      // If not logged in, redirect to login
      router.push('/auth/signin?callbackUrl=/messages/new')
      return
    }
    
    if (!selectedSupplier || !subject || !message) return

    setIsSending(true)
    try {
      const currentUserId = user?.id?.toString() || "buyer-1"
      const conv = await createConversation([selectedSupplier.id, currentUserId], subject)
      
      let finalMessage = message
      if (includeProductReference && productData) {
         finalMessage = `[Product Reference: ${productData.name}]\nLink: ${window.location.origin}/products/${productData.slug || productData.id}\n\n${message}`
      }

      if (conv) {
        await sendMessage(conv.id, finalMessage)
      }
      router.push('/messages')
    } catch (error) {
      console.error("Failed to send message:", error)
      setIsSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/messages" 
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Messages
        </Link>
        <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
          New Message
        </h1>
        <p className="mt-2 text-muted-foreground">
          Start a conversation with a supplier
        </p>
      </div>

      {loadingProduct && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading product details to prepare your message...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Selection */}
        <div className="rounded-xl border border-border bg-card p-6">
          <label className="text-sm font-medium text-foreground">
            Supplier
          </label>
          
          {selectedSupplier ? (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Factory className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{selectedSupplier.name}</span>
                    {selectedSupplier.verified && (
                      <CheckCircle className="h-4 w-4 text-secondary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedSupplier.location.city}, {selectedSupplier.location.country}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {selectedSupplier.rating}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedSupplier(null)
                  setShowSupplierSearch(true)
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <Input
                type="text"
                placeholder="Search suppliers by name or industry..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSupplierSearch(true)
                }}
                onFocus={() => setShowSupplierSearch(true)}
              />
              
              {showSupplierSearch && searchQuery && (
                <div className="mt-2 rounded-lg border border-border bg-card shadow-lg">
                  {filteredSuppliers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No suppliers found
                    </div>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSupplier(s)
                          setShowSupplierSearch(false)
                          setSearchQuery("")
                        }}
                        className="flex w-full items-center gap-3 border-b border-border p-3 text-left last:border-b-0 hover:bg-muted/50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Factory className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{s.name}</span>
                            {s.verified && (
                              <CheckCircle className="h-3 w-3 text-secondary" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {s.industry} • {s.location.country}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                          {s.rating}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="rounded-xl border border-border bg-card p-6">
          <label htmlFor="subject" className="text-sm font-medium text-foreground">
            Subject
          </label>
          <Input
            id="subject"
            type="text"
            placeholder="e.g., Inquiry about TWS Earbuds pricing"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-3"
            required
          />
        </div>

        {/* Message */}
        <div className="rounded-xl border border-border bg-card p-6">
          <label htmlFor="message" className="text-sm font-medium text-foreground">
            Message
          </label>
          <div className="mt-3 overflow-hidden rounded-md border border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            {includeProductReference && productData && (
              <div className="border-b border-border bg-muted/30 p-3">
                <div className="group relative flex items-start gap-4 rounded-lg border border-border/50 bg-background p-3 shadow-sm transition-all hover:border-border hover:shadow-md">
                  <button 
                    type="button" 
                    onClick={() => setIncludeProductReference(false)}
                    className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Remove product reference"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    {productData.images && productData.images[0] ? (
                      <img
                        src={productData.images[0]}
                        alt={productData.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center py-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Product Reference</span>
                    <h4 className="font-medium text-foreground line-clamp-1 pr-6 text-sm">{productData.name}</h4>
                    {productData.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{productData.description}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {productData.pricing_quantities?.minimum_order_quantity ? (
                        <span>Min. Order: {productData.pricing_quantities.minimum_order_quantity} {productData.pricing_quantities.unit || 'pcs'}</span>
                      ) : null}
                      {(productData.price_display || productData.price?.amount) ? (
                         <span className="font-medium text-foreground">
                           {productData.price_display || `$${productData.price.amount}`}
                         </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Textarea
              id="message"
              placeholder="Write your message to the supplier..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[200px] resize-y border-0 focus-visible:ring-0 rounded-none"
              required
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Include details about the products you are interested in, quantities, and any specific requirements.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/messages">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            className="gap-2"
            disabled={!selectedSupplier || !subject || !message || isSending}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewMessagePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }>
          <NewMessageForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
