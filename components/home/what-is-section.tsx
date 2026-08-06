"use client"

import { Factory, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"

export function WhatIsSection() {
  const { t } = useTranslation();
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-xl font-medium tracking-tight text-foreground sm:text-3xl">
            {t.landing.whatIs.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            {t.landing.whatIs.desc}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:gap-6">
          {/* For Buyers */}
          <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6 lg:p-8">
            <div className="flex items-start gap-3 sm:block">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14">
                <Users className="h-5 w-5 text-secondary sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <div className="min-w-0 flex-1 sm:mt-5 lg:mt-6">
                <h3 className="text-base font-semibold text-foreground sm:text-xl">{t.landing.whatIs.forBuyers}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground sm:mt-3 sm:line-clamp-none sm:text-base">
                  {t.landing.whatIs.forBuyersDesc}
                </p>
              </div>
            </div>
            <ul className="mt-3 hidden space-y-2 sm:mt-6 sm:block sm:space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t.landing.whatIs.buyerPoint1}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t.landing.whatIs.buyerPoint2}
              </li>
              <li className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t.landing.whatIs.buyerPoint3}
              </li>
              <li className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t.landing.whatIs.buyerPoint4}
              </li>
            </ul>
            <Link 
              href="/for-buyers" 
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:underline sm:mt-6 sm:gap-2 sm:text-sm"
            >
              {t.landing.whatIs.buyerLink}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
            </Link>
          </div>

          {/* For Manufacturers */}
          <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6 lg:p-8">
            <div className="flex items-start gap-3 sm:block">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14">
                <Factory className="h-5 w-5 text-secondary sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <div className="min-w-0 flex-1 sm:mt-5 lg:mt-6">
                <h3 className="text-base font-semibold text-foreground sm:text-xl">{t.landing.whatIs.forMfg}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground sm:mt-3 sm:line-clamp-none sm:text-base">
                  {t.landing.whatIs.forMfgDesc}
                </p>
              </div>
            </div>
            <ul className="mt-3 hidden space-y-2 sm:mt-6 sm:block sm:space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t.landing.whatIs.mfgPoint1}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t.landing.whatIs.mfgPoint2}
              </li>
              <li className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t.landing.whatIs.mfgPoint3}
              </li>
              <li className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {t.landing.whatIs.mfgPoint4}
              </li>
            </ul>
            <Link 
              href="/for-manufacturers" 
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:underline sm:mt-6 sm:gap-2 sm:text-sm"
            >
              {t.landing.whatIs.mfgLink}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
