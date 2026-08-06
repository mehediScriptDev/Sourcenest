import { publicApiClient } from "./client"

export interface LegalPageSection {
  id: number
  section_key: string
  title: string
  content: string
  sort: number
}

export interface LegalPage {
  id: number
  slug: string
  title: string
  last_updated: string | null
  enabled: boolean
  sort: number
  sections?: LegalPageSection[]
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

function normalizeLegalPage(raw: unknown, includeSections = false): LegalPage | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  if (typeof record.id !== "number" && typeof record.id !== "string") return null

  const sectionsRaw = Array.isArray(record.sections) ? record.sections : []
  const page: LegalPage = {
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
  }

  if (includeSections) {
    page.sections = sectionsRaw
      .map((item) => normalizeSection(item))
      .filter((item): item is LegalPageSection => item !== null)
      .sort((a, b) => a.sort - b.sort)
  }

  return page
}

export async function fetchLegalPages(): Promise<LegalPage[]> {
  const response = await publicApiClient.get("/legal-pages")
  const data = (response.data as { data?: unknown })?.data ?? response.data

  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item) => normalizeLegalPage(item))
    .filter((item): item is LegalPage => item !== null)
}

export async function fetchLegalPageBySlug(slug: string): Promise<LegalPage | null> {
  try {
    const response = await publicApiClient.get(`/legal-pages/${slug}`)
    const data = (response.data as { data?: unknown })?.data ?? response.data
    return normalizeLegalPage(data, true)
  } catch {
    return null
  }
}
