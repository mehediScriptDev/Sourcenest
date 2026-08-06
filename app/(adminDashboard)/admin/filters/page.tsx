"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Switch } from "@/components/ui/switch"
import {
  createAdminQuickFilterOption,
  deleteAdminQuickFilterOption,
  getAdminQuickFilterCounts,
  getAdminQuickFilterOptions,
  getAdminQuickFilterTypes,
  sortAdminQuickFilterOption,
  toggleAdminQuickFilterOption,
  type AdminQuickFilterCounts,
  type AdminQuickFilterOption,
  type AdminQuickFilterType,
  updateAdminQuickFilterOption,
} from "@/lib/api/admin-quick-filters"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"
import Swal from "sweetalert2"
import { 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  GripVertical,
  Globe,
  Award,
  Package,
  MapPin,
  Filter,
  ArrowUp,
  ArrowDown
} from "lucide-react"

interface FilterItem {
  id: string
  value: string
  label: string
  enabled: boolean
  order: number
}

interface FilterCategory {
  id: string
  name: string
  slug: string
  icon: React.ElementType
  description: string
  items: FilterItem[]
}

const categoryIconByType: Record<string, React.ElementType> = {
  countries: Globe,
  certifications: Award,
  moq_ranges: Package,
  export_markets: MapPin,
}

// Initial filter data
const initialFilters: FilterCategory[] = [
  {
    id: "countries",
    name: "Countries",
    slug: "countries",
    icon: Globe,
    description: "Filter suppliers by manufacturing country",
    items: [
      { id: "cn", value: "china", label: "China", enabled: true, order: 1 },
      { id: "in", value: "india", label: "India", enabled: true, order: 2 },
      { id: "vn", value: "vietnam", label: "Vietnam", enabled: true, order: 3 },
      { id: "tr", value: "turkey", label: "Turkey", enabled: true, order: 4 },
      { id: "de", value: "germany", label: "Germany", enabled: true, order: 5 },
      { id: "us", value: "usa", label: "United States", enabled: true, order: 6 },
      { id: "mx", value: "mexico", label: "Mexico", enabled: true, order: 7 },
      { id: "th", value: "thailand", label: "Thailand", enabled: true, order: 8 },
      { id: "id", value: "indonesia", label: "Indonesia", enabled: true, order: 9 },
      { id: "bd", value: "bangladesh", label: "Bangladesh", enabled: true, order: 10 },
    ]
  },
  {
    id: "certifications",
    name: "Certifications",
    slug: "certifications",
    icon: Award,
    description: "Filter by quality and compliance certifications",
    items: [
      { id: "iso9001", value: "iso-9001", label: "ISO 9001", enabled: true, order: 1 },
      { id: "iso14001", value: "iso-14001", label: "ISO 14001", enabled: true, order: 2 },
      { id: "ce", value: "ce-mark", label: "CE Mark", enabled: true, order: 3 },
      { id: "fda", value: "fda", label: "FDA Approved", enabled: true, order: 4 },
      { id: "rohs", value: "rohs", label: "RoHS", enabled: true, order: 5 },
      { id: "ul", value: "ul", label: "UL Listed", enabled: true, order: 6 },
      { id: "reach", value: "reach", label: "REACH", enabled: true, order: 7 },
      { id: "gmp", value: "gmp", label: "GMP", enabled: true, order: 8 },
      { id: "bsci", value: "bsci", label: "BSCI", enabled: true, order: 9 },
      { id: "sedex", value: "sedex", label: "SEDEX", enabled: true, order: 10 },
    ]
  },
  {
    id: "moq_ranges",
    name: "MOQ Ranges",
    slug: "moq_ranges",
    icon: Package,
    description: "Minimum Order Quantity ranges",
    items: [
      { id: "moq1", value: "1-100", label: "1-100 units", enabled: true, order: 1 },
      { id: "moq2", value: "100-500", label: "100-500 units", enabled: true, order: 2 },
      { id: "moq3", value: "500-1000", label: "500-1,000 units", enabled: true, order: 3 },
      { id: "moq4", value: "1000-5000", label: "1,000-5,000 units", enabled: true, order: 4 },
      { id: "moq5", value: "5000+", label: "5,000+ units", enabled: true, order: 5 },
    ]
  },
  {
    id: "export_markets",
    name: "Export Markets",
    slug: "export_markets",
    icon: MapPin,
    description: "Filter by export destination regions",
    items: [
      { id: "na", value: "north-america", label: "North America", enabled: true, order: 1 },
      { id: "eu", value: "europe", label: "Europe", enabled: true, order: 2 },
      { id: "asia", value: "asia", label: "Asia Pacific", enabled: true, order: 3 },
      { id: "me", value: "middle-east", label: "Middle East", enabled: true, order: 4 },
      { id: "sa", value: "south-america", label: "South America", enabled: true, order: 5 },
      { id: "af", value: "africa", label: "Africa", enabled: true, order: 6 },
      { id: "au", value: "australia", label: "Australia & Oceania", enabled: true, order: 7 },
    ]
  }
]

export default function AdminFiltersPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.filters
  const c = t.admin.common
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<FilterCategory[]>(initialFilters)
  const [activeTab, setActiveTab] = useState("countries")
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState<FilterItem | null>(null)
  const [newItem, setNewItem] = useState({ label: "", value: "" })

  const countsQuery = useQuery({
    queryKey: queryKeys.adminQuickFilterCounts(),
    queryFn: getAdminQuickFilterCounts,
  })

  const typesQuery = useQuery({
    queryKey: queryKeys.adminQuickFilterTypes(),
    queryFn: getAdminQuickFilterTypes,
  })

  const fallbackTypes = useMemo<AdminQuickFilterType[]>(
    () =>
      filters.map((filter) => ({
        value: filter.id,
        label: filter.name,
      })),
    [filters]
  )

  const types = typesQuery.data?.success && typesQuery.data.data.length > 0 ? typesQuery.data.data : []
  const visibleTypes = types.length > 0 ? types : fallbackTypes

  const categoryByType = useMemo(() => {
    const map = new Map<string, FilterCategory>()
    for (const category of filters) {
      map.set(category.id, category)
    }
    return map
  }, [filters])

  const resolvedCategories = useMemo<FilterCategory[]>(() => {
    return visibleTypes.map((type) => {
      const existing = categoryByType.get(type.value)
      if (existing) {
        return {
          ...existing,
          name: type.label || existing.name,
          description: c.manageFilterDesc,
        }
      }

      return {
        id: type.value,
        name: type.label || type.value,
        slug: type.value,
        icon: categoryIconByType[type.value] || Filter,
        description: c.manageFilterDesc,
        items: [],
      }
    })
  }, [categoryByType, visibleTypes, c.manageFilterDesc])

  useEffect(() => {
    if (!resolvedCategories.some((category) => category.id === activeTab)) {
      const first = resolvedCategories[0]
      if (first) {
        setActiveTab(first.id)
      }
    }
  }, [activeTab, resolvedCategories])

  const optionsQueryKey = queryKeys.adminQuickFilterOptions(activeTab)
  const optionsQuery = useQuery({
    queryKey: optionsQueryKey,
    queryFn: () => getAdminQuickFilterOptions(activeTab),
    enabled: Boolean(activeTab),
    placeholderData: (previousData) => previousData,
  })

  useEffect(() => {
    const response = optionsQuery.data
    if (!activeTab || !response?.success) {
      return
    }

    const normalizedItems: FilterItem[] = response.data.map((option: AdminQuickFilterOption, index) => ({
      id: String(option.id),
      value: option.value,
      label: option.displayLabel || option.value,
      enabled: option.isEnabled,
      order: option.sortOrder > 0 ? option.sortOrder : index + 1,
    }))

    setFilters((prev) => {
      const hasExisting = prev.some((category) => category.id === activeTab)
      if (hasExisting) {
        return prev.map((category) =>
          category.id === activeTab
            ? {
                ...category,
                items: normalizedItems,
              }
            : category
        )
      }

      const currentType = types.find((tabType) => tabType.value === activeTab)
      return [
        ...prev,
        {
          id: activeTab,
          name: currentType?.label || activeTab,
          slug: activeTab,
          icon: categoryIconByType[activeTab] || Filter,
          description: c.manageFilterDesc,
          items: normalizedItems,
        },
      ]
    })
  }, [activeTab, c.manageFilterDesc, optionsQuery.data, types])

  const createOptionMutation = useMutation({
    mutationFn: createAdminQuickFilterOption,
  })
  const updateOptionMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { displayLabel: string; value: string; isEnabled: boolean } }) =>
      updateAdminQuickFilterOption(id, input),
  })
  const toggleOptionMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      toggleAdminQuickFilterOption(id, isEnabled),
  })
  const deleteOptionMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { displayLabel: string; value: string; isEnabled: boolean } }) =>
      deleteAdminQuickFilterOption(id, input),
  })
  const sortOptionMutation = useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: "up" | "down" }) =>
      sortAdminQuickFilterOption(id, direction),
  })

  const activeCategory = resolvedCategories.find(f => f.id === activeTab)
  const isOptionsLoading = optionsQuery.isLoading || optionsQuery.isFetching
  const isMutatingOptions =
    createOptionMutation.isPending ||
    updateOptionMutation.isPending ||
    toggleOptionMutation.isPending ||
    deleteOptionMutation.isPending ||
    sortOptionMutation.isPending
  const optionsError =
    mutationError ||
    (optionsQuery.data?.success === false ? optionsQuery.data.message || c.failedToFetchOptions : null)

  const handleAddItem = () => {
    void (async () => {
      if (!newItem.label || !activeCategory) return

      setMutationError(null)
      const response = await createOptionMutation.mutateAsync({
        type: activeTab,
        displayLabel: newItem.label,
        value: newItem.value || newItem.label.toLowerCase().replace(/\s+/g, '-'),
        isEnabled: true,
      })

      if (!response.success) {
        setMutationError(response.message || c.failedToCreateOption)
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: optionsQueryKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminQuickFilterCounts() }),
      ])
      setNewItem({ label: "", value: "" })
      setShowAddDialog(false)

      void Swal.fire({
        icon: "success",
        title: p.successDone,
        text: response.message || c.optionCreatedSuccess,
        confirmButtonText: c.ok,
        confirmButtonColor: "#3d2e1f",
      })
    })()
  }

  const handleEditItem = async () => {
    if (!currentItem) return

    setMutationError(null)
    const response = await updateOptionMutation.mutateAsync({
      id: currentItem.id,
      input: {
      displayLabel: currentItem.label,
      value: currentItem.value,
      isEnabled: currentItem.enabled,
      },
    })

    if (!response.success) {
      setMutationError(response.message || c.failedToUpdateOption)
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: optionsQueryKey }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuickFilterCounts() }),
    ])
    setShowEditDialog(false)
    setCurrentItem(null)
  }

  const toggleItemEnabled = async (item: FilterItem) => {
    setMutationError(null)
    const response = await toggleOptionMutation.mutateAsync({ id: item.id, isEnabled: !item.enabled })
    if (!response.success) {
      setMutationError(response.message || c.failedToToggleOption)
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: optionsQueryKey }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuickFilterCounts() }),
    ])
  }

  const deleteItem = async (item: FilterItem) => {
    setMutationError(null)
    const response = await deleteOptionMutation.mutateAsync({
      id: item.id,
      input: {
        displayLabel: item.label,
        value: item.value,
        isEnabled: item.enabled,
      },
    })
    if (!response.success) {
      setMutationError(response.message || c.failedToDeleteOption)
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: optionsQueryKey }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQuickFilterCounts() }),
    ])
  }

  const moveItem = async (item: FilterItem, direction: 'up' | 'down') => {
    setMutationError(null)
    const response = await sortOptionMutation.mutateAsync({ id: item.id, direction })
    if (!response.success) {
      setMutationError(response.message || c.failedToSortOption)
      return
    }

    await queryClient.invalidateQueries({ queryKey: optionsQueryKey })
  }

  const totalFilters = filters.reduce((sum, cat) => sum + cat.items.length, 0)
  const enabledFilters = filters.reduce((sum, cat) => sum + cat.items.filter(i => i.enabled).length, 0)
  const counts = countsQuery.data?.success ? countsQuery.data.data : null
  const filterTypeCount = counts?.filterTypes ?? resolvedCategories.length
  const totalOptionsCount = counts?.totalOptions ?? totalFilters
  const enabledCount = counts?.enabled ?? enabledFilters
  const disabledCount = counts?.disabled ?? Math.max(0, totalOptionsCount - enabledCount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {p.subtitle}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <AdminStatCard
          title={p.filterCategories}
          value={filterTypeCount}
          icon={Filter}
          iconClassName="text-secondary"
          iconWrapperClassName="bg-secondary/10"
          layout="horizontal"
          contentClassName="p-6"
        />
        <AdminStatCard
          title={p.totalOptions}
          value={totalOptionsCount}
          icon={Package}
          iconClassName="text-blue-700"
          iconWrapperClassName="bg-blue-100"
          layout="horizontal"
          contentClassName="p-6"
        />
        <AdminStatCard
          title={p.enabled}
          value={enabledCount}
          icon={Filter}
          iconClassName="text-emerald-700"
          iconWrapperClassName="bg-emerald-100"
          layout="horizontal"
          contentClassName="p-6"
        />
        <AdminStatCard
          title={p.disabled}
          value={disabledCount}
          icon={Filter}
          iconClassName="text-amber-700"
          iconWrapperClassName="bg-amber-100"
          layout="horizontal"
          contentClassName="p-6"
        />
      </div>

      {/* Filter Categories Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {resolvedCategories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="gap-2">
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {resolvedCategories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5 text-secondary" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {p.addOption}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {isOptionsLoading && category.id === activeTab ? (
                    <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                      {c.loadingOptions}
                    </div>
                  ) : optionsError && category.id === activeTab ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {optionsError}
                    </div>
                  ) : (
                    [...category.items]
                    .sort((a, b) => a.order - b.order)
                    .map((item, index) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.value}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => void moveItem(item, 'up')}
                            disabled={isMutatingOptions || index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => void moveItem(item, 'down')}
                            disabled={isMutatingOptions || index === category.items.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Switch 
                          checked={item.enabled}
                          disabled={isMutatingOptions}
                          onCheckedChange={() => void toggleItemEnabled(item)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setCurrentItem(item)
                              setShowEditDialog(true)
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              {c.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => void deleteItem(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {c.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))) }
                  
                  {!isOptionsLoading && !optionsError && category.items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <category.icon className="h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 font-medium text-foreground">{p.noOptions}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {c.addFirstFilterOption}
                      </p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setShowAddDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {p.addOption}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.addFilterOption}</DialogTitle>
            <DialogDescription>
              {p.addFilterOptionDesc.replace("{category}", activeCategory?.name ?? "")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{p.displayLabel}</Label>
              <Input 
                placeholder={p.displayLabelPlaceholder}
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>{p.valueOptional}</Label>
              <Input 
                placeholder={p.valueOptionalPlaceholder}
                value={newItem.value}
                onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {p.valueOptionalHelp}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isMutatingOptions}>{c.cancel}</Button>
            <Button onClick={handleAddItem} disabled={!newItem.label || isMutatingOptions}>{p.addOption}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.editOption}</DialogTitle>
            <DialogDescription>
              {p.editFilterOptionDesc}
            </DialogDescription>
          </DialogHeader>
          {currentItem && (
            <div className="space-y-4">
              <div>
                <Label>{p.displayLabel}</Label>
                <Input 
                  value={currentItem.label}
                  onChange={(e) => setCurrentItem({ ...currentItem, label: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{p.valueLabel}</Label>
                <Input 
                  value={currentItem.value}
                  onChange={(e) => setCurrentItem({ ...currentItem, value: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{c.enabled}</Label>
                <Switch 
                  checked={currentItem.enabled}
                  onCheckedChange={(checked) => setCurrentItem({ ...currentItem, enabled: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>{c.cancel}</Button>
            <Button onClick={() => void handleEditItem()} disabled={isMutatingOptions}>{c.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
