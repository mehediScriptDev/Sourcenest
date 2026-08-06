import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"
import { unwrapApiItem, unwrapApiList } from "./locale"
import type { SocialMediaLinkItem } from "./social-media-links"

export interface SaveSocialMediaLinkInput {
  platform: string
  icon: string
  url: string
  enabled?: boolean
  sort?: number
}

export interface SyncSocialMediaLinkInput {
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

export async function fetchAdminSocialMediaLinks(): Promise<SocialMediaLinkItem[]> {
  try {
    const response = await apiClient.get("/admin/social-media-links")
    const items = unwrapApiList(response.data)

    return items
      .map((item) => normalizeSocialMediaLink(item))
      .filter((item): item is SocialMediaLinkItem => item !== null)
      .sort((a, b) => a.sort - b.sort)
  } catch {
    return []
  }
}

export async function createAdminSocialMediaLink(
  payload: SaveSocialMediaLinkInput
): Promise<SocialMediaLinkItem> {
  try {
    const response = await apiClient.post("/admin/social-media-links", payload)
    const data = normalizeSocialMediaLink(unwrapApiItem(response.data))
    if (!data) {
      throw new Error("Invalid social media link response.")
    }
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create social media link."))
  }
}

export async function updateAdminSocialMediaLink(
  id: number,
  payload: Partial<SaveSocialMediaLinkInput>
): Promise<SocialMediaLinkItem> {
  try {
    const response = await apiClient.put(`/admin/social-media-links/${id}`, payload)
    const data = normalizeSocialMediaLink(unwrapApiItem(response.data))
    if (!data) {
      throw new Error("Invalid social media link response.")
    }
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update social media link."))
  }
}

export async function deleteAdminSocialMediaLink(id: number): Promise<void> {
  try {
    await apiClient.delete(`/admin/social-media-links/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete social media link."))
  }
}

export async function syncAdminSocialMediaLinks(
  links: SyncSocialMediaLinkInput[]
): Promise<SocialMediaLinkItem[]> {
  try {
    const response = await apiClient.put("/admin/social-media-links/sync", { links })
    const items = unwrapApiList(response.data)

    return items
      .map((item) => normalizeSocialMediaLink(item))
      .filter((item): item is SocialMediaLinkItem => item !== null)
      .sort((a, b) => a.sort - b.sort)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to save social media links."))
  }
}

export function mapAdminSocialLinkToUi(link: SocialMediaLinkItem): import("@/lib/data/site-settings").SocialMediaLink {
  return {
    id: `social-${link.id}`,
    apiId: link.id,
    platform: link.platform,
    icon: link.icon,
    url: link.url,
    enabled: link.enabled,
    order: link.sort,
  }
}

export function mapUiSocialLinksToSync(
  links: import("@/lib/data/site-settings").SocialMediaLink[]
): SyncSocialMediaLinkInput[] {
  return [...links]
    .filter((link): link is import("@/lib/data/site-settings").SocialMediaLink & { apiId: number } =>
      typeof link.apiId === "number"
    )
    .sort((a, b) => a.order - b.order)
    .map((link, index) => ({
      id: link.apiId,
      platform: link.platform,
      icon: link.icon,
      url: link.url,
      enabled: link.enabled,
      sort: link.order || index + 1,
    }))
}
