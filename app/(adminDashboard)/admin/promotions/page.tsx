"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Sparkles,
  Users,
  Calendar,
  Edit,
  Trash2,
  RotateCcw,
  Eye,
  CheckCircle,
  Clock,
  Factory,
  TrendingUp,
  AlertTriangle,
  Save,
  X,
  Loader2,
} from "lucide-react"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Separator } from "@/components/ui/separator"
import {
  fetchAdminPromotions,
  resetAdminPromotions,
  updateAdminPromotion,
  toggleAdminPromotionStatus,
  type Promotion
} from "@/lib/api/admin-promotions"
import { fetchPlans, type PricingPlan } from "@/lib/api/admin-pricing"
import { queryKeys } from "@/lib/query-keys"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

export default function PromotionsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.promotions
  const c = t.admin.common
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  const promotionsQueryKey = queryKeys.adminPromotions()

  const promotionsQuery = useQuery({
    queryKey: promotionsQueryKey,
    queryFn: fetchAdminPromotions,
  })

  const plansQuery = useQuery({
    queryKey: queryKeys.adminPricingPlans(),
    queryFn: fetchPlans,
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number | string) => toggleAdminPromotionStatus(id),
  })

  const resetMutation = useMutation({
    mutationFn: resetAdminPromotions,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string
      payload: {
        plan_id: number
        slots: number
        duration_months: number
        promotion_title: string
        short_description: string
        button_text: string
        cta_button_text: string
        highlight_text: string
        expires_at: string | null
        status: boolean
      }
    }) => updateAdminPromotion(id, payload),
  })

  const promotions = promotionsQuery.data?.success ? promotionsQuery.data.data : []
  const plans = plansQuery.data ?? []
  const loading = promotionsQuery.isLoading
  const error =
    promotionsQuery.data?.success === false
      ? promotionsQuery.data.message || p.loadFailed
      : null

  const [showResetDialog, setShowResetDialog] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editPromoData, setEditPromoData] = useState<{
    id: number | string
    plan_id: number
    slots: number
    duration_months: number
    promotion_title: string
    short_description: string
    button_text: string
    cta_button_text: string
    highlight_text: string
    expires_at: string | null
    status: boolean
  } | null>(null)

  const submitting = updateMutation.isPending

  const handleToggleActive = async (promo: Promotion) => {
    toast({
      title: c.updating,
      description: !promo.status ? c.turningPromotionOn : c.turningPromotionOff,
    })

    const res = await toggleMutation.mutateAsync(promo.id)
    
    if (res.success) {
      queryClient.setQueryData(promotionsQueryKey, (previous: {
        success: boolean
        message?: string
        data: Promotion[]
      } | undefined) => {
        if (!previous?.success) return previous
        return {
          ...previous,
          data: previous.data.map((item) =>
            item.id === promo.id ? { ...item, status: !item.status } : item
          ),
        }
      })
      toast({
        title: c.success,
        description: res.message || (!promo.status ? c.promotionActivated : c.promotionDeactivated),
      })
    } else {
      toast({
        title: c.error,
        description: res.message || c.failedToUpdatePromotionStatus,
        variant: "destructive",
      })
    }
  }

  const handleResetCounter = async () => {
    if (!selectedPromotion) return
    
    setShowResetDialog(false)
    toast({
      title: c.resetting,
      description: p.resettingCounters,
    })
    
    const res = await resetMutation.mutateAsync()
    if (res.success) {
      toast({
        title: c.success,
        description: res.message || c.countersResetSuccess,
      })
      void queryClient.invalidateQueries({ queryKey: promotionsQueryKey })
    } else {
      toast({
        title: c.error,
        description: res.message || c.failedToResetCounters,
        variant: "destructive",
      })
    }
  }

  const handleOpenEditDialog = (promo: Promotion) => {
    setEditPromoData({
      id: promo.id,
      plan_id: promo.plan.id,
      slots: promo.slots,
      duration_months: promo.duration_months,
      promotion_title: promo.promotion_title,
      short_description: promo.short_description,
      button_text: promo.button_text,
      cta_button_text: promo.cta_button_text,
      highlight_text: promo.highlight_text,
      expires_at: promo.expires_at ? promo.expires_at.split("T")[0] : null,
      status: promo.status,
    })
    setShowEditDialog(true)
  }

  const handleUpdatePromotion = async () => {
    if (!editPromoData) return

    const payload = {
      plan_id: editPromoData.plan_id,
      slots: editPromoData.slots,
      duration_months: editPromoData.duration_months,
      promotion_title: editPromoData.promotion_title,
      short_description: editPromoData.short_description,
      button_text: editPromoData.button_text,
      cta_button_text: editPromoData.cta_button_text,
      highlight_text: editPromoData.highlight_text,
      expires_at: editPromoData.expires_at,
      status: editPromoData.status,
    }

    const res = await updateMutation.mutateAsync({ id: editPromoData.id, payload })

    if (res.success) {
      toast({
        title: c.success,
        description: res.message || c.promotionUpdated,
      })
      setShowEditDialog(false)
      void queryClient.invalidateQueries({ queryKey: promotionsQueryKey })
    } else {
      toast({
        title: c.error,
        description: res.message || c.failedToUpdatePromotion,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.title}</h1>
          <p className="text-muted-foreground">{p.subtitle}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">{c.errorLoadingPromotions}</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const totalSpots = promotions.reduce((sum, promo) => sum + promo.total_spots, 0)
  const totalApproved = promotions.reduce((sum, promo) => sum + promo.approved, 0)
  const totalRemaining = promotions.reduce((sum, promo) => sum + promo.spots_remaining, 0)
  const totalPending = promotions.reduce((sum, promo) => sum + promo.pending_review, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.title}</h1>
          <p className="text-muted-foreground">{p.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard
          title={p.totalSpots}
          value={totalSpots}
          icon={Users}
          iconClassName="text-primary"
          iconWrapperClassName="bg-primary/10"
          layout="spaceBetween"
        />
        <AdminStatCard
          title={p.approved}
          value={totalApproved}
          icon={CheckCircle}
          iconClassName="text-secondary"
          iconWrapperClassName="bg-secondary/10"
          layout="spaceBetween"
        />
        <AdminStatCard
          title={p.spotsRemaining}
          value={totalRemaining}
          icon={TrendingUp}
          iconClassName="text-amber-500"
          iconWrapperClassName="bg-amber-500/10"
          layout="spaceBetween"
        />
        <AdminStatCard
          title={p.pendingReview}
          value={totalPending}
          icon={Clock}
          iconClassName="text-blue-500"
          iconWrapperClassName="bg-blue-500/10"
          layout="spaceBetween"
        />
      </div>

      {promotions.map((promo) => {
        const percentUsed = promo.stats.fill_percentage
        const spotsRemaining = promo.stats.spots_remaining

        return (
          <Card key={promo.id}>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                    <Sparkles className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      {promo.promotion_title}
                      {promo.status ? (
                        <Badge className="bg-secondary text-secondary-foreground">{c.active}</Badge>
                      ) : (
                        <Badge variant="secondary">{c.inactive}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="wrap-break-word">{promo.short_description}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 mr-2 md:mr-4">
                    <Label htmlFor={`active-toggle-${promo.id}`} className="text-sm text-muted-foreground">{c.active}</Label>
                    <Switch
                      id={`active-toggle-${promo.id}`}
                      checked={promo.status}
                      onCheckedChange={() => handleToggleActive(promo)}
                    />
                  </div>
                  <Button variant="default" size="sm" onClick={() => router.push(`/admin/promotions/${promo.id}`)}>
                    <Users className="mr-2 h-4 w-4" />
                    {c.participants}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(promo)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {c.editDetails}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedPromotion(promo)
                    setShowResetDialog(true)
                  }}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {c.resetCounter}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">{p.programDetails}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.linkedPlan}</span>
                      <span className="font-medium text-foreground">
                        {promo.plan.name}
                        {promo.plan.is_popular && (
                          <Badge variant="secondary" className="ml-2 text-xs">{c.popular}</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{c.planPrice}</span>
                      <span className="font-medium text-foreground">
                        ${parseFloat(promo.plan.monthly_price.amount).toFixed(0)}{c.perMonthShort} · ${parseFloat(promo.plan.yearly_price.amount).toFixed(0)}{c.perYearShort}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.duration}</span>
                      <span className="font-medium text-foreground">{c.monthsFree.replace("{count}", String(promo.duration_months))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.maxSpots}</span>
                      <span className="font-medium text-foreground">{promo.slots}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.created}</span>
                      <span className="font-medium text-foreground">
                        {promo.created_at ? new Date(promo.created_at).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.expires}</span>
                      <span className="font-medium text-foreground">
                        {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : c.noExpiration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">{p.enrollmentProgress}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{c.spotsUsedApproved}</span>
                      <span className="font-medium text-foreground">{promo.stats.spots_joined} / {promo.stats.slots_total}</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary/20">
                      <div
                        className="h-full rounded-full bg-secondary transition-all"
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.percentFilled
                        .replace("{percent}", percentUsed.toFixed(1))
                        .replace("{remaining}", String(spotsRemaining))}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="rounded-lg bg-green-500/10 p-2 text-center">
                        <p className="text-lg font-bold text-green-600">{promo.stats.accepted}</p>
                        <p className="text-xs text-muted-foreground">{p.accepted}</p>
                      </div>
                      <div className="rounded-lg bg-amber-500/10 p-2 text-center">
                        <p className="text-lg font-bold text-amber-600">{promo.stats.pending}</p>
                        <p className="text-xs text-muted-foreground">{c.pending}</p>
                      </div>
                      <div className="rounded-lg bg-red-500/10 p-2 text-center">
                        <p className="text-lg font-bold text-red-600">{promo.stats.rejected}</p>
                        <p className="text-xs text-muted-foreground">{c.rejected}</p>
                      </div>
                    </div>

                    {spotsRemaining < 50 && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{p.runningLowSpotsAdjust}</span>
                      </div>
                    )}
                    {promo.stats.is_full && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{p.promotionFullNoSpots}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{c.displaySettings}</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">{c.buttonText}</Label>
                    <p className="text-sm font-medium text-foreground">{promo.button_text}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{c.ctaButtonText}</Label>
                    <p className="text-sm font-medium text-foreground">{promo.cta_button_text}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">{c.highlightText}</Label>
                    <p className="text-sm text-foreground">{promo.highlight_text}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {promotions.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">{c.noPromotions}</h3>
            <p className="mt-2 text-muted-foreground">{c.noPromotionsDesc}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.resetCounterTitle}</DialogTitle>
            <DialogDescription>
              {p.resetCounterDescLong.replace("{title}", selectedPromotion?.promotion_title ?? "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              {c.cancel}
            </Button>
            <Button onClick={handleResetCounter}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {c.resetToZero}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl flex flex-col max-h-[95dvh] gap-0 p-0 overflow-hidden">
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle>{c.editPromotionSettings}</DialogTitle>
              <DialogDescription>
                {p.editPromotionDescAlt}
              </DialogDescription>
            </DialogHeader>
          </div>
          {editPromoData && (
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">{c.promotionTitle}</Label>
                <Input
                  id="edit-title"
                  value={editPromoData.promotion_title}
                  onChange={(e) => setEditPromoData({ ...editPromoData, promotion_title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-desc">{c.shortDescription}</Label>
                <Textarea
                  id="edit-desc"
                  value={editPromoData.short_description}
                  onChange={(e) => setEditPromoData({ ...editPromoData, short_description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-plan">{p.linkedPlan.replace(/:$/, "")}</Label>
                  <Select
                    value={String(editPromoData.plan_id)}
                    onValueChange={(val) => setEditPromoData({ ...editPromoData, plan_id: Number(val) })}
                  >
                    <SelectTrigger id="edit-plan">
                      <SelectValue placeholder={p.selectPlan} />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={String(plan.id)}>
                          {plan.name} (${parseFloat(plan.monthly_price?.amount || "0").toFixed(0)}{c.perMonthShort})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-slots">{c.maxSpotsSlots}</Label>
                  <Input
                    id="edit-slots"
                    type="number"
                    value={editPromoData.slots}
                    onChange={(e) => setEditPromoData({ ...editPromoData, slots: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration">{c.durationMonthsFree}</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={editPromoData.duration_months}
                    onChange={(e) => setEditPromoData({ ...editPromoData, duration_months: Number(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-expiry">{c.expiresAt}</Label>
                  <Input
                    id="edit-expiry"
                    type="date"
                    value={editPromoData.expires_at || ""}
                    onChange={(e) => setEditPromoData({ ...editPromoData, expires_at: e.target.value || null })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-btn-text">{c.buttonTextPricingCard}</Label>
                  <Input
                    id="edit-btn-text"
                    value={editPromoData.button_text}
                    onChange={(e) => setEditPromoData({ ...editPromoData, button_text: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-cta-text">{c.ctaButtonTextSignUp}</Label>
                  <Input
                    id="edit-cta-text"
                    value={editPromoData.cta_button_text}
                    onChange={(e) => setEditPromoData({ ...editPromoData, cta_button_text: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-highlight">{c.highlightText}</Label>
                <Textarea
                  id="edit-highlight"
                  value={editPromoData.highlight_text}
                  onChange={(e) => setEditPromoData({ ...editPromoData, highlight_text: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>{c.promotionStatus}</Label>
                  <p className="text-xs text-muted-foreground">
                    {p.promotionStatusDesc}
                  </p>
                </div>
                <Switch
                  checked={editPromoData.status}
                  onCheckedChange={(checked) => setEditPromoData({ ...editPromoData, status: checked })}
                />
              </div>
            </div>
          )}
          <div className="p-6 pt-4 mt-auto border-t bg-card">
            <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>
              {c.cancel}
            </Button>
            <Button onClick={handleUpdatePromotion} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </div>
  )
}
