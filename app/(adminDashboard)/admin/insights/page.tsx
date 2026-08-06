"use client"

import React, { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api/errors"
import {
  createAdminArticle,
  createArticleCategory,
  deleteAdminArticle,
  deleteArticleCategory,
  fetchAdminArticle,
  fetchAdminArticles,
  fetchArticleCategories,
  mapAdminArticleToInsight,
  updateAdminArticle,
  updateArticleCategory,
  type ArticleStatus,
} from "@/lib/api/admin-articles"
import { useTranslation } from "@/lib/i18n"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  Eye,
  Calendar,
  FileText,
  Tag,
  Image,
  Save,
  ExternalLink,
  User
} from "lucide-react"

interface InsightArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  author: string
  publishedAt: string | null
  status: ArticleStatus
  featured: boolean
  featuredImage?: string | null
  featuredImageName?: string | null
  views: number
  createdAt: string
  updatedAt: string
}

export default function AdminInsightsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.insights
  const c = t.admin.common
  const statusLabels: Record<InsightArticle["status"], string> = {
    draft: t.admin.supplierStatus.draft,
    published: c.published,
    archived: c.archived,
  }
  const [articles, setArticles] = useState<InsightArticle[]>([]) // Start empty, fetch from server on mount
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articlesError, setArticlesError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([]) // Start empty, fetch from server on mount
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: "", index: -1 })
  const [rawCategories, setRawCategories] = useState<Array<{ id: number; name: string; slug?: string }>>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [featuredImageError, setFeaturedImageError] = useState<string | null>(null)
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
  const [featuredFile, setFeaturedFile] = React.useState<File | null>(null)
  const [isSubmittingArticle, setIsSubmittingArticle] = React.useState(false)
  const { toast } = useToast()

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function handleFeaturedFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setFeaturedImageError(c.invalidImageFile)
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFeaturedImageError(c.imageTooLarge.replace("{size}", formatBytes(MAX_IMAGE_BYTES)))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setEditForm(prev => ({ ...prev, featuredImage: String(reader.result), featuredImageName: file.name }))
      setFeaturedFile(file)
      setFeaturedImageError(null)
    }
    reader.readAsDataURL(file)
  }

  function removeFeaturedImage() {
    setEditForm(prev => ({ ...prev, featuredImage: null, featuredImageName: undefined }))
    setFeaturedImageError(null)
    setFeaturedFile(null)
  }
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingArticle, setEditingArticle] = useState<InsightArticle | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewArticle, setPreviewArticle] = useState<InsightArticle | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    author: "",
    status: "draft" as ArticleStatus,
    featured: false,
    featuredImage: null as string | null,
    featuredImageName: undefined as string | undefined
  })
  const [slugEdited, setSlugEdited] = useState(false)
  const [excerptEdited, setExcerptEdited] = useState(false)

  const filteredArticles = articles.filter(article => {
    if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter !== "all" && article.status !== statusFilter) {
      return false
    }
    if (categoryFilter !== "all" && article.category !== categoryFilter) {
      return false
    }
    return true
  })

  const openNewArticle = () => {
    setEditingArticle(null)
    setEditForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "",
      tags: "",
      author: c.editorialTeam,
      status: "draft",
      featured: false,
      featuredImage: null,
      featuredImageName: undefined
    })
    setSlugEdited(false)
    setExcerptEdited(false)
    setShowEditDialog(true)
  }

  const openEditArticle = (article: InsightArticle) => {
    setEditingArticle(article)
    setEditForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      tags: article.tags.join(", "),
      author: article.author,
      status: article.status,
      featured: article.featured,
      featuredImage: (article as any).featuredImage ?? null,
      featuredImageName: (article as any).featuredImageName ?? undefined
    })
    // if the slug equals generated slug from title we can allow auto-updates until user edits
    setSlugEdited(Boolean(article.slug && article.slug !== generateSlug(article.title)))
    setExcerptEdited(Boolean(article.excerpt && article.excerpt.trim().length > 0))
    setShowEditDialog(true)
  }

  const buildArticlePayload = () => {
    const cat = rawCategories.find((item) => String(item.name) === String(editForm.category))
    const tags = editForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean)

    return {
      title: editForm.title.trim(),
      slug: editForm.slug.trim(),
      excerpt: editForm.excerpt.trim(),
      content: editForm.content.trim(),
      author: editForm.author.trim(),
      is_featured: editForm.featured,
      status: editForm.status,
      article_category_id: cat?.id,
      article_image: featuredFile,
      tags,
    }
  }

  const saveArticle = () => {
    if (!editForm.title.trim() || !editForm.slug.trim() || !editForm.content.trim()) {
      toast({
        title: c.validationError,
        description: c.fillRequiredFields,
        variant: "destructive",
      })
      return
    }

    const cat = rawCategories.find((item) => String(item.name) === String(editForm.category))
    if (!cat?.id) {
      toast({
        title: c.validationError,
        description: p.selectCategory,
        variant: "destructive",
      })
      return
    }

    const payload = buildArticlePayload()

    ;(async () => {
      setIsSubmittingArticle(true)
      try {
        if (editingArticle) {
          const result = await updateAdminArticle(editingArticle.id, payload)
          toast({
            title: p.articleUpdated,
            description: result.message || p.articleSaved,
          })
        } else {
          const result = await createAdminArticle(payload)
          toast({
            title: p.articleCreated,
            description: result.message || p.articleSaved,
          })
        }

        setShowEditDialog(false)
        setFeaturedFile(null)
        setFeaturedImageError(null)
        await fetchArticles()
      } catch (err: unknown) {
        toast({
          title: editingArticle ? p.saveFailed : p.failedToCreate,
          description: getApiErrorMessage(
            err,
            editingArticle ? p.saveFailed : p.articleCreateFailed
          ),
          variant: "destructive",
        })
      } finally {
        setIsSubmittingArticle(false)
      }
    })()
  }

  async function fetchCategories() {
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      const list = await fetchArticleCategories()
      setRawCategories(list)
      setCategories(list.map((category) => String(category.name)))
    } catch (err: unknown) {
      setCategoriesError(getApiErrorMessage(err, p.failedLoadCategories))
    } finally {
      setCategoriesLoading(false)
    }
  }

  async function fetchArticles() {
    setArticlesLoading(true)
    setArticlesError(null)
    try {
      const list = await fetchAdminArticles()
      setArticles(list.map(mapAdminArticleToInsight))
    } catch (err: unknown) {
      setArticlesError(getApiErrorMessage(err, p.failedLoadArticles))
    } finally {
      setArticlesLoading(false)
    }
  }

  async function fetchAndPreviewArticle(articleId: string) {
    setPreviewLoading(true)
    try {
      const article = await fetchAdminArticle(articleId)
      setPreviewArticle(mapAdminArticleToInsight(article))
      setShowPreviewDialog(true)
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: c.error,
        description: getApiErrorMessage(err, p.previewFailed),
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  async function addCategory(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const slug = trimmed
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 100)
      await createArticleCategory({ name: trimmed, slug })
      await fetchCategories()
    } catch (err: unknown) {
      setCategoriesError(getApiErrorMessage(err, p.failedAddCategory))
    }
  }

  async function updateCategory(index: number, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const entry = rawCategories[index]
    if (!entry?.id) {
      setCategoriesError(p.categoryNotFoundUpdate)
      return
    }
    try {
      const slug = trimmed
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 100)
      await updateArticleCategory(entry.id, { name: trimmed, slug })
      await fetchCategories()
    } catch (err: unknown) {
      setCategoriesError(getApiErrorMessage(err, p.failedUpdateCategory))
    }
  }

  async function removeCategory(index: number) {
    const entry = rawCategories[index]
    if (!entry?.id) {
      setCategoriesError(p.categoryNotFoundDelete)
      return
    }
    try {
      await deleteArticleCategory(entry.id)
      await fetchCategories()
    } catch (err: unknown) {
      setCategoriesError(getApiErrorMessage(err, p.failedDeleteCategory))
    }
  }

  React.useEffect(() => {
    if (showCategoriesDialog) {
      fetchCategories()
    }
  }, [showCategoriesDialog])

  // Fetch categories and articles on mount so they populate from server
  React.useEffect(() => {
    fetchCategories()
    fetchArticles()
  }, [])

  // --- Auto-generate helpers for slug and excerpt ---
  function generateSlug(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 100)
  }

  function generateExcerptFromContent(content: string) {
    const text = String(content || '').replace(/!\[[^\]]*\]\([^\)]+\)/g, '') // remove images
      .replace(/\[[^\]]+\]\([^\)]+\)/g, '') // remove links
      .replace(/[#>*`~\-]{1,}/g, '') // remove some markdown chars
      .replace(/\s+/g, ' ').trim()
    if (!text) return ''
    return text.length <= 200 ? text : text.slice(0, 197).trim() + '...'
  }

  // keep slug in sync with title while user hasn't manually edited slug
  React.useEffect(() => {
    if (!slugEdited) {
      setEditForm(prev => ({ ...prev, slug: generateSlug(prev.title) }))
    }
  }, [editForm.title, slugEdited])

  // keep excerpt in sync with content while user hasn't manually edited excerpt
  React.useEffect(() => {
    if (!excerptEdited) {
      setEditForm(prev => ({ ...prev, excerpt: generateExcerptFromContent(prev.content) }))
    }
  }, [editForm.content, excerptEdited])

  function openCategoriesDialog() {
    // Clear previous values so UI shows loading state instead of stale list
    setCategories([])
    setRawCategories([])
    setCategoryForm({ name: "", index: -1 })
    setCategoriesError(null)
    setShowCategoriesDialog(true)
  }

  const deleteArticle = () => {
    if (!deletingId) return

    ;(async () => {
      try {
        await deleteAdminArticle(deletingId)
        toast({ title: c.deleted, description: (p as any).articleDeleted ?? c.deletedSuccessfully })
        setShowDeleteConfirm(false)
        setDeletingId(null)
        await fetchArticles()
      } catch (err: unknown) {
        toast({
          title: c.error,
          description: getApiErrorMessage(err, c.actionFailed),
          variant: "destructive",
        })
      }
    })()
  }

  const publishArticle = (id: string) => {
    const now = new Date().toISOString().split('T')[0]
    setArticles(prev => prev.map(a => 
      a.id === id ? { ...a, status: "published", publishedAt: now, updatedAt: now } : a
    ))
  }
  

  const statusColors = {
    draft: "bg-amber-100 text-amber-700",
    published: "bg-emerald-100 text-emerald-700",
    archived: "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.title}</h1>
          <p className="text-muted-foreground">{p.subtitle}</p>
        </div>
        <Button onClick={openNewArticle}>
          <Plus className="mr-2 h-4 w-4" />
          {p.newArticle}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <AdminStatCard
          title={p.totalArticles}
          value={articles.length}
          layout="vertical"
          contentClassName="pt-6 pb-6 px-6"
        />
        <AdminStatCard
          title={p.published}
          value={articles.filter(a => a.status === "published").length}
          valueClassName="text-emerald-600"
          layout="vertical"
          contentClassName="pt-6 pb-6 px-6"
        />
        <AdminStatCard
          title={p.totalViews}
          value={articles.reduce((acc, a) => acc + a.views, 0).toLocaleString()}
          layout="vertical"
          contentClassName="pt-6 pb-6 px-6"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={p.searchArticles}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder={c.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{c.allStatus}</SelectItem>
                <SelectItem value="draft">{t.admin.supplierStatus.draft}</SelectItem>
                <SelectItem value="published">{c.published}</SelectItem>
                <SelectItem value="archived">{c.archived}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder={c.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{p.allCategories}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => openCategoriesDialog()}>
              {c.manageCategories}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>{p.articles}</CardTitle>
          <CardDescription>
            {p.articlesFound.replace("{count}", String(filteredArticles.length))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articlesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : articlesError ? (
            <div className="py-8 text-center text-sm text-destructive">{articlesError}</div>
          ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <div 
                key={article.id}
                className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground truncate">
                      {article.title}
                    </h3>
                    <Badge className={statusColors[article.status]}>
                      {statusLabels[article.status]}
                    </Badge>
                    {article.featured && (
                      <Badge variant="outline" className="border-primary text-primary">
                        {c.featured}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {article.excerpt}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Tag className="h-3 w-3 shrink-0" />
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <User className="h-3 w-3 shrink-0" />
                      {article.author}
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {article.publishedAt || article.createdAt ? format(new Date(article.publishedAt || article.createdAt), "MMM dd, yyyy") : "-"}
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Eye className="h-3 w-3 shrink-0" />
                      {p.viewsLabel.replace("{count}", article.views.toLocaleString())}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditArticle(article)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditArticle(article)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {c.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fetchAndPreviewArticle(article.id)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {c.preview}
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setDeletingId(article.id)
                          setShowDeleteConfirm(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {c.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredArticles.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold text-foreground">{p.noArticlesFound}</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                    ? p.tryAdjustFilters
                    : p.createFirstArticle
                  }
                </p>
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AdminDialogContent mobile="fullscreen" size="xl">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? p.editArticle : p.createNewArticle}
            </DialogTitle>
            <DialogDescription>
              {editingArticle ? p.editArticleDesc : p.createArticleDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>{c.title}</Label>
                <Input 
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-2"
                  placeholder={p.articleTitle}
                />
              </div>
              <div>
                <Label>{p.urlSlug}</Label>
                <Input 
                  value={editForm.slug}
                  onChange={(e) => {
                    setSlugEdited(true)
                    setEditForm({ ...editForm, slug: e.target.value })
                  }}
                  className="mt-2"
                  placeholder={p.slugPlaceholder}
                />
              </div>
              <div>
                <Label>{c.category}</Label>
                <Select 
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={p.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{c.description}</Label>
              <Textarea 
                value={editForm.excerpt}
                  onChange={(e) => {
                    setExcerptEdited(true)
                    setEditForm({ ...editForm, excerpt: e.target.value })
                  }}
                className="mt-2"
                rows={2}
                placeholder={p.briefSummary}
              />
            </div>

            <div>
              <Label>{c.content}</Label>
              <Textarea 
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                className="mt-2"
                rows={10}
                placeholder={p.fullContent}
              />
            </div>

            <div>
              <Label>{p.featuredImage}</Label>
              <div className="mt-2">
                <div
                  className="group relative flex items-center gap-4 rounded border border-dashed border-border p-3 hover:border-primary transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer?.files && e.dataTransfer.files[0]
                    if (file) handleFeaturedFile(file)
                  }}
                >
                  <input
                    ref={(el) => { fileInputRef.current = el }}
                    id="featured-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0]
                      if (file) handleFeaturedFile(file)
                    }}
                  />

                  {editForm.featuredImage ? (
                    <img src={editForm.featuredImage} alt="preview" className="h-24 w-36 object-cover rounded" />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Image className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">{c.dropImageHere}</div>
                    </div>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>{c.chooseFile}</Button>
                    {editForm.featuredImage && (
                      <Button size="sm" variant="outline" onClick={() => removeFeaturedImage()}>
                        {c.remove}
                      </Button>
                    )}
                  </div>
                </div>
                {featuredImageError && (
                  <div className="mt-2 text-sm text-destructive">{featuredImageError}</div>
                )}
                {editForm.featuredImage && (
                  <div className="mt-2 text-xs text-muted-foreground">{editForm.featuredImageName ?? c.uploadedImage}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{p.tagsCommaSeparated}</Label>
                <Input 
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="mt-2"
                  placeholder={p.tagsPlaceholder}
                />
              </div>
              <div>
                <Label>{c.author}</Label>
                <Input 
                  value={editForm.author}
                  onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                  className="mt-2"
                  placeholder={p.authorName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{c.status}</Label>
                <Select 
                  value={editForm.status}
                  onValueChange={(value: ArticleStatus) => 
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t.admin.supplierStatus.draft}</SelectItem>
                    <SelectItem value="published">{c.published}</SelectItem>
                    <SelectItem value="archived">{c.archived}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={editForm.featured}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, featured: checked })}
                  />
                  <Label>{c.featuredArticle}</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {c.cancel}
            </Button>
            <Button onClick={saveArticle} disabled={isSubmittingArticle}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmittingArticle ? (editingArticle ? c.saving : c.creating) : (editingArticle ? c.saveChanges : c.createArticle)}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AdminDialogContent size="md">
          <DialogHeader>
            <DialogTitle>{c.deleteArticle}</DialogTitle>
            <DialogDescription>
              {p.deleteArticleDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {c.cancel}
            </Button>
            <Button variant="destructive" onClick={deleteArticle}>
              {c.delete}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Categories Management Dialog */}
      <Dialog open={showCategoriesDialog} onOpenChange={setShowCategoriesDialog}>
        <AdminDialogContent size="md">
          <DialogHeader>
            <DialogTitle>{c.manageArticleCategories}</DialogTitle>
            <DialogDescription>{p.manageCategoriesDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={p.newCategory}
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <Button
                onClick={() => {
                  const name = categoryForm.name.trim()
                  if (!name) return
                  if (categoryForm.index >= 0) {
                    updateCategory(categoryForm.index, name)
                  } else {
                    addCategory(name)
                  }
                  setCategoryForm({ name: "", index: -1 })
                }}
              >
                {categoryForm.index >= 0 ? c.save : c.add}
              </Button>
            </div>

            <div className="space-y-2">
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gray-300 animate-spin" />
                  <div className="ml-3 text-sm text-muted-foreground">{c.loadingCategories}</div>
                </div>
              ) : categoriesError ? (
                <div className="py-6 text-sm text-destructive">{categoriesError}</div>
              ) : categories.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground">{c.noCategoriesFound}</div>
              ) : (
                categories.map((cat, i) => (
                  <div key={cat} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>{cat}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCategoryForm({ name: cat, index: i })}
                      >
                        {c.edit}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeCategory(i)}
                      >
                        {c.delete}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoriesDialog(false)}>{c.close}</Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Article Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <AdminDialogContent mobile="fullscreen" size="lg">
          <DialogHeader>
            <DialogTitle>{c.articlePreview}</DialogTitle>
          </DialogHeader>
          
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gray-300 animate-spin" />
              <div className="ml-3 text-sm text-muted-foreground">{c.loadingArticle}</div>
            </div>
          ) : previewArticle ? (
            <div className="space-y-6">
              {/* Featured Image */}
              {previewArticle.featuredImage && (
                <div className="w-full">
                  <img 
                    src={previewArticle.featuredImage} 
                    alt={previewArticle.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Article Header */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{previewArticle.title}</h2>
                <p className="text-muted-foreground">{previewArticle.excerpt}</p>
              </div>

              {/* Meta Information */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-xs text-muted-foreground">{c.author}</p>
                  <p className="text-sm font-medium">{previewArticle.author}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.category}</p>
                  <p className="text-sm font-medium">{previewArticle.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.status}</p>
                  <Badge variant="outline" className="capitalize">{statusLabels[previewArticle.status]}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{p.totalViews}</p>
                  <p className="text-sm font-medium">{previewArticle.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.published}</p>
                  <p className="text-sm font-medium">{previewArticle.publishedAt || c.notPublished}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.tags}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewArticle.tags.length > 0 ? (
                      previewArticle.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">{c.noTags}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{c.content}</h3>
                <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                  {previewArticle.content}
                </div>
              </div>

              {/* Featured Badge */}
              {previewArticle.featured && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium">{c.featuredArticleNote}</p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>{c.close}</Button>
            {previewArticle && (
              <Button onClick={() => {
                openEditArticle(previewArticle)
                setShowPreviewDialog(false)
              }}>
                <Edit className="mr-2 h-4 w-4" />
                {c.edit}
              </Button>
            )}
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  )
}
