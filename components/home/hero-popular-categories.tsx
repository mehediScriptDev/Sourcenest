"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "@/lib/i18n"
import { getPublicCategories, type BackendCategory } from "@/lib/api/categories"
import { queryKeys } from "@/lib/query-keys"
import en from "@/lib/i18n/locales/en"

const POPULAR_LIMIT = 4

const FALLBACK_CATEGORIES: BackendCategory[] = [
  { id: "electronics-electrical", name: en.landing.hero.popElectronics, slug: "electronics-electrical" },
  { id: "textiles-apparel", name: en.landing.hero.popTextiles, slug: "textiles-apparel" },
  { id: "machinery-equipment", name: en.landing.hero.popMachinery, slug: "machinery-equipment" },
  { id: "food-beverage", name: en.landing.hero.popFood, slug: "food-beverage" },
]

function pickPopularCategories(categories: BackendCategory[]): BackendCategory[] {
  const featured = categories.filter((category) => Number(category.featured) === 1)
  const source = featured.length > 0 ? featured : categories
  return source.slice(0, POPULAR_LIMIT)
}

export function HeroPopularCategories() {
  const { t } = useTranslation()

  const categoriesQuery = useQuery({
    queryKey: queryKeys.publicCategories(50),
    queryFn: () => getPublicCategories({ perPage: 50 }),
  })

  const categories = useMemo(() => {
    if (!categoriesQuery.data?.success || !categoriesQuery.data.data?.length) {
      return FALLBACK_CATEGORIES
    }
    return pickPopularCategories(categoriesQuery.data.data)
  }, [categoriesQuery.data])

  const popularLabel = t.landing?.hero?.popular ?? en.landing.hero.popular

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-primary-foreground/70 sm:mt-6 sm:text-sm">
      <span data-hero="popular">{popularLabel}</span>
      {categories.map((category) => {
        const slug = category.slug || String(category.id)
        return (
          <Link
            key={slug}
            href={`/industries/${slug}`}
            className="hover:text-primary-foreground hover:underline"
          >
            {category.name}
          </Link>
        )
      })}
    </div>
  )
}
