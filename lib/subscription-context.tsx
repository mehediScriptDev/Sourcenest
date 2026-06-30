"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "./auth-context"
import { apiClient } from "@/lib/api/client"

export type PlanId = "free" | "starter" | "growth" | "enterprise"

export interface PlanLimits {
  products: number // -1 means unlimited
  inquiriesPerMonth: number
  messagesPerMonth: number
  teamMembers: number
  catalogUploads: number
}

export interface PlanFeatures {
  companyProfile: boolean
  productListings: boolean
  internalMessaging: boolean
  inquiryInbox: boolean
  rfqReception: boolean
  catalogUpload: boolean
  certificationsSection: boolean
  exportMarketsSection: boolean
  basicAnalytics: boolean
  advancedAnalytics: boolean
  enterpriseAnalytics: boolean
  prioritySearchVisibility: boolean
  premiumSearchPlacement: boolean
  reviewedBadge: boolean
  featuredSupplierBadge: boolean
  multipleTeamUsers: boolean
  prioritySupport: boolean
  dedicatedAccountManager: boolean
  customOnboarding: boolean
  apiAccess: boolean
}

export interface SubscriptionPlan {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number | null
  yearlyPrice: number | null
  limits: PlanLimits
  features: PlanFeatures
  rawFeatures?: Array<{
    id: number
    label?: string
    input_type: string
    value: string
    features?: {
      id: number
      name: string
      key: string
    }
  }>
}

export interface SubscriptionUsage {
  productsUsed: number
  inquiriesThisMonth: number
  messagesThisMonth: number
  teamMembersUsed: number
  catalogsUploaded: number
}

export interface Subscription {
  planId: PlanId
  status: "active" | "trialing" | "past_due" | "canceled" | "expired"
  billingCycle: "monthly" | "yearly"
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  daysRemaining?: number
  priceAmount?: string
  priceCurrency?: string
  autoRenew?: boolean
}

// Plan definitions
const plans: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    description: "For buyers - always free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      products: 0,
      inquiriesPerMonth: -1,
      messagesPerMonth: -1,
      teamMembers: 1,
      catalogUploads: 0
    },
    features: {
      companyProfile: false,
      productListings: false,
      internalMessaging: true,
      inquiryInbox: false,
      rfqReception: false,
      catalogUpload: false,
      certificationsSection: false,
      exportMarketsSection: false,
      basicAnalytics: false,
      advancedAnalytics: false,
      enterpriseAnalytics: false,
      prioritySearchVisibility: false,
      premiumSearchPlacement: false,
      reviewedBadge: false,
      featuredSupplierBadge: false,
      multipleTeamUsers: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
      customOnboarding: false,
      apiAccess: false
    }
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For small manufacturers starting their export journey",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    limits: {
      products: 25,
      inquiriesPerMonth: 50,
      messagesPerMonth: 100,
      teamMembers: 1,
      catalogUploads: 2
    },
    features: {
      companyProfile: true,
      productListings: true,
      internalMessaging: true,
      inquiryInbox: true,
      rfqReception: true,
      catalogUpload: true,
      certificationsSection: true,
      exportMarketsSection: true,
      basicAnalytics: true,
      advancedAnalytics: false,
      enterpriseAnalytics: false,
      prioritySearchVisibility: false,
      premiumSearchPlacement: false,
      reviewedBadge: true,
      featuredSupplierBadge: false,
      multipleTeamUsers: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
      customOnboarding: false,
      apiAccess: false
    }
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "For established manufacturers seeking more exposure",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    limits: {
      products: 100,
      inquiriesPerMonth: 200,
      messagesPerMonth: 500,
      teamMembers: 3,
      catalogUploads: 10
    },
    features: {
      companyProfile: true,
      productListings: true,
      internalMessaging: true,
      inquiryInbox: true,
      rfqReception: true,
      catalogUpload: true,
      certificationsSection: true,
      exportMarketsSection: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      enterpriseAnalytics: false,
      prioritySearchVisibility: true,
      premiumSearchPlacement: false,
      reviewedBadge: true,
      featuredSupplierBadge: true,
      multipleTeamUsers: true,
      prioritySupport: true,
      dedicatedAccountManager: false,
      customOnboarding: false,
      apiAccess: false
    }
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large manufacturers with custom requirements",
    monthlyPrice: null,
    yearlyPrice: null,
    limits: {
      products: -1, // unlimited
      inquiriesPerMonth: -1,
      messagesPerMonth: -1,
      teamMembers: -1,
      catalogUploads: -1
    },
    features: {
      companyProfile: true,
      productListings: true,
      internalMessaging: true,
      inquiryInbox: true,
      rfqReception: true,
      catalogUpload: true,
      certificationsSection: true,
      exportMarketsSection: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      enterpriseAnalytics: true,
      prioritySearchVisibility: true,
      premiumSearchPlacement: true,
      reviewedBadge: true,
      featuredSupplierBadge: true,
      multipleTeamUsers: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
      customOnboarding: true,
      apiAccess: true
    }
  }
}

interface SubscriptionContextType {
  // Current subscription state
  subscription: Subscription | null
  plan: SubscriptionPlan | null
  usage: SubscriptionUsage
  isLoading: boolean
  
  // Subscription checks
  hasFeature: (feature: keyof PlanFeatures) => boolean
  canUseFeature: (feature: keyof PlanFeatures) => { allowed: boolean; reason?: string }
  isWithinLimit: (limitKey: keyof PlanLimits) => boolean
  getRemainingLimit: (limitKey: keyof PlanLimits) => number
  getLimitPercentage: (limitKey: keyof PlanLimits) => number
  
  // Plan information
  getPlan: (planId: PlanId) => SubscriptionPlan
  getAllPlans: () => SubscriptionPlan[]
  getCurrentPlanId: () => PlanId
  
  // Actions (for demo purposes)
  upgradePlan: (planId: PlanId) => Promise<boolean>
  downgradePlan: (planId: PlanId) => Promise<boolean>
  cancelSubscription: () => Promise<boolean>
  subscribeToPlan: (payload: {
    plan_id: number
    payment_method: string
    billing_interval: string
    payment_id: string
    auto_renew: boolean
    paid_amount: number
  }) => Promise<{ success: boolean; message: string }>
  
  // Usage tracking
  incrementUsage: (key: keyof SubscriptionUsage) => void
  resetMonthlyUsage: () => void
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

function transformBackendPlanToSubscriptionPlan(backendPlan: any): SubscriptionPlan {
  const mappedId = backendPlan.name.toLowerCase() as PlanId;
  
  // Fallback default plan configuration
  const defaultPlan = plans[mappedId] || plans.starter;
  
  // Clone limits and features from default fallback definitions
  const limits: PlanLimits = { ...defaultPlan.limits };
  const features: PlanFeatures = { ...defaultPlan.features };

  if (Array.isArray(backendPlan.features)) {
    backendPlan.features.forEach((feature: any) => {
      const key = feature.features?.key;
      const isBoolean = feature.input_type === "boolean";
      const value = feature.value;
      const numericVal = parseInt(value, 10);
      const isEnabled = isBoolean ? value === "1" : !isNaN(numericVal) && numericVal > 0;

      if (key === "product_limit") {
        limits.products = isNaN(numericVal) ? 0 : (numericVal === -1 ? -1 : numericVal);
        if (limits.products > 0 || limits.products === -1) {
          features.productListings = true;
        }
      } else if (key === "team_users_limit") {
        limits.teamMembers = isNaN(numericVal) ? 1 : numericVal;
        if (limits.teamMembers > 1 || limits.teamMembers === -1) {
          features.multipleTeamUsers = true;
        }
      } else if (key === "inquiry_limit" || key === "inquiries_limit") {
        limits.inquiriesPerMonth = isNaN(numericVal) ? -1 : numericVal;
      } else if (key === "message_limit" || key === "messages_limit") {
        limits.messagesPerMonth = isNaN(numericVal) ? -1 : numericVal;
      } else if (key === "company_profile") {
        features.companyProfile = isEnabled;
      } else if (key === "internal_messaging") {
        features.internalMessaging = isEnabled;
      } else if (key === "inquiry_rfq_inbox") {
        features.inquiryInbox = isEnabled;
        features.rfqReception = isEnabled;
      } else if (key === "catalog_upload") {
        features.catalogUpload = isEnabled;
        limits.catalogUploads = isEnabled ? 10 : 0;
      } else if (key === "certifications_section") {
        features.certificationsSection = isEnabled;
      } else if (key === "export_markets_section") {
        features.exportMarketsSection = isEnabled;
      } else if (key === "basic_analytics") {
        features.basicAnalytics = isEnabled;
      } else if (key === "advanced_analytics") {
        features.advancedAnalytics = isEnabled;
      } else if (key === "priority_search_visibility") {
        features.prioritySearchVisibility = isEnabled;
      } else if (key === "featured_supplier_badge") {
        features.featuredSupplierBadge = isEnabled;
      } else if (key === "dedicated_account_manager") {
        features.dedicatedAccountManager = isEnabled;
      } else if (key === "api_access") {
        features.apiAccess = isEnabled;
      }
    });
  }

  // Adjust inquiries / messages based on plans if not defined explicitly by backend features
  if (limits.inquiriesPerMonth === 0) {
    if (mappedId === "starter") limits.inquiriesPerMonth = 50;
    else if (mappedId === "growth") limits.inquiriesPerMonth = 200;
    else if (mappedId === "enterprise") limits.inquiriesPerMonth = -1;
  }
  if (limits.messagesPerMonth === 0) {
    if (mappedId === "starter") limits.messagesPerMonth = 100;
    else if (mappedId === "growth") limits.messagesPerMonth = 500;
    else if (mappedId === "enterprise") limits.messagesPerMonth = -1;
  }

  if (mappedId !== "free") {
    features.reviewedBadge = true;
  }

  return {
    id: mappedId,
    name: backendPlan.name,
    description: backendPlan.description || "",
    monthlyPrice: parseFloat(backendPlan.monthly_price?.amount || "0"),
    yearlyPrice: parseFloat(backendPlan.yearly_price?.amount || "0"),
    limits,
    features,
    rawFeatures: backendPlan.features
  };
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<SubscriptionUsage>({
    productsUsed: 0,
    inquiriesThisMonth: 0,
    messagesThisMonth: 0,
    teamMembersUsed: 1,
    catalogsUploaded: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [availablePlans, setAvailablePlans] = useState<Record<PlanId, SubscriptionPlan>>(plans)

  // Load subscription data based on user
  useEffect(() => {
    const loadSubscription = async () => {
      setIsLoading(true)
      
      if (!user) {
        setSubscription(null)
        setIsLoading(false)
        return
      }

      // For buyers, they always have "free" plan (no subscription needed)
      if (user.role === "buyer") {
        setSubscription(null)
        setIsLoading(false)
        return
      }

      // Fetch from backend
      let subData: any = null
      try {
        const plansResponse = await apiClient.get('/plans').catch((err) => {
          console.error("Failed to fetch plans:", err);
          return null;
        });

        if (plansResponse && plansResponse.data?.success && Array.isArray(plansResponse.data?.data)) {
          const fetchedPlans = plansResponse.data.data;
          const mappedPlans: Record<PlanId, SubscriptionPlan> = { ...plans };
          fetchedPlans.forEach((bp: any) => {
            const sp = transformBackendPlanToSubscriptionPlan(bp);
            if (sp.id) {
              mappedPlans[sp.id] = sp;
            }
          });
          setAvailablePlans(mappedPlans);
        }
      } catch (e) {
        console.error("Error loading plans:", e);
      }

      let hasSubscription = false
      try {
        const response = await apiClient.get('/manufacturer/subscriptions')
        if (response.data?.success && response.data?.data) {
          subData = response.data.data
          let mappedPlanId: PlanId = "growth"
          if (subData.plan?.name) {
            const name = subData.plan.name.toLowerCase()
            if (["starter", "growth", "enterprise"].includes(name)) {
              mappedPlanId = name as PlanId
            }
          }
          
          setSubscription({
            planId: mappedPlanId,
            status: subData.status,
            billingCycle: subData.billing_interval === "year" ? "yearly" : "monthly",
            currentPeriodStart: subData.starts_at,
            currentPeriodEnd: subData.ends_at,
            cancelAtPeriodEnd: !subData.auto_renew,
            daysRemaining: subData.days_remaining,
            priceAmount: subData.billing_interval === "year"
              ? subData.plan?.yearly_price?.amount
              : subData.plan?.monthly_price?.amount,
            priceCurrency: subData.billing_interval === "year"
              ? (subData.plan?.yearly_price?.currency || "USD")
              : (subData.plan?.monthly_price?.currency || "USD"),
            autoRenew: subData.auto_renew
          })
          hasSubscription = true
        } else {
          setSubscription(null)
        }
      } catch (error: any) {
        // A 404 means no subscription yet.
        // A 403 might mean the manufacturer is pending approval or doesn't have access.
        const status = error?.response?.status;
        if (status !== 404 && status !== 403) {
          console.error("Failed to fetch subscription:", error)
        }
        setSubscription(null)
      }

      if (!hasSubscription) {
        try {
          const promoAppRes = await apiClient.get('/manufacturer/promotions/my-application')
          if (promoAppRes.data?.success && promoAppRes.data?.data) {
            const promoAppData = promoAppRes.data.data
            const appStatus = promoAppData.application?.status?.toLowerCase()
            const planName = promoAppData.promotion?.plan?.name?.toLowerCase() || "growth"
            
            let mappedPlanId: PlanId = "growth"
            if (["starter", "growth", "enterprise", "free"].includes(planName)) {
              mappedPlanId = planName as PlanId
            }

            setSubscription({
              planId: mappedPlanId,
              status: appStatus === "approved" ? "active" : "trialing",
              billingCycle: "monthly",
              currentPeriodStart: promoAppData.application?.joined_at || new Date().toISOString().split("T")[0],
              currentPeriodEnd: promoAppData.application?.trial_ends_at || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              cancelAtPeriodEnd: false,
              daysRemaining: 180,
              priceAmount: "0.00",
              priceCurrency: "USD",
              autoRenew: false
            })

            // Construct mock subData so metrics work correctly
            subData = {
              status: appStatus === "approved" ? "active" : "trialing",
              billing_interval: "month",
              starts_at: promoAppData.application?.joined_at || new Date().toISOString().split("T")[0],
              ends_at: promoAppData.application?.trial_ends_at || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              auto_renew: false,
              days_remaining: 180,
              plan: promoAppData.promotion?.plan
            }
          }
        } catch (promoErr) {
          console.error("Failed to fetch promotion application:", promoErr)
        }
      }

      // Fetch dynamic usage metrics from manufacturer dashboard statistics
      let backendProductsCount = subData?.manufacturer?.total_products ?? 0
      let backendInquiriesCount = 0
      let backendMessagesCount = 0

      try {
        const dashResponse = await apiClient.get('/manufacturer/dashboard').catch(() => null)
        if (dashResponse?.data?.success && dashResponse?.data?.data) {
          const dashData = dashResponse.data.data
          backendInquiriesCount = dashData.stats?.new_inquiries_30d?.value ?? 0
          backendMessagesCount = dashData.quick_stats?.unread_messages ?? 0
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err)
      }

      const storedUsage = localStorage.getItem(`sourcenest_usage_${user.id}`)
      if (storedUsage) {
        try {
          const parsedUsage = JSON.parse(storedUsage)
          setUsage({
            ...parsedUsage,
            productsUsed: backendProductsCount,
            inquiriesThisMonth: backendInquiriesCount,
            messagesThisMonth: backendMessagesCount
          })
        } catch {
          setUsage({
            productsUsed: backendProductsCount,
            inquiriesThisMonth: backendInquiriesCount,
            messagesThisMonth: backendMessagesCount,
            teamMembersUsed: 2,
            catalogsUploaded: 3
          })
        }
      } else {
        const defaultUsage: SubscriptionUsage = {
          productsUsed: backendProductsCount,
          inquiriesThisMonth: backendInquiriesCount,
          messagesThisMonth: backendMessagesCount,
          teamMembersUsed: 2,
          catalogsUploaded: 3
        }
        setUsage(defaultUsage)
        if (user.id) {
          localStorage.setItem(`sourcenest_usage_${user.id}`, JSON.stringify(defaultUsage))
        }
      }

      setIsLoading(false)
    }

    loadSubscription()
  }, [user])

  // Get current plan
  const plan = subscription ? availablePlans[subscription.planId] : (user?.role === "buyer" ? availablePlans.free : null)

  // Check if user has a specific feature
  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!plan) return false
    return plan.features[feature]
  }

  // Check if user can use a feature (with reason if not)
  const canUseFeature = (feature: keyof PlanFeatures): { allowed: boolean; reason?: string } => {
    if (!plan) {
      return { allowed: false, reason: "No active subscription" }
    }
    
    if (!plan.features[feature]) {
      return { 
        allowed: false, 
        reason: `This feature is not available on the ${plan.name} plan. Please upgrade to access it.` 
      }
    }

    if (subscription?.status === "past_due") {
      return { allowed: false, reason: "Please update your payment method to continue using this feature." }
    }

    if (subscription?.status === "expired" || subscription?.status === "canceled") {
      return { allowed: false, reason: "Your subscription has ended. Please renew to access this feature." }
    }

    return { allowed: true }
  }

  // Check if within a specific limit
  const isWithinLimit = (limitKey: keyof PlanLimits): boolean => {
    if (!plan) return false
    
    const limit = plan.limits[limitKey]
    if (limit === -1) return true // unlimited
    
    const usageMap: Record<keyof PlanLimits, keyof SubscriptionUsage> = {
      products: "productsUsed",
      inquiriesPerMonth: "inquiriesThisMonth",
      messagesPerMonth: "messagesThisMonth",
      teamMembers: "teamMembersUsed",
      catalogUploads: "catalogsUploaded"
    }
    
    const currentUsage = usage[usageMap[limitKey]]
    return currentUsage < limit
  }

  // Get remaining amount for a limit
  const getRemainingLimit = (limitKey: keyof PlanLimits): number => {
    if (!plan) return 0
    
    const limit = plan.limits[limitKey]
    if (limit === -1) return -1 // unlimited
    
    const usageMap: Record<keyof PlanLimits, keyof SubscriptionUsage> = {
      products: "productsUsed",
      inquiriesPerMonth: "inquiriesThisMonth",
      messagesPerMonth: "messagesThisMonth",
      teamMembers: "teamMembersUsed",
      catalogUploads: "catalogsUploaded"
    }
    
    const currentUsage = usage[usageMap[limitKey]]
    return Math.max(0, limit - currentUsage)
  }

  // Get usage percentage for a limit
  const getLimitPercentage = (limitKey: keyof PlanLimits): number => {
    if (!plan) return 0
    
    const limit = plan.limits[limitKey]
    if (limit === -1) return 0 // unlimited shows as 0%
    
    const usageMap: Record<keyof PlanLimits, keyof SubscriptionUsage> = {
      products: "productsUsed",
      inquiriesPerMonth: "inquiriesThisMonth",
      messagesPerMonth: "messagesThisMonth",
      teamMembers: "teamMembersUsed",
      catalogUploads: "catalogsUploaded"
    }
    
    const currentUsage = usage[usageMap[limitKey]]
    return Math.min(100, (currentUsage / limit) * 100)
  }

  // Get a specific plan
  const getPlan = (planId: PlanId): SubscriptionPlan => availablePlans[planId]

  // Get all plans
  const getAllPlans = (): SubscriptionPlan[] => Object.values(availablePlans)

  // Get current plan ID
  const getCurrentPlanId = (): PlanId => {
    if (subscription) return subscription.planId
    if (user?.role === "buyer") return "free"
    return "starter"
  }

  // Upgrade plan
  const upgradePlan = async (planId: PlanId): Promise<boolean> => {
    if (!user) return false
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newSub: Subscription = {
      planId,
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: new Date().toISOString().split("T")[0],
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      cancelAtPeriodEnd: false
    }
    
    setSubscription(newSub)
    localStorage.setItem(`sourcenest_subscription_${user.id}`, JSON.stringify(newSub))
    
    return true
  }

  // Downgrade plan
  const downgradePlan = async (planId: PlanId): Promise<boolean> => {
    if (!user || !subscription) return false
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newSub: Subscription = {
      ...subscription,
      planId,
      cancelAtPeriodEnd: false
    }
    
    setSubscription(newSub)
    localStorage.setItem(`sourcenest_subscription_${user.id}`, JSON.stringify(newSub))
    
    return true
  }

  // Cancel subscription
  const cancelSubscription = async (): Promise<boolean> => {
    if (!user || !subscription) return false
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newSub: Subscription = {
      ...subscription,
      cancelAtPeriodEnd: true
    }
    
    setSubscription(newSub)
    localStorage.setItem(`sourcenest_subscription_${user.id}`, JSON.stringify(newSub))
    
    return true
  }

  // Subscribe to plan via backend
  const subscribeToPlan = async (payload: {
    plan_id: number
    payment_method: string
    billing_interval: string
    payment_id: string
    auto_renew: boolean
    paid_amount: number
  }): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("[SubscriptionContext] POST /manufacturer/subscriptions/subscribe", payload)
      const response = await apiClient.post('/manufacturer/subscriptions/subscribe', payload)
      console.log("[SubscriptionContext] Subscribe response:", response.data)
      const success = response?.data?.success ?? true
      const message = response?.data?.message || "Subscription activated successfully"

      // On success, re-fetch the subscription from the backend so the UI updates
      if (success) {
        try {
          console.log("[SubscriptionContext] Re-fetching subscription after successful subscribe...")
          const subResponse = await apiClient.get('/manufacturer/subscriptions')
          console.log("[SubscriptionContext] Refetch response:", subResponse.data)
          if (subResponse.data?.success && subResponse.data?.data) {
            const subData = subResponse.data.data
            let mappedPlanId: PlanId = "growth"
            if (subData.plan?.name) {
              const name = subData.plan.name.toLowerCase()
              if (["starter", "growth", "enterprise"].includes(name)) {
                mappedPlanId = name as PlanId
              }
            }
            console.log("[SubscriptionContext] Setting subscription state with planId:", mappedPlanId, "status:", subData.status)
            setSubscription({
              planId: mappedPlanId,
              status: subData.status,
              billingCycle: subData.billing_interval === "year" ? "yearly" : "monthly",
              currentPeriodStart: subData.starts_at,
              currentPeriodEnd: subData.ends_at,
              cancelAtPeriodEnd: !subData.auto_renew,
              daysRemaining: subData.days_remaining,
              priceAmount: subData.billing_interval === "year"
                ? subData.plan?.yearly_price?.amount
                : subData.plan?.monthly_price?.amount,
              priceCurrency: subData.billing_interval === "year"
                ? (subData.plan?.yearly_price?.currency || "USD")
                : (subData.plan?.monthly_price?.currency || "USD"),
              autoRenew: subData.auto_renew
            })
          } else {
            console.warn("[SubscriptionContext] Refetch returned no subscription data")
          }
        } catch (refetchErr) {
          console.error("[SubscriptionContext] Failed to refetch subscription after subscribe:", refetchErr)
        }
      }

      return { success, message }
    } catch (error: any) {
      console.error("[SubscriptionContext] Subscribe API error:", error?.response?.data || error)
      const msg = error?.response?.data?.message || "Failed to activate subscription"
      return { success: false, message: msg }
    }
  }

  // Increment usage
  const incrementUsage = (key: keyof SubscriptionUsage) => {
    if (!user) return
    
    setUsage(prev => {
      const newUsage = { ...prev, [key]: prev[key] + 1 }
      localStorage.setItem(`sourcenest_usage_${user.id}`, JSON.stringify(newUsage))
      return newUsage
    })
  }

  // Reset monthly usage (would be called by a cron job in production)
  const resetMonthlyUsage = () => {
    if (!user) return
    
    setUsage(prev => {
      const newUsage = {
        ...prev,
        inquiriesThisMonth: 0,
        messagesThisMonth: 0
      }
      localStorage.setItem(`sourcenest_usage_${user.id}`, JSON.stringify(newUsage))
      return newUsage
    })
  }

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      plan,
      usage,
      isLoading,
      hasFeature,
      canUseFeature,
      isWithinLimit,
      getRemainingLimit,
      getLimitPercentage,
      getPlan,
      getAllPlans,
      getCurrentPlanId,
      upgradePlan,
      downgradePlan,
      cancelSubscription,
      subscribeToPlan,
      incrementUsage,
      resetMonthlyUsage
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

// Helper hook for checking feature access
export function useFeatureAccess(feature: keyof PlanFeatures) {
  const { hasFeature, canUseFeature, plan } = useSubscription()
  const access = canUseFeature(feature)
  
  return {
    hasAccess: access.allowed,
    reason: access.reason,
    planName: plan?.name,
    featureEnabled: hasFeature(feature)
  }
}

// Helper hook for checking limits
export function useLimitCheck(limitKey: keyof PlanLimits) {
  const { isWithinLimit, getRemainingLimit, getLimitPercentage, plan } = useSubscription()
  
  const limit = plan?.limits[limitKey] ?? 0
  const isUnlimited = limit === -1
  
  return {
    isWithinLimit: isWithinLimit(limitKey),
    remaining: getRemainingLimit(limitKey),
    percentage: getLimitPercentage(limitKey),
    limit: isUnlimited ? "Unlimited" : limit,
    isUnlimited
  }
}
