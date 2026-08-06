import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface PlatformGeneralSettings {
  platform_name: string
  support_email: string
  contact_phone: string
}

export interface PlatformSecuritySettings {
  require_email_verification: boolean
  manual_supplier_approval: boolean
  rate_limiting: boolean
}

export interface PlatformLocalizationSettings {
  default_language: string
  default_currency: string
  default_timezone: string
}

export interface PlatformSettings {
  general: PlatformGeneralSettings
  security: PlatformSecuritySettings
  localization: PlatformLocalizationSettings
}

export interface DatabaseExportCreator {
  id: number
  name: string | null
  email: string
}

export interface DatabaseExport {
  id: number
  type: string
  scope: string
  tables: string[] | null
  chunk_rows: number
  status: string
  total_tables: number
  processed_tables: number
  total_rows: number
  processed_rows: number
  total_parts: number
  progress_percent: number
  download_name: string | null
  file_size: number | null
  error_message: string | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
  creator?: DatabaseExportCreator | null
  download_url?: string | null
}

export interface DatabaseBackupStatus {
  last_backup_at: string | null
  last_backup: DatabaseExport | null
}

export interface DatabaseExportsMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface CreateDatabaseExportPayload {
  type: "backup" | "export"
  scope: "full" | "tables"
  tables?: string[]
  chunk_rows?: number
}

export type UpdatePlatformSettingsPayload = Partial<PlatformSettings>

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

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1"
  }
  return fallback
}

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.map((item) => toString(item)).filter(Boolean)
}

function normalizeGeneral(payload: unknown): PlatformGeneralSettings {
  const data = toRecord(payload)
  return {
    platform_name: toString(data.platform_name),
    support_email: toString(data.support_email),
    contact_phone: toString(data.contact_phone),
  }
}

function normalizeSecurity(payload: unknown): PlatformSecuritySettings {
  const data = toRecord(payload)
  return {
    require_email_verification: toBoolean(data.require_email_verification, true),
    manual_supplier_approval: toBoolean(data.manual_supplier_approval, true),
    rate_limiting: toBoolean(data.rate_limiting, true),
  }
}

function normalizeLocalization(payload: unknown): PlatformLocalizationSettings {
  const data = toRecord(payload)
  return {
    default_language: toString(data.default_language, "en"),
    default_currency: toString(data.default_currency, "USD"),
    default_timezone: toString(data.default_timezone, "UTC"),
  }
}

function normalizeSettings(payload: unknown): PlatformSettings {
  const data = toRecord(payload)
  return {
    general: normalizeGeneral(data.general),
    security: normalizeSecurity(data.security),
    localization: normalizeLocalization(data.localization),
  }
}

function normalizeExport(payload: unknown): DatabaseExport {
  const data = toRecord(payload)
  const creator = data.creator ? toRecord(data.creator) : null

  return {
    id: toNumber(data.id),
    type: toString(data.type),
    scope: toString(data.scope),
    tables: toStringArray(data.tables),
    chunk_rows: toNumber(data.chunk_rows, 1000),
    status: toString(data.status),
    total_tables: toNumber(data.total_tables),
    processed_tables: toNumber(data.processed_tables),
    total_rows: toNumber(data.total_rows),
    processed_rows: toNumber(data.processed_rows),
    total_parts: toNumber(data.total_parts),
    progress_percent: toNumber(data.progress_percent),
    download_name: data.download_name == null ? null : toString(data.download_name),
    file_size: data.file_size == null ? null : toNumber(data.file_size),
    error_message: data.error_message == null ? null : toString(data.error_message),
    completed_at: data.completed_at == null ? null : toString(data.completed_at),
    created_at: data.created_at == null ? null : toString(data.created_at),
    updated_at: data.updated_at == null ? null : toString(data.updated_at),
    creator: creator
      ? {
          id: toNumber(creator.id),
          name: creator.name == null ? null : toString(creator.name),
          email: toString(creator.email),
        }
      : null,
    download_url: data.download_url == null ? null : toString(data.download_url),
  }
}

function normalizeMeta(payload: unknown): DatabaseExportsMeta | null {
  const meta = toRecord(payload)
  if (Object.keys(meta).length === 0) return null

  return {
    currentPage: toNumber(meta.current_page, 1),
    lastPage: toNumber(meta.last_page, 1),
    perPage: toNumber(meta.per_page, 10),
    total: toNumber(meta.total, 0),
  }
}

export async function fetchAdminPlatformSettings(): Promise<{
  success: boolean
  message?: string
  data: PlatformSettings | null
}> {
  try {
    const response = await apiClient.get("/admin/settings")
    const payload = toRecord(response.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeSettings(payload.data) : null,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load platform settings."),
      data: null,
    }
  }
}

export async function updateAdminPlatformSettings(
  body: UpdatePlatformSettingsPayload
): Promise<{
  success: boolean
  message?: string
  data: PlatformSettings | null
}> {
  try {
    const response = await apiClient.put("/admin/settings", body)
    const payload = toRecord(response.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeSettings(payload.data) : null,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to save platform settings."),
      data: null,
    }
  }
}

export async function fetchDatabaseBackupStatus(): Promise<{
  success: boolean
  message?: string
  data: DatabaseBackupStatus | null
}> {
  try {
    const response = await apiClient.get("/admin/database/backup-status")
    const payload = toRecord(response.data)
    const data = toRecord(payload.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: {
        last_backup_at: data.last_backup_at == null ? null : toString(data.last_backup_at),
        last_backup: data.last_backup ? normalizeExport(data.last_backup) : null,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load backup status."),
      data: null,
    }
  }
}

export async function fetchDatabaseTables(): Promise<{
  success: boolean
  message?: string
  data: string[]
}> {
  try {
    const response = await apiClient.get("/admin/database/tables")
    const payload = toRecord(response.data)
    const rows = Array.isArray(payload.data) ? payload.data : []

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: rows.map((row) => toString(row)).filter(Boolean),
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load database tables."),
      data: [],
    }
  }
}

export async function createDatabaseExport(
  body: CreateDatabaseExportPayload
): Promise<{
  success: boolean
  message?: string
  data: DatabaseExport | null
}> {
  try {
    const response = await apiClient.post("/admin/database/exports", body)
    const payload = toRecord(response.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: payload.data ? normalizeExport(payload.data) : null,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to queue database export."),
      data: null,
    }
  }
}

export async function fetchDatabaseExports(page = 1): Promise<{
  success: boolean
  message?: string
  data: DatabaseExport[]
  meta: DatabaseExportsMeta | null
}> {
  try {
    const response = await apiClient.get("/admin/database/exports", { params: { page, per_page: 10 } })
    const payload = toRecord(response.data)
    const rows = Array.isArray(payload.data) ? payload.data : []

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: typeof payload.message === "string" ? payload.message : undefined,
      data: rows.map(normalizeExport),
      meta: normalizeMeta(payload.meta),
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load export history."),
      data: [],
      meta: null,
    }
  }
}

export async function downloadDatabaseExport(
  id: number,
  filename?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.get(`/admin/database/exports/${id}/download`, {
      responseType: "blob",
    })

    const blob = response.data as Blob
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename || "database-export.zip"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to download export."),
    }
  }
}
