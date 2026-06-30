"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMessages } from "@/lib/messages-context"
import { getSelectProducts, getSelectBuyers, createManufacturerOrder, type SelectProduct, type SelectBuyer } from "@/lib/api/orders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, FileText, Plus, X, Building2, Mail, MapPin, Loader2 } from "lucide-react"

interface CreateConfig {
  kind: string
  basePath: string
  sellerId: string | number
  sellerName: string
  title: string
  subtitle: string
  submitLabel: string
}

export function SellerOrderCreate({ config }: { config: CreateConfig }) {
  const router = useRouter()
  const { postOrderCreated } = useMessages()
  const isService = config.kind === "service"

  const [products, setProducts] = useState<SelectProduct[]>([])
  const [buyers, setBuyers] = useState<SelectBuyer[]>([])
  
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("")
  
  const selectedBuyer = buyers.find((b) => String(b.id) === selectedBuyerId)

  const [form, setForm] = useState({
    title: "",
    quantity: "",
    quantityUnit: isService ? "units" : "units",
    totalAmount: "",
    currency: "USD",
    productionTime: "",
    estimatedDelivery: "",
    paymentTerms: "",
    shippingTerms: isService ? "Digital delivery" : "",
    destination: isService ? "Remote / Online" : "",
    packagingDetails: "",
    notes: "",
  })
  
  // Actual file attachment state
  const [docs, setDocs] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showError, setShowError] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const required = !!(selectedBuyerId && selectedProductId && form.title && form.quantity && form.totalAmount && form.estimatedDelivery)

  useEffect(() => {
    async function loadProducts() {
      setIsLoadingProducts(true)
      const res = await getSelectProducts()
      if (res.success) {
        setProducts(res.data)
      }
      setIsLoadingProducts(false)
    }
    loadProducts()
  }, [])

  useEffect(() => {
    async function loadBuyers() {
      if (!selectedProductId) {
        setBuyers([])
        setSelectedBuyerId("")
        return
      }
      
      setIsLoadingBuyers(true)
      const res = await getSelectBuyers({ product_id: parseInt(selectedProductId, 10) })
      if (res.success) {
        setBuyers(res.data)
      }
      setIsLoadingBuyers(false)
    }
    loadBuyers()
  }, [selectedProductId])

  const handleSubmit = async () => {
    if (!required || !selectedBuyerId || !selectedProductId) {
      setShowError(true)
      return
    }
    
    setIsSubmitting(true)
    const amount = Number.parseFloat(form.totalAmount) || 0
    
    // Pass the actual files to the API
    const attachments: File[] = docs
    
    const res = await createManufacturerOrder({
      buyer_id: parseInt(selectedBuyerId, 10),
      product_id: parseInt(selectedProductId, 10),
      title: form.title,
      quantity: parseInt(form.quantity, 10) || 1,
      quantity_unit: form.quantityUnit,
      total_amount: amount,
      currency_code: form.currency,
      estimated_delivery_at: form.estimatedDelivery,
      production_lead: form.productionTime,
      payment_terms: form.paymentTerms,
      shipping_terms: form.shippingTerms,
      destination: form.destination,
      notes: form.notes,
      attachments,
    })

    if (res.success && res.data) {
      // Note: This relies on the global context which may or may not work depending on how messages are implemented
      try {
        postOrderCreated(res.data as any)
      } catch (e) {
        console.error("Failed to post message", e)
      }
      
      router.push(`${config.basePath}/${res.data.id}`)
    } else {
      setIsSubmitting(false)
      alert(res.message || "Failed to create order")
    }
  }

  return (
    <div className="w-full">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground">
        <Link href={config.basePath}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium text-foreground">{config.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.subtitle}</p>
      </div>

      <div className="space-y-6">
        <Section title={isService ? "Engagement" : "Order"}>
          <Field label={isService ? "Engagement title" : "Order title"} required>
            <Input
              placeholder={isService ? "e.g., Brand identity & packaging design" : "e.g., Premium ceramic mugs — 320ml"}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Related Product" required>
              <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={isLoadingProducts}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                  {products.length === 0 && !isLoadingProducts && (
                    <SelectItem value="none" disabled>No products available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Select connected buyer" required>
              <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId} disabled={!selectedProductId || isLoadingBuyers}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedProductId ? "Select a product first" :
                    isLoadingBuyers ? "Loading buyers..." : 
                    "Choose a buyer"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.company} — {b.name}
                    </SelectItem>
                  ))}
                  {buyers.length === 0 && !isLoadingBuyers && selectedProductId && (
                    <SelectItem value="none" disabled>No buyers available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isService ? "Scope / deliverables" : "Quantity"} required>
              <div className="flex gap-2">
                <Input
                  placeholder={isService ? "e.g., Logo, 3 packaging SKUs, brand guide" : "e.g., 5000"}
                  type={isService ? "text" : "number"}
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  className="flex-1"
                />
                {!isService && (
                  <Select 
                    value={form.quantityUnit} 
                    onValueChange={(value) => set("quantityUnit", value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="sets">Sets</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="kg">KG</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="cartons">Cartons</SelectItem>
                      <SelectItem value="pallets">Pallets</SelectItem>
                      <SelectItem value="20ft container">20ft Container</SelectItem>
                      <SelectItem value="40ft container">40ft Container</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </Field>
          </div>
        </Section>

        {selectedBuyer && (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {selectedBuyer.company}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {selectedBuyer.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <Section title="Commercial terms">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Total amount" required>
              <Input type="number" placeholder="0.00" value={form.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} />
            </Field>
            <Field label="Currency">
              <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
            </Field>
            <Field label={isService ? "Delivery date" : "Est. delivery"} required>
              <Input type="date" value={form.estimatedDelivery} onChange={(e) => set("estimatedDelivery", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isService ? "Timeline" : "Production lead time"}>
              <Input placeholder={isService ? "e.g., 3 weeks" : "e.g., 30 days"} value={form.productionTime} onChange={(e) => set("productionTime", e.target.value)} />
            </Field>
            <Field label="Payment terms">
              <Input placeholder="e.g., 50% upfront, 50% on delivery" value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
            </Field>
          </div>
          {!isService && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shipping terms">
                <Input placeholder="e.g., FOB Shanghai" value={form.shippingTerms} onChange={(e) => set("shippingTerms", e.target.value)} />
              </Field>
              <Field label="Destination">
                <Input placeholder="e.g., Los Angeles, USA" value={form.destination} onChange={(e) => set("destination", e.target.value)} />
              </Field>
            </div>
          )}
        </Section>

        <Section title="Documents & notes">
          <Field label="Attach documents">
            <div className="flex flex-wrap items-center gap-2">
              {docs.map((d, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-foreground">
                  <FileText className="h-3 w-3" />
                  {d.name}
                  <button type="button" onClick={() => setDocs((p) => p.filter((_, idx) => idx !== i))}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </span>
              ))}
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) {
                    setDocs((prev) => [...prev, ...Array.from(e.target.files as FileList)])
                  }
                  e.target.value = ""
                }}
              />
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                <Plus className="h-3.5 w-3.5" />
                Add document
              </Button>
            </div>
          </Field>
          <Field label="Notes">
            <Textarea
              placeholder={isService ? "Any additional context about this engagement..." : "Any additional context about this order..."}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </Field>
        </Section>

        {showError && !required && (
          <p className="text-sm text-destructive">Please fill in all required fields marked with *.</p>
        )}

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline" disabled={isSubmitting}>
            <Link href={config.basePath}>Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {config.submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 font-medium text-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}
