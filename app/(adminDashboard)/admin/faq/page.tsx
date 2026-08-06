"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { 
  HelpCircle, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  GripVertical,
  FolderPlus,
  MessageSquareText,
  Save
} from "lucide-react"
import {
  createAdminFaq,
  createAdminFaqCategory,
  deleteAdminFaq,
  deleteAdminFaqCategory,
  getAdminFaqCategories,
  moveAdminFaqCategoryPosition,
  moveAdminFaqPosition,
  updateAdminFaq,
  updateAdminFaqCategory,
} from "@/lib/api/admin-faqs"
import type { AdminFaqCategory } from "@/lib/api/admin-faqs"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"
import Swal from "sweetalert2"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function SortableItem(props: { id: string; children: (props: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: "relative" as const,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {props.children({ attributes, listeners })}
    </div>
  )
}

interface FAQ {
  id: string
  question: string
  answer: string
  sort: number
}

interface FAQCategory {
  id: string
  name: string
  slug: string
  sort: number
  faqs: FAQ[]
}

function toPosition(value: unknown, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback
}

interface DeleteTarget {
  type: "category" | "faq"
  id: string
  categoryId?: string
}

function createSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  if (normalized.length > 0) {
    return normalized
  }

  return `category-${Date.now()}`
}

function showSuccessAlert(c: { success: string; ok: string }, message: string) {
  void Swal.fire({
    icon: "success",
    title: c.success,
    text: message,
    confirmButtonText: c.ok,
    confirmButtonColor: "#3d2e1f",
  })
}

function showErrorAlert(c: { ok: string }, oopsTitle: string, message: string) {
  void Swal.fire({
    icon: "error",
    title: oopsTitle,
    text: message,
    confirmButtonText: c.ok,
    confirmButtonColor: "#3d2e1f",
  })
}

function normalizeFaqCategories(data: AdminFaqCategory[], noneLabel: string): FAQCategory[] {
  return data
    .map((category, index) => ({ ...category, tempOrder: index }))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.tempOrder - b.tempOrder)
    .map((category, categoryIndex) => ({
      id: String(category.id),
      name: (category.name || "").trim().length > 0 ? category.name : noneLabel,
      slug: category.slug,
      sort: Number.isFinite(category.sort) ? category.sort : categoryIndex,
      faqs: (category.faqs || [])
        .map((faq, faqIndex) => ({ ...faq, tempOrder: faqIndex }))
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.tempOrder - b.tempOrder)
        .map((faq, faqIndex) => ({
          id: String(faq.id),
          question: (faq.question || "").trim().length > 0 ? faq.question : noneLabel,
          answer: (faq.answer || "").trim().length > 0 ? faq.answer : noneLabel,
          sort: Number.isFinite(faq.sort) ? faq.sort : faqIndex,
        })),
    }))
}

export default function AdminFaqPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.faq
  const c = t.admin.common
  const queryClient = useQueryClient()
  const faqQueryKey = queryKeys.adminFaqCategories()

  const faqQuery = useQuery({
    queryKey: faqQueryKey,
    queryFn: async () => {
      const response = await getAdminFaqCategories()
      if (!response.success) {
        throw new Error(response.message || p.failedFetchCategories)
      }
      return normalizeFaqCategories(response.data, c.none)
    },
  })

  useEffect(() => {
    if (faqQuery.isError) {
      showErrorAlert(
        c,
        p.oops,
        faqQuery.error instanceof Error ? faqQuery.error.message : p.failedFetchCategories
      )
    }
  }, [faqQuery.isError, faqQuery.error, c, p.failedFetchCategories, p.oops])

  const categories = faqQuery.data ?? []
  const isLoading = faqQuery.isLoading

  const patchFaqCategories = (updater: (prev: FAQCategory[]) => FAQCategory[]) => {
    queryClient.setQueryData(faqQueryKey, updater)
  }

  const refreshFaqCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: faqQueryKey })
  }

  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  
  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null)
  const [categoryTitle, setCategoryTitle] = useState("")
  
  // FAQ dialog state
  const [faqDialogOpen, setFaqDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [faqQuestion, setFaqQuestion] = useState("")
  const [faqAnswer, setFaqAnswer] = useState("")
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<DeleteTarget | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Calculate totals
  const totalCategories = categories.length
  const totalFaqs = categories.reduce((sum, cat) => sum + cat.faqs.length, 0)

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Category CRUD
  const openCategoryDialog = (category?: FAQCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryTitle(category.name)
    } else {
      setEditingCategory(null)
      setCategoryTitle("")
    }
    setCategoryDialogOpen(true)
  }

  const saveCategory = async () => {
    if (isSaving) {
      return
    }

    if (!categoryTitle.trim()) {
      showErrorAlert(c, p.oops, c.enterCategoryTitle)
      return
    }

    const trimmedTitle = categoryTitle.trim()

    setIsSaving(true)
    try {
      const response = editingCategory 
        ? await updateAdminFaqCategory(editingCategory.id, {
            name: trimmedTitle,
            slug: editingCategory.slug,
            sort: Number.isFinite(editingCategory.sort)
              ? editingCategory.sort
              : Math.max(0, categories.findIndex((cat) => cat.id === editingCategory.id)),
          })
        : await createAdminFaqCategory({
            name: trimmedTitle,
            slug: createSlug(trimmedTitle),
          })

      if (!response.success) {
        showErrorAlert(c, p.oops, response.message || p.failedSaveCategory)
        return
      }

      await refreshFaqCategories()
      showSuccessAlert(c, response.message || (editingCategory ? p.categoryUpdated : p.categoryAdded))
      setCategoryDialogOpen(false)
      setCategoryTitle("")
      setEditingCategory(null)
    } finally {
      setIsSaving(false)
    }
  }

  // FAQ CRUD
  const openFaqDialog = (categoryId: string, faq?: FAQ) => {
    setSelectedCategoryId(categoryId)
    if (faq) {
      setEditingFaq(faq)
      setFaqQuestion(faq.question)
      setFaqAnswer(faq.answer)
    } else {
      setEditingFaq(null)
      setFaqQuestion("")
      setFaqAnswer("")
    }
    setFaqDialogOpen(true)
  }

  const saveFaq = async () => {
    if (isSaving) {
      return
    }

    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      showErrorAlert(c, p.oops, c.fillQuestionAnswer)
      return
    }

    if (!selectedCategoryId) {
      showErrorAlert(c, p.oops, c.selectCategory)
      return
    }

    const trimmedQuestion = faqQuestion.trim()
    const trimmedAnswer = faqAnswer.trim()

    setIsSaving(true)
    try {
      const response = editingFaq
        ? await updateAdminFaq(editingFaq.id, {
            question: trimmedQuestion,
            answer: trimmedAnswer,
            faqCategoryId: selectedCategoryId,
          })
        : await createAdminFaq({
            question: trimmedQuestion,
            answer: trimmedAnswer,
            faqCategoryId: selectedCategoryId,
          })

      if (!response.success) {
        showErrorAlert(c, p.oops, response.message || p.failedSaveFaq)
        return
      }

      await refreshFaqCategories()
      showSuccessAlert(c, response.message || (editingFaq ? p.faqUpdated : p.faqAdded))
      setFaqDialogOpen(false)
      setFaqQuestion("")
      setFaqAnswer("")
      setEditingFaq(null)
      setExpandedCategories((prev) => (prev.includes(selectedCategoryId) ? prev : [...prev, selectedCategoryId]))
    } finally {
      setIsSaving(false)
    }
  }

  // Delete handlers
  const openDeleteDialog = (type: "category" | "faq", id: string, categoryId?: string) => {
    setItemToDelete({ type, id, categoryId })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete || isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      const response = itemToDelete.type === "category"
        ? await deleteAdminFaqCategory(itemToDelete.id)
        : await deleteAdminFaq(itemToDelete.id)

      if (!response.success) {
        showErrorAlert(c, p.oops, response.message || p.failedDeleteItem)
        return
      }

      await refreshFaqCategories()
      showSuccessAlert(c, response.message || (itemToDelete.type === "category" ? p.categoryDeleted : p.faqDeleted))
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Reorder categories
  const moveCategoryUp = async (categoryId: string) => {
    if (isReordering) return

    const index = categories.findIndex((c) => String(c.id) === String(categoryId))
    if (index <= 0) return

    const category = categories[index]
    const newIndex = index - 1
    const targetCategory = categories[newIndex]
    const currentPosition = toPosition(category.sort, index)
    const newPosition = toPosition(targetCategory?.sort, newIndex)

    patchFaqCategories((prev) => arrayMove(prev, index, newIndex))
    setIsReordering(true)
    try {
      const response = await moveAdminFaqCategoryPosition(category.id, currentPosition, newPosition)
      if (!response.success) {
        showErrorAlert(c, p.oops, response.message || p.failedReorderCategory)
      }
      await refreshFaqCategories()
    } finally {
      setIsReordering(false)
    }
  }


  const moveCategoryDown = async (categoryId: string) => {
    if (isReordering) return

    const index = categories.findIndex((c) => String(c.id) === String(categoryId))
    if (index === -1 || index === categories.length - 1) return

    const category = categories[index]
    const newIndex = index + 1
    const targetCategory = categories[newIndex]
    const currentPosition = toPosition(category.sort, index)
    const newPosition = toPosition(targetCategory?.sort, newIndex)

    patchFaqCategories((prev) => arrayMove(prev, index, newIndex))
    setIsReordering(true)
    try {
      const response = await moveAdminFaqCategoryPosition(category.id, currentPosition, newPosition)
      if (!response.success) {
        showErrorAlert(c, p.oops, response.message || p.failedReorderCategory)
      }
      await refreshFaqCategories()
    } finally {
      setIsReordering(false)
    }
  }

  // Reorder FAQs
  const moveFaqUp = async (categoryId: string, faqId: string) => {
    if (isReordering) return

    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) return

    const faqIndex = category.faqs.findIndex((f) => String(f.id) === String(faqId))
    if (faqIndex <= 0) return

    const faq = category.faqs[faqIndex]
    const newIndex = faqIndex - 1
    const targetFaq = category.faqs[newIndex]
    const currentPosition = toPosition(faq.sort, faqIndex)
    const newPosition = toPosition(targetFaq?.sort, newIndex)
    const faqCategoryId = toPosition(categoryId, Number(categoryId))

    patchFaqCategories((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          return { ...c, faqs: arrayMove(c.faqs, faqIndex, newIndex) }
        }
        return c
      })
    )

    setIsReordering(true)
    try {
      const response = await moveAdminFaqPosition(faq.id, currentPosition, newPosition, faqCategoryId)
      if (!response.success) {
        showErrorAlert(c, p.oops, response.message || p.failedReorderFaq)
      }
      await refreshFaqCategories()
    } finally {
      setIsReordering(false)
    }
  }

  const moveFaqDown = async (categoryId: string, faqId: string) => {
    if (isReordering) return

    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) return

    const faqIndex = category.faqs.findIndex((f) => String(f.id) === String(faqId))
    if (faqIndex === -1 || faqIndex === category.faqs.length - 1) return

    const faq = category.faqs[faqIndex]
    const newIndex = faqIndex + 1
    const targetFaq = category.faqs[newIndex]
    const currentPosition = toPosition(faq.sort, faqIndex)
    const newPosition = toPosition(targetFaq?.sort, newIndex)
    const faqCategoryId = toPosition(categoryId, Number(categoryId))

    patchFaqCategories((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          return { ...c, faqs: arrayMove(c.faqs, faqIndex, newIndex) }
        }
        return c
      })
    )

    setIsReordering(true)
    try {
      const response = await moveAdminFaqPosition(faq.id, currentPosition, newPosition, faqCategoryId)
      if (!response.success) {
        showErrorAlert(c, p.oops, response.message || p.failedReorderFaq)
      }
      await refreshFaqCategories()
    } finally {
      setIsReordering(false)
    }
  }

  const handleDragEndCategory = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const activeCategory = categories[oldIndex]
      const targetCategory = categories[newIndex]
      const currentPosition = Number.isFinite(activeCategory?.sort) ? activeCategory.sort : oldIndex
      const newPosition = Number.isFinite(targetCategory?.sort) ? targetCategory.sort : newIndex

      patchFaqCategories((items) => arrayMove(items, oldIndex, newIndex))
      setIsReordering(true)
      try {
        const response = await moveAdminFaqCategoryPosition(String(active.id), currentPosition, newPosition)
        if (!response.success) {
          showErrorAlert(c, p.oops, response.message || p.failedReorderCategory)
        }
        await refreshFaqCategories()
      } finally {
        setIsReordering(false)
      }
    }
  }

  const handleDragEndFaq = async (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    const oldIndex = category.faqs.findIndex((f) => f.id === active.id)
    const newIndex = category.faqs.findIndex((f) => f.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const activeFaq = category.faqs[oldIndex]
      const targetFaq = category.faqs[newIndex]
      const currentPosition = toPosition(activeFaq?.sort, oldIndex)
      const newPosition = toPosition(targetFaq?.sort, newIndex)
      const faqCategoryId = toPosition(categoryId, Number(categoryId))

      patchFaqCategories((prev) =>
        prev.map((c) => {
          if (c.id === categoryId) {
            return {
              ...c,
              faqs: arrayMove(c.faqs, oldIndex, newIndex),
            }
          }
          return c
        })
      )

      setIsReordering(true)
      try {
        const response = await moveAdminFaqPosition(String(active.id), currentPosition, newPosition, faqCategoryId)
        if (!response.success) {
          showErrorAlert(c, p.oops, response.message || p.failedReorderFaq)
        }
        await refreshFaqCategories()
      } finally {
        setIsReordering(false)
      }
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.subtitle}
          </p>
        </div>
        <Button
          onClick={() => openCategoryDialog()}
          className="gap-2"
          disabled={isLoading || isSaving || isReordering || isDeleting}
        >
          <FolderPlus className="h-4 w-4" />
          {c.addCategoryBtn}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          title={p.totalCategories}
          value={totalCategories}
          icon={FolderPlus}
          iconClassName="text-muted-foreground"
          iconWrapperClassName="bg-transparent h-auto w-auto"
          layout="spaceBetween"
          contentClassName="p-6"
        />
        <AdminStatCard
          title={p.totalQuestions}
          value={totalFaqs}
          icon={HelpCircle}
          iconClassName="text-muted-foreground"
          iconWrapperClassName="bg-transparent h-auto w-auto"
          layout="spaceBetween"
          contentClassName="p-6"
        />
        <AdminStatCard
          title={p.avgQuestions}
          value={totalCategories > 0 ? (totalFaqs / totalCategories).toFixed(1) : 0}
          icon={MessageSquareText}
          iconClassName="text-muted-foreground"
          iconWrapperClassName="bg-transparent h-auto w-auto"
          layout="spaceBetween"
          contentClassName="p-6"
        />
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>{p.faqCategories}</CardTitle>
          <CardDescription>
            {p.categoriesDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{p.loadingCategories}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{p.noCategories}</p>
              <Button
                onClick={() => openCategoryDialog()}
                className="mt-4 gap-2"
                disabled={isSaving || isReordering || isDeleting}
              >
                <Plus className="h-4 w-4" />
                {c.addYourFirstCategory}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCategory}>
                <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {categories.map((category, categoryIndex) => (
                    <SortableItem key={category.id} id={category.id}>
                      {({ attributes, listeners }) => (
                        <div className="rounded-lg border border-border">
                          {/* Category Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/50 p-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div {...attributes} {...listeners} className="cursor-move shrink-0">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>

                              <button onClick={() => toggleCategory(category.id)} className="flex-1 flex items-center gap-2 text-left min-w-0">
                                <ChevronDown
                                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                    expandedCategories.includes(category.id) ? "rotate-180" : ""
                                  }`}
                                />
                                <span className="font-medium text-foreground truncate">{category.name}</span>
                                <Badge variant="secondary" className="ml-2 shrink-0">
                                  {category.faqs.length === 1
                                    ? c.questionsCount.replace("{count}", String(category.faqs.length))
                                    : c.questionsCountPlural.replace("{count}", String(category.faqs.length))}
                                </Badge>
                              </button>
                            </div>

                            <div className="flex items-center justify-end sm:justify-start gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveCategoryUp(category.id)}
                                disabled={categoryIndex === 0 || isReordering || isSaving || isDeleting}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveCategoryDown(category.id)}
                                disabled={categoryIndex === categories.length - 1 || isReordering || isSaving || isDeleting}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openCategoryDialog(category)}
                                disabled={isSaving || isReordering || isDeleting}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => openDeleteDialog("category", category.id)}
                                disabled={isSaving || isReordering || isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Category Content (FAQs) */}
                          {expandedCategories.includes(category.id) && (
                            <div className="border-t border-border p-4">
                              {category.faqs.length === 0 ? (
                                <div className="py-8 text-center">
                                  <p className="text-sm text-muted-foreground">{p.noQuestions}</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 gap-2"
                                    onClick={() => openFaqDialog(category.id)}
                                    disabled={isSaving || isReordering || isDeleting}
                                  >
                                    <Plus className="h-4 w-4" />
                                    {c.addQuestion}
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(e) => handleDragEndFaq(e, category.id)}
                                  >
                                    <SortableContext items={category.faqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                                      {category.faqs.map((faq, faqIndex) => (
                                        <SortableItem key={faq.id} id={faq.id}>
                                          {({ attributes, listeners }) => (
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-lg border border-border bg-background p-4">
                                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div {...attributes} {...listeners} className="cursor-move mt-1 shrink-0">
                                                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-foreground wrap-break-word">{faq.question}</p>
                                                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                                                </div>
                                              </div>

                                              <div className="flex items-center justify-end sm:justify-start gap-1 shrink-0 mt-2 sm:mt-0">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => moveFaqUp(category.id, faq.id)}
                                                  disabled={faqIndex === 0 || isReordering || isSaving || isDeleting}
                                                >
                                                  <ChevronUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => moveFaqDown(category.id, faq.id)}
                                                  disabled={faqIndex === category.faqs.length - 1 || isReordering || isSaving || isDeleting}
                                                >
                                                  <ChevronDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() => openFaqDialog(category.id, faq)}
                                                  disabled={isSaving || isReordering || isDeleting}
                                                >
                                                  <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                                  onClick={() => openDeleteDialog("faq", faq.id, category.id)}
                                                  disabled={isSaving || isReordering || isDeleting}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </SortableItem>
                                      ))}
                                    </SortableContext>
                                  </DndContext>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 gap-2"
                                    onClick={() => openFaqDialog(category.id)}
                                    disabled={isSaving || isReordering || isDeleting}
                                  >
                                    <Plus className="h-4 w-4" />
                                    {c.addQuestion}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? c.editCategory : c.addCategoryTitle}</DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? p.updateCategoryName 
                : p.createCategoryDesc
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-title">{c.categoryTitle}</Label>
              <Input
                id="category-title"
                value={categoryTitle}
                onChange={(e) => setCategoryTitle(e.target.value)}
                placeholder={c.categoryTitlePlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              {c.cancel}
            </Button>
            <Button onClick={() => void saveCategory()} className="gap-2" disabled={isSaving}>
              <Save className="h-4 w-4" />
              {editingCategory ? c.saveChanges : c.addCategoryTitle}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFaq ? c.editQuestion : c.addQuestionTitle}</DialogTitle>
            <DialogDescription>
              {editingFaq 
                ? c.editQuestionDesc 
                : p.addFaqToCategory
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="faq-question">{c.question}</Label>
              <Input
                id="faq-question"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder={p.questionPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-answer">{c.answer}</Label>
              <Textarea
                id="faq-answer"
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder={p.answerPlaceholder}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqDialogOpen(false)}>
              {c.cancel}
            </Button>
            <Button onClick={() => void saveFaq()} className="gap-2" disabled={isSaving}>
              <Save className="h-4 w-4" />
              {editingFaq ? c.saveChanges : c.addQuestionTitle}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{c.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "category" 
                ? p.deleteCategoryDesc
                : p.deleteFaqDesc
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => void confirmDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {c.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
