"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Factory } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function CtaSection() {
  const { t } = useTranslation()

  if (!t || !t.landing?.cta) {
    return null
  }
  return (
    <section className="bg-primary py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-primary-foreground sm:text-4xl">
            {t.landing.cta.buyerTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
            {t.landing.cta.buyerDesc}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-5 md:grid-cols-2 lg:gap-6">
          <div className="rounded-xl bg-primary-foreground/10 p-4 backdrop-blur sm:rounded-2xl sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:block">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14">
                <Users className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <h3 className="text-base font-semibold text-primary-foreground sm:mt-5 sm:text-xl lg:mt-6">{t.landing.howItWorks.tabBuyers}</h3>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-primary-foreground/80 sm:mt-2 sm:line-clamp-none sm:text-base">
              {t.landing.whatIs.forBuyersDesc}
            </p>
            <Button 
              variant="secondary" 
              size="lg"
              className="mt-4 h-10 w-full gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:mt-6 sm:h-11 sm:w-auto"
              asChild
            >
              <Link href="/auth/signup?role=buyer">
                {t.landing.cta.buyerBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-xl bg-primary-foreground/10 p-4 backdrop-blur sm:rounded-2xl sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:block">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14">
                <Factory className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <h3 className="text-base font-semibold text-primary-foreground sm:mt-5 sm:text-xl lg:mt-6">{t.landing.howItWorks.tabMfg}</h3>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-primary-foreground/80 sm:mt-2 sm:line-clamp-none sm:text-base">
              {t.landing.cta.mfgDesc}
            </p>
            <Button 
              variant="secondary" 
              size="lg"
              className="mt-4 h-10 w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 sm:mt-6 sm:h-11 sm:w-auto"
              asChild
            >
              <Link href="/pricing">
                {t.landing.cta.mfgBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
