import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RecordLike = Record<string, unknown>

function toRecord(value: unknown): RecordLike {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RecordLike
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

function toNullableString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

// ---------------------------------------------------------------------------
// Status mapping — backend ↔ frontend
// ---------------------------------------------------------------------------

/** Backend uses underscores, frontend uses dashes */
const BACKEND_TO_FRONTEND_STATUS: Record<string, string> = {
  order_created: "created",
  in_production: "in-production",
  ready_for_shipment: "ready",
  shipped: "shipped",
  completed: "completed",
  cancelled: "cancelled",
}

const FRONTEND_TO_BACKEND_STATUS: Record<string, string> = {
  created: "order_created",
  "in-production": "in_production",
  ready: "ready_for_shipment",
  shipped: "shipped",
  completed: "completed",
  cancelled: "cancelled",
}

function normalizeStatus(backendStatus: unknown): string {
  const raw = toString(backendStatus, "order_created").trim().toLowerCase()
  return BACKEND_TO_FRONTEND_STATUS[raw] ?? raw
}

export function toBackendStatus(frontendStatus: string): string {
  return FRONTEND_TO_BACKEND_STATUS[frontendStatus] ?? frontendStatus
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number | null
  to: number | null
}

export interface OrderStatusUpdate {
  id: number
  status: string
  notes: string | null
  photos: string[]
  attachments: { id: number; name: string; url: string }[]
  createdAt: string | null
  author: string
}

export interface OrderItem {
  id: number
  productId: number
  productSlug: string
  productName: string
  quantity: number
  quantityUnit: string
  unitPrice: number
  lineTotal: number
  notes: string | null
}

export interface OrderItemsSummary {
  lineCount: number
  totalQuantity: number
  quantityUnit: string | null
  hasMixedUnits: boolean
  productLabel: string
  quantityLabel: string
}

/** Aggregate line-item totals for multi-product orders. */
export function summarizeOrderItems(
  items: OrderItem[],
  fallback?: { quantity: number; quantityUnit: string; productName?: string },
): OrderItemsSummary {
  if (items.length === 0) {
    const qty = fallback?.quantity ?? 0
    const unit = fallback?.quantityUnit ?? "units"
    return {
      lineCount: fallback?.productName ? 1 : 0,
      totalQuantity: qty,
      quantityUnit: unit,
      hasMixedUnits: false,
      productLabel: fallback?.productName ?? "—",
      quantityLabel: `${qty.toLocaleString()} ${unit}`,
    }
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const units = [...new Set(items.map((item) => item.quantityUnit))]
  const hasMixedUnits = units.length > 1
  const quantityUnit = hasMixedUnits ? null : units[0]

  const productLabel =
    items.length === 1
      ? items[0].productName
      : `${items.length} products`

  const quantityLabel = hasMixedUnits
    ? `${totalQuantity.toLocaleString()} total units (${items.length} lines)`
    : `${totalQuantity.toLocaleString()} ${quantityUnit}`

  return {
    lineCount: items.length,
    totalQuantity,
    quantityUnit,
    hasMixedUnits,
    productLabel,
    quantityLabel,
  }
}

export interface ApiOrder {
  id: number
  orderNumber: string
  title: string
  status: string
  quantity: number
  quantityUnit: string
  totalAmount: number
  currencyCode: string
  estimatedDeliveryAt: string | null
  productionLead: string | null
  paymentTerms: string | null
  shippingTerms: string | null
  destination: string | null
  notes: string | null
  createdAt: string | null
  updatedAt: string | null
  // Relations
  buyerId: number | null
  buyerName: string
  buyerCompany: string
  buyerEmail: string
  manufacturerId: number | null
  manufacturerName: string
  productId: number | null
  productName: string
  productSlug: string
  // Nested
  items: OrderItem[]
  attachments: { id: number; name: string; url: string }[]
  statusUpdates: OrderStatusUpdate[]
}

export interface OrderStats {
  total: number
  active: number
  completed: number
  cancelled: number
  totalValue: number
}

export interface SelectProduct {
  id: number
  name: string
  slug: string
}

export interface SelectBuyer {
  id: number
  name: string
  email: string
  company: string
}

// ---------------------------------------------------------------------------
// Normalize helpers
// ---------------------------------------------------------------------------

function normalizeMeta(payload: unknown): OrderMeta | null {
  const meta = toRecord(payload)
  if (Object.keys(meta).length === 0) return null
  return {
    currentPage: toNumber(meta.current_page, 1),
    lastPage: toNumber(meta.last_page, 1),
    perPage: toNumber(meta.per_page, 15),
    total: toNumber(meta.total, 0),
    from: meta.from == null ? null : toNumber(meta.from),
    to: meta.to == null ? null : toNumber(meta.to),
  }
}

function normalizeStatusUpdate(payload: unknown): OrderStatusUpdate {
  const item = toRecord(payload)
  const user = toRecord(item.user)
  const photos = Array.isArray(item.photos) ? item.photos.map((p: unknown) => {
    if (typeof p === "string") return p
    const pRec = toRecord(p)
    return toString(pRec.url || pRec.path)
  }).filter(Boolean) as string[] : []
  const attachments = Array.isArray(item.attachments) ? item.attachments.map((a: unknown) => {
    const aRec = toRecord(a)
    return {
      id: toNumber(aRec.id),
      name: toString(aRec.name || aRec.file_name || aRec.original_name, "file"),
      url: toString(aRec.url || aRec.path),
    }
  }) : []

  return {
    id: toNumber(item.id),
    status: normalizeStatus(item.status),
    notes: toNullableString(item.notes ?? item.note),
    photos,
    attachments,
    createdAt: toNullableString(item.created_at),
    author: toString(user.role ?? item.author ?? item.updated_by, "manufacturer"),
  }
}

function normalizeOrderItem(payload: unknown): OrderItem {
  const item = toRecord(payload)
  const product = toRecord(item.product)

  return {
    id: toNumber(item.id),
    productId: toNumber(item.product_id ?? product.id),
    productSlug: toString(product.slug ?? item.product_slug ?? product.id ?? item.product_id),
    productName: toString(product.name ?? item.product_name, "Product"),
    quantity: toNumber(item.quantity),
    quantityUnit: toString(item.quantity_unit ?? item.quantityUnit, "pieces"),
    unitPrice: toNumber(item.unit_price ?? item.unitPrice),
    lineTotal: toNumber(item.line_total ?? item.lineTotal),
    notes: toNullableString(item.notes),
  }
}

function normalizeOrder(payload: unknown): ApiOrder {
  const item = toRecord(payload)
  const buyer = toRecord(item.buyer)
  const manufacturer = toRecord(item.manufacturer)
  const product = toRecord(item.product)

  const firstName = toString(buyer.first_name).trim()
  const lastName = toString(buyer.last_name).trim()
  const buyerFullName = `${firstName} ${lastName}`.trim() || "N/A"

  const mfName = toString(
    manufacturer.company_name ?? manufacturer.name ??
    item.manufacturer_name ?? item.supplier_name
  ).trim() || "N/A"

  const attachments = Array.isArray(item.attachments) ? item.attachments.map((a: unknown) => {
    const aRec = toRecord(a)
    return {
      id: toNumber(aRec.id),
      name: toString(aRec.name || aRec.file_name || aRec.original_name, "file"),
      url: toString(aRec.url || aRec.path),
    }
  }) : []

  const statusUpdates = Array.isArray(item.status_updates)
    ? item.status_updates.map(normalizeStatusUpdate)
    : Array.isArray(item.statusUpdates)
      ? item.statusUpdates.map(normalizeStatusUpdate)
      : []

  const items = Array.isArray(item.items) ? item.items.map(normalizeOrderItem) : []

  return {
    id: toNumber(item.id),
    orderNumber: toString(item.order_number ?? item.orderNumber ?? `ORD-${toNumber(item.id)}`),
    title: toString(item.title),
    status: normalizeStatus(item.status),
    quantity: toNumber(item.quantity),
    quantityUnit: toString(item.quantity_unit ?? item.quantityUnit, "units"),
    totalAmount: toNumber(item.total_amount ?? item.totalAmount),
    currencyCode: toString(item.currency_code ?? item.currencyCode ?? item.currency, "USD"),
    estimatedDeliveryAt: toNullableString(item.estimated_delivery_at ?? item.estimatedDeliveryAt),
    productionLead: toNullableString(item.production_lead ?? item.productionLead),
    paymentTerms: toNullableString(item.payment_terms ?? item.paymentTerms),
    shippingTerms: toNullableString(item.shipping_terms ?? item.shippingTerms),
    destination: toNullableString(item.destination),
    notes: toNullableString(item.notes),
    createdAt: toNullableString(item.created_at),
    updatedAt: toNullableString(item.updated_at),
    buyerId: item.buyer_id != null ? toNumber(item.buyer_id) : (buyer.id != null ? toNumber(buyer.id) : null),
    buyerName: buyerFullName,
    buyerCompany: toString(buyer.company_name ?? buyer.company ?? item.buyer_company, "N/A"),
    buyerEmail: toString(buyer.email ?? item.buyer_email),
    manufacturerId: item.manufacturer_id != null ? toNumber(item.manufacturer_id) : (manufacturer.id != null ? toNumber(manufacturer.id) : null),
    manufacturerName: mfName,
    productId: item.product_id != null ? toNumber(item.product_id) : (product.id != null ? toNumber(product.id) : null),
    productName: toString(product.name ?? item.product_name, "N/A"),
    productSlug: toString(product.slug ?? item.product_slug),
    items,
    attachments,
    statusUpdates,
  }
}

function normalizeStats(payload: unknown): OrderStats {
  const item = toRecord(payload)
  return {
    total: toNumber(item.total ?? item.total_orders ?? item.count),
    active: toNumber(item.active ?? item.active_orders ?? item.in_progress),
    completed: toNumber(item.completed ?? item.completed_orders),
    cancelled: toNumber(item.cancelled ?? item.cancelled_orders),
    totalValue: toNumber(item.total_value ?? item.total_amount ?? item.revenue),
  }
}

function normalizeSelectProduct(payload: unknown): SelectProduct {
  const item = toRecord(payload)
  return {
    id: toNumber(item.id),
    name: toString(item.name),
    slug: toString(item.slug),
  }
}

function normalizeSelectBuyer(payload: unknown): SelectBuyer {
  const item = toRecord(payload)
  const firstName = toString(item.first_name).trim()
  const lastName = toString(item.last_name).trim()
  return {
    id: toNumber(item.id),
    name: `${firstName} ${lastName}`.trim() || toString(item.name, "N/A"),
    email: toString(item.email),
    company: toString(item.company_name ?? item.company, "N/A"),
  }
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface OrdersListResponse {
  success: boolean
  message?: string
  data: ApiOrder[]
  meta: OrderMeta | null
}

export interface OrderDetailResponse {
  success: boolean
  message?: string
  data: ApiOrder | null
}

export interface OrderStatsResponse {
  success: boolean
  message?: string
  data: OrderStats
}

export interface SelectProductsResponse {
  success: boolean
  message?: string
  data: SelectProduct[]
}

export interface SelectBuyersResponse {
  success: boolean
  message?: string
  data: SelectBuyer[]
  meta: OrderMeta | null
}

export interface CreateOrderResponse {
  success: boolean
  message?: string
  data: ApiOrder | null
}

export interface UpdateStatusResponse {
  success: boolean
  message?: string
  data: ApiOrder | null
}

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

export async function getAdminOrders(params?: {
  page?: number
  per_page?: number
  search?: string
  status?: string
}): Promise<OrdersListResponse> {
  try {
    const queryParams: Record<string, string | number> = {}
    if (params?.page) queryParams.page = params.page
    if (params?.per_page) queryParams.per_page = params.per_page
    if (params?.search) queryParams.search = params.search
    if (params?.status) queryParams.status = toBackendStatus(params.status)

    const response = await apiClient.get("/admin/orders", { params: queryParams })
    const payload = toRecord(response.data)
    const rows = Array.isArray(payload.data) ? payload.data : []
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: rows.map(normalizeOrder),
      meta: normalizeMeta(payload.meta),
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch orders."),
      data: [],
      meta: null,
    }
  }
}

export async function getAdminOrder(orderId: number): Promise<OrderDetailResponse> {
  try {
    const response = await apiClient.get(`/admin/orders/${orderId}`)
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeOrder(payload.data) : null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch order."),
      data: null,
    }
  }
}

export async function getAdminOrderStats(): Promise<OrderStatsResponse> {
  try {
    const response = await apiClient.get("/admin/orders/stats")
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: normalizeStats(payload.data ?? payload),
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch order stats."),
      data: { total: 0, active: 0, completed: 0, cancelled: 0, totalValue: 0 },
    }
  }
}

// ---------------------------------------------------------------------------
// Buyer endpoints
// ---------------------------------------------------------------------------

export async function getBuyerOrders(params?: {
  page?: number
  per_page?: number
  search?: string
  product_id?: number
  manufacturer_id?: number
  status?: string
}): Promise<OrdersListResponse> {
  try {
    const queryParams: Record<string, string | number> = {}
    if (params?.page) queryParams.page = params.page
    if (params?.per_page) queryParams.per_page = params.per_page
    if (params?.search) queryParams.search = params.search
    if (params?.product_id) queryParams.product_id = params.product_id
    if (params?.manufacturer_id) queryParams.manufacturer_id = params.manufacturer_id
    if (params?.status) queryParams.status = toBackendStatus(params.status)

    const response = await apiClient.get("/buyer/orders", { params: queryParams })
    const payload = toRecord(response.data)
    const rows = Array.isArray(payload.data) ? payload.data : []
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: rows.map(normalizeOrder),
      meta: normalizeMeta(payload.meta),
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch orders."),
      data: [],
      meta: null,
    }
  }
}

export async function getBuyerOrder(orderId: number): Promise<OrderDetailResponse> {
  try {
    const response = await apiClient.get(`/buyer/orders/${orderId}`)
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeOrder(payload.data) : null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch order."),
      data: null,
    }
  }
}

export async function getBuyerOrderStats(): Promise<OrderStatsResponse> {
  try {
    const response = await apiClient.get("/buyer/orders/stats")
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: normalizeStats(payload.data ?? payload),
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch order stats."),
      data: { total: 0, active: 0, completed: 0, cancelled: 0, totalValue: 0 },
    }
  }
}

// ---------------------------------------------------------------------------
// Manufacturer endpoints
// ---------------------------------------------------------------------------

export async function getManufacturerOrders(params?: {
  page?: number
  per_page?: number
  search?: string
  buyer_id?: number
  product_id?: number
  status?: string
}): Promise<OrdersListResponse> {
  try {
    const queryParams: Record<string, string | number> = {}
    if (params?.page) queryParams.page = params.page
    if (params?.per_page) queryParams.per_page = params.per_page
    if (params?.search) queryParams.search = params.search
    if (params?.buyer_id) queryParams.buyer_id = params.buyer_id
    if (params?.product_id) queryParams.product_id = params.product_id
    if (params?.status) queryParams.status = toBackendStatus(params.status)

    const response = await apiClient.get("/manufacturer/orders", { params: queryParams })
    const payload = toRecord(response.data)
    const rows = Array.isArray(payload.data) ? payload.data : []
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: rows.map(normalizeOrder),
      meta: normalizeMeta(payload.meta),
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch orders."),
      data: [],
      meta: null,
    }
  }
}

export async function getManufacturerOrder(orderId: number): Promise<OrderDetailResponse> {
  try {
    const response = await apiClient.get(`/manufacturer/orders/${orderId}`)
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeOrder(payload.data) : null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch order."),
      data: null,
    }
  }
}

export interface CreateOrderItem {
  product_id: number
  quantity: number
  quantity_unit: string
  unit_price: number
  notes?: string
}

export async function createManufacturerOrder(data: {
  buyer_id: number
  items: CreateOrderItem[]
  title: string
  total_amount: number
  currency_code: string
  estimated_delivery_at: string
  production_lead?: string
  payment_terms?: string
  shipping_terms?: string
  destination?: string
  notes?: string
  attachments?: File[]
}): Promise<CreateOrderResponse> {
  try {
    const formData = new FormData()
    formData.append("buyer_id", String(data.buyer_id))
    formData.append("title", data.title)
    formData.append("total_amount", String(data.total_amount))
    formData.append("currency_code", data.currency_code)
    formData.append("estimated_delivery_at", data.estimated_delivery_at)
    data.items.forEach((item, i) => {
      formData.append(`items[${i}][product_id]`, String(item.product_id))
      formData.append(`items[${i}][quantity]`, String(item.quantity))
      formData.append(`items[${i}][quantity_unit]`, item.quantity_unit)
      formData.append(`items[${i}][unit_price]`, String(item.unit_price))
      if (item.notes) {
        formData.append(`items[${i}][notes]`, item.notes)
      }
    })
    if (data.production_lead) formData.append("production_lead", data.production_lead)
    if (data.payment_terms) formData.append("payment_terms", data.payment_terms)
    if (data.shipping_terms) formData.append("shipping_terms", data.shipping_terms)
    if (data.destination) formData.append("destination", data.destination)
    if (data.notes) formData.append("notes", data.notes)
    if (data.attachments) {
      data.attachments.forEach((file, i) => {
        formData.append(`attachments[${i}]`, file)
      })
    }

    const response = await apiClient.post("/manufacturer/orders/create", formData)
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeOrder(payload.data) : null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to create order."),
      data: null,
    }
  }
}

export async function updateManufacturerOrderStatus(
  orderId: number,
  data: {
    status: string
    notes?: string
    photos?: File[]
    attachments?: File[]
  }
): Promise<UpdateStatusResponse> {
  try {
    const formData = new FormData()
    formData.append("status", toBackendStatus(data.status))
    if (data.notes) formData.append("notes", data.notes)
    if (data.photos) {
      data.photos.forEach((file, i) => {
        formData.append(`photos[${i}]`, file)
      })
    }
    if (data.attachments) {
      data.attachments.forEach((file, i) => {
        formData.append(`attachments[${i}]`, file)
      })
    }

    const response = await apiClient.post(`/manufacturer/orders/${orderId}/status-updates`, formData)
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeOrder(payload.data) : null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to update order status."),
      data: null,
    }
  }
}

export async function getManufacturerOrderStats(): Promise<OrderStatsResponse> {
  try {
    const response = await apiClient.get("/manufacturer/orders/stats")
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: normalizeStats(payload.data ?? payload),
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch order stats."),
      data: { total: 0, active: 0, completed: 0, cancelled: 0, totalValue: 0 },
    }
  }
}

// Select endpoints for order creation form
export async function getSelectProducts(): Promise<SelectProductsResponse> {
  try {
    const response = await apiClient.get("/manufacturer/orders/select/products")
    const payload = toRecord(response.data)
    const rows = Array.isArray(payload.data) ? payload.data : []
    return {
      success: true,
      data: rows.map(normalizeSelectProduct),
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch products."),
      data: [],
    }
  }
}

export async function getSelectBuyers(params: {
  product_ids: number[]
  search?: string
  per_page?: number
  page?: number
}): Promise<SelectBuyersResponse> {
  try {
    const queryParams: Record<string, string | number | number[]> = {}
    params.product_ids.forEach((id, i) => {
      queryParams[`product_ids[${i}]`] = id
    })
    if (params.search) queryParams.search = params.search
    if (params.per_page) queryParams.per_page = params.per_page
    if (params.page) queryParams.page = params.page

    const response = await apiClient.get("/manufacturer/orders/select/buyers", { params: queryParams })
    const payload = toRecord(response.data)
    const rows = Array.isArray(payload.data) ? payload.data : []
    return {
      success: true,
      data: rows.map(normalizeSelectBuyer),
      meta: normalizeMeta(payload.meta),
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch buyers."),
      data: [],
      meta: null,
    }
  }
}

// ---------------------------------------------------------------------------
// Buyer review
// ---------------------------------------------------------------------------

export async function createProductReview(
  productId: number,
  data: { order_id: number; rating: number; comment: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.post(`/buyer/products/${productId}/reviews`, data)
    const payload = toRecord(response.data)
    return {
      success: true,
      message: typeof payload.message === "string" ? payload.message : undefined,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to submit review."),
    }
  }
}
