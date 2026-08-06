"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import {
  Globe,
  Shield,
  Users,
  Lightbulb,
  Target,
  Heart,
  ArrowRight,
  Loader2,
  type LucideIcon,
} from "lucide-react"
import { fetchAboutPage } from "@/lib/api/about-page"
import type { AboutPage } from "@/lib/api/about-page"
import { defaultAboutPage } from "@/lib/data/site-settings"

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Globe,
  Users,
  Lightbulb,
}

export default function AboutPageView() {
  const [page, setPage] = useState<AboutPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchAboutPage()
        if (active) {
          setPage(data)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const content = page?.content
  const hero = content?.hero ?? {
    title: defaultAboutPage.hero.title,
    subtitle: defaultAboutPage.hero.subtitle,
  }
  const story = content?.story ?? {
    title: defaultAboutPage.story.title,
    paragraphs: defaultAboutPage.story.paragraphs,
  }
  const mission = content?.mission ?? defaultAboutPage.mission
  const vision = content?.vision ?? defaultAboutPage.vision
  const valuesSection = content?.values ?? {
    title: defaultAboutPage.values.title,
    subtitle: defaultAboutPage.values.subtitle,
    items: defaultAboutPage.values.items.map((item) => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      description: item.description,
      enabled: item.enabled,
    })),
  }
  const whyDifferent = content?.why_different ?? {
    title: defaultAboutPage.whyDifferent.title,
    points: defaultAboutPage.whyDifferent.points.map((point) => ({
      id: point.id,
      title: point.title,
      description: point.description,
      enabled: point.enabled,
    })),
  }
  const cta = content?.cta ?? {
    title: defaultAboutPage.cta.title,
    subtitle: defaultAboutPage.cta.subtitle,
    buyer_button_text: defaultAboutPage.cta.buyerButtonText,
    manufacturer_button_text: defaultAboutPage.cta.manufacturerButtonText,
  }

  const enabledValues = valuesSection.items.filter((value) => value.enabled)
  const enabledPoints = whyDifferent.points.filter((point) => point.enabled)

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <section className="bg-primary py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                  <h1 className="font-serif text-3xl font-medium tracking-tight text-primary-foreground min-[400px]:text-4xl sm:text-5xl lg:text-6xl">
                    {hero.title}
                  </h1>
                  <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 sm:mt-6 sm:text-base lg:text-lg">
                    {hero.subtitle}
                  </p>
                </div>
              </div>
            </section>

            <section className="py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                  <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {story.title}
                  </h2>
                  <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
                    {story.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-5 sm:gap-8 lg:grid-cols-2 lg:gap-12">
                  <div className="rounded-xl bg-primary p-4 text-primary-foreground sm:rounded-2xl sm:p-6 lg:p-8">
                    <Target className="h-10 w-10 sm:h-12 sm:w-12" />
                    <h3 className="mt-4 font-serif text-xl font-medium sm:mt-6 sm:text-2xl">{mission.title}</h3>
                    <p className="mt-4 text-primary-foreground/80 leading-relaxed">{mission.description}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6 lg:p-8">
                    <Heart className="h-10 w-10 text-secondary sm:h-12 sm:w-12" />
                    <h3 className="mt-4 font-serif text-xl font-medium text-foreground sm:mt-6 sm:text-2xl">{vision.title}</h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{vision.description}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-muted/50 py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {valuesSection.title}
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
                    {valuesSection.subtitle}
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4 lg:gap-6">
                  {enabledValues.map((value) => {
                    const Icon = iconMap[value.icon] ?? Shield

                    return (
                      <div
                        key={value.id}
                        className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 sm:h-12 sm:w-12">
                          <Icon className="h-5 w-5 text-secondary sm:h-6 sm:w-6" />
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-foreground sm:mt-4 sm:text-base">{value.title}</h3>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed sm:mt-2 sm:text-sm">
                          {value.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className="py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {whyDifferent.title}
                  </h2>
                  <div className="mt-8 space-y-6 text-left text-muted-foreground leading-relaxed">
                    {enabledPoints.map((point) => (
                      <p key={point.id}>
                        <strong className="text-foreground">{point.title}</strong> {point.description}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-primary py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="font-serif text-3xl font-medium tracking-tight text-primary-foreground sm:text-4xl">
                    {cta.title}
                  </h2>
                  <p className="mt-4 text-primary-foreground/80">{cta.subtitle}</p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row w-full max-w-lg mx-auto">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full sm:w-auto justify-center gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      asChild
                    >
                      <Link href="/auth/signup?role=buyer" className="w-full text-center sm:w-auto">
                        {cta.buyer_button_text}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                      asChild
                    >
                      <Link href="/pricing" className="w-full text-center sm:w-auto">
                        {cta.manufacturer_button_text}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
