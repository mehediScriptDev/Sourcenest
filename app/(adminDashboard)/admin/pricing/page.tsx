"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Edit, 
  Plus, 
  Trash2,
  ChevronDown,
  Check,
  X,
  Save,
  Eye,
  Package,
  Search
} from "lucide-react"
import { fetchPlans, createPlan, updatePlan, deletePlan as deleteApiPlan, fetchPlanFeatures, togglePopularPlan, updatePlanFeature, type PricingPlan as BackendPricingPlan, type PlanFeature } from "@/lib/api/admin-pricing"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"

interface PricingFeature {
  rowId: string
  id: number
  label?: string
  inputType: "boolean" | "text"
  value: string
}

interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: PricingFeature[]
  highlighted: boolean
  buttonText: string
  active: boolean
}

function transformBackendPlan(plan: BackendPricingPlan, featureCatalog: PlanFeature[] = []): PricingPlan {
  return {
    id: plan.id.toString(),
    name: plan.name,
    description: plan.description,
    monthlyPrice: parseFloat(plan.monthly_price?.amount || "0"),
    yearlyPrice: parseFloat(plan.yearly_price?.amount || "0"),
    features: plan.features?.map((feature) => {
      const actualFeatureId = feature.features?.id ?? feature.id
      return {
        rowId: `${actualFeatureId}-${feature.input_type}-${feature.value}`,
        id: actualFeatureId,
        label: feature.label || featureCatalog.find((item) => Number(item.id) === Number(actualFeatureId))?.name || "",
        inputType: feature.input_type === "boolean" ? "boolean" : "text",
        value: feature.value,
      }
    }) || [],
    highlighted: plan.is_popular,
    buttonText: plan.button_text,
    active: plan.status === 1
  }
}

function createEditableFeatureRowId(id: number) {
  return `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function serializePlanFeatures(features: PricingFeature[]) {
  return features.map((feature) => ({
    id: feature.id,
    input_type: feature.inputType,
    label: feature.label || "",
    value: feature.inputType === "boolean"
      ? (feature.value === "1" ? "1" : "0")
      : feature.value.trim(),
  }))
}

function isFeatureEnabled(feature: PricingFeature) {
  if (feature.inputType === "boolean") {
    return feature.value === "1"
  }

  return feature.value.trim().length > 0
}

function EditableFeatureRow(props: {
  feature: PricingFeature
  onRemove: () => void
  onChange: (feature: PricingFeature) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const c = t.admin.common
  const p = t.admin.pages.pricing
  const [isOpen, setIsOpen] = useState(false)

  const valueDetail = props.feature.inputType === "boolean"
    ? p.booleanValueDetail
        .replace("{id}", String(props.feature.id))
        .replace("{value}", props.feature.value === "1" ? "1" : "0")
    : props.feature.value
      ? p.textValueDetail.replace("{value}", props.feature.value)
      : c.textValueEmpty

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-muted/20">
        <div className="flex items-center gap-2 p-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{props.feature.label || c.featureId.replace("{id}", String(props.feature.id))}</p>
            <p className="text-xs text-muted-foreground">
              {valueDetail}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {props.feature.inputType === "boolean" ? (props.feature.value === "1" ? c.yes : c.no) : c.textLabel}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={props.onRemove}
            className="h-8 w-8 shrink-0"
            disabled={props.disabled}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <CollapsibleContent className="px-2 pb-3 space-y-3">
          <div className="space-y-2">
            <Label>{c.customDisplayLabel}</Label>
            <Input
              type="text"
              value={props.feature.label || ""}
              onChange={(event) =>
                props.onChange({
                  ...props.feature,
                  label: event.target.value,
                })
              }
              placeholder={p.customFeaturePlaceholder}
              disabled={props.disabled}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{c.typeLabel}</Label>
              <Select
                value={props.feature.inputType}
                onValueChange={(value) =>
                  props.onChange({
                    ...props.feature,
                    inputType: value as "boolean" | "text",
                    value:
                      value === "boolean"
                        ? (props.feature.value === "0" ? "0" : "1")
                                    : (props.feature.value === "1" || props.feature.value === "0" ? "" : props.feature.value.replace(/[^0-9]/g, "")),
                  })
                }
                disabled={props.disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={c.selectType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">{c.booleanType}</SelectItem>
                  <SelectItem value="text">{c.textType}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {props.feature.inputType === "boolean" ? (
              <div className="space-y-2">
                <Label>{c.valueLabel2}</Label>
                <Select
                  value={props.feature.value === "1" ? "yes" : "no"}
                  onValueChange={(value) =>
                    props.onChange({
                      ...props.feature,
                      value: value === "yes" ? "1" : "0",
                    })
                  }
                  disabled={props.disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={c.chooseYesNo} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{c.yes}</SelectItem>
                    <SelectItem value="no">{c.no}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>{c.textValueLabel}</Label>
                <Input
                  type="number"
                  min="0"
                  value={props.feature.value}
                  onChange={(event) =>
                    props.onChange({
                      ...props.feature,
                      value: event.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder={c.enterNumericValue}
                  disabled={props.disabled}
                />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default function AdminPricingPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.pricing
  const c = t.admin.common
  const queryClient = useQueryClient()

  const plansQuery = useQuery({
    queryKey: queryKeys.adminPricingPlans(),
    queryFn: fetchPlans,
  })

  const featuresQuery = useQuery({
    queryKey: queryKeys.adminPlanFeatures(),
    queryFn: fetchPlanFeatures,
  })

  const availableFeatures = featuresQuery.data ?? []
  const plans = useMemo(() => {
    const backendPlans = plansQuery.data ?? []
    const features = featuresQuery.data ?? []
    return backendPlans.map((plan) => transformBackendPlan(plan, features))
  }, [plansQuery.data, featuresQuery.data])

  const isLoading = plansQuery.isLoading || featuresQuery.isLoading

  const refreshPricingPlans = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminPricingPlans() })
  }

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [featureCatalogFilter, setFeatureCatalogFilter] = useState("")
  const [featureSearchFilter, setFeatureSearchFilter] = useState("")
  const [showFeatureSelector, setShowFeatureSelector] = useState<"add" | "edit" | null>(null)
  const [editingFeature, setEditingFeature] = useState<PlanFeature | null>(null)
  const [showFeatureEditDialog, setShowFeatureEditDialog] = useState(false)
  const [isFeatureUpdating, setIsFeatureUpdating] = useState(false)
  const [featureUpdateError, setFeatureUpdateError] = useState<string | null>(null)
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null)
  const [togglingPopularPlanId, setTogglingPopularPlanId] = useState<string | null>(null)
  const [isFeatureCatalogOpen, setIsFeatureCatalogOpen] = useState(false)

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    buttonText: "",
    highlighted: false,
    active: true,
    features: [] as PricingFeature[]
  })

  const [featureForm, setFeatureForm] = useState({
    name: "",
  })

  const openEditDialog = (plan: PricingPlan) => {
    setEditingPlan(plan)
    setEditForm({
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      buttonText: plan.buttonText,
      highlighted: plan.highlighted,
      active: plan.active,
      features: plan.features.map((feature, index) => ({
        ...feature,
        rowId: feature.rowId || createEditableFeatureRowId(feature.id + index),
      }))
    })
    setShowEditDialog(true)
  }

  const openFeatureEditDialog = (feature: PlanFeature) => {
    setEditingFeature(feature)
    setFeatureForm({
      name: feature.name,
    })
    setFeatureUpdateError(null)
    setShowFeatureEditDialog(true)
  }

  const saveFeature = async () => {
    if (!editingFeature) return

    const trimmedName = featureForm.name.trim()

    if (!trimmedName) {
      setFeatureUpdateError(c.featureNameRequired)
      return
    }

    setIsFeatureUpdating(true)
    setFeatureUpdateError(null)

    try {
      const result = await updatePlanFeature(editingFeature.id, {
        name: trimmedName,
      })

      if (result.success) {
        queryClient.setQueryData(queryKeys.adminPlanFeatures(), (previous: PlanFeature[] | undefined) => {
          if (!previous) return previous
          return previous.map((feature) =>
            feature.id === editingFeature.id
              ? result.feature || { ...feature, name: trimmedName }
              : feature
          )
        })
        setShowFeatureEditDialog(false)
        setEditingFeature(null)
      } else {
        setFeatureUpdateError(result.message || p.failedToUpdateFeature)
      }
    } catch (error) {
      console.error("Error updating feature:", error)
      setFeatureUpdateError(c.unexpectedError)
    } finally {
      setIsFeatureUpdating(false)
    }
  }

  const savePlan = async () => {
    if (!editingPlan) return

    setIsUpdating(true)
    setUpdateError(null)

    try {
      const transformedFeatures = serializePlanFeatures(editForm.features)

      const hasEmptyTextFeature = editForm.features.some(feature => feature.inputType === "text" && !feature.value.trim())
      if (hasEmptyTextFeature) {
        setUpdateError(c.textFeatureValueRequired)
        setIsUpdating(false)
        return
      }

      // Prepare the payload
      const payload = {
        name: editForm.name,
        description: editForm.description,
        button_text: editForm.buttonText,
        monthly_price: editForm.monthlyPrice,
        yearly_price: editForm.yearlyPrice,
        status: editForm.active,
        is_popular: editForm.highlighted,
        features: transformedFeatures
      }

      // Call the API
      const result = await updatePlan(editingPlan.id, payload)

      if (result.success) {
        await refreshPricingPlans()
        setShowEditDialog(false)
        setEditingPlan(null)
      } else {
        setUpdateError(result.message || c.failedToUpdatePlan)
      }
    } catch (error) {
      console.error("Error updating plan:", error)
      setUpdateError(c.unexpectedError)
    } finally {
      setIsUpdating(false)
    }
  }

  const togglePlanActive = async (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return

    setTogglingPlanId(planId)
    try {
      const features = serializePlanFeatures(plan.features)

      // Prepare the payload with flipped active status
      const newActiveStatus = !plan.active
      const payload = {
        name: plan.name,
        description: plan.description,
        button_text: plan.buttonText,
        monthly_price: plan.monthlyPrice,
        yearly_price: plan.yearlyPrice,
        status: newActiveStatus,
        is_popular: plan.highlighted,
        features: features
      }

      // Call the API
      const result = await updatePlan(planId, payload)

      if (result.success) {
        await refreshPricingPlans()
      } else {
        console.error("Failed to toggle plan status:", result.message)
      }
    } catch (error) {
      console.error("Error toggling plan status:", error)
    } finally {
      setTogglingPlanId(null)
    }
  }

  const toggleHighlighted = async (planId: string) => {
    setTogglingPopularPlanId(planId)
    try {
      const result = await togglePopularPlan(planId)
      
      if (result.success) {
        await refreshPricingPlans()
      } else {
        console.error("Failed to toggle plan popular status:", result.message)
      }
    } catch (error) {
      console.error("Error toggling plan popular status:", error)
    } finally {
      setTogglingPopularPlanId(null)
    }
  }

  const addFeature = (featureId: number) => {
    const feature = availableFeatures.find(f => f.id === featureId)
    if (feature && !editForm.features.find(f => f.id === featureId)) {
      setEditForm(prev => ({
        ...prev,
        features: [...prev.features, {
          rowId: createEditableFeatureRowId(feature.id),
          id: feature.id,
          label: feature.name,
          inputType: "boolean",
          value: "1",
        }]
      }))
      setFeatureSearchFilter("")
    }
  }

  const removeFeature = (rowId: string) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.filter((feature) => feature.rowId !== rowId)
    }))
  }

  const updateFeature = (rowId: string, updatedFeature: PricingFeature) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.map((feature) =>
        feature.rowId === rowId ? updatedFeature : feature
      )
    }))
  }

  const addNewPlan = async () => {
    if (!editForm.name.trim()) {
      setCreateError(c.planNameRequired)
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const hasEmptyTextFeature = editForm.features.some(feature => feature.inputType === "text" && !feature.value.trim())
      if (hasEmptyTextFeature) {
        setCreateError(p.textFeaturesCreateError)
        setIsCreating(false)
        return
      }

      const transformedFeatures = serializePlanFeatures(editForm.features)

      // Prepare the payload
      const payload = {
        name: editForm.name,
        description: editForm.description || c.planDescriptionDefault,
        button_text: editForm.buttonText || c.getStarted,
        monthly_price: editForm.monthlyPrice,
        yearly_price: editForm.yearlyPrice,
        currency_code: "USD",
        features: transformedFeatures
      }

      // Call the API
      const result = await createPlan(payload)

      if (result.success) {
        await refreshPricingPlans()

        // Reset form
        setShowAddDialog(false)
        setEditForm({
          name: "",
          description: "",
          monthlyPrice: 0,
          yearlyPrice: 0,
          buttonText: "",
          highlighted: false,
          active: true,
          features: []
        })
      } else {
        setCreateError(result.message || c.failedToCreatePlan)
      }
    } catch (error) {
      console.error("Error creating plan:", error)
      setCreateError(c.unexpectedError)
    } finally {
      setIsCreating(false)
    }
  }

  const deletePlan = async (planId: string) => {
    setIsDeleting(planId)
    try {
      const result = await deleteApiPlan(planId)
      if (result.success) {
        await refreshPricingPlans()
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{c.loadingPricingPlans}</div>
        </div>
      )}
      {!isLoading && (
        <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.title}</h1>
          <p className="text-muted-foreground">{p.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => {
            setEditForm({
              name: "",
              description: "",
              monthlyPrice: 0,
              yearlyPrice: 0,
              buttonText: c.getStarted,
              highlighted: false,
              active: true,
              features: []
            })
            setShowAddDialog(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {c.addPlan}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <AdminStatCard
          title={p.totalPlans}
          value={plans.length}
          layout="vertical"
          contentClassName="pt-6 pb-6 px-6"
        />
        <AdminStatCard
          title={p.activePlans}
          value={plans.filter(p => p.active).length}
          valueClassName="text-emerald-600"
          layout="vertical"
          contentClassName="pt-6 pb-6 px-6"
        />
        <AdminStatCard
          title={p.highestMonthly}
          value={`$${Math.max(...plans.map(p => p.monthlyPrice), 0)}`}
          layout="vertical"
          contentClassName="pt-6 pb-6 px-6"
        />
        <AdminStatCard
          title={p.highestYearly}
          value={`$${Math.max(...plans.map(p => p.yearlyPrice), 0)}`}
          layout="vertical"
          contentClassName="pt-6 pb-6 px-6"
        />
      </div>

      {/* Feature Catalog */}
      <Card>
        <Collapsible open={isFeatureCatalogOpen} onOpenChange={setIsFeatureCatalogOpen}>
          <CardHeader className="pb-4">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-start justify-between gap-4 text-left">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {c.featureCatalog}
                  </CardTitle>
                  <CardDescription>
                    {p.featureCatalogDescAlt}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{c.featuresCount.replace("{count}", String(availableFeatures.length))}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {isFeatureCatalogOpen ? c.hideLabel : c.showLabel}
                  </span>
                </div>
              </button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={c.searchFeaturesPlaceholder}
                  value={featureCatalogFilter}
                  onChange={(e) => setFeatureCatalogFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {availableFeatures
                  .filter((feature) => {
                    const query = featureCatalogFilter.toLowerCase().trim()
                    if (!query) return true
                    return feature.name.toLowerCase().includes(query) || feature.key.toLowerCase().includes(query)
                  })
                  .map((feature) => (
                    <div key={feature.id} className="rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{feature.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground break-all">{feature.key}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => openFeatureEditDialog(feature)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                {availableFeatures.filter((feature) => {
                  const query = featureCatalogFilter.toLowerCase().trim()
                  if (!query) return true
                  return feature.name.toLowerCase().includes(query) || feature.key.toLowerCase().includes(query)
                }).length === 0 && (
                  <div className="col-span-full rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    {featureCatalogFilter ? c.noFeaturesMatch : c.noFeaturesLoaded}
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.highlighted ? 'ring-2 ring-primary' : ''} ${!plan.active ? 'opacity-60' : ''}`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">{p.mostPopular}</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {!plan.active && <Badge variant="secondary">{c.inactive}</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => openEditDialog(plan)}
                    disabled={isDeleting === plan.id}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deletePlan(plan.id)}
                    className="text-destructive"
                    disabled={isDeleting === plan.id}
                  >
                    {isDeleting === plan.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                  <span className="text-muted-foreground">{c.perMonth}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.orYearlySave
                    .replace("{price}", String(plan.yearlyPrice))
                    .replace("{percent}", String(plan.monthlyPrice > 0 ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100) : 0))}
                </p>
              </div>

              <div className="space-y-2">
                {plan.features.slice(0, 5).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {isFeatureEnabled(feature) ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={!isFeatureEnabled(feature) ? "text-muted-foreground" : ""}>
                      {feature.label || (feature.inputType === "boolean" ? (feature.value === "1" ? c.yes : c.no) : feature.value)}
                    </span>
                  </div>
                ))}
                {plan.features.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    {c.moreFeatures.replace("{count}", String(plan.features.length - 5))}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={plan.active}
                    onCheckedChange={() => togglePlanActive(plan.id)}
                    disabled={togglingPlanId === plan.id || isDeleting === plan.id}
                  />
                  <span className="text-sm">
                    {togglingPlanId === plan.id ? c.updating : c.active}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleHighlighted(plan.id)}
                  disabled={togglingPlanId === plan.id || togglingPopularPlanId === plan.id || isDeleting === plan.id}
                >
                  {togglingPopularPlanId === plan.id ? (
                    <>
                      <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {c.updating}
                    </>
                  ) : plan.highlighted ? c.removeHighlight : c.setAsPopular}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl flex flex-col max-h-[95dvh] gap-0 p-0 overflow-hidden">
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle>{p.editPlanTitle.replace("{name}", editingPlan?.name ?? "")}</DialogTitle>
              <DialogDescription>
                {p.updatePlanDesc}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
            {updateError && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                {updateError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{c.planName}</Label>
                <Input 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-2"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <Label>{c.buttonTextLabel}</Label>
                <Input 
                  value={editForm.buttonText}
                  onChange={(e) => setEditForm({ ...editForm, buttonText: e.target.value })}
                  className="mt-2"
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div>
              <Label>{c.description}</Label>
              <Textarea 
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-2"
                rows={2}
                disabled={isUpdating}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{c.monthlyPrice}</Label>
                <Input 
                  type="number"
                  min="0"
                  value={editForm.monthlyPrice}
                  onChange={(e) => setEditForm({ ...editForm, monthlyPrice: Number(e.target.value) })}
                  className="mt-2"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <Label>{c.yearlyPrice}</Label>
                <Input 
                  type="number"
                  min="0"
                  value={editForm.yearlyPrice}
                  onChange={(e) => setEditForm({ ...editForm, yearlyPrice: Number(e.target.value) })}
                  className="mt-2"
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div>
              <Label>{c.featuresLabel}</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                {editForm.features.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">{p.noFeaturesSelected}</p>
                ) : (
                  editForm.features.map((feature) => (
                    <EditableFeatureRow
                      key={feature.rowId}
                      feature={feature}
                      onRemove={() => removeFeature(feature.rowId)}
                      onChange={(updatedFeature) => updateFeature(feature.rowId, updatedFeature)}
                      disabled={isUpdating}
                    />
                  ))
                )}
              </div>
              <Button 
                onClick={() => setShowFeatureSelector("edit")}
                disabled={isUpdating}
                className="mt-3 w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                {p.addFeature}
              </Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="edit-plan-active"
                  checked={editForm.active}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, active: checked })}
                  disabled={isUpdating}
                />
                <Label htmlFor="edit-plan-active" className="cursor-pointer">{c.activePlanStatus}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="edit-plan-popular"
                  checked={editForm.highlighted}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, highlighted: checked })}
                  disabled={isUpdating}
                />
                <Label htmlFor="edit-plan-popular" className="cursor-pointer">{c.markMostPopular}</Label>
              </div>
            </div>
          </div>
          <div className="p-6 pt-4 mt-auto border-t bg-card">
            <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false)
                setUpdateError(null)
              }}
              disabled={isUpdating}
            >
              {c.cancel}
            </Button>
            <Button onClick={savePlan} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  {c.saving}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {c.saveChanges}
                </>
              )}
            </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Plan Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl flex flex-col max-h-[95dvh] gap-0 p-0 overflow-hidden">
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle>{c.addNewPlan}</DialogTitle>
              <DialogDescription>
                {c.createPlanDesc}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
            {createError && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                {createError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{c.planName}</Label>
                <Input 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-2"
                  placeholder={p.planNamePlaceholder}
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label>{c.buttonTextLabel}</Label>
                <Input 
                  value={editForm.buttonText}
                  onChange={(e) => setEditForm({ ...editForm, buttonText: e.target.value })}
                  className="mt-2"
                  placeholder={p.buttonTextPlaceholder}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div>
              <Label>{c.description}</Label>
              <Textarea 
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-2"
                rows={2}
                placeholder={p.descriptionPlaceholder}
                disabled={isCreating}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{c.monthlyPrice}</Label>
                <Input 
                  type="number"
                  min="0"
                  value={editForm.monthlyPrice}
                  onChange={(e) => setEditForm({ ...editForm, monthlyPrice: Number(e.target.value) })}
                  className="mt-2"
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label>{c.yearlyPrice}</Label>
                <Input 
                  type="number"
                  min="0"
                  value={editForm.yearlyPrice}
                  onChange={(e) => setEditForm({ ...editForm, yearlyPrice: Number(e.target.value) })}
                  className="mt-2"
                  disabled={isCreating}
                />
              </div>
            </div>

            <div>
              <Label>{c.featuresLabel}</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                {editForm.features.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">{p.noFeaturesSelected}</p>
                ) : (
                  editForm.features.map((feature) => (
                    <EditableFeatureRow
                      key={feature.rowId}
                      feature={feature}
                      onRemove={() => removeFeature(feature.rowId)}
                      onChange={(updatedFeature) => updateFeature(feature.rowId, updatedFeature)}
                      disabled={isCreating}
                    />
                  ))
                )}
              </div>
              <Button 
                onClick={() => setShowFeatureSelector("add")}
                disabled={isCreating}
                className="mt-3 w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                {p.addFeature}
              </Button>
            </div>
          </div>
          <div className="p-6 pt-4 mt-auto border-t bg-card">
            <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDialog(false)
                setCreateError(null)
              }}
              disabled={isCreating}
            >
              {c.cancel}
            </Button>
            <Button onClick={addNewPlan} disabled={isCreating}>
              {isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  {c.creating}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {c.createPlan}
                </>
              )}
            </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Feature Dialog */}
      <Dialog open={showFeatureEditDialog} onOpenChange={setShowFeatureEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{p.editFeatureDialog}</DialogTitle>
            <DialogDescription>
              {p.updateFeatureLabelDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {featureUpdateError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {featureUpdateError}
              </div>
            )}

            <div>
              <Label>{p.featureName}</Label>
              <Input
                value={featureForm.name}
                onChange={(e) => setFeatureForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-2"
                disabled={isFeatureUpdating}
              />
            </div>

            <div>
              <Label>{p.featureKey}</Label>
              <Input
                value={editingFeature?.key || ""}
                className="mt-2"
                disabled
              />
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeatureEditDialog(false)
                setFeatureUpdateError(null)
              }}
              disabled={isFeatureUpdating}
            >
              {c.cancel}
            </Button>
            <Button onClick={saveFeature} disabled={isFeatureUpdating}>
              {isFeatureUpdating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  {c.saving}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {c.saveFeature}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{p.pricingPreview}</DialogTitle>
            <DialogDescription>
              {c.previewPricingDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="py-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">{p.previewTitle}</h2>
              <p className="text-muted-foreground mt-2">
                {c.choosePlanDesc}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.filter(p => p.active).map((plan) => (
                <div 
                  key={plan.id}
                  className={`rounded-xl border p-6 ${plan.highlighted ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                >
                  {plan.highlighted && (
                    <Badge className="mb-4 bg-primary">{p.mostPopular}</Badge>
                  )}
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                    <span className="text-muted-foreground">{c.perMonth}</span>
                  </div>
                  <Button className={`w-full mt-6 ${plan.highlighted ? '' : 'variant-outline'}`}>
                    {plan.buttonText}
                  </Button>
                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {isFeatureEnabled(feature) ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={!isFeatureEnabled(feature) ? "text-muted-foreground" : ""}>
                          {feature.label || (feature.inputType === "boolean" ? (feature.value === "1" ? c.yes : c.no) : feature.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Selector Dialog */}
      <Dialog open={showFeatureSelector !== null} onOpenChange={(open) => !open && setShowFeatureSelector(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{c.selectFeaturesTitle}</DialogTitle>
            <DialogDescription>
              {c.selectFeaturesDesc.replace("{count}", String(availableFeatures.length))}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={c.searchFeaturesShort}
                value={featureSearchFilter}
                onChange={(e) => setFeatureSearchFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-lg p-3">
              {availableFeatures
                .filter(f => 
                  !editForm.features.find(ef => ef.id === f.id) &&
                  f.name.toLowerCase().includes(featureSearchFilter.toLowerCase())
                )
                .map((feature) => (
                  <div 
                    key={feature.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => addFeature(feature.id)}
                  >
                    <div>
                      <p className="font-medium text-sm">{feature.name}</p>
                      <p className="text-xs text-muted-foreground">{feature.key}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              {availableFeatures.filter(f => 
                !editForm.features.find(ef => ef.id === f.id) &&
                f.name.toLowerCase().includes(featureSearchFilter.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {featureSearchFilter ? p.noFeaturesMatchSearch : c.allFeaturesAdded}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowFeatureSelector(null)
                setFeatureSearchFilter("")
              }}
            >
              {p.done}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
