"use client"

import { useEffect } from "react"
import { DEFAULT_LOCALE, useTranslation } from "@/lib/i18n"
import type { TranslationKeys } from "@/lib/i18n/locales"

type HeroCopy = TranslationKeys["landing"]["hero"]

interface HeroLocaleSyncProps {
  initial: HeroCopy
}

function setText(root: HTMLElement, key: string, value: string) {
  const el = root.querySelector(`[data-hero="${key}"]`)
  if (el) el.textContent = value
}

export function HeroLocaleSync({ initial }: HeroLocaleSyncProps) {
  const { locale, t } = useTranslation()

  useEffect(() => {
    if (locale === DEFAULT_LOCALE) return

    const root = document.getElementById("hero-locale-root")
    if (!root) return

    const hero = t.landing?.hero ?? initial
    setText(root, "badge", hero.badge)
    setText(root, "title1", hero.title1)
    setText(root, "title2", hero.title2)
    setText(root, "subtitle", hero.subtitle)
    setText(root, "popular", hero.popular)
    setText(root, "statCountries", hero.statCountries)
    setText(root, "statReviewed", hero.statReviewed)
    setText(root, "statDirectPrefix", hero.statDirectPrefix)
    setText(root, "statDirect", hero.statDirect)
  }, [locale, t, initial])

  return null
}
