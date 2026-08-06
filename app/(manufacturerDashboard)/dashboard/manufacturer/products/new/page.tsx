"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Swal from "sweetalert2"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Package,
  ImageIcon,
  DollarSign,
  Truck,
  Tags,
  FileText,
  Sparkles,
  Zap,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { getAllPublicCategories, getAdminSubcategories, type BackendCategory, type BackendSubcategory } from "@/lib/api/categories"
import {
  buildManufacturerProductCreateFormData,
  createManufacturerProduct,
  getManufacturerCurrencies,
  getManufacturerShippingMethods,
} from "@/lib/api/manufacturer-products"
import type {
  ManufacturerCurrencyOption,
  ManufacturerProductStatus,
  ManufacturerSelectOption,
} from "@/lib/api/manufacturer-products"
import { useTranslation } from "@/lib/i18n"

const units = [
  { value: "pieces", label: "Pieces" },
  { value: "sets", label: "Sets" },
  { value: "units", label: "Units" },
  { value: "kg", label: "Kilograms" },
  { value: "tons", label: "Metric Tons" },
  { value: "meters", label: "Meters" },
  { value: "sqm", label: "Square Meters" },
  { value: "liters", label: "Liters" },
  { value: "boxes", label: "Boxes" },
  { value: "cartons", label: "Cartons" },
  { value: "pallets", label: "Pallets" },
  { value: "20ft container", label: "20ft Container" },
  { value: "40ft container", label: "40ft Container" },
]

/** Used when GET /currencies fails — ids align with typical Jaawass currency rows. */
const FALLBACK_CURRENCIES: ManufacturerCurrencyOption[] = [
  { id: 1, code: "USD", name: "US Dollar", symbol: "$" },
  { id: 2, code: "EUR", name: "Euro", symbol: "€" },
  { id: 3, code: "SAR", name: "Saudi Riyal", symbol: "SR" },
]

function currencySelectValue(c: ManufacturerCurrencyOption): string {
  return c.id != null ? String(c.id) : c.code
}

function currencyMenuLabel(c: ManufacturerCurrencyOption): string {
  const sym = c.symbol ? ` (${c.symbol})` : ""
  return `${c.code} — ${c.name}${sym}`
}

const packagingTypes = [
  { value: "standard", label: "Standard Export Packaging" },
  { value: "custom", label: "Custom OEM Packaging" },
  { value: "neutral", label: "Neutral/White Label" },
  { value: "retail", label: "Retail Ready" },
  { value: "bulk", label: "Bulk Packaging" },
]

function packagingTypeLabel(value: string): string {
  const row = packagingTypes.find((t) => t.value === value)
  return row?.label ?? (value.trim() || "Standard Export Packaging")
}

function unitDisplayLabel(unitValue: string): string {
  const row = units.find((u) => u.value === unitValue)
  return row?.label ?? unitValue
}

function productionDurationLabel(period: string): string {
  if (period === "day") {
    return "Per Day"
  }
  if (period === "week") {
    return "Per Week"
  }
  return "Per Month"
}

type ProductImageSlot = { file: File; url: string }

export default function AddProductPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const brochureInputRef = useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageSlots, setImageSlots] = useState<ProductImageSlot[]>([])
  const [specifications, setSpecifications] = useState([
    { key: "", value: "" }
  ])

  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [allSubcategories, setAllSubcategories] = useState<BackendSubcategory[]>([])
  const [currencyOptions, setCurrencyOptions] = useState<ManufacturerCurrencyOption[]>([])
  const [shippingOptions, setShippingOptions] = useState<ManufacturerSelectOption[]>([])

  const [brochureFile, setBrochureFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    /** Parent category id from `GET /categories` */
    categoryId: "",
    /** Sub-category id (`sub_category_id` for product create) */
    subCategoryId: "",
    priceMin: "",
    priceMax: "",
    /** API: numeric → currency_id; ISO code → currency_code (see GET /currencies). */
    currencyId: "",
    moq: "",
    moqUnit: "pieces",
    leadTime: "",
    supplyCapacity: "",
    supplyUnit: "pieces",
    supplyPeriod: "month",
    packaging: "",
    packagingDetails: "",
    packagingDimensions: "",
    packagingWeight: "",
    packagingCostPerUnit: "",
    unitsPerCarton: "",
    /** Shipping method ids from GET /shipping/methods */
    shippingMethodIds: [] as string[],
    portOfLoading: "",
    sampleAvailable: false,
    samplePrice: "",
    customization: false,
    customizationDetails: "",
    keywords: "",
    status: "draft",
  })
  const [keyFeatures, setKeyFeatures] = useState<string[]>([""])
  const [customizationOptions, setCustomizationOptions] = useState<string[]>([""])

  useEffect(() => {
    let cancelled = false
    async function loadCategories() {
      setCategoriesLoading(true)
      const res = await getAllPublicCategories({ perPage: 50 })
      if (cancelled) {
        return
      }
      setCategoriesLoading(false)
      if (!res.success) {
        toast.error(res.message ?? "Could not load categories.")
        setCategories([])
        return
      }
      const sorted = [...res.data].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      )
      setCategories(sorted)
    }
    void loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadMeta() {
      const [cur, ship] = await Promise.all([
        getManufacturerCurrencies(),
        getManufacturerShippingMethods(),
      ])
      if (cancelled) {
        return
      }
      const curOpts =
        cur.success && cur.data.length > 0 ? cur.data : FALLBACK_CURRENCIES
      setCurrencyOptions(curOpts)
      setShippingOptions(ship.success ? ship.data : [])
    }
    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!currencyOptions.length) {
      return
    }
    setFormData((prev) =>
      prev.currencyId ? prev : { ...prev, currencyId: currencySelectValue(currencyOptions[0]) }
    )
  }, [currencyOptions])

  // Fetch all subcategories once and filter by selected category
  useEffect(() => {
    let cancelled = false
    async function loadSubcategories() {
      const res = await getAdminSubcategories()
      if (cancelled) return
      if (res.success) {
        setAllSubcategories(res.data)
      }
    }
    void loadSubcategories()
    return () => { cancelled = true }
  }, [])

  const selectedCategory = categories.find((c) => String(c.id) === formData.categoryId)
  const subcategoriesForCategory = useMemo(() => {
    // First try subcategories fetched from the dedicated endpoint
    const fromApi = allSubcategories.filter(
      (s) => String(s.industry_id) === formData.categoryId || String(s.category_id) === formData.categoryId
    )
    if (fromApi.length > 0) {
      return [...fromApi].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    }
    // Fallback to nested subcategories from GET /categories
    const subs = selectedCategory?.subcategories ?? []
    return [...subs].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    )
  }, [selectedCategory, allSubcategories, formData.categoryId])

  const handleAddSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }])
  }

  const handleRemoveSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const handleSpecificationChange = (index: number, field: "key" | "value", value: string) => {
    const updated = [...specifications]
    updated[index][field] = value
    setSpecifications(updated)
  }

  const toggleShippingMethod = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      shippingMethodIds: prev.shippingMethodIds.includes(id)
        ? prev.shippingMethodIds.filter((x) => x !== id)
        : [...prev.shippingMethodIds, id],
    }))
  }

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (!picked.length) {
      return
    }
    setImageSlots((prev) => {
      const cap = 10 - prev.length
      if (cap <= 0) {
        return prev
      }
      const next = [...prev]
      for (const file of picked.slice(0, cap)) {
        next.push({ file, url: URL.createObjectURL(file) })
      }
      return next
    })
  }

  const removeImageAt = (index: number) => {
    setImageSlots((prev) => {
      const row = prev[index]
      if (row) {
        URL.revokeObjectURL(row.url)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()
    if (!formData.categoryId.trim()) {
      toast.error(t.mfg.products.selectCategoryError || "Please select a category.")
      return
    }
    if (subcategoriesForCategory.length > 0 && !formData.subCategoryId.trim()) {
      toast.error(t.mfg.products.selectSubcategoryError || "Please select a sub-category.")
      return
    }
    if (!formData.currencyId.trim()) {
      toast.error(t.mfg.products.selectCurrencyError || "Please select a currency.")
      return
    }
    if (imageSlots.length === 0) {
      toast.error(t.mfg.products.addImageError || "Add at least one product image.")
      return
    }
    if (!formData.name.trim()) {
      toast.error(t.mfg.products.enterNameError || "Please enter a product name.")
      return
    }
    if (!formData.description.trim()) {
      toast.error(t.mfg.products.enterDescError || "Please enter a product description.")
      return
    }
    if (!formData.priceMin.trim() || isNaN(Number(formData.priceMin))) {
      toast.error(t.mfg.products.enterMinPriceError || "Please enter a valid minimum price.")
      return
    }
    if (!formData.priceMax.trim() || isNaN(Number(formData.priceMax))) {
      toast.error(t.mfg.products.enterMaxPriceError || "Please enter a valid maximum price.")
      return
    }
    if (!formData.moq.trim() || isNaN(Number(formData.moq))) {
      toast.error(t.mfg.products.enterMoqError || "Please enter a minimum order quantity (MOQ).")
      return
    }
    if (!formData.leadTime.trim()) {
      toast.error(t.mfg.products.enterLeadTimeError || "Please enter a lead time.")
      return
    }

    setIsSubmitting(true)
    const status: ManufacturerProductStatus = saveAsDraft ? "draft" : "active"
    const keywords = formData.keywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const keyFeatureLines = keyFeatures.map((s) => s.trim()).filter(Boolean)
    const customizeLines = customizationOptions.map((s) => s.trim()).filter(Boolean)
    const specRows = specifications
      .map((s) => ({ title: s.key.trim(), value: s.value.trim() }))
      .filter((s) => s.title && s.value)

    const fd = buildManufacturerProductCreateFormData({
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId,
      subCategoryId: formData.subCategoryId,
      status,
      minPrice: formData.priceMin,
      maxPrice: formData.priceMax,
      currencyId: formData.currencyId,
      minimumOrderQuantity: formData.moq,
      unit: unitDisplayLabel(formData.moqUnit),
      leadTime: formData.leadTime,
      productionCapacity: formData.supplyCapacity.trim() || "0",
      productionDuration: productionDurationLabel(formData.supplyPeriod),
      productionUnit: unitDisplayLabel(formData.supplyUnit),
      customizeOptions: customizeLines,
      packagingType: packagingTypeLabel(formData.packaging),
      portOfLoading: formData.portOfLoading,
      packagingDimensions: formData.packagingDimensions,
      packagingWeight: formData.packagingWeight,
      packagingCostPerUnit: formData.packagingCostPerUnit,
      packagingDescription: formData.packagingDetails,
      shippingMethodIds: formData.shippingMethodIds,
      sampleAvailable: formData.sampleAvailable,
      samplePrice: formData.samplePrice,
      customizationAvailable: formData.customization,
      customizationDetail: formData.customizationDetails,
      keywords,
      keyFeatures: keyFeatureLines,
      specifications: specRows,
      imageFiles: imageSlots.map((s) => s.file),
      brochureFile,
    })

    const res = await createManufacturerProduct(fd)
    setIsSubmitting(false)
    if (!res.success) {
      const errorLines: string[] = []
      if (res.errors && typeof res.errors === "object") {
        for (const msgs of Object.values(res.errors)) {
          if (Array.isArray(msgs)) {
            errorLines.push(...msgs.map((m) => `• ${m}`))
          }
        }
      }
      await Swal.fire({
        title: t.mfg.products.createFailed || "Failed to Create Product",
        html: errorLines.length
          ? `<div style="text-align:left;line-height:1.8">${errorLines.join("<br/>")}</div>`
          : res.message ?? (t.mfg.products.createFailed || "Could not create product."),
        icon: "error",
        confirmButtonText: t.common.ok || "OK",
      })
      return
    }
    toast.success(res.message ?? (t.mfg.productForm.successCreate || "Product created."))
    router.push("/dashboard/manufacturer/products")
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-6 overflow-x-hidden pb-8 sm:space-y-8 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 min-w-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/manufacturer/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{t.mfg.productForm.createTitle}</h1>
          <p className="mt-1 text-muted-foreground">
            {t.mfg.products.newSubtitle || "Fill in the details to list your product"}
          </p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6 sm:space-y-8">
        {/* Basic Information */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <Package className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t.mfg.productForm.basicInfo}</h2>
              <p className="text-sm text-muted-foreground">{t.mfg.products.basicInfoDesc || "Product name and description"}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="name">{t.mfg.productForm.productName} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Wireless Bluetooth Earbuds TWS"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">{t.mfg.productForm.description} *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product in detail, including key features and benefits..."
                className="mt-2 min-h-[120px]"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="category-parent">{t.mfg.productForm.category} *</Label>
                <Select
                  value={formData.categoryId || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      categoryId: value,
                      subCategoryId: "",
                    })
                  }
                  disabled={categoriesLoading || categories.length === 0}
                >
                  <SelectTrigger id="category-parent" className="mt-2">
                    <SelectValue
                      placeholder={
                        categoriesLoading
                          ? (t.mfg.products.loadingCategories || "Loading categories…")
                          : categories.length === 0
                            ? (t.mfg.products.noCategories || "No categories available")
                            : (t.mfg.productForm.selectCategory || "Select category")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={String(cat.id)} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory">{t.mfg.products.subcategory || "Sub-category"} *</Label>
                <Select
                  value={formData.subCategoryId || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subCategoryId: value })
                  }
                  disabled={!formData.categoryId || subcategoriesForCategory.length === 0}
                >
                  <SelectTrigger id="subcategory" className="mt-2">
                    <SelectValue
                      placeholder={
                        !formData.categoryId
                          ? (t.mfg.products.selectCategoryFirst || "Select a category first")
                          : subcategoriesForCategory.length === 0
                            ? (t.mfg.products.noSubcategories || "No sub-categories for this category")
                            : (t.mfg.products.selectSubcategory || "Select sub-category")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriesForCategory.map((sub) => (
                      <SelectItem key={String(sub.id)} value={String(sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <ImageIcon className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t.mfg.productForm.images}</h2>
              <p className="text-sm text-muted-foreground">{t.mfg.products.imagesDesc || "Upload up to 10 high-quality images (required)"}</p>
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={onPickImages}
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {imageSlots.map((slot, index) => (
              <div
                key={`${slot.url}-${index}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                <img src={slot.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImageAt(index)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {imageSlots.length < 10 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-secondary hover:text-secondary"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">{t.mfg.productForm.uploadImages || "Upload"}</span>
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t.mfg.products.imagesRecommend || "Recommended: 800x800px or larger. JPG, PNG, or WebP format."}
          </p>
        </div>

        {/* Pricing & MOQ */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <DollarSign className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t.mfg.products.pricingQuantity || "Pricing & Quantity"}</h2>
              <p className="text-sm text-muted-foreground">{t.mfg.products.pricingDesc || "Set your price range and minimum order"}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <Label htmlFor="priceMin">{t.mfg.products.priceMin || "Price Min"} *</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="priceMin"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceMin}
                    onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="priceMax">{t.mfg.products.priceMax || "Price Max"} *</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="priceMax"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceMax}
                    onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="currency">{t.mfg.products.currency || "Currency"} *</Label>
                <Select
                  value={formData.currencyId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, currencyId: value })}
                  disabled={currencyOptions.length === 0}
                >
                  <SelectTrigger id="currency" className="mt-2">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((c) => (
                      <SelectItem key={currencySelectValue(c)} value={currencySelectValue(c)}>
                        {currencyMenuLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="moq">{t.mfg.productForm.minOrderQty} *</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="moq"
                    type="number"
                    min="1"
                    value={formData.moq}
                    onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                    placeholder="100"
                  />
                  <Select 
                    value={formData.moqUnit} 
                    onValueChange={(value) => setFormData({ ...formData, moqUnit: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="leadTime">{t.mfg.products.leadTime || "Lead Time"} *</Label>
                <Input
                  id="leadTime"
                  value={formData.leadTime}
                  onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                  placeholder="e.g., 15-20 days"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="supplyCapacity">{t.mfg.products.supplyCapacity || "Supply Capacity"}</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="supplyCapacity"
                  type="number"
                  min="0"
                  value={formData.supplyCapacity}
                  onChange={(e) => setFormData({ ...formData, supplyCapacity: e.target.value })}
                  placeholder="10000"
                />
                <Select 
                  value={formData.supplyUnit} 
                  onValueChange={(value) => setFormData({ ...formData, supplyUnit: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={formData.supplyPeriod} 
                  onValueChange={(value) => setFormData({ ...formData, supplyPeriod: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">{t.mfg.products.supplyPeriodDay || "Per Day"}</SelectItem>
                    <SelectItem value="week">{t.mfg.products.supplyPeriodWeek || "Per Week"}</SelectItem>
                    <SelectItem value="month">{t.mfg.products.supplyPeriodMonth || "Per Month"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t.mfg.products.specificationsTitle || "Product Specifications"}</h2>
              <p className="text-sm text-muted-foreground">{t.mfg.products.specificationsDesc || "Add detailed specifications"}</p>
            </div>
          </div>

          <div className="space-y-3">
            {specifications.map((spec, index) => (
              <div key={index} className="flex gap-3">
                <Input
                  placeholder="Specification (e.g., Material)"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, "key", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value (e.g., Stainless Steel)"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
                  className="flex-1"
                />
                {specifications.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSpecification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSpecification}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t.mfg.products.addSpecification || "Add Specification"}
            </Button>
          </div>
        </div>

        {/* Key Features */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <Zap className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t.mfg.products.keyFeatures || "Key Features"}</h2>
              <p className="text-sm text-muted-foreground">{t.mfg.products.keyFeaturesDesc || "Highlight the main selling points of your product"}</p>
            </div>
          </div>

          <div className="space-y-3">
            {keyFeatures.map((feature, index) => (
              <div key={index} className="flex gap-3">
                <Input
                  placeholder={`${t.common.feature || "Feature"} ${index + 1}`}
                  value={feature}
                  onChange={(e) => {
                    const updated = [...keyFeatures]
                    updated[index] = e.target.value
                    setKeyFeatures(updated)
                  }}
                  className="flex-1"
                />
                {keyFeatures.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setKeyFeatures(keyFeatures.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setKeyFeatures([...keyFeatures, ""])}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t.mfg.products.addFeature || "Add Feature"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t.mfg.products.keyFeaturesLimit || "Add up to 10 key features that make your product stand out"}
            </p>
          </div>
        </div>

        {/* Customization Options */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <Sparkles className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t.mfg.products.customizationOptions || "Customization Options"}</h2>
              <p className="text-sm text-muted-foreground">{t.mfg.products.customizationDesc || "What can buyers customize for this product?"}</p>
            </div>
          </div>

          <div className="space-y-3">
            {customizationOptions.map((option, index) => (
              <div key={index} className="flex gap-3">
                <Input
                  placeholder={`${t.common.option || "Option"} ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const updated = [...customizationOptions]
                    updated[index] = e.target.value
                    setCustomizationOptions(updated)
                  }}
                  className="flex-1"
                />
                {customizationOptions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setCustomizationOptions(customizationOptions.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomizationOptions([...customizationOptions, ""])}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t.mfg.products.addOption || "Add Option"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t.mfg.products.customizationCommon || "Common options: Logo printing, Custom color, Custom packaging, OEM branding"}
            </p>
          </div>
        </div>

        {/* Shipping & Packaging */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <Truck className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t.mfg.products.shippingPackaging || "Shipping & Packaging"}</h2>
              <p className="text-sm text-muted-foreground">{t.mfg.products.shippingPackagingDesc || "Logistics and packaging details"}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="packaging">{t.mfg.products.packagingType || "Packaging Type"}</Label>
                <Select 
                  value={formData.packaging} 
                  onValueChange={(value) => setFormData({ ...formData, packaging: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select packaging type" />
                  </SelectTrigger>
                  <SelectContent>
                    {packagingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="portOfLoading">{t.mfg.products.portOfLoading || "Port of Loading"}</Label>
                <Input
                  id="portOfLoading"
                  value={formData.portOfLoading}
                  onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                  placeholder="e.g., Shanghai Port"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="packagingDimensions">{t.mfg.products.packageDimensions || "Package Dimensions"}</Label>
                <Input
                  id="packagingDimensions"
                  value={formData.packagingDimensions}
                  onChange={(e) => setFormData({ ...formData, packagingDimensions: e.target.value })}
                  placeholder="e.g., 10x8x4 cm"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="packagingWeight">{t.mfg.products.packageWeight || "Package Weight"}</Label>
                <Input
                  id="packagingWeight"
                  value={formData.packagingWeight}
                  onChange={(e) => setFormData({ ...formData, packagingWeight: e.target.value })}
                  placeholder="e.g., 85g"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="packagingCostPerUnit">{t.mfg.products.packagingCost || "Packaging cost per unit"}</Label>
                <Input
                  id="packagingCostPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.packagingCostPerUnit}
                  onChange={(e) =>
                    setFormData({ ...formData, packagingCostPerUnit: e.target.value })
                  }
                  placeholder="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="unitsPerCarton">{t.mfg.products.unitsPerCarton || "Units per Carton"}</Label>
                <Input
                  id="unitsPerCarton"
                  type="number"
                  min="1"
                  value={formData.unitsPerCarton}
                  onChange={(e) => setFormData({ ...formData, unitsPerCarton: e.target.value })}
                  placeholder="e.g., 50"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="packagingDetails">{t.mfg.products.packagingDesc || "Packaging Description"}</Label>
              <Textarea
                id="packagingDetails"
                value={formData.packagingDetails}
                onChange={(e) => setFormData({ ...formData, packagingDetails: e.target.value })}
                placeholder="Describe your packaging in detail (materials used, inserts, branding options...)"
                className="mt-2"
              />
            </div>

            <div>
              <Label>{t.mfg.products.shippingMethods || "Shipping methods"}</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.mfg.products.shippingMethodsDesc || "Loaded from the API. Select at least one if your listing requires shipping options."}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {shippingOptions.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    {t.mfg.products.noShippingMethods || "No shipping methods returned."}
                  </span>
                ) : (
                  shippingOptions.map((method) => {
                    const idStr = String(method.id)
                    return (
                      <label key={method.id} className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={formData.shippingMethodIds.includes(idStr)}
                          onCheckedChange={() => toggleShippingMethod(idStr)}
                        />
                        <span className="text-sm">{method.name}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <Tags className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t.mfg.products.additionalOptions || "Additional Options"}</h2>
              <p className="text-sm text-muted-foreground">{t.mfg.products.additionalOptionsDesc || "Samples, customization, and keywords"}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="sampleAvailable"
                checked={formData.sampleAvailable}
                onCheckedChange={(checked) => setFormData({ ...formData, sampleAvailable: checked as boolean })}
              />
              <div>
                <Label htmlFor="sampleAvailable" className="cursor-pointer">{t.mfg.products.samplesAvailable || "Samples Available"}</Label>
                <p className="text-sm text-muted-foreground">{t.mfg.products.samplesDesc || "Buyers can request product samples"}</p>
              </div>
            </div>

            {formData.sampleAvailable && (
              <div className="ml-6">
                <Label htmlFor="samplePrice">{t.mfg.products.samplePrice || "Sample Price"}</Label>
                <div className="relative mt-2 max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="samplePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.samplePrice}
                    onChange={(e) => setFormData({ ...formData, samplePrice: e.target.value })}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Checkbox
                id="customization"
                checked={formData.customization}
                onCheckedChange={(checked) => setFormData({ ...formData, customization: checked as boolean })}
              />
              <div>
                <Label htmlFor="customization" className="cursor-pointer">{t.mfg.products.customizationAvailable || "Customization Available"}</Label>
                <p className="text-sm text-muted-foreground">{t.mfg.products.customizationAvailableDesc || "OEM/ODM services for this product"}</p>
              </div>
            </div>

            {formData.customization && (
              <div className="ml-6">
                <Label htmlFor="customizationDetails">{t.mfg.products.customizationDetails || "Customization Details"}</Label>
                <Textarea
                  id="customizationDetails"
                  value={formData.customizationDetails}
                  onChange={(e) => setFormData({ ...formData, customizationDetails: e.target.value })}
                  placeholder="Describe details..."
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label htmlFor="keywords">{t.mfg.products.keywords || "Product Keywords"}</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="wireless earbuds, bluetooth headphones, tws earphones"
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t.mfg.products.keywordsDesc || "Separate keywords with commas. These help buyers find your product."}
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <Label>{t.mfg.products.brochure || "Product brochure (PDF)"}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t.mfg.products.brochureDesc || "Optional PDF brochure for buyers."}
              </p>
              <input
                ref={brochureInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  e.target.value = ""
                  setBrochureFile(f)
                }}
              />
              <div className="mt-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => brochureInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && brochureInputRef.current?.click()}
                  className="flex w-full max-w-md cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-muted/50 p-4 text-left transition-colors hover:border-secondary"
                >
                  <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {brochureFile ? brochureFile.name : (t.mfg.products.uploadPdf || "Upload PDF")}
                    </p>
                    <p className="text-xs text-muted-foreground">Max 10MB · optional</p>
                  </div>
                  {brochureFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        setBrochureFile(null)
                      }}
                    >
                      {t.common.clear || "Clear"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/manufacturer/products">{t.common.cancel}</Link>
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.mfg.productForm.saving}
                </>
              ) : (
                t.mfg.products.saveAsDraft || "Save as Draft"
              )}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.mfg.products.publishing || "Publishing…"}
                </>
              ) : (
                t.mfg.products.publishProduct || "Publish Product"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
