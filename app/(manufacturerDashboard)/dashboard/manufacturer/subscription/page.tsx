"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSubscription, PlanId } from "@/lib/subscription-context"
import { toast } from "sonner"
import { 
  Check, 
  AlertCircle, 
  Zap, 
  Package, 
  Eye, 
  MessageSquare, 
  Crown, 
  Loader2 
} from "lucide-react"

export default function SubscriptionPage() {
  const { 
    subscription, 
    plan, 
    usage, 
    isLoading,
    getAllPlans,
    getCurrentPlanId,
    getLimitPercentage,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    subscribeToPlan
  } = useSubscription()

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }



  const [upgrading, setUpgrading] = useState<PlanId | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)

  const allPlans = getAllPlans().filter(p => p.id !== "free") // Exclude free plan for manufacturers
  const currentPlanId = getCurrentPlanId()

  // Use refs for stable references in useEffect to avoid dependency array size issues
  const subscribeToPlanRef = useRef(subscribeToPlan)
  subscribeToPlanRef.current = subscribeToPlan
  const upgradePlanRef = useRef(upgradePlan)
  upgradePlanRef.current = upgradePlan
  const allPlansRef = useRef(allPlans)
  allPlansRef.current = allPlans
  const currentPlanIdRef = useRef(currentPlanId)
  currentPlanIdRef.current = currentPlanId

  // Track whether we've already processed URL params to prevent double-processing
  const processedRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return
    if (processedRef.current) return
    
    const searchParams = new URLSearchParams(window.location.search)
    const transactionId = searchParams.get('transactionId')
    const planIdParam = searchParams.get('planId')
    const cycleParam = searchParams.get('cycle')
    const priceParam = searchParams.get('price')
    const planParam = searchParams.get('plan') as PlanId
    const promoParam = searchParams.get('promo')

    if (transactionId && planIdParam) {
      processedRef.current = true
      setConfirmingPayment(true)

      const confirmSubscription = async () => {
        // Clear URL params immediately so they don't re-trigger
        window.history.replaceState({}, '', '/dashboard/manufacturer/subscription')

        try {
          const dbPlanId = parseInt(planIdParam, 10);
          const paidAmount = priceParam ? parseFloat(priceParam) : 0;
          const billingInterval = cycleParam === "yearly" ? "year" : "month";

          const payload = {
            plan_id: dbPlanId,
            payment_method: "paypal",
            billing_interval: billingInterval,
            payment_id: transactionId,
            auto_renew: true,
            paid_amount: paidAmount
          };

          console.log("[Subscription] Confirming payment with payload:", payload);

          const result = await subscribeToPlanRef.current(payload);

          console.log("[Subscription] Subscribe API result:", result);

          if (result.success) {
            toast.success("Payment confirmed! Your subscription is now active.");
          } else {
            toast.error(result.message || "Failed to verify payment with the backend.");
          }
        } catch (e) {
          console.error("[Subscription] Error confirming subscription:", e);
          toast.error("An unexpected error occurred while confirming subscription.");
        } finally {
          setConfirmingPayment(false)
        }
      };

      confirmSubscription();
      return;
    }
    
    if (planParam && planParam !== currentPlanIdRef.current) {
      processedRef.current = true
      // Clear params first to prevent infinite loop
      window.history.replaceState({}, '', '/dashboard/manufacturer/subscription')
      
      const applyPromo = async () => {
        setUpgrading(planParam)
        try {
          const targetPlan = allPlansRef.current.find(p => p.id === planParam)
          if (!targetPlan) return
          
          await upgradePlanRef.current(planParam)
          if (promoParam) {
            toast.success(`Founding Manufacturer Promo Applied! You have been upgraded to the ${targetPlan.name} plan.`)
          } else {
            toast.success(`Successfully subscribed to ${targetPlan.name} plan.`)
          }
        } catch {
          toast.error("Failed to apply promotion.")
        } finally {
          setUpgrading(null)
        }
      }
      
      applyPromo()
    }
  }, [isLoading])

  const handlePlanChange = async (planId: PlanId) => {
    setUpgrading(planId)
    try {
      const currentPlan = allPlans.find(p => p.id === currentPlanId)
      const targetPlan = allPlans.find(p => p.id === planId)
      
      if (!currentPlan || !targetPlan) return
      
      const isUpgrade = (targetPlan.monthlyPrice || 0) > (currentPlan.monthlyPrice || 0)
      
      if (isUpgrade) {
        await upgradePlan(planId)
        toast.success(`Successfully upgraded to ${targetPlan.name} plan!`)
      } else {
        await downgradePlan(planId)
        toast.success(`Plan changed to ${targetPlan.name}. Changes will take effect at the end of your billing period.`)
      }
    } catch {
      toast.error("Failed to change plan. Please try again.")
    } finally {
      setUpgrading(null)
    }
  }

  const handleCancelSubscription = async () => {
    setCanceling(true)
    try {
      await cancelSubscription()
      toast.success("Your subscription will be canceled at the end of the current billing period.")
    } catch {
      toast.error("Failed to cancel subscription. Please try again.")
    } finally {
      setCanceling(false)
    }
  }

  if (isLoading || confirmingPayment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        {confirmingPayment && (
          <p className="text-sm text-muted-foreground">Activating your subscription...</p>
        )}
      </div>
    )
  }

  const productLimit = plan?.limits.products ?? 0
  const inquiryLimit = plan?.limits.inquiriesPerMonth ?? 0
  const messageLimit = plan?.limits.messagesPerMonth ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your subscription plan and billing details</p>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-secondary" />
                Current Plan: {plan?.name || "No Plan"}
              </CardTitle>
              <CardDescription>
                {subscription ? (
                  subscription.cancelAtPeriodEnd 
                    ? `Your subscription will end on ${formatDate(subscription.currentPeriodEnd)}`
                    : `Your subscription renews on ${formatDate(subscription.currentPeriodEnd)}`
                ) : (
                  "No active subscription plan"
                )}
                {subscription?.daysRemaining !== undefined && ` (${subscription.daysRemaining} days remaining)`}
              </CardDescription>
            </div>
            <Badge className={
              subscription?.status === "active" ? "bg-secondary text-secondary-foreground" :
              subscription?.status === "past_due" ? "bg-amber-500 text-white" :
              "bg-destructive text-destructive-foreground"
            }>
              {subscription?.cancelAtPeriodEnd ? "Canceling" : 
               subscription?.status === "active" ? "Active" : 
               subscription?.status || "No Subscription"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                Products Used
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold">{usage.productsUsed}</span>
                <span className="text-sm text-muted-foreground">
                  / {productLimit === -1 ? "∞" : productLimit}
                </span>
              </div>
              <Progress value={productLimit === -1 ? 0 : getLimitPercentage("products")} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                Inquiries This Month
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold">{usage.inquiriesThisMonth}</span>
                <span className="text-sm text-muted-foreground">
                  / {inquiryLimit === -1 ? "∞" : inquiryLimit}
                </span>
              </div>
              <Progress value={inquiryLimit === -1 ? 0 : getLimitPercentage("inquiriesPerMonth")} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Messages This Month
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold">{usage.messagesThisMonth}</span>
                <span className="text-sm text-muted-foreground">
                  / {messageLimit === -1 ? "∞" : messageLimit}
                </span>
              </div>
              <Progress value={messageLimit === -1 ? 0 : getLimitPercentage("messagesPerMonth")} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Plans</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {allPlans.map((planOption) => {
            const isCurrentPlan = planOption.id === currentPlanId
            const currentPlanPrice = plan?.monthlyPrice || 0
            const isUpgrade = (planOption.monthlyPrice || 0) > currentPlanPrice
            const isDowngrade = (planOption.monthlyPrice || 0) < currentPlanPrice
            
            return (
              <Card 
                key={planOption.id} 
                className={isCurrentPlan ? "border-secondary ring-1 ring-secondary" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{planOption.name}</CardTitle>
                    {planOption.id === "growth" && !isCurrentPlan && (
                      <Badge className="bg-secondary text-secondary-foreground">Popular</Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge variant="outline">Current</Badge>
                    )}
                  </div>
                  <CardDescription>{planOption.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    {planOption.monthlyPrice !== null ? (
                      <>
                        <span className="text-3xl font-bold">${planOption.monthlyPrice}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    ) : (
                      <span className="text-xl font-semibold">Contact Sales</span>
                    )}
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      {(() => {
                        const productLimitFeature = planOption.rawFeatures?.find(f => f.features?.key === "product_limit");
                        return productLimitFeature?.label || `${planOption.limits.products === -1 ? "Unlimited" : `Up to ${planOption.limits.products}`} products`;
                      })()}
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      {(() => {
                        const inquiriesLimitFeature = planOption.rawFeatures?.find(f => f.features?.key === "inquiries_limit" || f.features?.key === "inquiry_limit");
                        return inquiriesLimitFeature?.label || `${planOption.limits.inquiriesPerMonth === -1 ? "Unlimited" : `${planOption.limits.inquiriesPerMonth}`} inquiries/month`;
                      })()}
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      {(() => {
                        const messagesLimitFeature = planOption.rawFeatures?.find(f => f.features?.key === "messages_limit" || f.features?.key === "message_limit");
                        return messagesLimitFeature?.label || `${planOption.limits.messagesPerMonth === -1 ? "Unlimited" : `${planOption.limits.messagesPerMonth}`} messages/month`;
                      })()}
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      {(() => {
                        const teamLimitFeature = planOption.rawFeatures?.find(f => f.features?.key === "team_users_limit");
                        return teamLimitFeature?.label || `${planOption.limits.teamMembers === -1 ? "Unlimited" : planOption.limits.teamMembers} team member${planOption.limits.teamMembers !== 1 ? "s" : ""}`;
                      })()}
                    </li>
                    {planOption.rawFeatures ? (
                      planOption.rawFeatures
                        .filter((f) => {
                          const key = f.features?.key;
                          return key !== "product_limit" && key !== "team_users_limit" && key !== "inquiry_limit" && key !== "inquiries_limit" && key !== "message_limit" && key !== "messages_limit";
                        })
                        .map((feature) => (
                          <li key={feature.id} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                            <span className="text-foreground">
                              {feature.label || feature.features?.name}
                            </span>
                          </li>
                        ))
                    ) : (
                      <>
                        {planOption.features.advancedAnalytics && (
                          <li className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                            Advanced analytics
                          </li>
                        )}
                        {planOption.features.prioritySearchVisibility && (
                          <li className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                            Priority visibility
                          </li>
                        )}
                        {planOption.features.featuredSupplierBadge && (
                          <li className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                            Featured supplier badge
                          </li>
                        )}
                        {planOption.features.dedicatedAccountManager && (
                          <li className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                            Dedicated account manager
                          </li>
                        )}
                        {planOption.features.apiAccess && (
                          <li className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                            API access
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : planOption.monthlyPrice === null ? (
                    <Button variant="outline" className="w-full">
                      Contact Sales
                    </Button>
                  ) : isUpgrade ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handlePlanChange(planOption.id)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === planOption.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Upgrade
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handlePlanChange(planOption.id)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === planOption.id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Downgrade
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>



      {/* Danger Zone */}
      {subscription && !subscription.cancelAtPeriodEnd && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancel Subscription
            </CardTitle>
            <CardDescription>
              Cancel your subscription. You will retain access until the end of your current billing period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={canceling}
            >
              {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Subscription
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
