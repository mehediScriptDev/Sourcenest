import { apiClient } from "./client"
import { unwrapApiItem } from "./locale"

export interface AboutPageValueItem {
  id: string
  icon: string
  title: string
  description: string
  enabled: boolean
}

export interface AboutPageWhyDifferentPoint {
  id: string
  title: string
  description: string
  enabled: boolean
}

export interface AboutPageContent {
  hero: {
    title: string
    subtitle: string
  }
  story: {
    title: string
    paragraphs: string[]
  }
  mission: {
    title: string
    description: string
  }
  vision: {
    title: string
    description: string
  }
  values: {
    title: string
    subtitle: string
    items: AboutPageValueItem[]
  }
  why_different: {
    title: string
    points: AboutPageWhyDifferentPoint[]
  }
  cta: {
    title: string
    subtitle: string
    buyer_button_text: string
    manufacturer_button_text: string
  }
}

export interface AboutPage {
  id: number
  enabled: boolean
  content: AboutPageContent
}

function normalizeValueItem(raw: unknown): AboutPageValueItem | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>

  return {
    id: String(record.id ?? ""),
    icon: String(record.icon ?? "Shield"),
    title: String(record.title ?? ""),
    description: String(record.description ?? ""),
    enabled: record.enabled !== false,
  }
}

function normalizeWhyDifferentPoint(raw: unknown): AboutPageWhyDifferentPoint | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>

  return {
    id: String(record.id ?? ""),
    title: String(record.title ?? ""),
    description: String(record.description ?? ""),
    enabled: record.enabled !== false,
  }
}

function normalizeContent(raw: unknown): AboutPageContent | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  const hero = record.hero as Record<string, unknown> | undefined
  const story = record.story as Record<string, unknown> | undefined
  const mission = record.mission as Record<string, unknown> | undefined
  const vision = record.vision as Record<string, unknown> | undefined
  const values = record.values as Record<string, unknown> | undefined
  const whyDifferent = record.why_different as Record<string, unknown> | undefined
  const cta = record.cta as Record<string, unknown> | undefined

  if (!hero || !story || !mission || !vision || !values || !whyDifferent || !cta) {
    return null
  }

  const valueItems = Array.isArray(values.items) ? values.items : []
  const points = Array.isArray(whyDifferent.points) ? whyDifferent.points : []
  const paragraphs = Array.isArray(story.paragraphs) ? story.paragraphs : []

  return {
    hero: {
      title: String(hero.title ?? ""),
      subtitle: String(hero.subtitle ?? ""),
    },
    story: {
      title: String(story.title ?? ""),
      paragraphs: paragraphs.map(String),
    },
    mission: {
      title: String(mission.title ?? ""),
      description: String(mission.description ?? ""),
    },
    vision: {
      title: String(vision.title ?? ""),
      description: String(vision.description ?? ""),
    },
    values: {
      title: String(values.title ?? ""),
      subtitle: String(values.subtitle ?? ""),
      items: valueItems
        .map((item) => normalizeValueItem(item))
        .filter((item): item is AboutPageValueItem => item !== null),
    },
    why_different: {
      title: String(whyDifferent.title ?? ""),
      points: points
        .map((item) => normalizeWhyDifferentPoint(item))
        .filter((item): item is AboutPageWhyDifferentPoint => item !== null),
    },
    cta: {
      title: String(cta.title ?? ""),
      subtitle: String(cta.subtitle ?? ""),
      buyer_button_text: String(cta.buyer_button_text ?? ""),
      manufacturer_button_text: String(cta.manufacturer_button_text ?? ""),
    },
  }
}

export function normalizeAboutPage(raw: unknown): AboutPage | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  if (typeof record.id !== "number" && typeof record.id !== "string") return null

  const content = normalizeContent(record.content)
  if (!content) return null

  return {
    id: Number(record.id),
    enabled: record.enabled !== false,
    content,
  }
}

export async function fetchAboutPage(): Promise<AboutPage | null> {
  try {
    const response = await apiClient.get("/about-page")
    const data = unwrapApiItem(response.data)
    return normalizeAboutPage(data)
  } catch {
    return null
  }
}
