import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"
import { getApiContentLocale, unwrapApiItem, unwrapApiList } from "./locale"
import type { LegalPage, LegalPageSection } from "./legal-pages"

export interface AdminLegalPage extends LegalPage {
  sections: LegalPageSection[]
  available_locales?: string[]
}

export interface SaveLegalPageContentInput {
  locale?: string
  title: string
  last_updated?: string
  enabled?: boolean
  sort?: number
  sections: Array<{
    id?: number
    section_key: string
    title: string
    content: string
    sort: number
  }>
}

function normalizeSection(raw: unknown): LegalPageSection | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  if (typeof record.id !== "number" && typeof record.id !== "string") return null

  return {
    id: Number(record.id),
    section_key: String(record.section_key ?? ""),
    title: String(record.title ?? ""),
    content: String(record.content ?? ""),
    sort: Number(record.sort ?? 0),
  }
}

function normalizeAdminLegalPage(raw: unknown): AdminLegalPage | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  if (typeof record.id !== "number" && typeof record.id !== "string") return null

  const sectionsRaw = Array.isArray(record.sections) ? record.sections : []

  return {
    id: Number(record.id),
    slug: String(record.slug ?? ""),
    title: String(record.title ?? ""),
    last_updated:
      typeof record.last_updated === "string"
        ? record.last_updated
        : typeof record.last_updated_label === "string"
          ? record.last_updated_label
          : null,
    enabled: record.enabled !== false,
    sort: Number(record.sort ?? 0),
    sections: sectionsRaw
      .map((item) => normalizeSection(item))
      .filter((item): item is LegalPageSection => item !== null)
      .sort((a, b) => a.sort - b.sort),
    available_locales: Array.isArray(record.available_locales)
      ? record.available_locales.map(String)
      : undefined,
  }
}

export async function fetchAdminLegalPages(): Promise<AdminLegalPage[]> {
  const response = await apiClient.get("/admin/legal-pages")
  const items = unwrapApiList(response.data)

  if (items.length === 0) {
    throw new Error("No legal pages found in the API. Run the LegalPageSeeder on the backend.")
  }

  return items
    .map((item) => normalizeAdminLegalPage(item))
    .filter((item): item is AdminLegalPage => item !== null)
}

export async function fetchAdminLegalPage(id: number | string): Promise<AdminLegalPage | null> {
  try {
    const response = await apiClient.get(`/admin/legal-pages/${id}`)
    const data = unwrapApiItem(response.data)
    return normalizeAdminLegalPage(data)
  } catch {
    return null
  }
}

export async function updateAdminLegalPageContent(
  id: number | string,
  payload: SaveLegalPageContentInput
): Promise<{ success: boolean; message: string; data?: AdminLegalPage }> {
  try {
    const response = await apiClient.put(`/admin/legal-pages/${id}/content`, payload)
    const body = response.data as { success?: boolean; message?: string; data?: unknown }

    return {
      success: body.success !== false,
      message: typeof body.message === "string" ? body.message : "Legal page saved.",
      data: normalizeAdminLegalPage(unwrapApiItem(body)) ?? undefined,
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to save legal page."))
  }
}

export function mapAdminLegalPageToUi(page: AdminLegalPage): import("@/lib/data/site-settings").LegalPage {
  return {
    id: page.slug,
    apiId: page.id,
    slug: page.slug,
    title: page.title,
    lastUpdated: page.last_updated || "",
    enabled: page.enabled,
    sections: page.sections.map((section) => ({
      id: section.section_key,
      apiId: section.id,
      sectionKey: section.section_key,
      title: section.title,
      content: section.content,
      order: section.sort,
    })),
  }
}

export function mapUiLegalPageToSave(
  page: import("@/lib/data/site-settings").LegalPage,
  locale?: string
): SaveLegalPageContentInput {
  const contentLocale = locale ?? getApiContentLocale()

  return {
    locale: contentLocale,
    title: page.title,
    last_updated: page.lastUpdated,
    enabled: page.enabled,
    sort: undefined,
    sections: [...page.sections]
      .sort((a, b) => a.order - b.order)
      .map((section, index) => ({
        id: section.apiId,
        section_key: section.sectionKey || section.id,
        title: section.title,
        content: section.content,
        sort: section.order || index + 1,
      })),
  }
}
