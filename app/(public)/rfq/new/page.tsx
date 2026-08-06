"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProduct, type Product } from "@/lib/api/products"
import { createRFQ } from "@/lib/api/rfqs"
import {
  getPublicSupplierDetails,
  getPublicSupplierProducts,
  getPublicSuppliers,
  type Supplier,
  type ApiSupplierProduct,
} from "@/lib/api/public-suppliers"
import { countries } from "@/lib/data/countries"
import { useToast } from "@/hooks/use-toast"
import Swal from "sweetalert2"
import {
  ArrowLeft,
  Package,
  FileText,
  Loader2,
  AlertCircle,
  Factory,
  CheckCircle,
  Star,
  Plus,
  Trash2,
} from "lucide-react"
import { DEFAULT_PRODUCT_UNIT, PRODUCT_UNIT_OPTIONS } from "@/lib/product-units"

interface RfqProductLine {
  key: string
  productId: string
  quantity: string
  quantity_unit: string
  target_price: string
  packaging_details: string
}

let lineCounterSeed = 0

function newProductLine(productId = "", unit: string = DEFAULT_PRODUCT_UNIT): RfqProductLine {
  lineCounterSeed += 1
  return {
    key: `line-${Date.now()}-${lineCounterSeed}`,
    productId,
    quantity: "",
    quantity_unit: unit,
    target_price: "",
    packaging_details: "",
  }
}

function NewRFQForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const productIdParam = searchParams.get("product_id") || searchParams.get("product")
  const supplierParam = searchParams.get("supplier")

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplierProducts, setSupplierProducts] = useState<ApiSupplierProduct[]>([])
  const [loadingSupplier, setLoadingSupplier] = useState(!!supplierParam)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [initialProduct, setInitialProduct] = useState<Product | null>(null)
  const [loadingInitialProduct, setLoadingInitialProduct] = useState(!!productIdParam)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [manufacturerSearch, setManufacturerSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Supplier[]>([])
  const [searchingSuppliers, setSearchingSuppliers] = useState(false)
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

  const [productLines, setProductLines] = useState<RfqProductLine[]>([newProductLine()])

  const [formData, setFormData] = useState({
    target_currency_code: "USD",
    required_delivery_date: "",
    shipping_terms: "FOB",
    destination_country: "",
    destination_port_city: "",
    additional_requirements: "",
  })

  const updateLine = (key: string, patch: Partial<RfqProductLine>) =>
    setProductLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const addLine = () => setProductLines((prev) => [...prev, newProductLine()])

  const removeLine = (key: string) =>
    setProductLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))

  const selectLineProduct = (key: string, productId: string) => {
    const product = supplierProducts.find((p) => String(p.id) === productId)
    updateLine(key, {
      productId,
      quantity_unit: product?.pricing_quantities?.unit || "pieces",
    })
  }

  const getProductById = (id: string) => supplierProducts.find((p) => String(p.id) === id)

  const linesValid =
    productLines.length > 0 &&
    productLines.every(
      (l) => l.productId && Number.parseFloat(l.quantity) > 0,
    )

  const canSubmit =
    selectedSupplier &&
    linesValid &&
    formData.required_delivery_date &&
    formData.destination_country

  useEffect(() => {
    if (!productIdParam) {
      setLoadingInitialProduct(false)
      return
    }

    const fetchInitialProduct = async () => {
      setLoadingInitialProduct(true)
      try {
        const response = await getProduct(productIdParam)
        if (response.success && response.data) {
          setInitialProduct(response.data)
          setProductLines([newProductLine(String(response.data.id), response.data.pricing_quantities?.unit || "pieces")])
        }
      } catch {
        // optional prefill — ignore
      } finally {
        setLoadingInitialProduct(false)
      }
    }

    void fetchInitialProduct()
  }, [productIdParam])

  useEffect(() => {
    if (supplierParam || !initialProduct?.supplierId) return

    const fetchSupplierFromProduct = async () => {
      const idOrSlug = initialProduct.supplierSlug || initialProduct.supplierId
      const res = await getPublicSupplierDetails(String(idOrSlug))
      if (res?.success && res.data) {
        setSelectedSupplier(res.data)
      }
    }

    void fetchSupplierFromProduct()
  }, [initialProduct, supplierParam])

  useEffect(() => {
    if (!supplierParam) {
      setLoadingSupplier(false)
      return
    }

    const fetchSupplier = async () => {
      setLoadingSupplier(true)
      try {
        const res = await getPublicSupplierDetails(supplierParam)
        if (res?.success && res.data) {
          setSelectedSupplier(res.data)
        }
      } catch {
        setError("Failed to load supplier")
      } finally {
        setLoadingSupplier(false)
      }
    }

    void fetchSupplier()
  }, [supplierParam])

  useEffect(() => {
    if (!selectedSupplier) {
      setSupplierProducts([])
      return
    }

    const loadCatalog = async () => {
      setLoadingProducts(true)
      const idOrSlug = String(selectedSupplier.id)
      const res = await getPublicSupplierProducts(idOrSlug)
      if (res?.success) {
        setSupplierProducts(res.data)
      } else {
        setSupplierProducts([])
      }
      setLoadingProducts(false)
    }

    void loadCatalog()
  }, [selectedSupplier])

  useEffect(() => {
    if (!initialProduct || supplierProducts.length === 0) return
    const exists = supplierProducts.some((p) => String(p.id) === String(initialProduct.id))
    if (!exists) return
    setProductLines((prev) => {
      if (prev.length === 1 && prev[0].productId === String(initialProduct.id)) return prev
      if (prev.length === 1 && !prev[0].productId) {
        return [newProductLine(String(initialProduct.id), initialProduct.pricing_quantities?.unit || "pieces")]
      }
      return prev
    })
  }, [initialProduct, supplierProducts])

  useEffect(() => {
    if (!manufacturerSearch.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingSuppliers(true)
      const res = await getPublicSuppliers({ search: manufacturerSearch.trim() })
      setSearchResults(res?.data ?? [])
      setSearchingSuppliers(false)
    }, 350)

    return () => clearTimeout(timer)
  }, [manufacturerSearch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canSubmit) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier, add valid product lines, delivery date, and destination.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    const failures: string[] = []
    let successCount = 0

    for (const line of productLines) {
      const payload = {
        product_id: Number(line.productId),
        quantity: Number(line.quantity),
        quantity_unit: line.quantity_unit,
        target_price: line.target_price ? Number(line.target_price) : 0,
        target_currency_code: formData.target_currency_code,
        required_delivery_date: formData.required_delivery_date,
        shipping_terms: formData.shipping_terms,
        destination_country: formData.destination_country,
        destination_port_city: formData.destination_port_city,
        packaging_details: line.packaging_details,
        additional_requirements: formData.additional_requirements,
      }

      const response = await createRFQ(payload)
      if (response.success) {
        successCount += 1
      } else {
        failures.push(response.message || "Unknown error")
      }
    }

    setSubmitting(false)

    if (successCount === productLines.length) {
      const productLabel =
        successCount === 1
          ? getProductById(productLines[0].productId)?.name || "your product"
          : `${successCount} products`

      Swal.fire({
        title: "Success!",
        text: `Your quotation request for ${productLabel} has been sent. Suppliers will review your request shortly.`,
        icon: "success",
        confirmButtonColor: "#503322",
        confirmButtonText: "View My RFQs",
        customClass: { confirmButton: "text-white" },
      }).then(() => {
        router.push("/dashboard/buyer/rfqs")
      })
      return
    }

    if (successCount > 0) {
      toast({
        title: "Partially submitted",
        description: `${successCount} of ${productLines.length} products were submitted.`,
        variant: "destructive",
      })
      router.push("/dashboard/buyer/rfqs")
      return
    }

    toast({
      title: "Error",
      description: failures[0] || "Failed to create RFQ. Please try again.",
      variant: "destructive",
    })
  }

  if (loadingSupplier || loadingInitialProduct) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/products")}>
                Back to Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/products"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
          Request for Quotation
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add one or more products and submit a detailed quote request to receive competitive pricing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier */}
        <div className="rounded-xl border border-border bg-card p-6">
          <label className="text-sm font-medium text-foreground">Supplier</label>

          {selectedSupplier ? (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Factory className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{selectedSupplier.name}</span>
                    {selectedSupplier.reviewed && (
                      <CheckCircle className="h-4 w-4 text-secondary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {selectedSupplier.location.city}, {selectedSupplier.location.country}
                    </span>
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
                  setManufacturerSearch("")
                  setProductLines([newProductLine()])
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="relative mt-3">
              <Input
                type="text"
                placeholder="Search by manufacturer name or industry..."
                value={manufacturerSearch}
                onChange={(e) => {
                  setManufacturerSearch(e.target.value)
                  setShowSupplierDropdown(true)
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                className="w-full"
              />

              {showSupplierDropdown && manufacturerSearch && (
                <div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-lg border border-border bg-card shadow-lg">
                  {searchingSuppliers ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No manufacturers found
                    </div>
                  ) : (
                    searchResults.map((supplier) => (
                      <button
                        key={supplier.id}
                        type="button"
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setShowSupplierDropdown(false)
                          setManufacturerSearch("")
                          setProductLines([newProductLine()])
                        }}
                        className="flex w-full items-center gap-3 border-b border-border p-3 text-left last:border-b-0 hover:bg-muted/50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Factory className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{supplier.name}</span>
                            {supplier.reviewed && (
                              <CheckCircle className="h-3 w-3 text-secondary" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {supplier.industry} • {supplier.location.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{supplier.rating}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-foreground">Products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add every product you want quoted in this request. Each line can have its own quantity,
              target price, and packaging notes.
            </p>
          </div>

          {!selectedSupplier ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Select a supplier first to choose products from their catalog.
            </p>
          ) : (
            <div className="space-y-3">
              {productLines.map((line, index) => {
                const catalogProduct = getProductById(line.productId)
                return (
                  <div key={line.key} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Product {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLine(line.key)}
                        disabled={productLines.length <= 1}
                        aria-label={`Remove product ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground">Product</label>
                        <Select
                          value={line.productId || undefined}
                          onValueChange={(v) => selectLineProduct(line.key, v)}
                          disabled={loadingProducts}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue
                              placeholder={loadingProducts ? "Loading products..." : "Select a product"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {supplierProducts.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                              </SelectItem>
                            ))}
                            {supplierProducts.length === 0 && !loadingProducts && (
                              <SelectItem value="none" disabled>
                                No products available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {catalogProduct && (
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{catalogProduct.name}</p>
                            {catalogProduct.price_display && (
                              <p>{catalogProduct.price_display}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 5000"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Unit</label>
                          <Select
                            value={line.quantity_unit}
                            onValueChange={(v) => updateLine(line.key, { quantity_unit: v })}
                          >
                            <SelectTrigger className="mt-2">
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
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Target price</label>
                          <div className="mt-2 flex gap-2">
                            <Select
                              value={formData.target_currency_code}
                              onValueChange={(v) =>
                                setFormData((p) => ({ ...p, target_currency_code: v }))
                              }
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="CNY">CNY</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="15.00"
                              value={line.target_price}
                              onChange={(e) => updateLine(line.key, { target_price: e.target.value })}
                              className="flex-1"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Packaging notes</label>
                          <Input
                            placeholder="e.g., OEM logo, export carton"
                            value={line.packaging_details}
                            onChange={(e) =>
                              updateLine(line.key, { packaging_details: e.target.value })
                            }
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addLine}
                disabled={!selectedSupplier || loadingProducts}
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          )}
        </div>

        {/* Delivery Details */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground">Delivery Details</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="required_delivery_date" className="text-sm font-medium text-foreground">
                Required Delivery Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="required_delivery_date"
                type="date"
                value={formData.required_delivery_date}
                onChange={(e) =>
                  setFormData({ ...formData, required_delivery_date: e.target.value })
                }
                className="mt-2"
                required
              />
            </div>

            <div>
              <label htmlFor="shipping_terms" className="text-sm font-medium text-foreground">
                Shipping Terms
              </label>
              <Select
                value={formData.shipping_terms}
                onValueChange={(v) => setFormData({ ...formData, shipping_terms: v })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB (Free On Board)</SelectItem>
                  <SelectItem value="CIF">CIF (Cost, Insurance, Freight)</SelectItem>
                  <SelectItem value="DDP">DDP (Delivered Duty Paid)</SelectItem>
                  <SelectItem value="EXW">EXW (Ex Works)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="destination_country" className="text-sm font-medium text-foreground">
                Destination Country <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.destination_country}
                onValueChange={(v) => setFormData({ ...formData, destination_country: v })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="destination_port_city" className="text-sm font-medium text-foreground">
                Destination Port / City
              </label>
              <Input
                id="destination_port_city"
                type="text"
                placeholder="e.g., Chattogram"
                value={formData.destination_port_city}
                onChange={(e) =>
                  setFormData({ ...formData, destination_port_city: e.target.value })
                }
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="rounded-xl border border-border bg-card p-6">
          <label htmlFor="additional_requirements" className="text-sm font-medium text-foreground">
            Additional Requirements
          </label>
          <Textarea
            id="additional_requirements"
            placeholder="Include any specific requirements such as customization, certifications, quality standards, etc."
            value={formData.additional_requirements}
            onChange={(e) =>
              setFormData({ ...formData, additional_requirements: e.target.value })
            }
            className="mt-3 min-h-30"
          />
          <p className="mt-2 text-xs text-muted-foreground">Fields marked with * are required</p>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" className="gap-2" disabled={!canSubmit || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Submit RFQ
                {productLines.length > 1 ? ` (${productLines.length} products)` : ""}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewRFQPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <NewRFQForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
