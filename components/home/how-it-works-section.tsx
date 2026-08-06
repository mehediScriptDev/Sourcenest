"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Search,
  Building2,
  MessageSquare,
  FileText,
  UserPlus,
  CreditCard,
  Settings,
  Upload,
  CheckCircle,
  Globe,
  Shield,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function HowItWorksSection() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"buyers" | "manufacturers">("buyers")

  const buyerSteps = [
    {
      step: 1,
      title: t.landing.howItWorks.buyerStep1Title,
      description: t.landing.howItWorks.buyerStep1Desc,
      icon: Search,
    },
    {
      step: 2,
      title: t.landing.howItWorks.buyerStep2Title,
      description: t.landing.howItWorks.buyerStep2Desc,
      icon: Building2,
    },
    {
      step: 3,
      title: t.landing.howItWorks.buyerStep3Title,
      description: t.landing.howItWorks.buyerStep3Desc,
      icon: MessageSquare,
    },
    {
      step: 4,
      title: t.landing.howItWorks.buyerStep4Title,
      description: t.landing.howItWorks.buyerStep4Desc,
      icon: FileText,
    },
  ]

  const manufacturerSteps = [
    {
      step: 1,
      title: t.landing.howItWorks.mfgStep1Title,
      description: t.landing.howItWorks.mfgStep1Desc,
      icon: UserPlus,
    },
    {
      step: 2,
      title: t.landing.howItWorks.mfgStep5Title,
      description: t.landing.howItWorks.mfgStep5Desc,
      icon: CheckCircle,
    },
    {
      step: 3,
      title: t.landing.howItWorks.mfgStep2Title,
      description: t.landing.howItWorks.mfgStep2Desc,
      icon: CreditCard,
    },
    {
      step: 4,
      title: t.landing.howItWorks.mfgStep3Title,
      description: t.landing.howItWorks.mfgStep3Desc,
      icon: Settings,
    },
    {
      step: 5,
      title: t.landing.howItWorks.mfgStep4Title,
      description: t.landing.howItWorks.mfgStep4Desc,
      icon: Upload,
    },
    
    {
      step: 6,
      title: t.landing.howItWorks.mfgStep6Title,
      description: t.landing.howItWorks.mfgStep6Desc,
      icon: Globe,
    },
  ]

  return (
    <section className="bg-muted/50 py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {t.landing.howItWorks.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.landing.howItWorks.subtitle}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex justify-center sm:mt-12">
          <div className="inline-flex w-full max-w-sm rounded-lg bg-background p-1 shadow-sm sm:w-auto">
            <button
              onClick={() => setActiveTab("buyers")}
              className={cn(
                "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all sm:flex-none sm:px-6",
                activeTab === "buyers"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.landing.howItWorks.tabBuyers}
            </button>
            <button
              onClick={() => setActiveTab("manufacturers")}
              className={cn(
                "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all sm:flex-none sm:px-6",
                activeTab === "manufacturers"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.landing.howItWorks.tabMfg}
            </button>
          </div>
        </div>

        {/* Buyer Steps */}
        {activeTab === "buyers" && (
          <div className="mt-10 sm:mt-16">
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {buyerSteps.map((item) => (
                <div key={item.step} className="relative">
                  {item.step < buyerSteps.length && (
                    <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-border lg:block" />
                  )}
                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm sm:h-16 sm:w-16 sm:rounded-2xl sm:shadow-md lg:h-20 lg:w-20">
                      <item.icon className="h-5 w-5 text-secondary sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:-right-1 sm:-top-1 sm:h-6 sm:w-6 sm:text-xs">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-xs font-semibold leading-snug text-foreground sm:mt-4 sm:text-base sm:line-clamp-none lg:mt-6 lg:text-lg">{item.title}</h3>
                    <p className="mt-1 hidden text-sm leading-relaxed text-muted-foreground sm:mt-2 sm:block">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-secondary/10 p-4 text-center sm:mt-10 sm:rounded-xl sm:p-5 lg:mt-12 lg:p-6">
              <p className="text-xs font-medium text-secondary sm:text-sm lg:text-base">
                {t.landing.howItWorks.buyerFree}
              </p>
            </div>
          </div>
        )}

        {/* Manufacturer Steps */}
        {activeTab === "manufacturers" && (
          <div className="mt-10 sm:mt-16">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {manufacturerSteps.map((item) => (
                <div key={item.step} className="relative rounded-lg bg-background p-3 shadow-sm sm:rounded-xl sm:p-5 lg:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                      <item.icon className="h-4 w-4 text-secondary sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:h-5 sm:w-5 sm:text-xs">
                          {item.step}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground sm:text-base">{item.title}</h3>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:line-clamp-none sm:text-sm">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-6 max-w-2xl rounded-lg bg-secondary/10 p-4 text-center sm:mt-10 sm:rounded-xl sm:p-5 lg:mt-12 lg:p-6">
              <Shield className="mx-auto h-6 w-6 text-secondary sm:h-8 sm:w-8" />
              <p className="mt-3 text-sm font-medium text-secondary sm:mt-4 sm:text-base">
                {t?.landing?.howItWorks?.important || "Important: No payment is required upfront. Your account will be reviewed first, and you will only be charged after approval."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t?.landing?.howItWorks?.paymentComplete || "Once approved, complete your payment to activate your account and unlock full access to the platform."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
