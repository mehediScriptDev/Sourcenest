"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMessages } from "@/lib/messages-context"
import {
  getSelectProducts,
  getSelectBuyers,
  createManufacturerOrder,
  type SelectProduct,
  type SelectBuyer,
} from "@/lib/api/orders"
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
import {
  ArrowLeft,
  FileText,
  Plus,
  X,
  Building2,
  Mail,
  Package,
  Trash2,
  Loader2,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { DEFAULT_PRODUCT_UNIT, PRODUCT_UNIT_OPTIONS } from "@/lib/product-units"

interface ProductLine {
  key: string
  productId: string
  productName: string
  quantity: string
  unit: string
  unitPrice: string
  notes: string
}

let lineCounterSeed = 0

function newLine(): ProductLine {
  lineCounterSeed += 1
  return {
    key: `line-${Date.now()}-${lineCounterSeed}`,
    productId: "",
    productName: "",
    quantity: "",
    unit: DEFAULT_PRODUCT_UNIT,
    unitPrice: "",
    notes: "",
  }
}

function lineTotal(line: ProductLine): number {
  const qty = Number.parseFloat(line.quantity) || 0
  const price = Number.parseFloat(line.unitPrice) || 0
  return qty * price
}

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
  const { t } = useTranslation()
  const on = t.mfg.orderNew
  const od = t.mfg.orderDetails
  const isService = config.kind === "service"

  const [products, setProducts] = useState<SelectProduct[]>([])
  const [buyers, setBuyers] = useState<SelectBuyer[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("")
  const selectedBuyer = buyers.find((b) => String(b.id) === selectedBuyerId)

  const [form, setForm] = useState({
    title: "",
    quantity: "",
    quantityUnit: "units",
    totalAmount: "",
    currency: "USD",
    productionTime: "",
    estimatedDelivery: "",
    paymentTerms: "",
    shippingTerms: isService ? "Digital delivery" : "",
    destination: isService ? "Remote / Online" : "",
    notes: "",
  })

  const [docs, setDocs] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showError, setShowError] = useState(false)

  const [lines, setLines] = useState<ProductLine[]>(() => (isService ? [] : [newLine()]))

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const updateLine = (key: string, patch: Partial<ProductLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const addLine = () => setLines((prev) => [...prev, newLine()])

  const removeLine = (key: string) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))

  const selectProduct = (key: string, productId: string) => {
    const product = products.find((p) => String(p.id) === productId)
    if (!product) {
      updateLine(key, { productId: "", productName: "" })
      return
    }
    updateLine(key, {
      productId,
      productName: product.name,
    })
  }

  const orderTotal = lines.reduce((sum, l) => sum + lineTotal(l), 0)

  const selectedProductIds = lines
    .map((l) => Number.parseInt(l.productId, 10))
    .filter((id) => Number.isFinite(id) && id > 0)

  const allProductsSelected = !isService && lines.length > 0 && lines.every((l) => l.productId)

  const linesValid =
    lines.length > 0 &&
    lines.every(
      (l) =>
        l.productId &&
        l.productName.trim() &&
        Number.parseFloat(l.quantity) > 0 &&
        Number.parseFloat(l.unitPrice) >= 0,
    )

  const required = isService
    ? !!(
        selectedBuyerId &&
        form.title &&
        form.quantity &&
        form.totalAmount &&
        form.estimatedDelivery
      )
    : !!(selectedBuyerId && form.title && form.estimatedDelivery && linesValid)

  useEffect(() => {
    async function loadProducts() {
      setIsLoadingProducts(true)
      const res = await getSelectProducts()
      if (res.success) {
        setProducts(res.data)
      }
      setIsLoadingProducts(false)
    }
    void loadProducts()
  }, [])

  useEffect(() => {
    async function loadBuyers() {
      if (isService) {
        if (!products[0]?.id) {
          setBuyers([])
          setSelectedBuyerId("")
          return
        }
        setIsLoadingBuyers(true)
        const res = await getSelectBuyers({
          product_ids: [products[0].id],
        })
        if (res.success) {
          setBuyers(res.data)
        }
        setIsLoadingBuyers(false)
        return
      }

      if (!allProductsSelected || selectedProductIds.length === 0) {
        setBuyers([])
        setSelectedBuyerId("")
        return
      }

      setIsLoadingBuyers(true)
      const res = await getSelectBuyers({
        product_ids: selectedProductIds,
      })
      if (res.success) {
        setBuyers(res.data)
      }
      setIsLoadingBuyers(false)
    }
    void loadBuyers()
  }, [isService, products, allProductsSelected, selectedProductIds.join(",")])

  const handleSubmit = async () => {
    if (!required || !selectedBuyerId) {
      setShowError(true)
      return
    }

    setIsSubmitting(true)

    try {
      if (isService) {
        const amount = Number.parseFloat(form.totalAmount) || 0
        const productId = products[0]?.id ?? 0
        const res = await createManufacturerOrder({
          buyer_id: Number.parseInt(selectedBuyerId, 10),
          items: [
            {
              product_id: productId,
              quantity: Number.parseInt(form.quantity, 10) || 1,
              quantity_unit: form.quantityUnit,
              unit_price: amount,
            },
          ],
          title: form.title,
          total_amount: amount,
          currency_code: form.currency,
          estimated_delivery_at: form.estimatedDelivery,
          production_lead: form.productionTime,
          payment_terms: form.paymentTerms,
          shipping_terms: form.shippingTerms,
          destination: form.destination,
          notes: form.notes,
          attachments: docs,
        })

        if (res.success && res.data) {
          try {
            postOrderCreated(res.data as never)
          } catch {
            // messaging is optional
          }
          router.push(`${config.basePath}/${res.data.id}`)
          return
        }

        alert(res.message || on.submitFailed)
        return
      }

      const items = lines.map((line) => ({
        product_id: Number.parseInt(line.productId, 10),
        quantity: Number.parseInt(line.quantity, 10) || 1,
        quantity_unit: line.unit,
        unit_price: Number.parseFloat(line.unitPrice) || 0,
        notes: line.notes.trim() || undefined,
      }))

      const res = await createManufacturerOrder({
        buyer_id: Number.parseInt(selectedBuyerId, 10),
        items,
        title: form.title,
        total_amount: orderTotal,
        currency_code: form.currency,
        estimated_delivery_at: form.estimatedDelivery,
        production_lead: form.productionTime,
        payment_terms: form.paymentTerms,
        shipping_terms: form.shippingTerms,
        destination: form.destination,
        notes: form.notes,
        attachments: docs,
      })

      if (!res.success || !res.data) {
        alert(res.message || on.submitFailed)
        return
      }

      try {
        postOrderCreated(res.data as never)
      } catch {
        // messaging is optional
      }
      router.push(`${config.basePath}/${res.data.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-2xl overflow-x-hidden">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground">
        <Link href={config.basePath}>
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium text-foreground">{config.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.subtitle}</p>
      </div>

      <div className="space-y-6">
        <Section title={isService ? on.engagement : t.mfg.orders.title}>
          <Field label={isService ? on.engagementTitle : on.orderTitle} required>
            <Input
              placeholder={
                isService
                  ? on.engagementTitlePlaceholder
                  : on.orderTitlePlaceholder
              }
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          {isService && (
            <Field label={od.scope} required>
              <Input
                placeholder={on.scopePlaceholder}
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </Field>
          )}
        </Section>

        {!isService && (
          <Section title={on.products}>
            <p className="-mt-2 text-sm text-muted-foreground">{on.productsHelp}</p>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={line.key} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {on.productLine.replace("{n}", String(index + 1))}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLine(line.key)}
                      disabled={lines.length <= 1}
                      title={on.removeProduct}
                      aria-label={on.removeProduct}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Field label={on.selectProduct}>
                      <Select
                        value={line.productId || undefined}
                        onValueChange={(v) => selectProduct(line.key, v)}
                        disabled={isLoadingProducts}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingProducts ? on.loadingProducts : on.selectProduct
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                          {products.length === 0 && !isLoadingProducts && (
                            <SelectItem value="none" disabled>
                              {on.noProducts}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <Field label={od.quantity}>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                        />
                      </Field>
                      <Field label={on.unit}>
                        <Select
                          value={line.unit}
                          onValueChange={(v) => updateLine(line.key, { unit: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_UNIT_OPTIONS.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label={on.unitPrice}>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                        />
                      </Field>
                      <Field label={on.lineTotal}>
                        <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium text-foreground">
                          {form.currency}{" "}
                          {lineTotal(line).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </Field>
                    </div>

                    <Field label={on.notesPackaging}>
                      <Input
                        placeholder={on.notesPackagingPlaceholder}
                        value={line.notes}
                        onChange={(e) => updateLine(line.key, { notes: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addLine}>
                <Plus className="h-4 w-4" />
                {on.addItem}
              </Button>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{on.totalAmount}</p>
                <p className="font-serif text-xl font-medium text-foreground">
                  {form.currency}{" "}
                  {orderTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Section>
        )}

        <Section title={on.selectBuyer}>
          <Field label={on.selectBuyer} required>
            <Select
              value={selectedBuyerId}
              onValueChange={setSelectedBuyerId}
              disabled={(!isService && !allProductsSelected) || (isService && !products[0]?.id) || isLoadingBuyers}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !isService && !allProductsSelected
                      ? on.selectProductFirst
                      : isService && !products[0]?.id
                        ? on.selectProductFirst
                        : isLoadingBuyers
                          ? on.loadingBuyers
                          : on.chooseBuyer
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {buyers.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.company} — {b.name}
                  </SelectItem>
                ))}
                {buyers.length === 0 && !isLoadingBuyers && (allProductsSelected || (isService && products[0]?.id)) && (
                  <SelectItem value="none" disabled>
                    {on.noBuyers}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">{on.buyerHelp}</p>
          </Field>

          {selectedBuyer && (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
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
          )}
        </Section>

        <Section title={on.commercialTerms}>
          <div className="grid gap-4 sm:grid-cols-3">
            {isService ? (
              <Field label={on.totalAmount} required>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.totalAmount}
                  onChange={(e) => set("totalAmount", e.target.value)}
                />
              </Field>
            ) : (
              <Field label={on.totalAmount}>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium text-foreground">
                  {form.currency}{" "}
                  {orderTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </Field>
            )}
            <Field label="Currency">
              <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
            </Field>
            <Field label={isService ? on.deliveryDate : od.estDelivery} required>
              <Input
                type="date"
                value={form.estimatedDelivery}
                onChange={(e) => set("estimatedDelivery", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isService ? on.timeline : od.productionTime}>
              <Input
                placeholder={isService ? on.timelinePlaceholder : on.productionTimePlaceholder}
                value={form.productionTime}
                onChange={(e) => set("productionTime", e.target.value)}
              />
            </Field>
            <Field label={od.paymentTerms}>
              <Input
                placeholder={on.paymentTermsPlaceholder}
                value={form.paymentTerms}
                onChange={(e) => set("paymentTerms", e.target.value)}
              />
            </Field>
          </div>
          {!isService && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={od.shippingTerms}>
                <Input
                  placeholder={on.shippingTermsPlaceholder}
                  value={form.shippingTerms}
                  onChange={(e) => set("shippingTerms", e.target.value)}
                />
              </Field>
              <Field label={od.destination}>
                <Input
                  placeholder={on.destinationPlaceholder}
                  value={form.destination}
                  onChange={(e) => set("destination", e.target.value)}
                />
              </Field>
            </div>
          )}
        </Section>

        <Section title={on.documentsNotes}>
          <Field label={on.attachDocuments}>
            <div className="flex flex-wrap items-center gap-2">
              {docs.map((d, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-foreground"
                >
                  <FileText className="h-3 w-3" />
                  {d.name}
                  <button
                    type="button"
                    onClick={() => setDocs((p) => p.filter((_, idx) => idx !== i))}
                  >
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-3.5 w-3.5" />
                {od.attachFile}
              </Button>
            </div>
          </Field>
          <Field label={t.mfg.inquiryDetails.notes || "Notes"}>
            <Textarea
              placeholder={on.notesPlaceholder}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </Field>
        </Section>

        {showError && !required && (
          <p className="text-sm text-destructive">
            {isService ? on.requiredFieldsError : on.productOrderError}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline" disabled={isSubmitting}>
            <Link href={config.basePath}>{t.common.cancel}</Link>
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
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
      <h2 className="mb-4 font-medium text-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
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
