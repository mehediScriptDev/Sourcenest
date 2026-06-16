import { apiClient, publicApiClient } from "./client"
import { getApiErrorMessage } from "./errors"

// Types based on backend response
export interface ProductPrice {
  amount: string
  currency: string
}

export interface PricingQuantity {
  id: number
  min_price: {
    price: ProductPrice
    price_display: string | null
    conversion_available: boolean
  }
  max_price: {
    price: ProductPrice
    price_display: string | null
    conversion_available: boolean
  }
  currency: {
    id: number
    code: string
    name: string
    symbol: string
    decimal_places: number
    is_base: boolean
    is_active: number
    sort_order: number
  }
  minimum_order_quantity: number
  unit: string
  lead_time: string
  production_capacity: number
  production_duration: string
  production_unit: string
}

export interface Category {
  id: number
  name: string
  description: string | null
  slug: string
  icon: string | null
  icon_url: string | null
  color: string | null
  featured: number
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export interface SubCategory {
  id: number
  name: string
  slug: string
  icon: string | null
  icon_url: string | null
  sort_order: number
}

export interface Specification {
  id: number
  specification_title: string
  specification_value: string
}

export interface KeyFeature {
  id: number
  value: string
}

export interface CustomizationOption {
  id: number
  option: string
}

export interface ShippingPackaging {
  id: number
  packaging_type: string
  port_of_loading: string
  packaging_dimensions: string
  packaging_weight: string
  packaging_description: string
  packaging_cost_per_unit: {
    price: ProductPrice
    price_display: string | null
    conversion_available: boolean
  }
}

export interface ShippingMethod {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: ProductPrice
  price_display: string | null
  conversion_available: boolean
  quantity: string | null
  inquiry_count: number
  view_count: number
  is_approved: boolean
  image: string | null
  status: string
  created_at: string
  updated_at: string
  available_locales: string[]
  supplierId?: string
  supplierSlug?: string
  supplierName?: string
  category: Category
  sub_category: SubCategory
  images: string[]
  pricing_quantities: PricingQuantity
  specifications: Specification[]
  product_key_features: KeyFeature[]
  customization_options: CustomizationOption[]
  shipping_packaging: ShippingPackaging
  available_options: string | null
  shipping_methods: ShippingMethod[]
}

export interface ProductsMetadata {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface GetProductsResponse {
  success: boolean
  message?: string
  data: Product[]
  meta?: ProductsMetadata
}

export interface GetProductResponse {
  success: boolean
  message?: string
  data: Product | null
}

// Helper functions for type conversion
function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function toString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") return value.toLowerCase() === "true" || value === "1"
  return fallback
}

import { products as dummyProducts } from "../data/products"

// Helper to convert dummy static product to API payload format
function dummyToApiPayload(dummy: any) {
  return {
    id: dummy.id,
    name: dummy.name,
    slug: dummy.slug,
    description: dummy.description,
    price: { amount: dummy.price?.min?.toString() || "0", currency: dummy.price?.currency || "USD" },
    price_display: `$${dummy.price?.min} - $${dummy.price?.max}`,
    conversion_available: false,
    quantity: "1000",
    inquiry_count: dummy.featured ? 150 : 10,
    view_count: 500,
    is_approved: true,
    image: dummy.images?.[0] || null,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    available_locales: ["en"],
    supplier_id: dummy.supplierId,
    supplier_slug: dummy.supplierSlug,
    supplier_name: dummy.supplierName,
    category: {
      id: 1,
      name: dummy.category,
      slug: dummy.categorySlug,
      description: null,
      icon: null,
      icon_url: null,
      color: null,
      featured: 1,
      sort_order: 1,
    },
    sub_category: {
      id: 1,
      name: dummy.category,
      slug: dummy.categorySlug,
      icon: null,
      icon_url: null,
      sort_order: 1,
    },
    images: dummy.images || [],
    pricing_quantities: {
      id: 1,
      min_price: {
        price: { amount: dummy.price?.min?.toString() || "0", currency: dummy.price?.currency || "USD" },
        price_display: null,
        conversion_available: false,
      },
      max_price: {
        price: { amount: dummy.price?.max?.toString() || "0", currency: dummy.price?.currency || "USD" },
        price_display: null,
        conversion_available: false,
      },
      currency: {
        id: 1,
        code: dummy.price?.currency || "USD",
        name: dummy.price?.currency === "USD" ? "US Dollar" : dummy.price?.currency,
        symbol: "$",
        decimal_places: 2,
        is_base: true,
        is_active: 1,
        sort_order: 0,
      },
      minimum_order_quantity: dummy.moq,
      unit: dummy.moqUnit,
      lead_time: dummy.leadTime,
      production_capacity: 10000,
      production_duration: "30 days",
      production_unit: dummy.moqUnit,
    },
    specifications: Object.entries(dummy.specifications || {}).map(([key, value], i) => ({
      id: i + 1,
      specification_title: key,
      specification_value: value as string,
    })),
    product_key_features: (dummy.keyFeatures || []).map((feature: string, i: number) => ({
      id: i + 1,
      value: feature,
    })),
    customization_options: (dummy.customizationOptions || []).map((opt: string, i: number) => ({
      id: i + 1,
      option: opt,
    })),
    shipping_packaging: {
      id: 1,
      packaging_type: dummy.packagingDetails?.type || "Standard",
      port_of_loading: "Shenzhen",
      packaging_dimensions: dummy.packagingDetails?.dimensions || "",
      packaging_weight: dummy.packagingDetails?.weight || "",
      packaging_description: dummy.packagingDetails?.description || "",
      packaging_cost_per_unit: {
        price: { amount: "0.00", currency: "USD" },
        price_display: null,
        conversion_available: false,
      },
    },
    available_options: null,
    shipping_methods: [],
  };
}

// Fetch all products
export async function getProducts(
  page = 1,
  filters?: Record<string, unknown>
): Promise<GetProductsResponse> {
  try {
    const params = { page, ...filters }
    const response = await publicApiClient.get<GetProductsResponse>("/products", { params })
    
    if (response.data && Array.isArray(response.data.data)) {
      response.data.data = response.data.data.map(item => normalizeProduct(item))
      
      // Ensure meta is correctly formatted if present
      if (response.data.meta) {
        response.data.meta = normalizeMeta(response.data.meta)
      }
    }
    
    return response.data
  } catch (error) {
    console.error("Error fetching products:", error)
    return {
      success: false,
      message: getApiErrorMessage(error) || "Failed to fetch products",
      data: []
    }
  }
}

// Fetch single product
export async function getProduct(slug: string): Promise<GetProductResponse> {
  try {
    const response = await publicApiClient.get<GetProductResponse>(`/products/${slug}`)
    
    if (response.data && response.data.data) {
      response.data.data = normalizeProduct(response.data.data)
    }
    
    return response.data
  } catch (error) {
    console.error(`Error fetching product ${slug}:`, error)
    return {
      success: false,
      message: getApiErrorMessage(error) || "Product not found.",
      data: null
    }
  }
}

// Helper: Normalize product data
function normalizeProduct(payload: unknown): Product {
  const product = toRecord(payload)
  const supplier = toRecord(product.supplier)

  const pricingQuantities = toRecord(product.pricing_quantities)
  const minPrice = toRecord(pricingQuantities.min_price)
  const maxPrice = toRecord(pricingQuantities.max_price)
  const currency = toRecord(pricingQuantities.currency)

  return {
    id: toNumber(product.id),
    name: toString(product.name),
    slug: toString(product.slug),
    description: toString(product.description),
    price: {
      amount: toString(toRecord(product.price).amount, "0.00"),
      currency: toString(toRecord(product.price).currency, "USD"),
    },
    price_display: product.price_display ? toString(product.price_display) : null,
    conversion_available: toBoolean(product.conversion_available, true),
    quantity: product.quantity ? toString(product.quantity) : null,
    inquiry_count: toNumber(product.inquiry_count, 0),
    view_count: toNumber(product.view_count, 0),
    is_approved: toBoolean(product.is_approved, false),
    image: product.image 
      ? toString(product.image) 
      : (Array.isArray(product.images) && product.images.length > 0 
          ? (typeof product.images[0] === "string" ? product.images[0] : (product.images[0] as any).url || (product.images[0] as any).file_path || (product.images[0] as any).path || (product.images[0] as any).image_url || null)
          : null),
    status: toString(product.status, "active"),
    created_at: toString(product.created_at),
    updated_at: toString(product.updated_at),
    available_locales: Array.isArray(product.available_locales)
      ? (product.available_locales as string[])
      : [],
    supplierId: toString(
      product.supplier_id ?? product.supplierId ?? supplier.id,
      ""
    ) || undefined,
    supplierSlug: toString(
      product.supplier_slug ?? product.supplierSlug ?? supplier.slug,
      ""
    ) || undefined,
    supplierName: toString(
      product.supplier_name ?? product.supplierName ?? supplier.name,
      ""
    ) || undefined,
    category: normalizeCategory(product.category),
    sub_category: normalizeSubCategory(product.sub_category),
    images: Array.isArray(product.images) 
      ? product.images.map((img: any) => typeof img === "string" ? img : img.url || img.file_path || img.path || img.image_url || "").filter(Boolean) 
      : [],
    pricing_quantities: {
      id: toNumber(pricingQuantities.id),
      min_price: {
        price: {
          amount: toString(toRecord(minPrice.price).amount, "0.00"),
          currency: toString(toRecord(minPrice.price).currency, "USD"),
        },
        price_display: minPrice.price_display ? toString(minPrice.price_display) : null,
        conversion_available: toBoolean(minPrice.conversion_available, true),
      },
      max_price: {
        price: {
          amount: toString(toRecord(maxPrice.price).amount, "0.00"),
          currency: toString(toRecord(maxPrice.price).currency, "USD"),
        },
        price_display: maxPrice.price_display ? toString(maxPrice.price_display) : null,
        conversion_available: toBoolean(maxPrice.conversion_available, true),
      },
      currency: {
        id: toNumber(currency.id),
        code: toString(currency.code, "USD"),
        name: toString(currency.name, "US Dollar"),
        symbol: toString(currency.symbol, "$"),
        decimal_places: toNumber(currency.decimal_places, 2),
        is_base: toBoolean(currency.is_base, true),
        is_active: toNumber(currency.is_active, 1),
        sort_order: toNumber(currency.sort_order, 0),
      },
      minimum_order_quantity: toNumber(pricingQuantities.minimum_order_quantity, 1),
      unit: toString(pricingQuantities.unit, "piece"),
      lead_time: toString(pricingQuantities.lead_time, ""),
      production_capacity: toNumber(pricingQuantities.production_capacity, 0),
      production_duration: toString(pricingQuantities.production_duration, ""),
      production_unit: toString(pricingQuantities.production_unit, ""),
    },
    specifications: Array.isArray(product.specifications)
      ? (product.specifications as Specification[])
      : [],
    product_key_features: Array.isArray(product.product_key_features)
      ? (product.product_key_features as KeyFeature[])
      : [],
    customization_options: Array.isArray(product.customization_options)
      ? (product.customization_options as CustomizationOption[])
      : [],
    shipping_packaging: normalizeShippingPackaging(product.shipping_packaging),
    available_options: product.available_options ? toString(product.available_options) : null,
    shipping_methods: Array.isArray(product.shipping_methods)
      ? (product.shipping_methods as ShippingMethod[])
      : [],
  }
}

function normalizeCategory(payload: unknown): Category {
  const category = toRecord(payload)
  return {
    id: toNumber(category.id),
    name: toString(category.name),
    description: category.description ? toString(category.description) : null,
    slug: toString(category.slug),
    icon: category.icon ? toString(category.icon) : null,
    icon_url: category.icon_url ? toString(category.icon_url) : null,
    color: category.color ? toString(category.color) : null,
    featured: toNumber(category.featured, 0),
    sort_order: toNumber(category.sort_order, 0),
    created_at: category.created_at ? toString(category.created_at) : null,
    updated_at: category.updated_at ? toString(category.updated_at) : null,
  }
}

function normalizeSubCategory(payload: unknown): SubCategory {
  const subCategory = toRecord(payload)
  return {
    id: toNumber(subCategory.id),
    name: toString(subCategory.name),
    slug: toString(subCategory.slug),
    icon: subCategory.icon ? toString(subCategory.icon) : null,
    icon_url: subCategory.icon_url ? toString(subCategory.icon_url) : null,
    sort_order: toNumber(subCategory.sort_order, 0),
  }
}

function normalizeShippingPackaging(payload: unknown): ShippingPackaging {
  const shipping = toRecord(payload)
  const packagingCost = toRecord(shipping.packaging_cost_per_unit)
  const costPrice = toRecord(packagingCost.price)

  return {
    id: toNumber(shipping.id),
    packaging_type: toString(shipping.packaging_type),
    port_of_loading: toString(shipping.port_of_loading),
    packaging_dimensions: toString(shipping.packaging_dimensions),
    packaging_weight: toString(shipping.packaging_weight),
    packaging_description: toString(shipping.packaging_description),
    packaging_cost_per_unit: {
      price: {
        amount: toString(costPrice.amount, "0.00"),
        currency: toString(costPrice.currency, "USD"),
      },
      price_display: packagingCost.price_display ? toString(packagingCost.price_display) : null,
      conversion_available: toBoolean(packagingCost.conversion_available, true),
    },
  }
}

function normalizeMeta(payload: unknown): ProductsMetadata {
  const meta = toRecord(payload)
  return {
    current_page: toNumber(meta.current_page, 1),
    last_page: toNumber(meta.last_page, 1),
    per_page: toNumber(meta.per_page, 10),
    total: toNumber(meta.total, 0),
    from: meta.from == null ? null : toNumber(meta.from),
    to: meta.to == null ? null : toNumber(meta.to),
  }
}
