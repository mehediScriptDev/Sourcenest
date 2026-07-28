"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/lib/i18n"
import { PayPalButton } from "@/components/payment/paypal-button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { Check, X, ArrowRight, HelpCircle, Sparkles, Users, CheckCircle, AlertCircle, Loader2, XIcon, Factory, LogIn } from "lucide-react"
import { fetchPublicPlans, type PublicPlan } from "@/lib/api/public-plans"
import { fetchActivePromotion, enrollInPromotion, type ActivePromotion } from "@/lib/api/public-promotions"
import { useAuth } from "@/lib/auth-context"

import { useRouter } from "next/navigation"
import { useSubscription, type PlanId, SubscriptionProvider } from "@/lib/subscription-context"
import Swal from "sweetalert2"

interface PlanOption {
  id: string;
  name: string;
  price: number;
  cycle: "monthly" | "yearly";
}

type AuthGateReason = "guest" | "wrongRole"

export default function PricingPage() {
  return (
    <SubscriptionProvider>
      <PricingPageContent />
    </SubscriptionProvider>
  )
}

function PricingPageContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "error">("idle")
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [autoRenew, setAutoRenew] = useState(true)
  const router = useRouter()
  const { upgradePlan } = useSubscription()

  // Dynamic plans from backend
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(null)
  const [promotionLoading, setPromotionLoading] = useState(true)

  const [authGateOpen, setAuthGateOpen] = useState(false)
  const [authGateReason, setAuthGateReason] = useState<AuthGateReason>("guest")
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)
  const [pendingPromoId, setPendingPromoId] = useState<string | null>(null)

  /** Only logged-in manufacturers may pay or enroll. Everyone else gets the auth gate modal. */
  const ensureManufacturerAccess = (planId?: string, promoId?: string): boolean => {
    if (!user) {
      setAuthGateReason("guest")
      setPendingPlanId(planId ?? null)
      setPendingPromoId(promoId ?? null)
      setAuthGateOpen(true)
      return false
    }
    if (user.role !== "manufacturer") {
      setAuthGateReason("wrongRole")
      setPendingPlanId(planId ?? null)
      setPendingPromoId(promoId ?? null)
      setAuthGateOpen(true)
      return false
    }
    return true
  }

  const signupHref = (() => {
    const params = new URLSearchParams({ role: "manufacturer" })
    if (pendingPlanId) params.set("plan", pendingPlanId)
    if (pendingPromoId) params.set("promo", pendingPromoId)
    return `/auth/signup?${params.toString()}`
  })()

  const signinHref = `/auth/signin?callbackUrl=${encodeURIComponent(
    pendingPlanId ? `/pricing?plan=${encodeURIComponent(pendingPlanId)}` : "/pricing"
  )}`

  useEffect(() => {
    let cancelled = false
    async function loadPlans() {
      setPlansLoading(true)
      const res = await fetchPublicPlans()
      if (cancelled) return
      if (res.success) {
        // Only show active plans (status === 1)
        setPlans(res.data.filter((p) => p.status === 1))
      }
      setPlansLoading(false)

      const promoRes = await fetchActivePromotion()
      if (!cancelled) {
        if (promoRes.success && promoRes.data) {
          setActivePromotion(promoRes.data)
        }
        setPromotionLoading(false)
      }
    }
    void loadPlans()
    return () => { cancelled = true }
  }, [])

  const handlePlanSelect = (planId: string, planName: string, price: number) => {
    setSelectedPlan({
      id: planId,
      name: planName,
      price,
      cycle: billingCycle,
    })
    setPaymentStatus("idle")
    setTransactionId(null)
    setErrorMessage(null)
    setAutoRenew(true)
  }

  const handlePaymentSuccess = (id: string, meta?: { vaultId?: string | null }) => {
    setPaymentStatus("success")
    setTransactionId(id)
    const vaultParam = meta?.vaultId ? `&paypalVaultId=${encodeURIComponent(meta.vaultId)}` : ""
    setTimeout(() => {
      router.push(
        `/dashboard/manufacturer/subscription?transactionId=${id}&planId=${selectedPlan?.id || ""}&cycle=${billingCycle}&price=${selectedPlan?.price || ""}&autoRenew=${autoRenew ? "1" : "0"}${vaultParam}`
      )
    }, 3000)
  }

  const handlePaymentError = (error: string) => {
    setPaymentStatus("error")
    setErrorMessage(error)
  }

  const handleClosePayment = () => {
    setSelectedPlan(null)
    setPaymentStatus("idle")
    setTransactionId(null)
    setErrorMessage(null)
  }

  /** Helper: parse price amount string to number */
  const parsePrice = (amount: string): number => {
    const num = parseFloat(amount)
    return Number.isFinite(num) ? num : 0
  }

  /** Check if a plan is "free" (both monthly and yearly are 0) */
  const isFree = (plan: PublicPlan): boolean => {
    return parsePrice(plan.monthly_price.amount) === 0 && parsePrice(plan.yearly_price.amount) === 0
  }

  /** Check if a feature is enabled (boolean with value "1") */
  const isFeatureEnabled = (feature: PublicPlan["features"][number]): boolean => {
    if (feature.input_type === "boolean") {
      return feature.value === "1"
    }
    return feature.value.trim().length > 0
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-serif text-4xl font-medium tracking-tight text-primary-foreground sm:text-5xl">
                {t?.pricing?.hero?.title || "Simple, Transparent Pricing"}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
                {t?.pricing?.hero?.subtitle || "Choose the plan that fits your business. All plans include admin review and approval process."}
              </p>
              <p className="mt-2 text-sm text-primary-foreground/60">
                {t?.pricing?.hero?.buyersNote || "Pricing is for manufacturers only. Buyers use SourceNest for free."}
              </p>
            </div>
          </div>
        </section>

        {/* Special Launch Plan - Founding Manufacturer */}
        {!promotionLoading && activePromotion && (
          <section className="py-8 sm:py-12 lg:py-16 bg-linear-to-b from-secondary/5 to-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center mb-12">
                <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4">
                  <Sparkles className="mr-1.5 inline-block h-3 w-3" />
                  First 300 Manufacturers Only
                </Badge>
                <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">
                  Founding Manufacturer
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Early Supplier Program
                </p>
              </div>

              <div className="max-w-lg mx-auto">
                <div className="relative rounded-2xl border-2 border-secondary bg-card p-8 shadow-lg">
                  <Badge className="absolute -top-3 left-6 bg-secondary text-secondary-foreground">
                    <Users className="mr-1.5 inline-block h-3 w-3" />
                    First 300 Manufacturers Only
                  </Badge>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                      <Sparkles className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Founding Manufacturer</h3>
                      <p className="text-sm text-muted-foreground">Early Supplier Program</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">$0</span>
                      <span className="text-muted-foreground">for 6 months</span>
                    </div>
                    <p className="mt-2 text-sm text-secondary font-medium">No credit card required</p>
                  </div>

                  <div className="mb-4 rounded-lg bg-secondary/10 p-4 border border-secondary/20">
                    <p className="text-sm text-foreground leading-relaxed">
                      Get full Growth Plan features free for 6 months. <br/>
                      <span className="text-muted-foreground mt-1 inline-block">After the trial, continue with any paid plan to keep your manufacturer account active.</span>
                    </p>
                  </div>
                  
                  {/* Spots remaining section */}
                  <div className="mb-6 rounded-lg bg-muted/50 p-4 border border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Spots remaining:</span>
                      <span className="font-semibold text-secondary">
                        {activePromotion ? `${activePromotion.stats.spots_remaining} / ${activePromotion.slots}` : '0 / 0'}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-secondary/20 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-secondary transition-all" 
                        style={{ width: activePromotion ? `${activePromotion.stats.fill_percentage}%` : '0%' }}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Included Features</h4>
                    <ul className="space-y-3">
                      {[
                        "Professional company profile",
                        "Up to 100 products",
                        "Internal messaging",
                        "Buyer inquiry inbox",
                        "RFQ reception",
                        "Catalog upload",
                        "Certifications section",
                        "Export markets section",
                        "Advanced analytics",
                        "Priority visibility in manufacturer discovery",
                        "Featured supplier badge"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 py-6 text-base"
                    onClick={() => {
                      const promoPlanId = activePromotion?.plan?.id?.toString()
                      if (!ensureManufacturerAccess(promoPlanId, activePromotion?.id?.toString())) return

                      Swal.fire({
                        title: 'Apply Founding Manufacturer Promo?',
                        text: 'You will receive a 6‑month free Growth plan. Continue?',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: 'var(--color-secondary)',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, apply',
                        cancelButtonText: 'Cancel'
                      }).then(async (result) => {
                        if (result.isConfirmed) {
                          Swal.fire({
                            title: 'Applying Promotion...',
                            text: 'Please wait while we register your promotion...',
                            allowOutsideClick: false,
                            didOpen: () => {
                              Swal.showLoading()
                            }
                          })

                          try {
                            if (activePromotion) {
                              const enrollRes = await enrollInPromotion(activePromotion.id)
                              if (enrollRes.success) {
                                const rawPlanName = activePromotion.plan.name.toLowerCase()
                                let matchedPlanId: PlanId = "growth"
                                if (rawPlanName.includes("starter")) matchedPlanId = "starter"
                                else if (rawPlanName.includes("growth")) matchedPlanId = "growth"
                                else if (rawPlanName.includes("enterprise")) matchedPlanId = "enterprise"
                                else if (rawPlanName.includes("free")) matchedPlanId = "free"

                                await upgradePlan(matchedPlanId)

                                Swal.fire({
                                  icon: 'success',
                                  title: 'Promotion Applied!',
                                  text: enrollRes.message || 'Founding Manufacturer Promo Applied!',
                                  confirmButtonColor: 'var(--color-secondary)'
                                }).then(() => {
                                  if (user?.manufacturerStatus === 'approved') {
                                    router.push('/dashboard/manufacturer')
                                  } else {
                                    router.push('/review')
                                  }
                                })
                              } else {
                                Swal.fire({
                                  icon: 'error',
                                  title: 'Failed to Apply',
                                  text: enrollRes.message || 'Failed to apply promo',
                                  confirmButtonColor: '#d33'
                                })
                              }
                            }
                          } catch (e: unknown) {
                            const message = e instanceof Error ? e.message : 'Failed to apply promo'
                            Swal.fire({
                              icon: 'error',
                              title: 'Error',
                              text: message,
                              confirmButtonColor: '#d33'
                            })
                          }
                        }
                      })
                    }}
                    disabled={activePromotion?.stats?.is_full}
                  >
                    {activePromotion?.stats?.is_full ? "Promotion Full" : "Apply as Founding Manufacturer"}
                    {!activePromotion?.stats?.is_full && <ArrowRight className="h-4 w-4" />}
                  </Button>
                  <p className="mt-4 text-xs text-center text-muted-foreground">
                    Subject to admin review and approval.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pricing Toggle & Cards */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">
                {t?.pricing?.paidPlans?.title || "Paid Plans"}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t?.pricing?.paidPlans?.subtitle || "For manufacturers ready to maximize their visibility and reach"}
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-4 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium transition-all",
                    billingCycle === "monthly"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t?.pricing?.paidPlans?.monthly || "Monthly"}
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                    billingCycle === "yearly"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t?.pricing?.paidPlans?.yearly || "Yearly"}
                  <Badge variant="secondary" className="text-xs">{t?.pricing?.paidPlans?.savePercentage || "Save 17%"}</Badge>
                </button>
              </div>
            </div>

            {/* Loading State */}
            {plansLoading && (
              <div className="mt-12 flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Pricing Cards — Dynamic from GET /plans */}
            {!plansLoading && plans.length > 0 && (
              <div className={cn(
                "mt-12 grid gap-8",
                plans.length === 1 ? "max-w-md mx-auto" : plans.length === 2 ? "max-w-3xl mx-auto lg:grid-cols-2" : "lg:grid-cols-3"
              )}>
                {plans.map((plan) => {
                  const monthlyPrice = parsePrice(plan.monthly_price.amount)
                  const yearlyPrice = parsePrice(plan.yearly_price.amount)
                  const currentPrice = billingCycle === "monthly" ? monthlyPrice : yearlyPrice
                  const planIsFree = isFree(plan)
                  const enabledFeatures = plan.features.filter(isFeatureEnabled)

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative rounded-2xl border bg-card p-8",
                        plan.is_popular ? "border-secondary shadow-lg" : "border-border"
                      )}
                    >
                      {plan.is_popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground">
                          {t?.pricing?.paidPlans?.growth?.badge || "Most Popular"}
                        </Badge>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="mt-6">
                        {planIsFree ? (
                          <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-foreground">
                              {t?.pricing?.paidPlans?.free || "Free"}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline">
                              <span className="text-4xl font-bold text-foreground">
                                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                              <span className="ml-2 text-muted-foreground">
                                /{billingCycle === "monthly" ? (t?.pricing?.paidPlans?.monthly || "month") : (t?.pricing?.paidPlans?.yearly || "year")}
                              </span>
                            </div>
                            {billingCycle === "yearly" && yearlyPrice > 0 && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {(t?.pricing?.paidPlans?.billedAnnually || "Billed annually (${price}/month)").replace("${price}", Math.round(yearlyPrice / 12).toString())}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <Button
                        className={cn(
                          "mt-6 w-full gap-2",
                          plan.is_popular && "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        )}
                        variant={plan.is_popular ? "default" : "outline"}
                        onClick={() => {
                          if (!ensureManufacturerAccess(plan.id.toString())) return

                          if (planIsFree) {
                            router.push("/dashboard/manufacturer/subscription")
                          } else if (currentPrice > 0) {
                            handlePlanSelect(plan.id.toString(), plan.name, currentPrice)
                          } else {
                            router.push("/contact?type=sales")
                          }
                        }}
                      >
                        {plan.button_text || "Get Started"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>

                      {/* Feature List */}
                      {enabledFeatures.length > 0 && (
                        <ul className="mt-8 space-y-3">
                          {enabledFeatures.map((feature) => (
                            <li key={feature.id} className="flex items-center gap-3 text-sm">
                              <Check className="h-4 w-4 shrink-0 text-secondary" />
                              <span className="text-foreground">
                                {feature.label || feature.features.name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty state if no plans */}
            {!plansLoading && plans.length === 0 && (
              <div className="mt-12 rounded-xl border border-dashed border-border py-16 text-center">
                <p className="text-muted-foreground">{t?.pricing?.paidPlans?.noPlans || "No pricing plans available at this time."}</p>
              </div>
            )}


          </div>
        </section>

        {/* Feature Comparison */}
        <section className="bg-muted/50 py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">
                {t?.pricing?.comparison?.title || "Compare All Features"}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t?.pricing?.comparison?.subtitle || "See exactly what's included in each plan"}
              </p>
            </div>

            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-150 border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-border p-4 text-left font-medium text-foreground">{t?.pricing?.comparison?.feature || "Feature"}</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="border-b border-border p-4 text-center font-medium text-foreground">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Build a unified feature list across all plans */}
                  {(() => {
                    // Collect all unique features across all plans
                    const featureMap = new Map<number, string>()
                    plans.forEach((plan) => {
                      plan.features.forEach((f) => {
                        if (!featureMap.has(f.features.id)) {
                          featureMap.set(f.features.id, f.features.name)
                        }
                      })
                    })
                    const allFeatures = Array.from(featureMap.entries())

                    return allFeatures.map(([featureId, featureName]) => (
                      <tr key={featureId}>
                        <td className="border-b border-border p-4 text-muted-foreground">{featureName}</td>
                        {plans.map((plan) => {
                          const match = plan.features.find((f) => f.features.id === featureId)
                          const enabled = match ? isFeatureEnabled(match) : false
                          return (
                            <td key={plan.id} className="border-b border-border p-4 text-center">
                              {enabled ? (
                                <Check className="mx-auto h-4 w-4 text-secondary" />
                              ) : (
                                <X className="mx-auto h-4 w-4 text-muted-foreground/50" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <HelpCircle className="mx-auto h-10 w-10 text-secondary" />
              <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight text-foreground">
                {t?.pricing?.faq?.title || "Pricing FAQ"}
              </h2>
            </div>

            <Accordion type="single" collapsible className="mt-12">
              {[
                {
                  q: t?.pricing?.faq?.q1 || "Does payment automatically publish my profile?",
                  a: t?.pricing?.faq?.a1 || "Yes. After your manufacturer profile has been reviewed and approved, you'll be redirected to the subscription page. Once you choose a plan (including the Free Plan, if available) and complete the activation process, your profile will automatically become live and visible to buyers."
                },
                {
                  q: t?.pricing?.faq?.q2 || "What happens if my profile is not approved?",
                  a: t?.pricing?.faq?.a2 || "If your profile isn't approved, it won't be published on SourceNest. You'll receive the reason for the rejection and can update the requested information before submitting it for review again."
                },
                {
                  q: t?.pricing?.faq?.q3 || "Can I upgrade or downgrade my plan?",
                  a: t?.pricing?.faq?.a3 || "Yes. You can change your subscription plan at any time from your dashboard. Your new plan will take effect according to your billing cycle."
                },
                {
                  q: t?.pricing?.faq?.q4 || "What is the Founding Manufacturer Program?",
                  a: t?.pricing?.faq?.a4 || "The Founding Manufacturer Program gives selected manufacturers access to SourceNest with 6 months of free access. After approval, eligible manufacturers can activate this offer by selecting the Free Plan."
                },
                {
                  q: t?.pricing?.faq?.q5 || "What happens after my 6-month free period ends?",
                  a: t?.pricing?.faq?.a5 || "Before your free period expires, we'll notify you. To keep your profile active and visible to buyers, you'll simply choose one of the available paid subscription plans."
                },
                {
                  q: t?.pricing?.faq?.q6 || "Is the Founding Manufacturer Program still available?",
                  a: t?.pricing?.faq?.a6 || "The program is available only for a limited number of manufacturers. Once all available spots have been filled, the offer will no longer be available."
                },
                {
                  q: t?.pricing?.faq?.q7 || "Are there any commission fees on sales?",
                  a: t?.pricing?.faq?.a7 || "No. SourceNest does not charge any commission on your sales. You only pay for your subscription plan."
                },
                {
                  q: t?.pricing?.faq?.q8 || "What payment methods do you accept?",
                  a: t?.pricing?.faq?.a8 || "We accept major credit and debit cards, PayPal, and any additional payment methods displayed during checkout."
                },
                {
                  q: t?.pricing?.faq?.q9 || "When do I choose my subscription plan?",
                  a: t?.pricing?.faq?.a9 || "You'll choose your subscription plan only after your manufacturer profile has been reviewed and approved. At that stage, you'll see all available plans and can activate the one that best fits your business."
                },
                {
                  q: t?.pricing?.faq?.q10 || "Can I choose the Free Plan after approval?",
                  a: t?.pricing?.faq?.a10 || "Yes. If you're eligible, the Free Plan will appear together with the paid plans after your profile is approved. Simply choose the plan you want to activate."
                },
                {
                  q: t?.pricing?.faq?.q11 || "What happens if I don't choose a plan after approval?",
                  a: t?.pricing?.faq?.a11 || "Your profile will remain approved, but it won't become visible to buyers until you activate a subscription plan."
                }
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-base font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl font-medium tracking-tight text-primary-foreground">
                {t?.pricing?.cta?.title || "Ready to Get Started?"}
              </h2>
              <p className="mt-4 text-primary-foreground/80">
                {t?.pricing?.cta?.subtitle || "Join SourceNest and start reaching global buyers today."}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row w-full max-w-lg mx-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto justify-center gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                  <Link href="/auth/signup?role=manufacturer" className="w-full text-center sm:w-auto">
                    {t?.pricing?.cta?.createAccount || "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link href="/contact?type=sales" className="w-full text-center sm:w-auto">
                    {t?.pricing?.cta?.talkToSales || "Talk to Sales"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="w-full max-w-sm rounded-lg bg-white shadow-xl overflow-hidden">
              <div className="border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{t?.pricing?.payment?.title || "Complete Your Payment"}</h2>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600">{selectedPlan.name} {t?.pricing?.payment?.plan || "Plan"}</p>
                  </div>
                  <button
                    onClick={handleClosePayment}
                    className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-6">
                {/* Success State */}
                {paymentStatus === "success" && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-600" />
                    <h3 className="mt-3 font-semibold text-green-900 text-sm sm:text-base">{t?.pricing?.payment?.success || "Payment Successful!"}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-green-700 break-all">
                      {t?.pricing?.payment?.transactionId || "Transaction ID:"} <span className="font-mono text-xs">{transactionId}</span>
                    </p>
                    <p className="mt-4 text-xs text-green-600">
                      {t?.pricing?.payment?.redirectingDashboard || "Redirecting to your dashboard..."}
                    </p>
                  </div>
                )}

                {/* Error State */}
                {paymentStatus === "error" && (
                  <div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 mb-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-600 mt-0.5" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-red-900 text-sm">{t?.pricing?.payment?.failed || "Payment Failed"}</h3>
                          <p className="mt-1 text-xs sm:text-sm text-red-700 wrap-break-word">{errorMessage}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentStatus("idle")}
                      className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
                    >
                      {t?.pricing?.payment?.tryAgain || "Try Again"}
                    </button>
                  </div>
                )}

                {/* Payment Form */}
                {paymentStatus === "idle" && (
                  <div className="space-y-4">
                    {/* Price Summary */}
                    <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {(t?.pricing?.payment?.priceInfo || "{plan} Plan ({cycle})")
                            .replace("{plan}", selectedPlan.name)
                            .replace("{cycle}", selectedPlan.cycle)}
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-gray-900 shrink-0">
                          ${selectedPlan.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                        checked={autoRenew}
                        onChange={(e) => setAutoRenew(e.target.checked)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-900">
                          {t?.mfg?.subscription?.autoRenewTitle || "Auto-renew"}
                        </span>
                        <span className="mt-1 block text-xs text-gray-600 leading-relaxed">
                          {autoRenew
                            ? (t?.mfg?.subscription?.autoRenewVaultHint || "PayPal will ask to save your payment method for renewals.")
                            : (t?.mfg?.subscription?.autoRenewManualHint || "One-time payment only. You can enable auto-renew later from this page.")}
                        </span>
                      </span>
                    </label>

                    {/* PayPal Button — remount when vault preference changes */}
                    <PayPalButton
                      key={autoRenew ? "vault" : "one-time"}
                      amount={selectedPlan.price}
                      currency="USD"
                      vault={autoRenew}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />

                    {/* Info Text */}
                    <div className="rounded-lg bg-blue-50 p-2 sm:p-3 border border-blue-200">
                      <p className="text-xs text-blue-900 leading-relaxed">
                        {t?.pricing?.payment?.processingTime || "💡 This typically takes 2-5 business days."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Auth gate — must be a logged-in manufacturer before payment / enroll */}
        <Dialog open={authGateOpen} onOpenChange={setAuthGateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="sm:text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                {authGateReason === "guest" ? (
                  <LogIn className="h-6 w-6 text-secondary" />
                ) : (
                  <Factory className="h-6 w-6 text-secondary" />
                )}
              </div>
              <DialogTitle className="text-xl sm:text-center">
                {authGateReason === "guest"
                  ? (t?.pricing?.authGate?.guestTitle || "Manufacturer account required")
                  : (t?.pricing?.authGate?.wrongRoleTitle || "Switch to a manufacturer account")}
              </DialogTitle>
              <DialogDescription className="sm:text-center leading-relaxed">
                {authGateReason === "guest"
                  ? (t?.pricing?.authGate?.guestDescription ||
                      "Pricing and subscriptions are for manufacturers only. Sign in to your manufacturer account, or create one to continue.")
                  : (t?.pricing?.authGate?.wrongRoleDescription ||
                      "You're signed in with an account that isn't a manufacturer. Create a manufacturer account to subscribe, or contact support if you need help.")}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
              {authGateReason === "guest" && (
                <Button className="w-full gap-2" asChild>
                  <Link href={signinHref} onClick={() => setAuthGateOpen(false)}>
                    <LogIn className="h-4 w-4" />
                    {t?.pricing?.authGate?.signIn || "Sign in"}
                  </Link>
                </Button>
              )}
              <Button
                className={cn(
                  "w-full gap-2",
                  authGateReason === "guest" &&
                    "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                )}
                asChild
              >
                <Link href={signupHref} onClick={() => setAuthGateOpen(false)}>
                  <Factory className="h-4 w-4" />
                  {t?.pricing?.authGate?.createManufacturer || "Create manufacturer account"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {authGateReason === "wrongRole" && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact?type=sales" onClick={() => setAuthGateOpen(false)}>
                    {t?.pricing?.authGate?.contactSupport || "Contact support"}
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setAuthGateOpen(false)}
              >
                {t?.pricing?.authGate?.close || "Not now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  )
}