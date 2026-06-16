"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n"
import { PayPalButton } from "@/components/payment/paypal-button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { Check, X, ArrowRight, Shield, HelpCircle, Sparkles, Users, CheckCircle, AlertCircle, X as XIcon, Loader2 } from "lucide-react"
import { fetchPublicPlans, type PublicPlan } from "@/lib/api/public-plans"
import { fetchActivePromotion, type ActivePromotion } from "@/lib/api/public-promotions"

import { useRouter } from "next/navigation"

interface PlanOption {
  name: string;
  price: number;
  cycle: "monthly" | "yearly";
}

export default function PricingPage() {
  const { t } = useTranslation()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "error">("idle")
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  // Dynamic plans from backend
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(null)
  const [promotionLoading, setPromotionLoading] = useState(true)

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

  const handlePlanSelect = (planName: string, price: number) => {
    setSelectedPlan({
      name: planName,
      price,
      cycle: billingCycle,
    })
    setPaymentStatus("idle")
    setTransactionId(null)
    setErrorMessage(null)
  }

  const handlePaymentSuccess = (id: string) => {
    setPaymentStatus("success")
    setTransactionId(id)
    setTimeout(() => {
      router.push(`/dashboard/manufacturer/subscription?transactionId=${id}`)
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 lg:py-24">
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

        {/* Special Launch Plan - Dynamic Promotion */}
        {(!promotionLoading && activePromotion) && (
          <section className="py-16 lg:py-20 bg-linear-to-b from-secondary/5 to-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center mb-12">
                <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-4">
                  <Sparkles className="mr-1.5 h-3 w-3" />
                  {t?.pricing?.founding?.badge || "Limited Time Offer"}
                </Badge>
                <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">
                  {activePromotion.promotion_title || t?.pricing?.founding?.title || "Join as a Founding Manufacturer"}
                </h2>
                <p className="mt-4 text-muted-foreground">
                  {activePromotion.short_description}
                </p>
              </div>

              <div className="max-w-lg mx-auto">
                <div className="relative rounded-2xl border-2 border-secondary bg-card p-8 shadow-lg">
                  <Badge className="absolute -top-3 left-6 bg-secondary text-secondary-foreground">
                    <Users className="mr-1.5 h-3 w-3" />
                    First {activePromotion.slots} Only
                  </Badge>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                      <Sparkles className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{activePromotion.promotion_title}</h3>
                      <p className="text-sm text-muted-foreground">Early Supplier Program</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">$0</span>
                      <span className="text-muted-foreground">for {activePromotion.duration_months} months</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm line-through text-muted-foreground">
                        ${parsePrice(activePromotion.plan.monthly_price.amount).toFixed(0)}/mo
                      </span>
                      <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary">
                        Save ${(parsePrice(activePromotion.plan.monthly_price.amount) * activePromotion.duration_months).toFixed(0)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-secondary font-medium">No credit card required</p>
                  </div>
                  <div className="mb-4 rounded-lg bg-secondary/10 p-3 border border-secondary/20">
                    <p className="text-sm text-foreground">
                      {activePromotion.highlight_text || `Get full ${activePromotion.plan.name} plan features free for ${activePromotion.duration_months} months.`}
                    </p>
                  </div>
                  
                  {/* Spots remaining section */}
                  <div className="mb-6 rounded-lg bg-muted/50 p-3 border border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Spots remaining:</span>
                      <span className="font-semibold text-secondary">{activePromotion.stats.spots_remaining} / {activePromotion.slots}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-secondary/20 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-secondary transition-all" 
                        style={{ width: `${activePromotion.stats.fill_percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="text-foreground">Full {activePromotion.plan.name} Features</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="text-foreground font-medium">Free for {activePromotion.duration_months} months</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="text-foreground">Priority search visibility</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="text-foreground font-medium">Featured supplier badge</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    onClick={() => router.push(`/auth/signup?role=manufacturer&plan=${activePromotion.plan.id}&promo=${activePromotion.id}`)}
                    disabled={activePromotion.stats.is_full}
                  >
                    {activePromotion.stats.is_full ? "Promotion Full" : (activePromotion.cta_button_text || "Apply as Founding Member")}
                    {!activePromotion.stats.is_full && <ArrowRight className="h-4 w-4" />}
                  </Button>
                  <p className="mt-3 text-xs text-center text-muted-foreground">
                    Subject to admin review and approval
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pricing Toggle & Cards */}
        <section className="py-16 lg:py-24">
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
                              {(t?.pricing?.paidPlans as any)?.free || "Free"}
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
                          if (planIsFree) {
                            router.push("/auth/signup?role=manufacturer&plan=free")
                          } else if (currentPrice > 0) {
                            handlePlanSelect(plan.name, currentPrice)
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
                                {feature.features.name}
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
                <p className="text-muted-foreground">{(t?.pricing?.paidPlans as any)?.noPlans || "No pricing plans available at this time."}</p>
              </div>
            )}

            {/* Approval Notice */}
            <div className="mx-auto mt-12 max-w-2xl rounded-xl bg-secondary/10 p-6 text-center">
              <Shield className="mx-auto h-8 w-8 text-secondary" />
              <h3 className="mt-4 font-semibold text-foreground">{t?.pricing?.approval?.title || "Approval Required"}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t?.pricing?.approval?.description || "Payment does not automatically publish your profile. All manufacturer accounts go through a review process before becoming visible to buyers. This ensures quality and trust on the platform."}
              </p>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="bg-muted/50 py-16 lg:py-24">
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
        <section className="py-16 lg:py-24">
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
                  a: t?.pricing?.faq?.a1 || "No. Payment creates your manufacturer account, but your profile must still go through our review and approval process before it becomes visible to buyers. This typically takes 2-5 business days after you submit your complete profile."
                },
                {
                  q: t?.pricing?.faq?.q2 || "What happens if my profile is not approved?",
                  a: t?.pricing?.faq?.a2 || "If your profile doesn't meet our requirements, we'll provide specific feedback on what needs to be updated. You can make the necessary changes and resubmit. If approval is ultimately not possible, we offer a full refund within 30 days."
                },
                {
                  q: t?.pricing?.faq?.q3 || "Can I upgrade or downgrade my plan?",
                  a: t?.pricing?.faq?.a3 || "Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate applies at your next billing cycle."
                },
                {
                  q: t?.pricing?.faq?.q4 || "What is the Founding Manufacturer program?",
                  a: t?.pricing?.faq?.a4 || "The Founding Manufacturer program is a limited offer for the first 300 manufacturers who join SourceNest. As a founding member, you get 6 months of free access to our full Growth plan ($299/month value) - including up to 100 products, advanced analytics, priority search visibility, featured supplier badge, and multiple team users. No credit card required to start."
                },
                {
                  q: t?.pricing?.faq?.q5 || "What happens after my 6-month free period ends?",
                  a: t?.pricing?.faq?.a5 || "After your 6-month free period ends, you'll need to choose and pay for one of our plans (Starter, Growth, or Enterprise) to continue using the platform. We'll send you reminders before your free period expires so you have plenty of time to choose the right plan for your business."
                },
                {
                  q: t?.pricing?.faq?.q6 || "Is the Founding Manufacturer program still available?",
                  a: t?.pricing?.faq?.a6 || "The program is available until we reach 300 approved manufacturer registrations (pending applications don't count toward the limit). You can see the remaining spots on our pricing page. Once all spots are filled, the program will close and new manufacturers will need to choose a paid plan."
                },
                {
                  q: t?.pricing?.faq?.q7 || "Are there any commission fees on sales?",
                  a: t?.pricing?.faq?.a7 || "No. SourceNest does not take any commission on deals you close through the platform. Your subscription fee is your only cost."
                },
                {
                  q: t?.pricing?.faq?.q8 || "What payment methods do you accept?",
                  a: t?.pricing?.faq?.a8 || "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. For Enterprise plans, we also offer bank transfer options."
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
        <section className="bg-primary py-16 lg:py-20">
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
                      {t?.pricing?.payment?.redirecting || "Redirecting to sign up..."}
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
                          <p className="mt-1 text-xs sm:text-sm text-red-700 break-word">{errorMessage}</p>
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

                    {/* PayPal Button */}
                    <PayPalButton
                      amount={selectedPlan.price}
                      currency="USD"
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
      </main>
      <Footer />
    </div>
  )
}


