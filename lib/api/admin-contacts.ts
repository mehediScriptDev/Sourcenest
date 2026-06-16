import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface AdminContact {
  id: number
  name: string
  email: string
  company_name: string
  inquiry_type: string
  message: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface AdminContactMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number | null
  to: number | null
}

export interface AdminContactsResponse {
  success: boolean
  message?: string
  data: AdminContact[]
  meta: AdminContactMeta | null
}

export interface AdminContactDetailResponse {
  success: boolean
  message?: string
  data: AdminContact | null
}

type RecordLike = Record<string, unknown>

function toRecord(value: unknown): RecordLike {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RecordLike
  }
  return {}
}

function toString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return fallback
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "number") {
    return value !== 0
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1"
  }
  return fallback
}

function normalizeContact(payload: unknown): AdminContact {
  const contact = toRecord(payload)

  return {
    id: toNumber(contact.id),
    name: toString(contact.name),
    email: toString(contact.email),
    company_name: toString(contact.company_name),
    inquiry_type: toString(contact.inquiry_type),
    message: toString(contact.message),
    is_read: toBoolean(contact.is_read),
    created_at: toString(contact.created_at),
    updated_at: toString(contact.updated_at),
  }
}

function normalizeMeta(payload: unknown): AdminContactMeta | null {
  const meta = toRecord(payload)
  if (Object.keys(meta).length === 0) {
    return null
  }

  return {
    currentPage: toNumber(meta.current_page, 1),
    lastPage: toNumber(meta.last_page, 1),
    perPage: toNumber(meta.per_page, 10),
    total: toNumber(meta.total, 0),
    from: meta.from == null ? null : toNumber(meta.from),
    to: meta.to == null ? null : toNumber(meta.to),
  }
}

export async function getAdminContacts(
  page = 1,
  filters?: Record<string, unknown>
): Promise<AdminContactsResponse> {
  try {
    const params: Record<string, unknown> = { page, ...filters }
    const response = await apiClient.get("/admin/contacts", { params })
    const payload = toRecord(response.data)
    const rows = Array.isArray(payload.data) ? payload.data : []

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: rows.map(normalizeContact),
      meta: normalizeMeta(payload.meta),
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch admin contacts."),
      data: [],
      meta: null,
    }
  }
}

export async function getAdminContactById(id: number): Promise<AdminContactDetailResponse> {
  try {
    const response = await apiClient.get(`/admin/contacts/${id}`)
    const payload = toRecord(response.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeContact(payload.data) : null,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch contact details."),
      data: null,
    }
  }
}

export async function deleteAdminContact(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.delete(`/admin/contacts/${id}`)
    const payload = toRecord(response.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to delete contact."),
    }
  }
}

export async function updateAdminContactReadStatus(id: number, is_read: boolean): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.patch(`/admin/contacts/${id}/read-status`, { is_read })
    const payload = toRecord(response.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to update read status."),
    }
  }
}
