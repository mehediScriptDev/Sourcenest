"use client"

import { 
  Shield, 
  Globe, 
  MessageSquare, 
  BarChart3, 
  Clock, 
  Users,
  Wallet,
  Award,
  TrendingUp
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function WhyUseSection() {
  const { t } = useTranslation();

  if (!t || !t.landing?.whyUse) {
    return null
  }

  const buyerBenefits = [
    {
      icon: Wallet,
      title: t.landing.whyUse.bb1Title,
      description: t.landing.whyUse.bb1Desc,
    },
    {
      icon: Shield,
      title: t.landing.whyUse.bb2Title,
      description: t.landing.whyUse.bb2Desc,
    },
    {
      icon: Globe,
      title: t.landing.whyUse.bb3Title,
      description: t.landing.whyUse.bb3Desc,
    },
    {
      icon: MessageSquare,
      title: t.landing.whyUse.bb4Title,
      description: t.landing.whyUse.bb4Desc,
    },
    {
      icon: BarChart3,
      title: t.landing.whyUse.bb5Title,
      description: t.landing.whyUse.bb5Desc,
    },
    {
      icon: Clock,
      title: t.landing.whyUse.bb6Title,
      description: t.landing.whyUse.bb6Desc,
    },
  ]

  const manufacturerBenefits = [
    {
      icon: TrendingUp,
      title: t.landing.whyUse.mb1Title,
      description: t.landing.whyUse.mb1Desc,
    },
    {
      icon: Award,
      title: t.landing.whyUse.mb2Title,
      description: t.landing.whyUse.mb2Desc,
    },
    {
      icon: Users,
      title: t.landing.whyUse.mb3Title,
      description: t.landing.whyUse.mb3Desc,
    },
  ]

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Why Buyers Use SourceNest */}
        <div>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              {t.landing.whyUse.buyerTitle}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.landing.whyUse.buyerSubtitle}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {buyerBenefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-2.5 sm:gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                  <benefit.icon className="h-4 w-4 text-secondary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">{benefit.title}</h3>
                  <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:mt-1 sm:line-clamp-none sm:text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border sm:my-20" />

        {/* Why Manufacturers Join */}
        <div>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              {t.landing.whyUse.mfgTitle}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.landing.whyUse.mfgSubtitle}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {manufacturerBenefits.map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-border bg-card p-3 text-center sm:rounded-2xl sm:p-6 lg:p-8">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary sm:h-14 sm:w-14 sm:rounded-2xl lg:h-16 lg:w-16">
                  <benefit.icon className="h-5 w-5 text-primary-foreground sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-foreground sm:mt-5 sm:text-xl lg:mt-6">{benefit.title}</h3>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:mt-3 sm:line-clamp-none sm:text-sm lg:text-base">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-primary p-4 text-center text-primary-foreground sm:mt-14 sm:rounded-2xl sm:p-8 md:p-12">
            <h3 className="font-serif text-lg font-medium sm:text-2xl md:text-3xl">
              {t.landing.whyUse.whyPayTitle}
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/80 sm:mt-4 sm:text-base">
              {t.landing.whyUse.whyPayDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
