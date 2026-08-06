import { publicApiClient } from "./client"
import { getApiErrorMessage } from "./errors"
import {
  STATIC_ARTICLES,
  type StaticArticle,
  formatPublishedDate,
  estimateReadTime,
} from "@/lib/static-articles"

export type { StaticArticle as BlogArticle }
export { formatPublishedDate, estimateReadTime }

export interface ApiArticle {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  tags?: string[]
  author: string
  is_featured: boolean
  status: string
  published_at: string | null
  views?: number
  image_url?: string | null
  category?: { id: number; name: string; slug?: string } | null
}

const IMAGE_FALLBACK_BY_SLUG: Record<string, string> = Object.fromEntries(
  STATIC_ARTICLES.map((article) => [article.slug, article.imageUrl])
)

function resolveImageUrl(article: ApiArticle): string {
  if (article.image_url) {
    return article.image_url
  }

  return IMAGE_FALLBACK_BY_SLUG[article.slug] ?? "/blog/article_sourcing_platform.png"
}

export function mapApiArticleToBlog(article: ApiArticle): StaticArticle {
  const publishedAt = article.published_at
    ? article.published_at.slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category?.name ?? "",
    excerpt: article.excerpt,
    content: article.content,
    imageUrl: resolveImageUrl(article),
    author: article.author || "SourceNest Editorial Team",
    publishedAt,
    readTime: estimateReadTime(article.content),
    isFeatured: Boolean(article.is_featured),
    metaTitle: `${article.title} | SourceNest`,
    metaDescription: article.excerpt,
    tags: Array.isArray(article.tags) ? article.tags.map(String) : [],
  }
}

function unwrapArticleList(payload: unknown): ApiArticle[] {
  if (!payload || typeof payload !== "object") {
    return []
  }

  const root = payload as Record<string, unknown>
  const data = root.data

  if (Array.isArray(data)) {
    return data as ApiArticle[]
  }

  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)) {
    return (data as { data: ApiArticle[] }).data
  }

  return []
}

export async function fetchPublicArticles(): Promise<StaticArticle[]> {
  try {
    const response = await publicApiClient.get("/articles", {
      params: {
        status: "published",
        per_page: 100,
        page: 1,
      },
    })

    const list = unwrapArticleList(response.data)
    if (list.length === 0) {
      return STATIC_ARTICLES
    }

    return list.map(mapApiArticleToBlog)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load articles"))
  }
}

export async function fetchPublicArticleBySlug(slug: string): Promise<StaticArticle | null> {
  try {
    const response = await publicApiClient.get(`/articles/${encodeURIComponent(slug)}`)
    const article = response.data?.data as ApiArticle | undefined
    if (!article) {
      return null
    }

    return mapApiArticleToBlog(article)
  } catch {
    return STATIC_ARTICLES.find((article) => article.slug === slug) ?? null
  }
}

export function getBlogCategories(articles: StaticArticle[]): string[] {
  const categories = new Set(articles.map((article) => article.category).filter(Boolean))

  return [
    "All",
    ...Array.from(categories).sort((a, b) => a.localeCompare(b)),
  ]
}
