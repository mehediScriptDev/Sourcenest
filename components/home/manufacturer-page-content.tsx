"use client"

import Link from "next/link"
import { 
  Globe,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Award,
  Shield,
  ArrowRight,
  Check,
  Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

export function ManufacturerPageContent() {
  const { t } = useTranslation()

  if (!t || !t.forManufacturers) {
    return null
  }

  const features = [
    {
      icon: Building2,
      title: t.forManufacturers.features.f1Title,
      description: t.forManufacturers.features.f1Desc,
    },
    {
      icon: Globe,
      title: t.forManufacturers.features.f2Title,
      description: t.forManufacturers.features.f2Desc,
    },
    {
      icon: MessageSquare,
      title: t.forManufacturers.features.f3Title,
      description: t.forManufacturers.features.f3Desc,
    },
    {
      icon: FileText,
      title: t.forManufacturers.features.f4Title,
      description: t.forManufacturers.features.f4Desc,
    },
    {
      icon: BarChart3,
      title: t.forManufacturers.features.f5Title,
      description: t.forManufacturers.features.f5Desc,
    },
    {
      icon: Award,
      title: t.forManufacturers.features.f6Title,
      description: t.forManufacturers.features.f6Desc,
    },
  ]

  const steps = [
    {
      step: 1,
      title: t.forManufacturers.howItWorks.step1Title,
      description: t.forManufacturers.howItWorks.step1Desc,
    },
    {
      step: 2,
      title: t.forManufacturers.howItWorks.step2Title,
      description: t.forManufacturers.howItWorks.step2Desc,
    },
    {
      step: 3,
      title: t.forManufacturers.howItWorks.step3Title,
      description: t.forManufacturers.howItWorks.step3Desc,
    },
    {
      step: 4,
      title: t.forManufacturers.howItWorks.step4Title,
      description: t.forManufacturers.howItWorks.step4Desc,
    },
    {
      step: 5,
      title: t.forManufacturers.howItWorks.step5Title,
      description: t.forManufacturers.howItWorks.step5Desc,
    },
    {
      step: 6,
      title: t.forManufacturers.howItWorks.step6Title,
      description: t.forManufacturers.howItWorks.step6Desc,
    },
  ]

  const benefits = [
    t.forManufacturers.benefits.b1,
    t.forManufacturers.benefits.b2,
    t.forManufacturers.benefits.b3,
    t.forManufacturers.benefits.b4,
    t.forManufacturers.benefits.b5,
    t.forManufacturers.benefits.b6,
  ]

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-primary py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-1.5 text-sm text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{t.forManufacturers.hero.badge}</span>
            </div>
            <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight text-primary-foreground min-[400px]:text-4xl sm:mt-6 sm:text-5xl lg:text-6xl">
              {t.forManufacturers.hero.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 sm:mt-6 sm:text-base lg:text-lg">
              {t.forManufacturers.hero.subtitle}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4 w-full max-w-lg mx-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
                <Link href="/pricing" className="w-full text-center sm:w-auto">
                  {t.forManufacturers.hero.viewPricing}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link href="/auth/signup?role=manufacturer" className="w-full text-center sm:w-auto">
                  {t.forManufacturers.hero.getStarted}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {t.forManufacturers.features.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
              {t.forManufacturers.features.subtitle}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 sm:h-12 sm:w-12">
                  <feature.icon className="h-5 w-5 text-secondary sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground sm:mt-4 sm:text-base">{feature.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed sm:mt-2 sm:text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {t.forManufacturers.howItWorks.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
              {t.forManufacturers.howItWorks.subtitle}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
            {steps.map((step, index) => (
              <div key={step.step} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-6 hidden h-0.5 w-full bg-border md:block" />
                )}
                <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">{step.step}</span>
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-xl bg-secondary/10 p-6 text-center">
            <Shield className="mx-auto h-8 w-8 text-secondary" />
            <p className="mt-4 font-medium text-secondary">
              {t.forManufacturers.howItWorks.important}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.forManufacturers.howItWorks.afterApproval}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="rounded-xl bg-primary p-4 text-primary-foreground sm:rounded-2xl sm:p-6 lg:p-8">
              <Users className="h-10 w-10 sm:h-12 sm:w-12" />
              <h3 className="mt-4 font-serif text-xl font-medium sm:mt-6 sm:text-2xl">{t.forManufacturers.benefits.whyChoose}</h3>
              <p className="mt-4 text-primary-foreground/80 leading-relaxed">
                {t.forManufacturers.benefits.desc1}
              </p>
              <p className="mt-4 text-primary-foreground/80 leading-relaxed">
                {t.forManufacturers.benefits.desc2}
              </p>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {t.forManufacturers.benefits.title}
              </h2>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Check className="h-3 w-3 text-secondary-foreground" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8 gap-2 w-full sm:w-auto" asChild>
                <Link href="/pricing" className="w-full text-center sm:w-auto">
                  {t.forManufacturers.hero.viewPricing}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-secondary-foreground sm:text-4xl">
              {t.forManufacturers.cta.title}
            </h2>
            <p className="mt-4 text-lg text-secondary-foreground/80">
              {t.forManufacturers.cta.subtitle}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row w-full max-w-lg mx-auto">
              <Button size="lg" className="w-full sm:w-auto justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/pricing" className="w-full text-center sm:w-auto">
                  {t.forManufacturers.cta.choosePlan}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent w-full sm:w-auto border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
                <Link href="/contact" className="w-full text-center sm:w-auto">
                  {t.forManufacturers.cta.contactSales}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
