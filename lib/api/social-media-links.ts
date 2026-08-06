import { apiClient } from "./client"
import { unwrapApiList } from "./locale"

export interface SocialMediaLinkItem {
  id: number
  platform: string
  icon: string
  url: string
  enabled: boolean
  sort: number
}

function normalizeSocialMediaLink(raw: unknown): SocialMediaLinkItem | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  if (typeof record.id !== "number" && typeof record.id !== "string") return null

  return {
    id: Number(record.id),
    platform: String(record.platform ?? ""),
    icon: String(record.icon ?? "Share2"),
    url: String(record.url ?? ""),
    enabled: record.enabled !== false,
    sort: Number(record.sort ?? 0),
  }
}

export async function fetchSocialMediaLinks(): Promise<SocialMediaLinkItem[]> {
  try {
    const response = await apiClient.get("/social-media-links")
    const items = unwrapApiList(response.data)

    return items
      .map((item) => normalizeSocialMediaLink(item))
      .filter((item): item is SocialMediaLinkItem => item !== null)
      .sort((a, b) => a.sort - b.sort)
  } catch {
    return []
  }
}
