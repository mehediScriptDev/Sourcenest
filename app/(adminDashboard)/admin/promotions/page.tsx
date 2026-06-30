"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

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
  const [submitting, setSubmitting] = useState(false)

  const loadPromotions = async (cancelled = false) => {
    setLoading(true)
    setError(null)
    const res = await fetchAdminPromotions()
    if (cancelled) return
    if (res.success) {
      setPromotions(res.data)
    } else {
      setError(res.message || "Failed to load promotions")
    }
    setLoading(false)
  }

  const loadPlans = async () => {
    try {
      const data = await fetchPlans()
      setPlans(data)
    } catch (err) {
      console.error("Failed to load plans", err)
    }
  }

  useEffect(() => {
    let cancelled = false
    void loadPromotions(cancelled)
    void loadPlans()
    return () => { cancelled = true }
  }, [])

  const handleToggleActive = async (promo: Promotion) => {
    toast({
      title: "Updating...",
      description: `Turning promotion ${!promo.status ? "ON" : "OFF"}...`,
    })

    const res = await toggleAdminPromotionStatus(promo.id)
    
    if (res.success) {
      toast({
        title: "Success",
        description: res.message || `Promotion ${!promo.status ? "activated" : "deactivated"} successfully.`,
      })
      void loadPromotions()
    } else {
      toast({
        title: "Error",
        description: res.message || "Failed to update promotion status.",
        variant: "destructive",
      })
    }
  }

  const handleResetCounter = async () => {
    if (!selectedPromotion) return
    
    setShowResetDialog(false)
    toast({
      title: "Resetting...",
      description: "Resetting promotion counters...",
    })
    
    const res = await resetAdminPromotions()
    if (res.success) {
      toast({
        title: "Success",
        description: res.message || "Promotion counters reset successfully.",
      })
      void loadPromotions()
    } else {
      toast({
        title: "Error",
        description: res.message || "Failed to reset counters.",
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
    
    setSubmitting(true)
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

    const res = await updateAdminPromotion(editPromoData.id, payload)
    setSubmitting(false)

    if (res.success) {
      toast({
        title: "Success",
        description: res.message || "Promotion updated successfully.",
      })
      setShowEditDialog(false)
      void loadPromotions()
    } else {
      toast({
        title: "Error",
        description: res.message || "Failed to update promotion.",
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
          <h1 className="text-2xl font-bold text-foreground">Promotional Offers</h1>
          <p className="text-muted-foreground">Manage special offers and founding programs</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Error loading promotions</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // Aggregate stats across all promotions
  const totalSpots = promotions.reduce((sum, p) => sum + p.total_spots, 0)
  const totalApproved = promotions.reduce((sum, p) => sum + p.approved, 0)
  const totalRemaining = promotions.reduce((sum, p) => sum + p.spots_remaining, 0)
  const totalPending = promotions.reduce((sum, p) => sum + p.pending_review, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promotional Offers</h1>
          <p className="text-muted-foreground">Manage special offers and founding programs</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <AdminStatCard
          title="Total Spots"
          value={totalSpots}
          icon={Users}
          iconClassName="text-primary"
          iconWrapperClassName="bg-primary/10"
          layout="spaceBetween"
        />
        <AdminStatCard
          title="Approved"
          value={totalApproved}
          icon={CheckCircle}
          iconClassName="text-secondary"
          iconWrapperClassName="bg-secondary/10"
          layout="spaceBetween"
        />
        <AdminStatCard
          title="Spots Remaining"
          value={totalRemaining}
          icon={TrendingUp}
          iconClassName="text-amber-500"
          iconWrapperClassName="bg-amber-500/10"
          layout="spaceBetween"
        />
        <AdminStatCard
          title="Pending Review"
          value={totalPending}
          icon={Clock}
          iconClassName="text-blue-500"
          iconWrapperClassName="bg-blue-500/10"
          layout="spaceBetween"
        />
      </div>

      {/* Promotion Cards */}
      {promotions.map((promo) => {
        const percentUsed = promo.stats.fill_percentage
        const spotsRemaining = promo.stats.spots_remaining

        return (
          <Card key={promo.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                    <Sparkles className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {promo.promotion_title}
                      {promo.status ? (
                        <Badge className="bg-secondary text-secondary-foreground">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{promo.short_description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-4">
                    <Label htmlFor={`active-toggle-${promo.id}`} className="text-sm text-muted-foreground">Active</Label>
                    <Switch
                      id={`active-toggle-${promo.id}`}
                      checked={promo.status}
                      onCheckedChange={() => handleToggleActive(promo)}
                    />
                  </div>
                  <Button variant="default" size="sm" onClick={() => router.push(`/admin/promotions/${promo.id}`)}>
                    <Users className="mr-2 h-4 w-4" />
                    Participants
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(promo)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedPromotion(promo)
                    setShowResetDialog(true)
                  }}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Counter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Program Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Program Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Linked Plan:</span>
                      <span className="font-medium text-foreground">
                        {promo.plan.name}
                        {promo.plan.is_popular && (
                          <Badge variant="secondary" className="ml-2 text-xs">Popular</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan Price:</span>
                      <span className="font-medium text-foreground">
                        ${parseFloat(promo.plan.monthly_price.amount).toFixed(0)}/mo · ${parseFloat(promo.plan.yearly_price.amount).toFixed(0)}/yr
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium text-foreground">{promo.duration_months} months free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max Spots:</span>
                      <span className="font-medium text-foreground">{promo.slots}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium text-foreground">
                        {promo.created_at ? new Date(promo.created_at).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium text-foreground">
                        {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : "No expiration"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Enrollment Progress</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spots Used (Approved Only):</span>
                      <span className="font-medium text-foreground">{promo.stats.spots_joined} / {promo.stats.slots_total}</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary/20">
                      <div
                        className="h-full rounded-full bg-secondary transition-all"
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {percentUsed.toFixed(1)}% filled • {spotsRemaining} spots remaining
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="rounded-lg bg-green-500/10 p-2 text-center">
                        <p className="text-lg font-bold text-green-600">{promo.stats.accepted}</p>
                        <p className="text-xs text-muted-foreground">Accepted</p>
                      </div>
                      <div className="rounded-lg bg-amber-500/10 p-2 text-center">
                        <p className="text-lg font-bold text-amber-600">{promo.stats.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="rounded-lg bg-red-500/10 p-2 text-center">
                        <p className="text-lg font-bold text-red-600">{promo.stats.rejected}</p>
                        <p className="text-xs text-muted-foreground">Rejected</p>
                      </div>
                    </div>

                    {spotsRemaining < 50 && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Running low on spots! Consider adjusting the limit.</span>
                      </div>
                    )}
                    {promo.stats.is_full && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>This promotion is full! No more spots available.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Display Settings Preview */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Display Settings</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Button Text</Label>
                    <p className="text-sm font-medium text-foreground">{promo.button_text}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CTA Button Text</Label>
                    <p className="text-sm font-medium text-foreground">{promo.cta_button_text}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Highlight Text</Label>
                    <p className="text-sm text-foreground">{promo.highlight_text}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Empty state */}
      {promotions.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">No promotions found</h3>
            <p className="mt-2 text-muted-foreground">There are no promotional offers configured yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Reset Counter Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Counter</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the spots counter for &quot;{selectedPromotion?.promotion_title}&quot;? This will not affect existing enrolled suppliers, but will show the full capacity as available on the pricing page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetCounter}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to 0
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Promotion Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promotion Settings</DialogTitle>
            <DialogDescription>
              Modify the configuration for the special promotional offer.
            </DialogDescription>
          </DialogHeader>
          {editPromoData && (
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Promotion Title</Label>
                <Input
                  id="edit-title"
                  value={editPromoData.promotion_title}
                  onChange={(e) => setEditPromoData({ ...editPromoData, promotion_title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-desc">Short Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editPromoData.short_description}
                  onChange={(e) => setEditPromoData({ ...editPromoData, short_description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-plan">Linked Plan</Label>
                  <Select
                    value={String(editPromoData.plan_id)}
                    onValueChange={(val) => setEditPromoData({ ...editPromoData, plan_id: Number(val) })}
                  >
                    <SelectTrigger id="edit-plan">
                      <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={String(plan.id)}>
                          {plan.name} (${parseFloat(plan.monthly_price?.amount || "0").toFixed(0)}/mo)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-slots">Max Spots / Slots</Label>
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
                  <Label htmlFor="edit-duration">Duration (Months Free)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={editPromoData.duration_months}
                    onChange={(e) => setEditPromoData({ ...editPromoData, duration_months: Number(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-expiry">Expires At</Label>
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
                  <Label htmlFor="edit-btn-text">Button Text (Pricing Card)</Label>
                  <Input
                    id="edit-btn-text"
                    value={editPromoData.button_text}
                    onChange={(e) => setEditPromoData({ ...editPromoData, button_text: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-cta-text">CTA Button Text (Sign Up)</Label>
                  <Input
                    id="edit-cta-text"
                    value={editPromoData.cta_button_text}
                    onChange={(e) => setEditPromoData({ ...editPromoData, cta_button_text: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-highlight">Highlight Text</Label>
                <Textarea
                  id="edit-highlight"
                  value={editPromoData.highlight_text}
                  onChange={(e) => setEditPromoData({ ...editPromoData, highlight_text: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>Promotion Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Whether this promotional offer is visible and active on the platform.
                  </p>
                </div>
                <Switch
                  checked={editPromoData.status}
                  onCheckedChange={(checked) => setEditPromoData({ ...editPromoData, status: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePromotion} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
