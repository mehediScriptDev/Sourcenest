"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/button"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import IconPicker from "@/components/icon-picker"
import DynamicIcon from "@/components/dynamic-icon"
import {
  createAdminCategory,
  createAdminSubcategory,
  deleteAdminCategory,
  deleteAdminSubcategory,
  getAdminCategories,
  getAdminSubcategories,
  moveAdminSubcategoryPosition,
  toggleAdminCategoryFeatured,
  updateAdminCategory,
  updateAdminSubcategory,
  type BackendCategory,
  type BackendSubcategory,
  type CategoriesPaginationMeta,
} from "@/lib/api/categories"
import { useTranslation } from "@/lib/i18n"
import { queryKeys } from "@/lib/query-keys"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { 
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Layers,
  Factory,
  Package,
  ChevronRight,
  ChevronDown,
  GripVertical,
  FolderOpen,
  Tag,
  ArrowLeft,
  X,
  Star
} from "lucide-react"

// Types
interface Subcategory {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  tags?: string
  icon?: string
  subcategories: Subcategory[]
}

interface Industry {
  id: string
  name: string
  slug: string
  description: string
  icon?: string
  icon_color?: string
  color?: string
  title_color?: string
  description_color?: string
  btn_color?: string
  supplier_count_color?: string
  supplierCount: number
  productCount: number
  featured: boolean
  categories: Category[]
}

const PER_PAGE = 10

export default function AdminIndustriesPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.industries
  const c = t.admin.common
  const queryClient = useQueryClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // Dialog states
  const [showAddIndustryDialog, setShowAddIndustryDialog] = useState(false)
  const [showEditIndustryDialog, setShowEditIndustryDialog] = useState(false)
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false)
  const [showEditSubcategoryDialog, setShowEditSubcategoryDialog] = useState(false)
  const [showManageCategoriesDialog, setShowManageCategoriesDialog] = useState(false)
  
  // Current selections
  const [currentIndustry, setCurrentIndustry] = useState<Industry | null>(null)
  /** Snapshot of `featured` when "Edit Industry" opened — used to sync changes via PATCH toggle after PUT. */
  const [editIndustryFeaturedAtOpen, setEditIndustryFeaturedAtOpen] = useState<boolean | null>(null)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [currentSubcategory, setCurrentSubcategory] = useState<Subcategory | null>(null)
  
  // Form states
  const [newIndustry, setNewIndustry] = useState<{
    name: string;
    description: string;
    featured: boolean;
    slug: string;
    color: string;
    title_color: string;
    description_color: string;
    btn_color: string;
    supplier_count_color: string;
    icon: string;
    icon_color: string;
  }>({
    name: "", 
    description: "", 
    featured: false,
    slug: "",
    color: "#ffffff",
    title_color: "#000000",
    description_color: "#64748b",
    btn_color: "#3b82f6",
    supplier_count_color: "#64748b",
    icon: "",
    icon_color: "#000000",
  })
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    tags: "",
    icon: "",
  })
  const [newSubcategory, setNewSubcategory] = useState({ name: "" })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const slugify = (value: string) => value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const mapServerData = (categories: BackendCategory[], subcategories: BackendSubcategory[]): Industry[] => {
    const groupedSubcategories = new Map<string, BackendSubcategory[]>()

    for (const sub of subcategories) {
      const parentId = sub.industry_id ?? sub.category_id
      if (parentId === undefined || parentId === null) continue
      const key = String(parentId)
      if (!groupedSubcategories.has(key)) {
        groupedSubcategories.set(key, [])
      }
      groupedSubcategories.get(key)?.push(sub)
    }

    return categories.map((category) => {
      const categoryId = String(category.id)
      const nested = category.sub_categories?.length
        ? category.sub_categories
        : category.subcategories?.length
          ? category.subcategories
          : groupedSubcategories.get(categoryId) || []

      return {
        id: categoryId,
        name: category.name || c.unnamedIndustry,
        slug: category.slug || slugify(category.name || ""),
        description: category.description || "",
        icon: category.icon,
        icon_color: category.icon_color,
        color: category.color,
        title_color: category.title_color,
        description_color: category.description_color,
        btn_color: category.btn_color,
        supplier_count_color: category.supplier_count_color,
        supplierCount: category.supplier_count || 0,
        productCount: category.product_count || 0,
        featured: Boolean(category.featured),
        categories: nested.map((sub) => ({
          id: String(sub.id),
          name: sub.name,
          slug: sub.slug || slugify(sub.name),
          description: sub.description,
          tags: sub.tags?.length ? sub.tags.join(",") : undefined,
          icon: sub.icon,
          subcategories: [],
        })),
      }
    })
  }

  const industriesQueryKey = queryKeys.adminIndustries(page, PER_PAGE, debouncedSearch)

  const industriesQuery = useQuery({
    queryKey: industriesQueryKey,
    queryFn: async () => {
      const [categoriesResult, subcategoriesResult] = await Promise.all([
        getAdminCategories({ perPage: PER_PAGE, page, search: debouncedSearch || undefined }),
        getAdminSubcategories(),
      ])

      if (!categoriesResult.success) {
        throw new Error(categoriesResult.message || c.failedToLoadCategories)
      }

      const industries = mapServerData(
        categoriesResult.data,
        subcategoriesResult.success ? subcategoriesResult.data : []
      )

      return {
        industries,
        meta: categoriesResult.meta ?? null,
        totalSubcategories: subcategoriesResult.success ? subcategoriesResult.data.length : 0,
        subcategoriesWarning: !subcategoriesResult.success
          ? subcategoriesResult.message || c.subcategoriesFailed
          : null,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const industries = industriesQuery.data?.industries ?? []
  const meta = industriesQuery.data?.meta ?? null
  const totalSubcategories = industriesQuery.data?.totalSubcategories ?? 0
  const isLoading = industriesQuery.isLoading
  const loadError =
    industriesQuery.isError
      ? industriesQuery.error instanceof Error
        ? industriesQuery.error.message
        : c.failedToLoadCategories
      : industriesQuery.data?.subcategoriesWarning ?? null

  const refreshIndustries = async () => {
    await queryClient.invalidateQueries({ queryKey: industriesQueryKey })
  }

  const filteredIndustries = industries

  // Toggle expand
  const toggleIndustry = (id: string) => {
    setExpandedIndustries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Industry CRUD
  const handleAddIndustry = () => {
    void (async () => {
      const slugUsed = (newIndustry.slug || "").trim() || slugify(newIndustry.name)
      const wantFeatured = newIndustry.featured

      const result = await createAdminCategory({
        name: newIndustry.name.trim(),
        slug: slugUsed,
        description: newIndustry.description,
        featured: false,
        color: newIndustry.color,
        title_color: newIndustry.title_color,
        description_color: newIndustry.description_color,
        btn_color: newIndustry.btn_color,
        supplier_count_color: newIndustry.supplier_count_color,
        icon: newIndustry.icon || undefined,
        icon_color: newIndustry.icon_color,
      })

      if (!result.success) {
        setErrorMessage(result.message || c.failedToCreateCategory)
        return
      }

      if (wantFeatured) {
        let categoryId: string | null = result.data
        if (!categoryId) {
          const list = await getAdminCategories({ perPage: 100 })
          if (list.success) {
            const norm = (s: string) => s.toLowerCase().trim()
            const su = norm(slugUsed)
            const row =
              list.data.find((c) => norm(c.slug || "") === su) ||
              list.data.find((c) => norm(slugify(c.name || "")) === su)
            categoryId = row ? String(row.id) : null
          }
        }
        if (categoryId) {
          const tgl = await toggleAdminCategoryFeatured(categoryId)
          if (!tgl.success) {
            setNewIndustry({
              name: "",
              description: "",
              featured: false,
              slug: "",
              color: "#ffffff",
              title_color: "#000000",
              description_color: "#64748b",
              btn_color: "#3b82f6",
              supplier_count_color: "#64748b",
              icon: "",
              icon_color: "#000000",
            })
            setShowAddIndustryDialog(false)
            await refreshIndustries()
            setErrorMessage(
              tgl.message || p.industryCreatedFeaturedFailed
            )
            return
          }
        } else {
          setNewIndustry({
            name: "",
            description: "",
            featured: false,
            slug: "",
            color: "#ffffff",
            title_color: "#000000",
            description_color: "#64748b",
            btn_color: "#3b82f6",
            supplier_count_color: "#64748b",
            icon: "",
            icon_color: "#000000",
          })
          setShowAddIndustryDialog(false)
          await refreshIndustries()
          setErrorMessage(c.industryCreatedHint)
          return
        }
      }

      setNewIndustry({
        name: "",
        description: "",
        featured: false,
        slug: "",
        color: "#ffffff",
        title_color: "#000000",
        description_color: "#64748b",
        btn_color: "#3b82f6",
        supplier_count_color: "#64748b",
        icon: "",
        icon_color: "#000000",
      })
      setShowAddIndustryDialog(false)
      await refreshIndustries()
    })()
  }

  const handleEditIndustry = () => {
    if (!currentIndustry) return
    void (async () => {
      const result = await updateAdminCategory(String(currentIndustry.id), {
        name: currentIndustry.name,
        slug: currentIndustry.slug || slugify(currentIndustry.name),
        description: currentIndustry.description,
        color: currentIndustry.color,
        title_color: currentIndustry.title_color,
        description_color: currentIndustry.description_color,
        btn_color: currentIndustry.btn_color,
        supplier_count_color: currentIndustry.supplier_count_color,
        icon: currentIndustry.icon || undefined,
        icon_color: currentIndustry.icon_color,
      })

      if (!result.success) {
        setErrorMessage(result.message || c.failedToUpdateCategory)
        return
      }

      const baseline = editIndustryFeaturedAtOpen
      if (baseline !== null && currentIndustry.featured !== baseline) {
        const tgl = await toggleAdminCategoryFeatured(String(currentIndustry.id))
        if (!tgl.success) {
          setErrorMessage(
            tgl.message || p.industrySavedFeaturedFailed
          )
          setShowEditIndustryDialog(false)
          setEditIndustryFeaturedAtOpen(null)
          await refreshIndustries()
          return
        }
      }

      setShowEditIndustryDialog(false)
      setEditIndustryFeaturedAtOpen(null)
      await refreshIndustries()
    })()
  }

  const deleteIndustry = (id: string) => {
    void (async () => {
      const result = await deleteAdminCategory(String(id))
      if (!result.success) {
        setErrorMessage(result.message || c.failedToDeleteCategory)
        return
      }
      await refreshIndustries()
    })()
  }

  const toggleFeatured = (id: string) => {
    void (async () => {
      const result = await toggleAdminCategoryFeatured(String(id))
      if (!result.success) {
        await Swal.fire({
          title: c.error,
          text: result.message || c.failedToToggleMainCategory,
          icon: "error",
          confirmButtonText: c.ok,
        })
        return
      }
      await refreshIndustries()
    })()
  }

  // Category CRUD
  const openAddCategory = (industry: Industry) => {
    setCurrentIndustry(industry)
    setNewCategory({ name: "", slug: "", description: "", tags: "", icon: "" })
    setShowAddCategoryDialog(true)
  }

  const handleAddCategory = () => {
    if (!currentIndustry) return
    void (async () => {
      const slug = (newCategory.slug || "").trim() || slugify(newCategory.name)
      const tagsCsv = newCategory.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(",")
      const result = await createAdminSubcategory({
        name: newCategory.name.trim(),
        slug,
        description: newCategory.description.trim() || undefined,
        tags: tagsCsv || undefined,
        icon: newCategory.icon.trim() || undefined,
        industry_id: String(currentIndustry.id),
      })

      if (!result.success) {
        setErrorMessage(result.message || c.failedToCreateSubcategory)
        return
      }

      setNewCategory({ name: "", slug: "", description: "", tags: "", icon: "" })
      setShowAddCategoryDialog(false)
      await refreshIndustries()
    })()
  }

  const openEditCategory = (industry: Industry, category: Category) => {
    setCurrentIndustry(industry)
    setCurrentCategory({ ...category })
    setShowEditCategoryDialog(true)
  }

  const handleEditCategory = () => {
    if (!currentIndustry || !currentCategory) return
    void (async () => {
      const tagsCsv =
        (currentCategory.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .join(",") || undefined
      const result = await updateAdminSubcategory(String(currentCategory.id), {
        name: currentCategory.name,
        slug: currentCategory.slug || slugify(currentCategory.name),
        description: currentCategory.description?.trim() || undefined,
        tags: tagsCsv,
        icon: currentCategory.icon?.trim() || undefined,
        industry_id: String(currentIndustry.id),
      })

      if (!result.success) {
        setErrorMessage(result.message || c.failedToUpdateSubcategory)
        return
      }

      setShowEditCategoryDialog(false)
      await refreshIndustries()
    })()
  }

  const deleteCategory = (industryId: string, categoryId: string) => {
    void (async () => {
      const result = await deleteAdminSubcategory(String(categoryId))
      if (!result.success) {
        setErrorMessage(result.message || c.failedToDeleteSubcategory)
        return
      }
      await refreshIndustries()
    })()
  }

  const moveCategoryUp = (industryId: string, categoryId: string) => {
    void (async () => {
      const parent = industries.find((ind) => ind.id === industryId)
      if (!parent) return
      const idx = parent.categories.findIndex((c) => c.id === categoryId)
      if (idx <= 0) return

      const result = await moveAdminSubcategoryPosition(String(categoryId), idx, idx - 1)
      if (!result.success) {
        setErrorMessage(result.message || p.failedToMoveSubcategory)
        return
      }

      await refreshIndustries()
    })()
  }

  const moveCategoryDown = (industryId: string, categoryId: string) => {
    void (async () => {
      const parent = industries.find((ind) => ind.id === industryId)
      if (!parent) return
      const idx = parent.categories.findIndex((c) => c.id === categoryId)
      if (idx < 0 || idx >= parent.categories.length - 1) return

      const result = await moveAdminSubcategoryPosition(String(categoryId), idx, idx + 1)
      if (!result.success) {
        setErrorMessage(result.message || p.failedToMoveSubcategory)
        return
      }

      await refreshIndustries()
    })()
  }

  // Subcategory CRUD
  const openAddSubcategory = (industry: Industry, category: Category) => {
    setCurrentIndustry(industry)
    setCurrentCategory(category)
    setErrorMessage(c.nestedSubcategoriesUnsupported)
  }

  const handleAddSubcategory = () => {
    setShowAddSubcategoryDialog(false)
    setErrorMessage(c.nestedSubcategoriesUnsupported)
  }

  const openEditSubcategory = (industry: Industry, category: Category, subcategory: Subcategory) => {
    setCurrentIndustry(industry)
    setCurrentCategory(category)
    setCurrentSubcategory({ ...subcategory })
    setErrorMessage(c.nestedSubcategoriesUnsupported)
  }

  const handleEditSubcategory = () => {
    setShowEditSubcategoryDialog(false)
    setErrorMessage(c.nestedSubcategoriesUnsupported)
  }

  const deleteSubcategory = (industryId: string, categoryId: string, subcategoryId: string) => {
    setErrorMessage(c.nestedSubcategoriesUnsupported)
  }

  const moveSubcategoryUp = (industryId: string, categoryId: string, subcategoryId: string) => {
    setErrorMessage(c.nestedSubcategoriesUnsupported)
  }

  const moveSubcategoryDown = (industryId: string, categoryId: string, subcategoryId: string) => {
    setErrorMessage(c.nestedSubcategoriesUnsupported)
  }

  // Open manage categories dialog
  const openManageCategories = (industry: Industry) => {
    setCurrentIndustry(industry)
    setShowManageCategoriesDialog(true)
  }

  // Stats
  const featuredCount = industries.filter(ind => ind.featured).length
  const totalCategories = meta?.total ?? industries.length
  const hasCorrectMainCategoryCount = featuredCount === 8

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {p.subtitle}
          </p>
        </div>
        <Button onClick={() => setShowAddIndustryDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {c.addIndustry}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {c.mainCategoriesLimit}
        </p>
        <Badge className={hasCorrectMainCategoryCount ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
          {c.mainCategoriesCount.replace("{count}", String(featuredCount))}
        </Badge>
      </div>

      {(errorMessage || loadError) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {errorMessage || loadError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {c.loadingCategoriesFromBackend}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <AdminStatCard
          title={p.mainCategories}
          value={totalCategories}
          icon={Layers}
          iconClassName="text-secondary"
          iconWrapperClassName="bg-secondary/10"
        />
        <AdminStatCard
          title={p.categoryRecords}
          value={totalCategories}
          icon={FolderOpen}
          iconClassName="text-blue-700"
          iconWrapperClassName="bg-blue-100"
        />
        <AdminStatCard
          title={p.subcategories}
          value={totalSubcategories}
          icon={Tag}
          iconClassName="text-emerald-700"
          iconWrapperClassName="bg-emerald-100"
        />
        <AdminStatCard
          title={p.featuredCategory}
          value={featuredCount}
          icon={Layers}
          iconClassName="text-amber-700"
          iconWrapperClassName="bg-amber-100"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={c.searchIndustriesPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Mobile Industries Cards */}
      <div className="block sm:hidden space-y-4">
        {filteredIndustries.map((industry) => (
          <div key={industry.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted overflow-hidden" style={{ backgroundColor: industry.color || undefined }}>
                    {industry.icon ? (
                      <DynamicIcon name={industry.icon} size={24} />
                    ) : (
                      <Layers className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground line-clamp-1">{industry.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{industry.description || c.noDescription}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openAddCategory(industry)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {p.addCategory}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setCurrentIndustry(industry)
                        setEditIndustryFeaturedAtOpen(industry.featured)
                        setShowEditIndustryDialog(true)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        {p.editIndustry}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFeatured(industry.id)}>
                        {industry.featured ? c.removeFromMainCategories : c.addToMainCategories}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteIndustry(industry.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {c.deleteIndustry}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-3">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{industry.supplierCount.toLocaleString()}</span>
                  <span className="text-xs">{p.tableSuppliers}</span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="font-medium text-foreground">{industry.categories.length}</span>
                  <span className="text-xs">{p.tableCategories}</span>
                </div>
                <div className="flex flex-col items-end">
                  {industry.featured ? (
                    <Badge className="bg-amber-100 text-amber-700 h-6">{p.mainCategory}</Badge>
                  ) : (
                    <span className="h-6"></span>
                  )}
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full justify-between mt-2" 
                onClick={() => toggleIndustry(industry.id)}
              >
                <span>{expandedIndustries.has(industry.id) ? "Hide Categories" : "View Categories"}</span>
                {expandedIndustries.has(industry.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Mobile Categories (Expanded) */}
            {expandedIndustries.has(industry.id) && (
              <div className="bg-muted/10 border-t border-border">
                {industry.categories.length > 0 ? (
                  industry.categories.map((category, catIdx) => (
                    <div key={category.id} className="border-b border-border/50 last:border-0">
                      <div className="p-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-100">
                              <FolderOpen className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                              <span className="font-medium text-sm text-foreground">{category.name}</span>
                              <p className="text-xs text-muted-foreground">{c.subcategoriesCount.replace("{count}", String(category.subcategories.length))}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditCategory(industry, category)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Category
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => moveCategoryUp(industry.id, category.id)} disabled={catIdx === 0}>
                                  <ChevronDown className="mr-2 h-4 w-4 rotate-180" />
                                  Move Up
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => moveCategoryDown(industry.id, category.id)} disabled={catIdx === industry.categories.length - 1}>
                                  <ChevronDown className="mr-2 h-4 w-4" />
                                  Move Down
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteCategory(industry.id, category.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {c.deleteSubcategory}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-full justify-between h-8 text-xs text-muted-foreground" 
                          onClick={() => toggleCategory(category.id)}
                        >
                          <span>{expandedCategories.has(category.id) ? "Hide subcategories" : "View subcategories"}</span>
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* Mobile Subcategories (Expanded) */}
                      {expandedCategories.has(category.id) && category.subcategories.length > 0 && (
                        <div className="bg-muted/20 px-3 py-2 space-y-1">
                          {category.subcategories.map((subcategory, subIdx) => (
                            <div key={subcategory.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 shrink-0">
                                  <Tag className="h-2.5 w-2.5 text-emerald-700" />
                                </div>
                                <span className="text-sm line-clamp-1">{subcategory.name}</span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditSubcategory(industry, category, subcategory)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {c.editSubcategory}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => moveSubcategoryUp(industry.id, category.id, subcategory.id)} disabled={subIdx === 0}>
                                    <ChevronDown className="mr-2 h-4 w-4 rotate-180" />
                                    Move Up
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => moveSubcategoryDown(industry.id, category.id, subcategory.id)} disabled={subIdx === category.subcategories.length - 1}>
                                    <ChevronDown className="mr-2 h-4 w-4" />
                                    Move Down
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => deleteSubcategory(industry.id, category.id, subcategory.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {c.deleteSubcategory}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">{p.noCategories}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openAddCategory(industry)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      {c.addFirstCategory}
                    </Button>
                  </div>
                )}
                {industry.categories.length > 0 && (
                  <div className="p-3 bg-muted/5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-muted-foreground border border-dashed border-muted-foreground/30"
                      onClick={() => openAddCategory(industry)}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      {p.addCategory}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filteredIndustries.length === 0 && !isLoading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No industries found.</p>
          </div>
        )}
        <AdminPagination
          page={page}
          meta={meta}
          itemCount={filteredIndustries.length}
          onPageChange={setPage}
          variant="card"
        />
      </div>

      {/* Desktop Industries Tree */}
      <div className="hidden sm:block rounded-xl border border-border bg-card overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="border-b border-border px-4 py-3">
          <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground">
            <div className="col-span-5">{p.tableName}</div>
            <div className="col-span-2">{p.tableCategories}</div>
            <div className="col-span-2">{p.tableSuppliers}</div>
            <div className="col-span-2">{p.tableHomepage}</div>
            <div className="col-span-1"></div>
          </div>
        </div>
        
        <div className="divide-y divide-border">
          {filteredIndustries.map((industry) => (
            <div key={industry.id}>
              {/* Industry Row */}
              <div className="grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="col-span-5 flex items-center gap-2">
                  <button 
                    onClick={() => toggleIndustry(industry.id)}
                    className="p-1 rounded hover:bg-muted"
                  >
                    {expandedIndustries.has(industry.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted overflow-hidden" style={{ backgroundColor: industry.color || undefined }}>
                    {industry.icon ? (
                      <DynamicIcon name={industry.icon} size={20} />
                    ) : (
                      <Layers className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{industry.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{industry.description || c.noDescription}</p>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {c.categoriesCount.replace("{count}", String(industry.categories.length))}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {c.suppliersCount.replace("{count}", industry.supplierCount.toLocaleString())}
                </div>
                <div className="col-span-2">
                  {industry.featured && (
                    <Badge className="bg-amber-100 text-amber-700">{p.mainCategory}</Badge>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* <DropdownMenuItem onClick={() => openManageCategories(industry)}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Manage Categories
                      </DropdownMenuItem> */}
                      <DropdownMenuItem onClick={() => openAddCategory(industry)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {p.addCategory}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setCurrentIndustry(industry)
                        setEditIndustryFeaturedAtOpen(industry.featured)
                        setShowEditIndustryDialog(true)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        {p.editIndustry}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFeatured(industry.id)}>
                        {industry.featured ? c.removeFromMainCategories : c.addToMainCategories}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteIndustry(industry.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {c.deleteIndustry}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Categories (Expanded) */}
              {expandedIndustries.has(industry.id) && industry.categories.length > 0 && (
                <div className="bg-muted/20">
                  {industry.categories.map((category, catIdx) => (
                    <div key={category.id}>
                      {/* Category Row */}
                      <div className="grid grid-cols-12 items-center px-4 py-2 pl-12 hover:bg-muted/30 transition-colors">
                        <div className="col-span-5 flex items-center gap-2">
                          <button 
                            onClick={() => toggleCategory(category.id)}
                            className="p-1 rounded hover:bg-muted"
                          >
                            {expandedCategories.has(category.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-100">
                            <FolderOpen className="h-3.5 w-3.5 text-blue-700" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{category.name}</span>
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {c.subcategoriesCount.replace("{count}", String(category.subcategories.length))}
                        </div>
                        <div className="col-span-2"></div>
                        <div className="col-span-2 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveCategoryUp(industry.id, category.id)}
                            disabled={catIdx === 0}
                          >
                            <ChevronDown className="h-3 w-3 rotate-180" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveCategoryDown(industry.id, category.id)}
                            disabled={catIdx === industry.categories.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditCategory(industry, category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {c.editSubcategory}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteCategory(industry.id, category.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {c.deleteSubcategory}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Subcategories (Expanded) */}
                      {expandedCategories.has(category.id) && category.subcategories.length > 0 && (
                        <div className="bg-muted/10">
                          {category.subcategories.map((subcategory, subIdx) => (
                            <div 
                              key={subcategory.id}
                              className="grid grid-cols-12 items-center px-4 py-1.5 pl-20 hover:bg-muted/30 transition-colors"
                            >
                              <div className="col-span-5 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100">
                                  <Tag className="h-3 w-3 text-emerald-700" />
                                </div>
                                <span className="text-sm text-foreground">{subcategory.name}</span>
                              </div>
                              <div className="col-span-2"></div>
                              <div className="col-span-2"></div>
                              <div className="col-span-2 flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveSubcategoryUp(industry.id, category.id, subcategory.id)}
                                  disabled={subIdx === 0}
                                >
                                  <ChevronDown className="h-3 w-3 rotate-180" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveSubcategoryDown(industry.id, category.id, subcategory.id)}
                                  disabled={subIdx === category.subcategories.length - 1}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditSubcategory(industry, category, subcategory)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      {c.editSubcategory}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => deleteSubcategory(industry.id, category.id, subcategory.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {c.deleteSubcategory}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Add Category Button */}
                  <div className="px-4 py-2 pl-12">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground"
                      onClick={() => openAddCategory(industry)}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      {p.addCategory}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Empty state for categories */}
              {expandedIndustries.has(industry.id) && industry.categories.length === 0 && (
                <div className="bg-muted/20 px-4 py-4 pl-12">
                  <p className="text-sm text-muted-foreground mb-2">{p.noCategories}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openAddCategory(industry)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    {c.addFirstCategory}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        </div>

        <AdminPagination
          page={page}
          meta={meta}
          itemCount={filteredIndustries.length}
          onPageChange={setPage}
          variant="footer"
        />
      </div>

      {/* Add Industry Dialog */}
      <Dialog
        open={showAddIndustryDialog}
        onOpenChange={(open) => {
          setShowAddIndustryDialog(open)
          if (open) {
            setNewIndustry({
              name: "",
              description: "",
              featured: false,
              slug: "",
              color: "#ffffff",
              title_color: "#000000",
              description_color: "#64748b",
              btn_color: "#3b82f6",
              supplier_count_color: "#64748b",
              icon: "",
              icon_color: "#000000",
            })
          }
        }}
      >
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{c.addNewIndustry}</DialogTitle>
            <DialogDescription>
              {c.createIndustryDesc}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-6 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{p.industryName}</Label>
                  <Input 
                    placeholder={p.miningPlaceholder}
                    value={newIndustry.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setNewIndustry({ 
                        ...newIndustry, 
                        name, 
                        slug: slugify(name) 
                      })
                    }}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{p.slug}</Label>
                  <Input 
                    placeholder={p.miningSlugPlaceholder}
                    value={newIndustry.slug}
                    onChange={(e) => setNewIndustry({ ...newIndustry, slug: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{p.themeColor}</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input 
                      type="color"
                      value={newIndustry.color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, color: e.target.value })}
                      className="h-10 w-12 p-1 cursor-pointer"
                    />
                    <Input 
                      value={newIndustry.color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>{p.icon}</Label>
                  <IconPicker
                    selectedIcon={newIndustry.icon}
                    onSelect={(name) => setNewIndustry({ ...newIndustry, icon: name })}
                  />
                </div>
                <div>
                  <Label>{c.iconColor}</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input 
                      type="color"
                      value={newIndustry.icon_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, icon_color: e.target.value })}
                      className="h-10 w-12 p-1 cursor-pointer"
                    />
                    <Input 
                      value={newIndustry.icon_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, icon_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">{p.titleColor}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input 
                      type="color"
                      value={newIndustry.title_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, title_color: e.target.value })}
                      className="h-8 w-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                    />
                    <Input 
                      value={newIndustry.title_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, title_color: e.target.value })}
                      className="h-8 text-xs px-2"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{p.descColor}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input 
                      type="color"
                      value={newIndustry.description_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, description_color: e.target.value })}
                      className="h-8 w-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                    />
                    <Input 
                      value={newIndustry.description_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, description_color: e.target.value })}
                      className="h-8 text-xs px-2"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{p.btnColor}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input 
                      type="color"
                      value={newIndustry.btn_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, btn_color: e.target.value })}
                      className="h-8 w-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                    />
                    <Input 
                      value={newIndustry.btn_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, btn_color: e.target.value })}
                      className="h-8 text-xs px-2"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{p.supplierColor}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input 
                      type="color"
                      value={newIndustry.supplier_count_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, supplier_count_color: e.target.value })}
                      className="h-8 w-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                    />
                    <Input 
                      value={newIndustry.supplier_count_color}
                      onChange={(e) => setNewIndustry({ ...newIndustry, supplier_count_color: e.target.value })}
                      className="h-8 text-xs px-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>{c.description}</Label>
                <Textarea 
                  placeholder={p.describeIndustryPlaceholder}
                  value={newIndustry.description}
                  onChange={(e) => setNewIndustry({ ...newIndustry, description: e.target.value })}
                  className="mt-2 h-20"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-base">{p.featured}</Label>
                  <p className="text-xs text-muted-foreground">{p.showOnHomepage}</p>
                  {featuredCount >= 8 && (
                    <p className="text-xs text-amber-700 mt-1">{p.featuredHomepageLimit}</p>
                  )}
                </div>
                <Switch
                  checked={newIndustry.featured}
                  disabled={featuredCount >= 8}
                  onCheckedChange={(checked) => setNewIndustry({ ...newIndustry, featured: checked })}
                />
              </div>

              {/* Preview Section */}
              <div className="rounded-xl bg-muted/30 p-4 border border-border">
                <Label className="mb-3 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">{p.cardPreview}</Label>
                <div className="flex justify-center">
                  <div 
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 w-full max-w-[320px]"
                    style={{ backgroundColor: newIndustry.color }}
                  >
                    <div className="relative p-6">
                      {/* Icon */}
                      <div 
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-md"
                      >
                        {newIndustry.icon ? (
                          <DynamicIcon name={newIndustry.icon} size={32} color={newIndustry.icon_color} />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Industry Name */}
                      <h3 
                        className="mt-5 text-xl font-semibold transition-colors truncate"
                        style={{ color: newIndustry.title_color }}
                      >
                        {newIndustry.name || p.industryNamePlaceholder}
                      </h3>

                      {/* Description */}
                      <p 
                        className="mt-2 text-sm line-clamp-2"
                        style={{ color: newIndustry.description_color }}
                      >
                        {newIndustry.description || p.exploreSectorDefault}
                      </p>

                      {/* Stats */}
                      <div className="mt-5 flex items-center gap-4 text-sm" style={{ color: newIndustry.supplier_count_color }}>
                        <div className="flex items-center gap-1">
                          <Factory className="h-4 w-4" />
                          <span className="font-semibold">0</span>
                          <span>{p.suppliers}</span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div 
                        className="mt-5 flex items-center text-sm font-medium"
                        style={{ color: newIndustry.btn_color }}
                      >
                        <span>{p.explore}</span>
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 border-t border-border bg-muted/10">
            <Button variant="outline" onClick={() => setShowAddIndustryDialog(false)}>{c.cancel}</Button>
            <Button onClick={handleAddIndustry} disabled={!newIndustry.name}>{c.addIndustry}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Industry Dialog */}
      <Dialog
        open={showEditIndustryDialog}
        onOpenChange={(open) => {
          setShowEditIndustryDialog(open)
          if (!open) setEditIndustryFeaturedAtOpen(null)
        }}
      >
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{p.editIndustry}</DialogTitle>
            <DialogDescription>
              {c.updateIndustryDesc}
            </DialogDescription>
          </DialogHeader>
          
          {currentIndustry && (
            <div className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-6 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{p.industryName}</Label>
                    <Input 
                      value={currentIndustry.name}
                      onChange={(e) => setCurrentIndustry({ ...currentIndustry, name: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>{p.slug}</Label>
                    <Input 
                      value={currentIndustry.slug}
                      onChange={(e) => setCurrentIndustry({ ...currentIndustry, slug: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{p.themeColor}</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input 
                        type="color"
                        value={currentIndustry.color || "#ffffff"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, color: e.target.value })}
                        className="h-10 w-12 p-1 cursor-pointer"
                      />
                      <Input 
                        value={currentIndustry.color || "#ffffff"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{p.icon}</Label>
                    <IconPicker
                      selectedIcon={currentIndustry.icon}
                      onSelect={(name) => setCurrentIndustry({ ...currentIndustry, icon: name })}
                    />
                  </div>
                  <div>
                    <Label>{c.iconColor}</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input 
                        type="color"
                        value={currentIndustry.icon_color || "#000000"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, icon_color: e.target.value })}
                        className="h-10 w-12 p-1 cursor-pointer"
                      />
                      <Input 
                        value={currentIndustry.icon_color || "#000000"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, icon_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">{p.titleColor}</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input 
                        type="color"
                        value={currentIndustry.title_color || "#000000"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, title_color: e.target.value })}
                        className="h-8 w-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                      />
                      <Input 
                        value={currentIndustry.title_color || "#000000"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, title_color: e.target.value })}
                        className="h-8 text-xs px-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{p.descColor}</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input 
                        type="color"
                        value={currentIndustry.description_color || "#64748b"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, description_color: e.target.value })}
                        className="h-8 w-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                      />
                      <Input 
                        value={currentIndustry.description_color || "#64748b"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, description_color: e.target.value })}
                        className="h-8 text-xs px-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{p.btnColor}</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input 
                        type="color"
                        value={currentIndustry.btn_color || "#3b82f6"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, btn_color: e.target.value })}
                        className="h-8 w-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                      />
                      <Input 
                        value={currentIndustry.btn_color || "#3b82f6"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, btn_color: e.target.value })}
                        className="h-8 text-xs px-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{p.supplierColor}</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input 
                        type="color"
                        value={currentIndustry.supplier_count_color || "#64748b"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, supplier_count_color: e.target.value })}
                        className="h-8 w-8 p-0 border-none cursor-pointer rounded-full overflow-hidden"
                      />
                      <Input 
                        value={currentIndustry.supplier_count_color || "#64748b"}
                        onChange={(e) => setCurrentIndustry({ ...currentIndustry, supplier_count_color: e.target.value })}
                        className="h-8 text-xs px-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>{c.description}</Label>
                  <Textarea 
                    value={currentIndustry.description}
                    onChange={(e) => setCurrentIndustry({ ...currentIndustry, description: e.target.value })}
                    className="mt-2 h-20"
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label className="text-base">{p.featured}</Label>
                    <p className="text-xs text-muted-foreground">{p.showOnHomepage}</p>
                  </div>
                  <Switch 
                    checked={currentIndustry.featured}
                    onCheckedChange={(checked) => setCurrentIndustry({ ...currentIndustry, featured: checked })}
                  />
                </div>

                {/* Preview Section */}
                <div className="rounded-xl bg-muted/30 p-4 border border-border">
                  <Label className="mb-3 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">{p.cardPreview}</Label>
                  <div className="flex justify-center">
                    <div 
                      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 w-full max-w-[320px]"
                      style={{ backgroundColor: currentIndustry.color || "#ffffff" }}
                    >
                      <div className="relative p-6">
                        {/* Icon */}
                        <div 
                          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-md"
                        >
                          {currentIndustry.icon ? (
                            <DynamicIcon name={currentIndustry.icon} size={32} color={currentIndustry.icon_color} />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>

                        {/* Industry Name */}
                        <h3 
                          className="mt-5 text-xl font-semibold transition-colors truncate"
                          style={{ color: currentIndustry.title_color || "#000000" }}
                        >
                          {currentIndustry.name}
                        </h3>

                        {/* Description */}
                        <p 
                          className="mt-2 text-sm line-clamp-2"
                          style={{ color: currentIndustry.description_color || "#64748b" }}
                        >
                          {currentIndustry.description || p.exploreSectorDefault}
                        </p>

                        {/* Stats */}
                        <div className="mt-5 flex items-center gap-4 text-sm" style={{ color: currentIndustry.supplier_count_color || "#64748b" }}>
                          <div className="flex items-center gap-1">
                            <Factory className="h-4 w-4" />
                            <span className="font-semibold">{currentIndustry.supplierCount.toLocaleString()}</span>
                            <span>{p.suppliers}</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div 
                          className="mt-5 flex items-center text-sm font-medium"
                          style={{ color: currentIndustry.btn_color || "#3b82f6" }}
                        >
                          <span>{p.explore}</span>
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-6 pt-2 border-t border-border bg-muted/10">
            <Button variant="outline" onClick={() => setShowEditIndustryDialog(false)}>{c.cancel}</Button>
            <Button onClick={handleEditIndustry}>{c.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.addCategory}</DialogTitle>
            <DialogDescription>
              {c.addCategoryTo.replace("{name}", currentIndustry?.name ?? "")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>{c.categoryName}</Label>
                <Input
                  placeholder={p.categoryNamePlaceholder}
                  value={newCategory.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setNewCategory({
                      ...newCategory,
                      name,
                      slug: slugify(name),
                    })
                  }}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{p.slug}</Label>
                <Input
                  placeholder={p.categorySlugPlaceholder}
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
            {/* <div>
              <Label>Icon</Label>
              <Input
                placeholder="e.g., Package or red (sent as text to API)"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional text value for the API `icon` field (same as Postman form-data).
              </p>
            </div> */}
              <div>
                <Label>{c.description}</Label>
                <Textarea
                  placeholder={p.describeCategoryPlaceholder}
                  value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="mt-2 h-20"
              />
            </div>
            <div>
              <Label>{p.tags}</Label>
              <Input
                placeholder={p.tagsPlaceholder}
                value={newCategory.tags}
                onChange={(e) => setNewCategory({ ...newCategory, tags: e.target.value })}
                className="mt-2"
              />
              {/* <p className="text-xs text-muted-foreground mt-1">Comma-separated (stored as one form field, same as Postman).</p> */}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>{c.cancel}</Button>
            <Button onClick={handleAddCategory} disabled={!newCategory.name.trim()}>{p.addCategory}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.editCategoryIndustry}</DialogTitle>
            <DialogDescription>
              {c.updateCategoryDesc}
            </DialogDescription>
          </DialogHeader>
          {currentCategory && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>{c.categoryName}</Label>
                  <Input
                    value={currentCategory.name}
                    onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{p.slug}</Label>
                  <Input
                    value={currentCategory.slug}
                    onChange={(e) => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              {/* <div>
                <Label>Icon</Label>
                <Input
                  placeholder="Optional"
                  value={currentCategory.icon || ""}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, icon: e.target.value })}
                  className="mt-2"
                />
              </div> */}
              <div>
                <Label>{c.description}</Label>
                <Textarea
                  placeholder={p.describeCategoryPlaceholder}
                  value={currentCategory.description || ""}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                  className="mt-2 h-20"
                />
              </div>
              <div>
                <Label>{p.tags}</Label>
                <Input
                  placeholder={p.tagsPlaceholder}
                  value={currentCategory.tags || ""}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, tags: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">{c.tagsCommaSeparated}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCategoryDialog(false)}>{c.cancel}</Button>
            <Button onClick={handleEditCategory}>{c.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Dialog */}
      <Dialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.addSubcategory}</DialogTitle>
            <DialogDescription>
              {p.addSubcategoryTo.replace("{name}", currentCategory?.name ?? "")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{p.subcategoryName}</Label>
              <Input 
                placeholder={p.subcategoryNamePlaceholder}
                value={newSubcategory.name}
                onChange={(e) => setNewSubcategory({ name: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSubcategoryDialog(false)}>{c.cancel}</Button>
            <Button onClick={handleAddSubcategory} disabled={!newSubcategory.name}>{c.addSubcategory}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={showEditSubcategoryDialog} onOpenChange={setShowEditSubcategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.editSubcategoryTitle}</DialogTitle>
            <DialogDescription>
              {p.updateSubcategoryDesc}
            </DialogDescription>
          </DialogHeader>
          {currentSubcategory && (
            <div className="space-y-4">
              <div>
                <Label>{p.subcategoryName}</Label>
                <Input 
                  value={currentSubcategory.name}
                  onChange={(e) => setCurrentSubcategory({ ...currentSubcategory, name: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSubcategoryDialog(false)}>{c.cancel}</Button>
            <Button onClick={handleEditSubcategory}>{c.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog (Full View) */}
      <Dialog open={showManageCategoriesDialog} onOpenChange={setShowManageCategoriesDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {c.manageCategoriesTitle.replace("{name}", currentIndustry?.name ?? "")}
            </DialogTitle>
            <DialogDescription>
              {c.manageCategoriesDesc}
            </DialogDescription>
          </DialogHeader>
          
          {currentIndustry && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => {
                  setShowManageCategoriesDialog(false)
                  openAddCategory(currentIndustry)
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  {p.addCategory}
                </Button>
              </div>
              
              <ScrollArea className="h-100 rounded-lg border border-border">
                {industries.find(i => i.id === currentIndustry.id)?.categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">{p.noCategories}</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowManageCategoriesDialog(false)
                        openAddCategory(currentIndustry)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {c.addFirstCategory}
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {industries.find(i => i.id === currentIndustry.id)?.categories.map((category, catIdx, catArr) => (
                      <div key={category.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                              <FolderOpen className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{category.name}</p>
                              <p className="text-xs text-muted-foreground">{c.subcategoriesCount.replace("{count}", String(category.subcategories.length))}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveCategoryUp(currentIndustry.id, category.id)}
                              disabled={catIdx === 0}
                            >
                              <ChevronDown className="h-4 w-4 rotate-180" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveCategoryDown(currentIndustry.id, category.id)}
                              disabled={catIdx === catArr.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setShowManageCategoriesDialog(false)
                                openEditCategory(currentIndustry, category)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteCategory(currentIndustry.id, category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Subcategories */}
                        <div className="mt-3 ml-11 space-y-2">
                          {category.subcategories.map((sub, subIdx, subArr) => (
                            <div 
                              key={sub.id}
                              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3 text-emerald-600" />
                                <span className="text-sm">{sub.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveSubcategoryUp(currentIndustry.id, category.id, sub.id)}
                                  disabled={subIdx === 0}
                                >
                                  <ChevronDown className="h-3 w-3 rotate-180" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveSubcategoryDown(currentIndustry.id, category.id, sub.id)}
                                  disabled={subIdx === subArr.length - 1}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setShowManageCategoriesDialog(false)
                                    openEditSubcategory(currentIndustry, category, sub)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => deleteSubcategory(currentIndustry.id, category.id, sub.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-muted-foreground"
                            onClick={() => {
                              setShowManageCategoriesDialog(false)
                              openAddSubcategory(currentIndustry, category)
                            }}
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            {c.addSubcategory}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowManageCategoriesDialog(false)}>{p.done}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
