import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"
import { getApiContentLocale, unwrapApiItem } from "./locale"
import type { AboutPage, AboutPageContent } from "./about-page"
import { normalizeAboutPage } from "./about-page"

export type { AboutPage, AboutPageContent } from "./about-page"

export interface SaveAboutPageInput {
  locale?: string
  enabled?: boolean
  content: AboutPageContent
}

export async function fetchAdminAboutPage(): Promise<AboutPage | null> {
  try {
    const response = await apiClient.get("/admin/about-page")
    const data = unwrapApiItem(response.data)
    return normalizeAboutPage(data)
  } catch {
    return null
  }
}

export async function updateAdminAboutPage(
  payload: SaveAboutPageInput
): Promise<{ success: boolean; message: string; data?: AboutPage }> {
  try {
    const response = await apiClient.put("/admin/about-page", payload)
    const body = response.data as { success?: boolean; message?: string; data?: unknown }

    return {
      success: body.success !== false,
      message: typeof body.message === "string" ? body.message : "About page saved.",
      data: normalizeAboutPage(unwrapApiItem(body)) ?? undefined,
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to save about page."))
  }
}

export function mapAdminAboutPageToUi(page: AboutPage): import("@/lib/data/site-settings").AboutPageData {
  const { content } = page

  return {
    apiId: page.id,
    enabled: page.enabled,
    hero: {
      title: content.hero.title,
      subtitle: content.hero.subtitle,
    },
    story: {
      title: content.story.title,
      paragraphs: content.story.paragraphs,
    },
    mission: {
      title: content.mission.title,
      description: content.mission.description,
    },
    vision: {
      title: content.vision.title,
      description: content.vision.description,
    },
    values: {
      title: content.values.title,
      subtitle: content.values.subtitle,
      items: content.values.items.map((item) => ({
        id: item.id,
        icon: item.icon,
        title: item.title,
        description: item.description,
        enabled: item.enabled,
      })),
    },
    whyDifferent: {
      title: content.why_different.title,
      points: content.why_different.points.map((point) => ({
        id: point.id,
        title: point.title,
        description: point.description,
        enabled: point.enabled,
      })),
    },
    cta: {
      title: content.cta.title,
      subtitle: content.cta.subtitle,
      buyerButtonText: content.cta.buyer_button_text,
      manufacturerButtonText: content.cta.manufacturer_button_text,
    },
  }
}

export function mapUiAboutPageToSave(
  page: import("@/lib/data/site-settings").AboutPageData,
  locale?: string
): SaveAboutPageInput {
  const contentLocale = locale ?? getApiContentLocale()

  return {
    locale: contentLocale,
    enabled: page.enabled,
    content: {
      hero: {
        title: page.hero.title,
        subtitle: page.hero.subtitle,
      },
      story: {
        title: page.story.title,
        paragraphs: page.story.paragraphs,
      },
      mission: {
        title: page.mission.title,
        description: page.mission.description,
      },
      vision: {
        title: page.vision.title,
        description: page.vision.description,
      },
      values: {
        title: page.values.title,
        subtitle: page.values.subtitle,
        items: page.values.items.map((item) => ({
          id: item.id,
          icon: item.icon,
          title: item.title,
          description: item.description,
          enabled: item.enabled,
        })),
      },
      why_different: {
        title: page.whyDifferent.title,
        points: page.whyDifferent.points.map((point) => ({
          id: point.id,
          title: point.title,
          description: point.description,
          enabled: point.enabled,
        })),
      },
      cta: {
        title: page.cta.title,
        subtitle: page.cta.subtitle,
        buyer_button_text: page.cta.buyerButtonText,
        manufacturer_button_text: page.cta.manufacturerButtonText,
      },
    },
  }
}
