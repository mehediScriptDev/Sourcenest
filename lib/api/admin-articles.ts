import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export type ArticleStatus = "draft" | "published" | "archived"

export interface ArticleCategory {
  id: number
  name: string
  slug?: string
}

export interface AdminArticle {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  status: ArticleStatus
  is_featured: boolean
  views?: number
  published_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  image_url?: string | null
  article_image?: string | null
  article_image_name?: string | null
  category?: ArticleCategory | null
  tags?: string[]
}

export interface ArticleFormPayload {
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  is_featured: boolean
  status: ArticleStatus
  article_category_id?: number | string
  article_image?: File | null
  tags?: string[]
}

function buildArticleFormData(payload: ArticleFormPayload): FormData {
  const form = new FormData()
  form.append("title", payload.title)
  form.append("slug", payload.slug)
  form.append("excerpt", payload.excerpt)
  form.append("content", payload.content)
  form.append("author", payload.author)
  form.append("is_featured", payload.is_featured ? "1" : "0")
  form.append("status", payload.status)

  if (payload.article_category_id != null && payload.article_category_id !== "") {
    form.append("article_category_id", String(payload.article_category_id))
  }

  if (payload.article_image) {
    form.append("article_image", payload.article_image)
  }

  payload.tags?.forEach((tag, index) => {
    form.append(`tags[${index}]`, tag)
  })

  return form
}

export async function fetchArticleCategories(): Promise<ArticleCategory[]> {
  try {
    const response = await apiClient.get<{ data?: ArticleCategory[] }>("/admin/article/categories")
    return Array.isArray(response.data?.data) ? response.data.data : []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load article categories"))
  }
}

export async function createArticleCategory(payload: {
  name: string
  slug: string
}): Promise<void> {
  try {
    await apiClient.post("/admin/article/categories", payload)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create category"))
  }
}

export async function updateArticleCategory(
  id: number | string,
  payload: { name: string; slug: string }
): Promise<void> {
  try {
    await apiClient.put(`/admin/article/categories/${id}`, payload)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update category"))
  }
}

export async function deleteArticleCategory(id: number | string): Promise<void> {
  try {
    await apiClient.delete(`/admin/article/categories/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete category"))
  }
}

export async function fetchAdminArticles(): Promise<AdminArticle[]> {
  try {
    const response = await apiClient.get<{ data?: AdminArticle[] }>("/admin/articles")
    return Array.isArray(response.data?.data) ? response.data.data : []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load articles"))
  }
}

export async function fetchAdminArticle(id: number | string): Promise<AdminArticle> {
  try {
    const response = await apiClient.get<{ data?: AdminArticle }>(`/admin/articles/${id}`)
    if (!response.data?.data) {
      throw new Error("Article not found")
    }
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load article"))
  }
}

export async function createAdminArticle(
  payload: ArticleFormPayload
): Promise<{ message?: string; data: AdminArticle }> {
  try {
    const response = await apiClient.post<{ message?: string; data: AdminArticle }>(
      "/admin/articles/create",
      buildArticleFormData(payload)
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create article"))
  }
}

export async function updateAdminArticle(
  id: number | string,
  payload: ArticleFormPayload
): Promise<{ message?: string; data: AdminArticle }> {
  try {
    const response = await apiClient.put<{ message?: string; data: AdminArticle }>(
      `/admin/articles/${id}`,
      buildArticleFormData(payload)
    )
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update article"))
  }
}

export async function deleteAdminArticle(id: number | string): Promise<void> {
  try {
    await apiClient.delete(`/admin/articles/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete article"))
  }
}

export function mapAdminArticleToInsight(article: AdminArticle) {
  return {
    id: String(article.id),
    title: String(article.title || ""),
    slug: String(article.slug || ""),
    excerpt: String(article.excerpt || ""),
    content: String(article.content || ""),
    category: article.category?.name ? String(article.category.name) : "",
    tags: Array.isArray(article.tags) ? article.tags.map((tag) => String(tag)) : [],
    author: String(article.author || ""),
    publishedAt: article.published_at ? String(article.published_at) : null,
    status: (["draft", "published", "archived"].includes(article.status)
      ? article.status
      : "draft") as ArticleStatus,
    featured: Boolean(article.is_featured),
    views: Number(article.views) || 0,
    createdAt: String(article.created_at || ""),
    updatedAt: String(article.updated_at || ""),
    featuredImage: article.image_url ? String(article.image_url) : null,
    featuredImageName: article.image_url ? article.image_url.split("/").pop() : null,
  }
}
