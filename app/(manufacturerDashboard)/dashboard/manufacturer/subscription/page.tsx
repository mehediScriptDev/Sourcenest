"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSubscription, PlanId, SubscriptionPlan } from "@/lib/subscription-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PayPalButton } from "@/components/payment/paypal-button"
import { PayPalVaultSetupButton } from "@/components/payment/paypal-vault-setup-button"
import { Switch } from "@/components/ui/switch"
import Swal from "sweetalert2"
import { useTranslation } from "@/lib/i18n"
import { 
  Check, 
  AlertCircle, 
  Zap, 
  Package, 
  Eye, 
  MessageSquare, 
  Crown, 
  Loader2,
  X as XIcon,
  CheckCircle,
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const MAX_VISIBLE_FEATURES = 5

const localT = {
  en: {
    paymentSuccess: "Payment confirmed! Your subscription is now active.",
    paymentFailedVerify: "Failed to verify payment with the backend.",
    unexpectedErrorConfirm: "An unexpected error occurred while confirming subscription.",
    unableToProcessUpgrade: "Unable to process upgrade. Plan information is missing.",
    upgradeToPlan: "Upgrade to {plan}?",
    upgradeToPlanDesc: "You are upgrading to the <strong>{plan}</strong> plan.",
    amountPer: "Amount: <strong>${price}</strong> per {cycle}",
    paypalPrompt: "You will be asked to complete payment via PayPal.",
    proceedToPayment: "Proceed to Payment",
    cancel: "Cancel",
    unableToProcessSwitch: "Unable to process billing cycle switch. Plan information is missing.",
    switchBilling: "Switch to {cycle} Billing?",
    switchBillingDesc: "You are switching your <strong>{plan}</strong> plan to <strong>{cycle}</strong> billing.",
    newPricePer: "New price: <strong>${price}</strong> per {cycle}",
    unableToProcessChange: "Unable to process plan change. Plan information is missing.",
    downgradeToPlan: "Downgrade to {plan}?",
    downgradeToPlanDesc: "You are downgrading to the <strong>{plan}</strong> plan.",
    downgradeWarning: "⚠️ Some features may become unavailable and your usage limits will be reduced.",
    keepCurrentPlan: "Keep Current Plan",
    failProcessUpgrade: "Failed to process upgrade. Please contact support.",
    cancelSubTitle: "Cancel Subscription?",
    cancelSubDesc: "Are you sure you want to cancel your subscription?<br/><br/>You will retain access to all features until the end of your current billing period ({date}).<br/><br/><span style='color: #dc2626;'>After that, your manufacturer profile and products will no longer be visible to buyers.</span>",
    yesCancel: "Yes, Cancel Subscription",
    keepMyPlan: "Keep My Plan",
    subCanceledTitle: "Subscription Canceled",
    subCanceledDesc: "Your subscription has been canceled. You will retain access until the end of your current billing period.",
    cancelFailedTitle: "Cancellation Failed",
    cancelFailedDesc: "Failed to cancel subscription. Please try again or contact support.",
    errorTitle: "Error",
    unexpectedError: "An unexpected error occurred. Please try again.",
    monthlyCycle: "month",
    yearlyCycle: "year",
    unlimited: "Unlimited",
    upToProducts: "Up to {count} products",
    upToInquiries: "Up to {count} inquiries/month",
    upToMessages: "Up to {count} messages/month",
    teamMembersCount: "{count} team member{plural}",
    advancedAnalytics: "Advanced analytics",
    priorityVisibility: "Priority visibility",
    featuredSupplier: "Featured supplier badge",
    dedicatedManager: "Dedicated account manager",
    apiAccess: "API access",
    switchTo: "Switch to",
    downgradeBtn: "Downgrade",
    completePayment: "Complete your payment to upgrade",
    upgradeSuccessful: "Upgrade Successful!",
    upgradeSuccessfulDesc: "Your plan has been upgraded to {plan}.",
    refreshingSubscription: "Refreshing your subscription...",
    processingUpgrade: "Processing your upgrade...",
    doNotClose: "Please do not close this window.",
    upgradeFailed: "Upgrade Failed",
    tryAgain: "Try Again",
    upgradeImmediately: "💡 Your plan will be upgraded immediately after payment confirmation.",
    autoRenewOnConfirm: "Disable auto-renew for your current plan? You keep access until {date}, then pay manually to continue.",
    autoRenewOffConfirm: "Enable auto-renew for your current plan? Renewals will use your saved PayPal method.",
    yesDisableAutoRenew: "Disable auto-renew",
    yesEnableAutoRenew: "Enable auto-renew",
    showMore: "Show more",
    showLess: "Show less",
  },
  ar: {
    paymentSuccess: "تم تأكيد الدفع! اشتراكك نشط الآن.",
    paymentFailedVerify: "فشل التحقق من الدفع مع النظام الخلفي.",
    unexpectedErrorConfirm: "حدث خطأ غير متوقع أثناء تأكيد الاشتراك.",
    unableToProcessUpgrade: "تعذر معالجة الترقية. معلومات الخطة مفقودة.",
    upgradeToPlan: "ترقية إلى {plan}؟",
    upgradeToPlanDesc: "أنت تقوم بالترقية إلى خطة <strong>{plan}</strong>.",
    amountPer: "المبلغ: <strong>${price}</strong> لكل {cycle}",
    paypalPrompt: "سيُطلب منك إتمام الدفع عبر PayPal.",
    proceedToPayment: "الذهاب إلى الدفع",
    cancel: "إلغاء",
    unableToProcessSwitch: "تعذر معالجة تبديل دورة الفوترة. معلومات الخطة مفقودة.",
    switchBilling: "التبديل إلى الفاتورة {cycle}؟",
    switchBillingDesc: "أنت تقوم بتبديل خطة <strong>{plan}</strong> إلى الفاتورة <strong>{cycle}</strong>.",
    newPricePer: "السعر الجديد: <strong>${price}</strong> لكل {cycle}",
    unableToProcessChange: "تعذر معالجة تغيير الخطة. معلومات الخطة مفقودة.",
    downgradeToPlan: "تخفيض إلى {plan}؟",
    downgradeToPlanDesc: "أنت تقوم بالتخفيض إلى خطة <strong>{plan}</strong>.",
    downgradeWarning: "⚠️ قد تصبح بعض الميزات غير متوفرة وسيتم تقليل حدود الاستخدام الخاصة بك.",
    keepCurrentPlan: "الاحتفاظ بالخطة الحالية",
    failProcessUpgrade: "فشلت معالجة الترقية. يرجى الاتصال بالدعم.",
    cancelSubTitle: "إلغاء الاشتراك؟",
    cancelSubDesc: "هل أنت متأكد أنك تريد إلغاء اشتراكك؟<br/><br/>ستحتفظ بإمكانية الوصول إلى جميع الميزات حتى نهاية فترة الفوترة الحالية ({date}).<br/><br/><span style='color: #dc2626;'>بعد ذلك، لن يكون ملف تعريف المصنع والمنتجات الخاصة بك مرئية للمشترين.</span>",
    yesCancel: "نعم، إلغاء الاشتراك",
    keepMyPlan: "الاحتفاظ بخطتي",
    subCanceledTitle: "تم إلغاء الاشتراك",
    subCanceledDesc: "تم إلغاء اشتراكك. ستحتفظ بحق الوصول حتى نهاية فترة الفوترة الحالية.",
    cancelFailedTitle: "فشل الإلغاء",
    cancelFailedDesc: "فشل إلغاء الاشتراك. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.",
    errorTitle: "خطأ",
    unexpectedError: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    monthlyCycle: "شهر",
    yearlyCycle: "سنة",
    unlimited: "غير محدود",
    upToProducts: "حتى {count} منتج",
    upToInquiries: "حتى {count} استفسار/شهر",
    upToMessages: "حتى {count} رسالة/شهر",
    teamMembersCount: "{count} عضو فريق",
    advancedAnalytics: "تحليلات متقدمة",
    priorityVisibility: "ظهور ذو أولوية",
    featuredSupplier: "شارة مورد مميز",
    dedicatedManager: "مدير حساب مخصص",
    apiAccess: "الوصول إلى واجهة برمجة التطبيقات (API)",
    switchTo: "التبديل إلى",
    downgradeBtn: "تخفيض",
    completePayment: "أكمل الدفع للترقية",
    upgradeSuccessful: "تمت الترقية بنجاح!",
    upgradeSuccessfulDesc: "تمت ترقية خطتك إلى {plan}.",
    refreshingSubscription: "جاري تحديث اشتراكك...",
    processingUpgrade: "جاري معالجة الترقية الخاصة بك...",
    doNotClose: "يرجى عدم إغلاق هذه النافذة.",
    upgradeFailed: "فشلت الترقية",
    tryAgain: "حاول مرة أخرى",
    upgradeImmediately: "💡 سيتم ترقية خطتك فورًا بعد تأكيد الدفع.",
    autoRenewOnConfirm: "إيقاف التجديد التلقائي لخطتك الحالية؟ ستحتفظ بالوصول حتى {date}، ثم تدفع يدويًا للمتابعة.",
    autoRenewOffConfirm: "تفعيل التجديد التلقائي لخطتك الحالية؟ سيتم استخدام PayPal المحفوظ للتجديد.",
    yesDisableAutoRenew: "إيقاف التجديد التلقائي",
    yesEnableAutoRenew: "تفعيل التجديد التلقائي",
    showMore: "عرض المزيد",
    showLess: "عرض أقل",
  },
  he: {
    paymentSuccess: "התשלום אושר! המנוי שלך פעיל כעת.",
    paymentFailedVerify: "אימות התשלום מול השרת נכשל.",
    unexpectedErrorConfirm: "שגיאה בלתי צפויה אירעה במהלך אישור המנוי.",
    unableToProcessUpgrade: "לא ניתן לעבד את השדרוג. מידע על התוכנית חסר.",
    upgradeToPlan: "לשדרג ל-{plan}?",
    upgradeToPlanDesc: "אתה משדרג לתוכנית <strong>{plan}</strong>.",
    amountPer: "סכום: <strong>${price}</strong> לכל {cycle}",
    paypalPrompt: "תתבקש להשלים את התשלום באמצעות PayPal.",
    proceedToPayment: "המשך לתשלום",
    cancel: "ביטול",
    unableToProcessSwitch: "לא ניתן לעבד את שינוי מחזור החיוב. מידע על התוכנית חסר.",
    switchBilling: "לעבור לחיוב {cycle}?",
    switchBillingDesc: "אתה מעביר את תוכנית <strong>{plan}</strong> לחיוב <strong>{cycle}</strong>.",
    newPricePer: "מחיר חדש: <strong>${price}</strong> לכל {cycle}",
    unableToProcessChange: "לא ניתן לעבד את שינוי התוכנית. מידע על התוכנית חסר.",
    downgradeToPlan: "לשנמך ל-{plan}?",
    downgradeToPlanDesc: "אתה משנמך לתוכנית <strong>{plan}</strong>.",
    downgradeWarning: "⚠️ חלק מהתכונות עלולות להפוך ללא זמינות ומגבלות השימוש שלך יופחתו.",
    keepCurrentPlan: "שמור על התוכנית הנוכחית",
    failProcessUpgrade: "עיבוד השדרוג נכשל. אנא פנה לתמיכה.",
    cancelSubTitle: "לבטל את המנוי?",
    cancelSubDesc: "האם אתה בטוח שברצונך לבטל את המנוי שלך?<br/><br/>תשמור על גישה לכל התכונות עד סוף תקופת החיוב הנוכחית ({date}).<br/><br/><span style='color: #dc2626;'>לאחר מכן, פרופיל היצרן והמוצרים שלך לא יהיו גלויים יותר לקונים.</span>",
    yesCancel: "כן, בטל מנוי",
    keepMyPlan: "שמור על התוכנית שלי",
    subCanceledTitle: "המנוי בוטל",
    subCanceledDesc: "המנוי שלך בוטל. תשמור על גישה עד סוף תקופת החיוב הנוכחית.",
    cancelFailedTitle: "הביטול נכשל",
    cancelFailedDesc: "ביטול המנוי נכשל. אנא נסה שוב או פנה לתמיכה.",
    errorTitle: "שגיאה",
    unexpectedError: "שגיאה בלתי צפויה אירעה. אנא נסה שוב.",
    monthlyCycle: "חודש",
    yearlyCycle: "שנה",
    unlimited: "ללא הגבלה",
    upToProducts: "עד {count} מוצרים",
    upToInquiries: "עד {count} פניות לחודש",
    upToMessages: "עד {count} הודעות לחודש",
    teamMembersCount: "{count} חברי צוות",
    advancedAnalytics: "אנליזה מתקדמת",
    priorityVisibility: "נראות בעדיפות",
    featuredSupplier: "תג ספק מומלץ",
    dedicatedManager: "מנהל חשבון ייעודי",
    apiAccess: "גישה ל-API",
    switchTo: "עבור אל",
    downgradeBtn: "שנמוך",
    completePayment: "השלם את התשלום כדי לשדרג",
    upgradeSuccessful: "השדרוג הצליח!",
    upgradeSuccessfulDesc: "התוכנית שלך שודרגה ל-{plan}.",
    refreshingSubscription: "מרענן את המנוי שלך...",
    processingUpgrade: "מעבד את השדרוג שלך...",
    doNotClose: "נא לא לסגור חלון זה.",
    upgradeFailed: "השדרוג נכשל",
    tryAgain: "נסה שוב",
    upgradeImmediately: "💡 התוכנית שלך תשודרג מיד לאחר אישור התשלום.",
    autoRenewOnConfirm: "לכבות חידוש אוטומטי לתוכנית הנוכחית? תשמור על גישה עד {date}, ואז תשלם ידנית כדי להמשיך.",
    autoRenewOffConfirm: "להפעיל חידוש אוטומטי לתוכנית הנוכחית? החידושים ישתמשו ב-PayPal השמור.",
    yesDisableAutoRenew: "כבה חידוש אוטומטי",
    yesEnableAutoRenew: "הפעל חידוש אוטומטי",
    showMore: "הצג עוד",
    showLess: "הצג פחות",
  },
  es: {
    paymentSuccess: "付款已确认！您的订阅现已激活。",
    paymentFailedVerify: "无法与后台验证付款。",
    unexpectedErrorConfirm: "确认订阅时发生意外错误。",
    unableToProcessUpgrade: "无法处理升级。缺少计划信息。",
    upgradeToPlan: "升级到 {plan}？",
    upgradeToPlanDesc: "您正在升级到 <strong>{plan}</strong> 计划。",
    amountPer: "金额：每 {cycle} <strong>${price}</strong>",
    paypalPrompt: "您将被要求通过 PayPal 完成付款。",
    proceedToPayment: "前往付款",
    cancel: "取消",
    unableToProcessSwitch: "无法处理计费周期切换。缺少计划信息。",
    switchBilling: "切换到 {cycle} 计费？",
    switchBillingDesc: "您正在将 <strong>{plan}</strong> 计划切换为 <strong>{cycle}</strong> 计费。",
    newPricePer: "新价格：每 {cycle} <strong>${price}</strong>",
    unableToProcessChange: "无法处理计划更改。缺少计划信息。",
    downgradeToPlan: "降级到 {plan}？",
    downgradeToPlanDesc: "您正在降级到 <strong>{plan}</strong> 计划。",
    downgradeWarning: "⚠️ 某些功能可能会变得不可用，且您的使用限制将会减少。",
    keepCurrentPlan: "保留当前计划",
    failProcessUpgrade: "升级处理失败。请联系支持部门。",
    cancelSubTitle: "取消订阅？",
    cancelSubDesc: "您确定要取消订阅吗？<br/><br/>您将在当前计费周期结束（{date}）之前保留所有功能的访问权限。<br/><br/><span style='color: #dc2626;'>之后，买家将无法再看到您的制造商资料和产品。</span>",
    yesCancel: "是，取消订阅",
    keepMyPlan: "保留我的计划",
    subCanceledTitle: "订阅已取消",
    subCanceledDesc: "您的订阅已取消。您将保留访问权限，直到当前计费周期结束。",
    cancelFailedTitle: "取消失败",
    cancelFailedDesc: "取消订阅失败。请重试或联系支持部门。",
    errorTitle: "错误",
    unexpectedError: "发生意外错误。请重试。",
    monthlyCycle: "月",
    yearlyCycle: "年",
    unlimited: "无限制",
    upToProducts: "最多 {count} 个产品",
    upToInquiries: "每月最多 {count} 个询盘",
    upToMessages: "每月最多 {count} 条消息",
    teamMembersCount: "{count} 个团队成员",
    advancedAnalytics: "高级数据分析",
    priorityVisibility: "优先搜索曝光",
    featuredSupplier: "精选供应商徽章",
    dedicatedManager: "专属客户经理",
    apiAccess: "API 访问权限",
    switchTo: "切换到",
    downgradeBtn: "降级",
    completePayment: "完成付款以升级",
    upgradeSuccessful: "升级成功！",
    upgradeSuccessfulDesc: "您的计划已升级至 {plan}。",
    refreshingSubscription: "正在刷新您的订阅...",
    processingUpgrade: "正在处理您的升级...",
    doNotClose: "请勿关闭此窗口。",
    upgradeFailed: "升级失败",
    tryAgain: "重试",
    upgradeImmediately: "💡 付款确认后，您的计划将立即升级。",
    autoRenewOnConfirm: "关闭当前套餐的自动续订？您可使用至 {date}，之后需手动付款继续。",
    autoRenewOffConfirm: "启用当前套餐的自动续订？续订将使用已保存的 PayPal 方式。",
    yesDisableAutoRenew: "关闭自动续订",
    yesEnableAutoRenew: "启用自动续订",
    showMore: "显示更多",
    showLess: "收起",
  }
}

interface UpgradePlanSelection {
  id: PlanId
  backendId: number
  name: string
  price: number
  cycle: "monthly" | "yearly"
}

type LocalSubscriptionCopy = (typeof localT)[keyof typeof localT]

function getPlanFeatureLabels(
  planOption: SubscriptionPlan,
  local: LocalSubscriptionCopy,
  locale: string
): string[] {
  const labels: string[] = []

  const productLimitFeature = planOption.rawFeatures?.find((f) => f.features?.key === "product_limit")
  if (productLimitFeature?.label) {
    labels.push(productLimitFeature.label)
  } else if (planOption.limits.products === -1) {
    labels.push(
      local.unlimited + " " + (locale === "ar" ? "منتجات" : locale === "he" ? "מוצרים" : locale === "es" ? "产品" : "products")
    )
  } else {
    labels.push(local.upToProducts.replace("{count}", String(planOption.limits.products)))
  }

  const inquiriesLimitFeature = planOption.rawFeatures?.find(
    (f) => f.features?.key === "inquiries_limit" || f.features?.key === "inquiry_limit"
  )
  if (inquiriesLimitFeature?.label) {
    labels.push(inquiriesLimitFeature.label)
  } else if (planOption.limits.inquiriesPerMonth === -1) {
    labels.push(
      local.unlimited + " " + (locale === "ar" ? "استفسارات" : locale === "he" ? "פניות" : locale === "es" ? "询盘" : "inquiries")
    )
  } else {
    labels.push(local.upToInquiries.replace("{count}", String(planOption.limits.inquiriesPerMonth)))
  }

  const messagesLimitFeature = planOption.rawFeatures?.find(
    (f) => f.features?.key === "messages_limit" || f.features?.key === "message_limit"
  )
  if (messagesLimitFeature?.label) {
    labels.push(messagesLimitFeature.label)
  } else if (planOption.limits.messagesPerMonth === -1) {
    labels.push(
      local.unlimited + " " + (locale === "ar" ? "رسائل" : locale === "he" ? "הודעות" : locale === "es" ? "消息" : "messages")
    )
  } else {
    labels.push(local.upToMessages.replace("{count}", String(planOption.limits.messagesPerMonth)))
  }

  const teamLimitFeature = planOption.rawFeatures?.find((f) => f.features?.key === "team_users_limit")
  if (teamLimitFeature?.label) {
    labels.push(teamLimitFeature.label)
  } else if (planOption.limits.teamMembers === -1) {
    labels.push(
      local.unlimited + " " + (locale === "ar" ? "أعضاء الفريق" : locale === "he" ? "חברי צוות" : locale === "es" ? "团队成员" : "team members")
    )
  } else {
    const pluralStr = planOption.limits.teamMembers !== 1 ? "s" : ""
    labels.push(
      local.teamMembersCount.replace("{count}", String(planOption.limits.teamMembers)).replace("{plural}", pluralStr)
    )
  }

  if (planOption.rawFeatures) {
    planOption.rawFeatures
      .filter((f) => {
        const key = f.features?.key
        return (
          key !== "product_limit" &&
          key !== "team_users_limit" &&
          key !== "inquiry_limit" &&
          key !== "inquiries_limit" &&
          key !== "message_limit" &&
          key !== "messages_limit"
        )
      })
      .forEach((feature) => {
        const label = feature.label || feature.features?.name
        if (label) labels.push(label)
      })
  } else {
    if (planOption.features.advancedAnalytics) labels.push(local.advancedAnalytics)
    if (planOption.features.prioritySearchVisibility) labels.push(local.priorityVisibility)
    if (planOption.features.featuredSupplierBadge) labels.push(local.featuredSupplier)
    if (planOption.features.dedicatedAccountManager) labels.push(local.dedicatedManager)
    if (planOption.features.apiAccess) labels.push(local.apiAccess)
  }

  return labels
}

export default function SubscriptionPage() {
  const { t, locale } = useTranslation()
  const local = localT[locale as keyof typeof localT] || localT.en
  const {
    subscription,
    plan,
    usage,
    isLoading,
    getAllPlans,
    getCurrentPlanId,
    getLimitPercentage,
    subscribeToPlan,
    cancelSubscription,
    upgradeSubscription,
    setAutoRenew,
  } = useSubscription()

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      const localesMap = { en: "en-US", ar: "ar-EG", he: "he-IL", es: "zh-CN" }
      const activeLang = localesMap[locale as keyof typeof localesMap] || "en-US"
      return new Date(dateString).toLocaleDateString(activeLang, {
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
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false)
  const [showVaultSetup, setShowVaultSetup] = useState(false)
  const [upgradeAutoRenew, setUpgradeAutoRenew] = useState(true)
  const [expandedPlanFeatures, setExpandedPlanFeatures] = useState<Partial<Record<PlanId, boolean>>>({})
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    subscription?.billingCycle || "monthly"
  )

  // Payment modal state for upgrades
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<UpgradePlanSelection | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const allPlans = getAllPlans().filter(p => p.id !== "free") // Exclude free plan for manufacturers
  const currentPlanId = getCurrentPlanId()

  // Use refs for stable references in useEffect to avoid dependency array issues
  const subscribeToPlanRef = useRef(subscribeToPlan)
  subscribeToPlanRef.current = subscribeToPlan
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
    const autoRenewParam = searchParams.get('autoRenew')
    const paypalVaultIdParam = searchParams.get('paypalVaultId')

    if (transactionId && planIdParam) {
      processedRef.current = true
      setConfirmingPayment(true)

      const confirmSubscription = async () => {
        // Clear URL params immediately so they don't re-trigger
        window.history.replaceState({}, '', '/dashboard/manufacturer/subscription')

        try {
          const dbPlanId = parseInt(planIdParam, 10);
          const paidAmount = priceParam ? parseFloat(priceParam) : 0;
          // Backend expects "yearly" | "monthly" on POST /manufacturer/subscriptions/subscribe
          const billingInterval = cycleParam === "yearly" ? "yearly" : "monthly";
          const wantsAutoRenew = autoRenewParam !== "0";

          const payload: {
            plan_id: number
            payment_method: string
            billing_interval: "yearly" | "monthly"
            payment_id: string
            auto_renew: boolean
            paid_amount: number
            paypal_vault_id?: string
          } = {
            plan_id: dbPlanId,
            payment_method: "paypal",
            billing_interval: billingInterval,
            payment_id: transactionId,
            auto_renew: wantsAutoRenew,
            paid_amount: paidAmount,
          };

          if (paypalVaultIdParam) {
            payload.paypal_vault_id = paypalVaultIdParam;
          }

          console.log("[Subscription] Confirming payment with payload:", payload);

          const result = await subscribeToPlanRef.current(payload);

          console.log("[Subscription] Subscribe API result:", result);

          if (result.success) {
            toast.success(local.paymentSuccess);
          } else {
            toast.error(result.message || local.paymentFailedVerify);
          }
        } catch (e) {
          console.error("[Subscription] Error confirming subscription:", e);
          toast.error(local.unexpectedErrorConfirm);
        } finally {
          setConfirmingPayment(false)
        }
      };

      confirmSubscription();
    }
  }, [isLoading])

  // ── Upgrade flow (requires PayPal payment) ──────────────────────
  const handleUpgrade = (planOption: typeof allPlans[0]) => {
    const price = billingCycle === "monthly" 
      ? (planOption.monthlyPrice || 0) 
      : (planOption.yearlyPrice || 0)
    
    if (!price || !planOption.backendId) {
      toast.error(local.unableToProcessUpgrade)
      return
    }

    const cycleText = billingCycle === "monthly" ? local.monthlyCycle : local.yearlyCycle

    Swal.fire({
      title: local.upgradeToPlan.replace('{plan}', planOption.name),
      html: `<div style="text-align: left; font-size: 14px; line-height: 1.6;">
        <p>${local.upgradeToPlanDesc.replace('{plan}', planOption.name)}</p>
        <p style="margin-top: 8px;">${local.amountPer.replace('{price}', price.toLocaleString()).replace('{cycle}', cycleText)}</p>
        <p style="margin-top: 8px; color: #6b7280; font-size: 13px;">${local.paypalPrompt}</p>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: local.proceedToPayment,
      cancelButtonText: local.cancel
    }).then((result) => {
      if (result.isConfirmed) {
        setSelectedUpgradePlan({
          id: planOption.id,
          backendId: planOption.backendId!,
          name: planOption.name,
          price,
          cycle: billingCycle
        })
        setPaymentStatus("idle")
        setPaymentError(null)
      }
    })
  }

  // ── Switch billing cycle flow (requires PayPal payment) ──────────
  const handleSwitchCycle = (planOption: typeof allPlans[0]) => {
    const price = billingCycle === "monthly" 
      ? (planOption.monthlyPrice || 0) 
      : (planOption.yearlyPrice || 0)
    
    if (!price || !planOption.backendId) {
      toast.error(local.unableToProcessSwitch)
      return
    }

    const targetCycle = billingCycle === "monthly" ? local.monthlyCycle : local.yearlyCycle

    Swal.fire({
      title: local.switchBilling.replace('{cycle}', targetCycle === local.monthlyCycle ? t.mfg.subscription.monthly : t.mfg.subscription.yearly),
      html: `<div style="text-align: left; font-size: 14px; line-height: 1.6;">
        <p>${local.switchBillingDesc.replace('{plan}', planOption.name).replace('{cycle}', targetCycle === local.monthlyCycle ? t.mfg.subscription.monthly : t.mfg.subscription.yearly)}</p>
        <p style="margin-top: 8px;">${local.newPricePer.replace('{price}', price.toLocaleString()).replace('{cycle}', targetCycle)}</p>
        <p style="margin-top: 8px; color: #6b7280; font-size: 13px;">${local.paypalPrompt}</p>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: local.proceedToPayment,
      cancelButtonText: local.cancel
    }).then((result) => {
      if (result.isConfirmed) {
        setSelectedUpgradePlan({
          id: planOption.id,
          backendId: planOption.backendId!,
          name: planOption.name,
          price,
          cycle: billingCycle
        })
        setPaymentStatus("idle")
        setPaymentError(null)
      }
    })
  }

  // ── Downgrade flow (also requires PayPal payment) ────────────────
  const handleDowngrade = async (planOption: typeof allPlans[0]) => {
    const price = billingCycle === "monthly" 
      ? (planOption.monthlyPrice || 0) 
      : (planOption.yearlyPrice || 0)

    if (!planOption.backendId) {
      toast.error(local.unableToProcessChange)
      return
    }

    const cycleText = billingCycle === "monthly" ? local.monthlyCycle : local.yearlyCycle

    const result = await Swal.fire({
      title: local.downgradeToPlan.replace('{plan}', planOption.name),
      html: `<div style="text-align: left; font-size: 14px; line-height: 1.6;">
        <p>${local.downgradeToPlanDesc.replace('{plan}', planOption.name)}</p>
        <p style="margin-top: 8px;">${local.newPricePer.replace('{price}', price.toLocaleString()).replace('{cycle}', cycleText)}</p>
        <p style="margin-top: 8px; color: #d97706;">${local.downgradeWarning}</p>
      </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#6b7280',
      confirmButtonText: local.proceedToPayment,
      cancelButtonText: local.keepCurrentPlan
    })

    if (result.isConfirmed) {
      setSelectedUpgradePlan({
        id: planOption.id,
        backendId: planOption.backendId,
        name: planOption.name,
        price,
        cycle: billingCycle
      })
      setPaymentStatus("idle")
      setPaymentError(null)
    }
  }

  // ── PayPal payment callbacks for upgrade ────────────────────────
  const handleUpgradePaymentSuccess = async (paymentId: string, meta?: { vaultId?: string | null }) => {
    if (!selectedUpgradePlan) return
    setPaymentStatus("processing")
    
    try {
      const res = await upgradeSubscription({
        plan_id: selectedUpgradePlan.backendId,
        payment_method: "paypal",
        billing_interval: selectedUpgradePlan.cycle,
        payment_id: paymentId,
        auto_renew: upgradeAutoRenew,
        paid_amount: selectedUpgradePlan.price,
        ...(meta?.vaultId ? { paypal_vault_id: meta.vaultId } : {}),
      })

      if (res.success) {
        setPaymentStatus("success")
        setTimeout(() => {
          setSelectedUpgradePlan(null)
          setPaymentStatus("idle")
          setUpgradeAutoRenew(true)
        }, 3000)
      } else {
        setPaymentStatus("error")
        setPaymentError(res.message)
      }
    } catch {
      setPaymentStatus("error")
      setPaymentError(local.failProcessUpgrade)
    }
  }

  const handleUpgradePaymentError = (error: string) => {
    setPaymentStatus("error")
    setPaymentError(error)
  }

  const handleClosePaymentModal = () => {
    if (paymentStatus === "processing") return // Don't close while processing
    setSelectedUpgradePlan(null)
    setPaymentStatus("idle")
    setPaymentError(null)
    setUpgradeAutoRenew(true)
  }

  const handleAutoRenewToggle = async (nextEnabled: boolean) => {
    if (!subscription || togglingAutoRenew) return

    if (nextEnabled && !subscription.hasReusablePaymentMethod) {
      setShowVaultSetup(true)
      return
    }

    const periodEndText = subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "N/A"
    const result = await Swal.fire({
      title: nextEnabled
        ? (t.mfg.subscription.autoRenewEnable || local.yesEnableAutoRenew)
        : (t.mfg.subscription.autoRenewDisable || local.yesDisableAutoRenew),
      html: nextEnabled
        ? local.autoRenewOffConfirm
        : local.autoRenewOnConfirm.replace("{date}", periodEndText),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: nextEnabled ? "#0f172a" : "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: nextEnabled ? local.yesEnableAutoRenew : local.yesDisableAutoRenew,
      cancelButtonText: local.cancel,
    })

    if (!result.isConfirmed) return

    setTogglingAutoRenew(true)
    try {
      const res = await setAutoRenew({ enabled: nextEnabled })
      if (res.success) {
        toast.success(res.message || t.mfg.subscription.autoRenewUpdated)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error(local.unexpectedError)
    } finally {
      setTogglingAutoRenew(false)
    }
  }

  const handleVaultSetupSuccess = async (vaultSetupToken: string) => {
    setTogglingAutoRenew(true)
    try {
      const res = await setAutoRenew({
        enabled: true,
        vault_setup_token: vaultSetupToken,
      })
      if (res.success) {
        setShowVaultSetup(false)
        toast.success(res.message || t.mfg.subscription.autoRenewUpdated)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error(local.unexpectedError)
    } finally {
      setTogglingAutoRenew(false)
    }
  }

  // ── Cancel subscription with confirmation ───────────────────────
  const handleCancelSubscription = async () => {
    const periodEndText = subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'
    const result = await Swal.fire({
      title: local.cancelSubTitle,
      html: local.cancelSubDesc.replace('{date}', periodEndText),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: local.yesCancel,
      cancelButtonText: local.keepMyPlan
    })

    if (result.isConfirmed) {
      setCanceling(true)
      try {
        const success = await cancelSubscription()
        if (success) {
          Swal.fire({
            icon: 'success',
            title: local.subCanceledTitle,
            text: local.subCanceledDesc,
            confirmButtonColor: '#0f172a'
          })
        } else {
          Swal.fire({
            icon: 'error',
            title: local.cancelFailedTitle,
            text: local.cancelFailedDesc,
            confirmButtonColor: '#d33'
          })
        }
      } catch {
        Swal.fire({
          icon: 'error',
          title: local.errorTitle,
          text: local.unexpectedError,
          confirmButtonColor: '#d33'
        })
      } finally {
        setCanceling(false)
      }
    }
  }

  // ── Loading state ───────────────────────────────────────────────
  if (isLoading || confirmingPayment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        {confirmingPayment && (
          <p className="text-sm text-muted-foreground">{t.mfg.subscription.activatingSubscription}</p>
        )}
      </div>
    )
  }

  const productLimit = plan?.limits.products ?? 0
  const inquiryLimit = plan?.limits.inquiriesPerMonth ?? 0
  const messageLimit = plan?.limits.messagesPerMonth ?? 0

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.mfg.subscription.title}</h1>
        <p className="text-muted-foreground">{t.mfg.subscription.subtitle}</p>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-secondary" />
                {t.mfg.subscription.currentPlan}: {plan?.name || "No Plan"}
              </CardTitle>
              <CardDescription>
                {subscription ? (
                  subscription.cancelAtPeriodEnd 
                    ? t.mfg.subscription.endsOn.replace('{date}', formatDate(subscription.currentPeriodEnd))
                    : t.mfg.subscription.renewsOn.replace('{date}', formatDate(subscription.currentPeriodEnd))
                ) : (
                  t.mfg.subscription.noActiveSubscription
                )}
                {subscription?.daysRemaining !== undefined && ` ${t.mfg.subscription.daysRemaining.replace('{days}', String(subscription.daysRemaining))}`}
              </CardDescription>
            </div>
            <Badge className={
              subscription?.status === "active" ? "bg-secondary text-secondary-foreground" :
              subscription?.status === "past_due" ? "bg-amber-500 text-white" :
              "bg-destructive text-destructive-foreground"
            }>
              {subscription?.cancelAtPeriodEnd ? t.mfg.subscription.canceling : 
               subscription?.status === "active" ? t.mfg.subscription.active : 
               subscription?.status || t.mfg.subscription.noSubscription}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                {t.mfg.subscription.productsLimit}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xl font-semibold sm:text-2xl">{usage.productsUsed}</span>
                <span className="text-sm text-muted-foreground">
                  / {productLimit === -1 ? "∞" : productLimit}
                </span>
              </div>
              <Progress value={productLimit === -1 ? 0 : getLimitPercentage("products")} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                {t.mfg.subscription.inquiriesLimit}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xl font-semibold sm:text-2xl">{usage.inquiriesThisMonth}</span>
                <span className="text-sm text-muted-foreground">
                  / {inquiryLimit === -1 ? "∞" : inquiryLimit}
                </span>
              </div>
              <Progress value={inquiryLimit === -1 ? 0 : getLimitPercentage("inquiriesPerMonth")} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                {t.mfg.subscription.messagesLimit}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xl font-semibold sm:text-2xl">{usage.messagesThisMonth}</span>
                <span className="text-sm text-muted-foreground">
                  / {messageLimit === -1 ? "∞" : messageLimit}
                </span>
              </div>
              <Progress value={messageLimit === -1 ? 0 : getLimitPercentage("messagesPerMonth")} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-renew management for current plan */}
      {subscription && (subscription.status === "active" || subscription.status === "past_due" || subscription.status === "trialing") && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-secondary" />
                  {t.mfg.subscription.autoRenewTitle}
                </CardTitle>
                <CardDescription>
                  {subscription.autoRenew
                    ? t.mfg.subscription.autoRenewEnabledDesc
                    : t.mfg.subscription.autoRenewDisabledDesc}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {subscription.autoRenew
                    ? t.mfg.subscription.active
                    : t.mfg.subscription.canceling}
                </span>
                <Switch
                  checked={Boolean(subscription.autoRenew)}
                  disabled={togglingAutoRenew}
                  onCheckedChange={(checked) => {
                    void handleAutoRenewToggle(checked)
                  }}
                />
              </div>
            </div>
          </CardHeader>
          {!subscription.autoRenew && !subscription.hasReusablePaymentMethod && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.mfg.subscription.autoRenewSavePaypalDesc}
              </p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => setShowVaultSetup(true)}
                disabled={togglingAutoRenew}
              >
                {t.mfg.subscription.autoRenewSavePaypal}
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Plan Comparison */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t.mfg.subscription.availablePlans}</h2>
          
          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.mfg.subscription.monthly}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                billingCycle === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.mfg.subscription.yearly}
              <Badge variant="secondary" className="text-xs px-1.5 py-0">{t.mfg.subscription.saveDiscount}</Badge>
            </button>
          </div>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {allPlans.map((planOption) => {
            const isCurrentPlan = planOption.id === currentPlanId && (subscription?.billingCycle || "monthly") === billingCycle
            const isSamePlanDifferentCycle = planOption.id === currentPlanId && (subscription?.billingCycle || "monthly") !== billingCycle
            
            const planTiers: Record<PlanId, number> = { free: 0, starter: 1, growth: 2, enterprise: 3 }
            const currentTier = planTiers[currentPlanId] || 0
            const optionTier = planTiers[planOption.id] || 0
            const isUpgrade = optionTier > currentTier
            
            const displayPrice = billingCycle === "monthly" 
              ? planOption.monthlyPrice 
              : planOption.yearlyPrice

            const featureLabels = getPlanFeatureLabels(planOption, local, locale)
            const isFeaturesExpanded = Boolean(expandedPlanFeatures[planOption.id])
            const hasMoreFeatures = featureLabels.length > MAX_VISIBLE_FEATURES
            const visibleFeatures = isFeaturesExpanded
              ? featureLabels
              : featureLabels.slice(0, MAX_VISIBLE_FEATURES)
            
            return (
              <Card 
                key={planOption.id} 
                className={cn(
                  "relative flex h-full flex-col gap-0 transition-all",
                  isCurrentPlan ? "border-secondary ring-1 ring-secondary" : "hover:border-secondary/50"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex min-h-7 items-start justify-between gap-2">
                    <CardTitle className="text-lg">{planOption.name}</CardTitle>
                    {isCurrentPlan ? (
                      <Badge variant="outline" className="shrink-0 border-secondary text-secondary">
                        {t.mfg.subscription.current}
                      </Badge>
                    ) : planOption.id === "growth" ? (
                      <Badge className="shrink-0 bg-secondary text-secondary-foreground">
                        {t.mfg.subscription.popular}
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className="mt-2 line-clamp-2 min-h-10">
                    {planOption.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pb-4">
                  <div className="mb-5 min-h-14">
                    {displayPrice !== null && displayPrice !== undefined ? (
                      <>
                        <span className="text-2xl font-bold sm:text-3xl">
                          ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-muted-foreground">
                          /{billingCycle === "monthly" ? (locale === "ar" ? "شهر" : locale === "he" ? "חודש" : locale === "es" ? "月" : "month") : (locale === "ar" ? "سنة" : locale === "he" ? "שנה" : locale === "es" ? "年" : "year")}
                        </span>
                        {billingCycle === "yearly" && displayPrice > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            ${Math.round(displayPrice / 12)}/{locale === "ar" ? "شهر يُدفع سنوياً" : locale === "he" ? "חודש בחיוב שנתי" : locale === "es" ? "月 按年计费" : "month billed annually"}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-xl font-semibold">Contact Sales</span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex flex-1 flex-col",
                      !isFeaturesExpanded && "min-h-58"
                    )}
                  >
                    <ul className="space-y-2.5">
                      {visibleFeatures.map((label, index) => (
                        <li key={`${planOption.id}-feature-${index}`} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                          <span className="leading-snug text-foreground">{label}</span>
                        </li>
                      ))}
                    </ul>

                    {hasMoreFeatures ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlanFeatures((prev) => ({
                            ...prev,
                            [planOption.id]: !isFeaturesExpanded,
                          }))
                        }
                        className="mt-3 inline-flex items-center gap-1 self-start text-sm font-medium text-secondary hover:underline"
                      >
                        {isFeaturesExpanded ? (
                          <>
                            {local.showLess}
                            <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            {local.showMore}
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="mt-3 h-5" aria-hidden />
                    )}
                  </div>
                </CardContent>
                <CardFooter className="mt-auto pt-0">
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="mr-2 h-4 w-4" />
                      {t.mfg.subscription.currentPlan}
                    </Button>
                  ) : isSamePlanDifferentCycle ? (
                    <Button 
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                      onClick={() => handleSwitchCycle(planOption)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === planOption.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      {local.switchTo} ({billingCycle === "monthly" ? t.mfg.subscription.monthly : t.mfg.subscription.yearly})
                    </Button>
                  ) : planOption.monthlyPrice === null ? (
                    <Button variant="outline" className="w-full">
                      {t.mfg.subscription.contactSales}
                    </Button>
                  ) : isUpgrade ? (
                    <Button 
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                      onClick={() => handleUpgrade(planOption)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === planOption.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      {t.mfg.subscription.upgrade}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDowngrade(planOption)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === planOption.id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {local.downgradeBtn}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Approval Notice */}
      <div className="rounded-xl bg-secondary/10 p-5 flex items-start gap-4">
        <Shield className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-foreground text-sm">{t.mfg.subscription.planChangesApproval}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.mfg.subscription.planChangesDesc}
          </p>
        </div>
      </div>

      {/* Danger Zone — Cancel Subscription */}
      {subscription && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t.mfg.subscription.cancelSubscription}
            </CardTitle>
            <CardDescription>
              {subscription.cancelAtPeriodEnd 
                ? t.mfg.subscription.cancellationScheduledDesc.replace('{date}', formatDate(subscription.currentPeriodEnd))
                : t.mfg.subscription.cancelSubscriptionDesc
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription.cancelAtPeriodEnd ? (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                {t.mfg.subscription.cancellationScheduled}
              </Badge>
            ) : (
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
                disabled={canceling}
              >
                {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.mfg.subscription.cancelSubscription}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Payment Modal for Upgrades ────────────────────────────── */}
      {selectedUpgradePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {t.mfg.subscription.upgrade} {selectedUpgradePlan.name}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">{local.completePayment}</p>
                </div>
                <button
                  onClick={handleClosePaymentModal}
                  className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={paymentStatus === "processing"}
                >
                  <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              {/* Success State */}
              {paymentStatus === "success" && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-600" />
                  <h3 className="mt-3 font-semibold text-green-900 text-sm sm:text-base">{local.upgradeSuccessful}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-green-700">
                    {local.upgradeSuccessfulDesc.replace('{plan}', selectedUpgradePlan.name)}
                  </p>
                  <p className="mt-3 text-xs text-green-600">{local.refreshingSubscription}</p>
                </div>
              )}

              {/* Processing State */}
              {paymentStatus === "processing" && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                  <p className="text-sm text-muted-foreground">{local.processingUpgrade}</p>
                  <p className="text-xs text-muted-foreground">{local.doNotClose}</p>
                </div>
              )}

              {/* Error State */}
              {paymentStatus === "error" && (
                <div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 mb-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-600 mt-0.5" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-red-900 text-sm">{local.upgradeFailed}</h3>
                        <p className="mt-1 text-xs sm:text-sm text-red-700 wrap-break-word">{paymentError}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPaymentStatus("idle")}
                    className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
                  >
                    {local.tryAgain}
                  </button>
                </div>
              )}

              {/* Payment Form (idle state) */}
              {paymentStatus === "idle" && (
                <div className="space-y-4">
                  {/* Price Summary */}
                  <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {selectedUpgradePlan.name} Plan ({selectedUpgradePlan.cycle === "yearly" ? t.mfg.subscription.yearly : t.mfg.subscription.monthly})
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-gray-900 shrink-0">
                        ${selectedUpgradePlan.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                      checked={upgradeAutoRenew}
                      onChange={(e) => setUpgradeAutoRenew(e.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">
                        {t.mfg.subscription.autoRenewTitle}
                      </span>
                      <span className="mt-1 block text-xs text-gray-600 leading-relaxed">
                        {upgradeAutoRenew
                          ? t.mfg.subscription.autoRenewVaultHint
                          : t.mfg.subscription.autoRenewManualHint}
                      </span>
                    </span>
                  </label>

                  <PayPalButton
                    key={upgradeAutoRenew ? "upgrade-vault" : "upgrade-one-time"}
                    amount={selectedUpgradePlan.price}
                    currency="USD"
                    vault={upgradeAutoRenew}
                    onSuccess={handleUpgradePaymentSuccess}
                    onError={handleUpgradePaymentError}
                  />

                  {/* Info */}
                  <div className="rounded-lg bg-blue-50 p-2 sm:p-3 border border-blue-200">
                    <p className="text-xs text-blue-900 leading-relaxed">
                      {local.upgradeImmediately}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVaultSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl overflow-hidden">
            <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t.mfg.subscription.autoRenewSavePaypal}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">
                    {t.mfg.subscription.autoRenewSavePaypalDesc}
                  </p>
                </div>
                <button
                  onClick={() => !togglingAutoRenew && setShowVaultSetup(false)}
                  className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={togglingAutoRenew}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
              {togglingAutoRenew ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                  <p className="text-sm text-muted-foreground">{t.mfg.subscription.autoRenewEnable}...</p>
                </div>
              ) : (
                <PayPalVaultSetupButton
                  onSuccess={(token) => {
                    void handleVaultSetupSuccess(token)
                  }}
                  onError={(error) => toast.error(error)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
