"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n"
import {
  getAllPublicCategories,
  getPublicCategories,
  CATEGORIES_LIST_PER_PAGE,
  type BackendCategory,
} from "@/lib/api/categories"
import { queryKeys } from "@/lib/query-keys"
import DynamicIcon from "@/components/dynamic-icon"
import { ListPagination } from "@/components/common/list-pagination"
import { ArrowRight, Factory } from "lucide-react"

interface Industry {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  icon_color?: string
  supplierCount: number
  productCount: number
  featured?: boolean
  categories: { id: string; name: string }[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

function mapCategoryToIndustry(category: BackendCategory): Industry {
  const subs = category.sub_categories?.length
    ? category.sub_categories
    : category.subcategories ?? []

  return {
    id: String(category.id),
    name: category.name,
    slug: (category.slug && category.slug.trim()) || slugify(category.name),
    description: category.description ?? "",
    icon: category.icon?.trim() || "Package",
    icon_color: category.icon_color,
    supplierCount: category.supplier_count ?? 0,
    productCount: category.product_count ?? 0,
    featured: Number(category.featured) === 1,
    categories: subs.map((sub) => ({
      id: String(sub.id),
      name: sub.name,
    })),
  }
}

export function IndustriesPageContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page")
    const parsed = pageParam ? parseInt(pageParam, 10) : 1
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.publicIndustriesStats(),
    queryFn: () => getAllPublicCategories({ perPage: 50 }),
  })

  const industriesQuery = useQuery({
    queryKey: queryKeys.publicIndustriesList(currentPage),
    queryFn: () => getPublicCategories({ page: currentPage, perPage: CATEGORIES_LIST_PER_PAGE }),
    placeholderData: (previousData) => previousData,
  })

  const statsIndustries = useMemo(() => {
    if (!statsQuery.data?.success) return []
    return statsQuery.data.data.map(mapCategoryToIndustry)
  }, [statsQuery.data])

  const industries = useMemo(() => {
    if (!industriesQuery.data?.success) return []
    return industriesQuery.data.data.map(mapCategoryToIndustry)
  }, [industriesQuery.data])

  const isLoading = industriesQuery.isLoading
  const loadError =
    industriesQuery.data?.success === false
      ? industriesQuery.data.message || "Failed to load industries."
      : null
  const totalPages = industriesQuery.data?.success ? industriesQuery.data.meta?.last_page ?? 1 : 1
  const totalIndustries = industriesQuery.data?.success
    ? industriesQuery.data.meta?.total ?? industries.length
    : 0
  const paginationFrom = industriesQuery.data?.success ? industriesQuery.data.meta?.from ?? null : null
  const paginationTo = industriesQuery.data?.success ? industriesQuery.data.meta?.to ?? null : null

  useEffect(() => {
    const pageParam = searchParams.get("page")
    const parsed = pageParam ? parseInt(pageParam, 10) : 1
    if (Number.isFinite(parsed) && parsed > 0) {
      setCurrentPage(parsed)
    }
  }, [searchParams])

  const goToPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(nextPage)
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage > 1) {
      params.set("page", String(nextPage))
    } else {
      params.delete("page")
    }
    const query = params.toString()
    router.replace(query ? `/industries?${query}` : "/industries", { scroll: false })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const statsSource = statsIndustries.length > 0 ? statsIndustries : industries
  const totalSuppliers = statsSource.reduce((acc, ind) => acc + ind.supplierCount, 0)
  const totalProducts = statsSource.reduce((acc, ind) => acc + ind.productCount, 0)
  const totalSubcategories = statsSource.reduce((acc, ind) => acc + ind.categories.length, 0)
  const industryCount = totalIndustries || statsSource.length

  return (
    <main className="min-w-0 flex-1">
      <section className="bg-primary py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3 bg-secondary/20 px-2.5 py-0.5 text-xs text-primary-foreground sm:mb-4 sm:px-3 sm:py-1 sm:text-sm">
              {t?.landing?.industries?.majorIndustriesBadge || "Major Industries"}{" "}
              {isLoading && statsIndustries.length === 0 ? "" : `(${industryCount})`}
            </Badge>
            <h1 className="font-serif text-2xl font-medium tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
              {t?.landing?.industries?.pageTitle || "Explore Industries"}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/80 sm:mt-4 sm:text-lg">
              {t?.landing?.industries?.pageDescription ||
                "Discover reviewed manufacturers and suppliers across all major industries. From electronics to textiles, find the perfect partner for your business."}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-5 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
            <div className="text-center">
              <div className="text-xl font-bold text-secondary sm:text-3xl">
                {isLoading && industryCount === 0 ? "—" : industryCount}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                {t?.landing?.industries?.majorIndustriesBadge || "Industries"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-secondary sm:text-3xl">{isLoading ? "—" : totalSubcategories}</div>
              <div className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                {t?.landing?.industries?.categoriesLabel || "Categories"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-secondary sm:text-3xl">
                {isLoading ? "—" : `${Math.max(0, (totalSuppliers / 1000) || 0).toFixed(0)}K+`}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                {t?.landing?.industries?.suppliersLabel || "Suppliers"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-secondary sm:text-3xl">
                {isLoading ? "—" : `${Math.max(0, (totalProducts / 1000) || 0).toFixed(0)}K+`}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                {t?.landing?.industries?.productsLabel || "Products"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {loadError && (
        <section className="border-b border-border bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          {loadError}
        </section>
      )}

      <section className="py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {!isLoading && industries.length > 0 && (
            <p className="mb-4 text-sm text-muted-foreground sm:mb-6">
              {paginationFrom != null && paginationTo != null ? (
                <>
                  {t?.landing?.products?.showingResults
                    ?.replace("{from}", String(paginationFrom))
                    ?.replace("{to}", String(paginationTo))
                    ?.replace("{total}", totalIndustries.toLocaleString()) ||
                    `Showing ${paginationFrom}-${paginationTo} of ${totalIndustries.toLocaleString()} industries`}
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{totalIndustries.toLocaleString()}</span>{" "}
                  industries
                </>
              )}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border bg-card p-3 animate-pulse sm:rounded-2xl sm:p-6"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted sm:h-14 sm:w-14 sm:rounded-xl" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-muted sm:mt-5 sm:h-6" />
                  <div className="mt-2 hidden h-4 w-full rounded bg-muted sm:block" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-5 w-14 rounded-full bg-muted sm:h-6 sm:w-16" />
                    <div className="h-5 w-16 rounded-full bg-muted sm:h-6 sm:w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {industries.map((industry) => (
                <div
                  key={industry.id}
                  className="group min-w-0 overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg sm:rounded-2xl"
                >
                  <div className="p-3 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary sm:h-12 sm:w-12 sm:rounded-xl">
                        <DynamicIcon
                          name={industry.icon}
                          className="h-6 w-6"
                          fallback={<Factory className="h-6 w-6" />}
                        />
                      </div>
                      {industry.featured && (
                        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px] sm:px-2.5 sm:text-xs">
                          {t?.landing?.industries?.featuredBadge || "Featured"}
                        </Badge>
                      )}
                    </div>

                    <h2 className="mt-3 line-clamp-2 font-serif text-sm font-medium text-foreground transition-colors group-hover:text-secondary sm:mt-5 sm:line-clamp-1 sm:text-xl">
                      {industry.name}
                    </h2>
                    <p className="mt-1.5 hidden line-clamp-2 text-sm text-muted-foreground sm:mt-2 sm:block">
                      {industry.description}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs sm:mt-4 sm:gap-2 sm:text-sm">
                      <Factory className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                      <span className="font-medium text-foreground">{industry.supplierCount.toLocaleString()}</span>
                      <span className="truncate text-muted-foreground">
                        {t?.landing?.industries?.suppliersLabel || "Suppliers"}
                      </span>
                    </div>

                    {industry.categories.length > 0 && (
                      <div className="mt-2 hidden sm:mt-4 sm:block">
                        <div className="flex flex-wrap gap-1">
                          {industry.categories.slice(0, 3).map((category) => (
                            <span
                              key={category.id}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {category.name}
                            </span>
                          ))}
                          {industry.categories.length > 3 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {(() => {
                                const n = industry.categories.length - 3
                                const tpl = t?.landing?.industries?.moreCategories
                                if (typeof tpl === "string" && tpl.includes("{count}")) {
                                  return tpl.replace(/\{count\}/g, String(n))
                                }
                                return `+${n} more`
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:gap-3">
                      <Button size="sm" className="h-8 w-full gap-1.5 text-xs sm:h-9 sm:w-auto sm:gap-2 sm:text-sm" asChild>
                        <Link href={`/industries/${industry.slug}`}>
                          {t?.landing?.industries?.exploreButton || "Explore"}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-full text-xs sm:h-9 sm:w-auto sm:text-sm" asChild>
                        <Link href={`/suppliers?industry=${industry.slug}`}>
                          {t?.landing?.industries?.suppliersButton || "Suppliers"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && industries.length === 0 && !loadError && (
            <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center sm:py-16">
              <Factory className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">No industries found</h3>
            </div>
          )}

          {!isLoading && industries.length > 0 && (
            <ListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={totalIndustries}
              from={paginationFrom}
              to={paginationTo}
              perPage={CATEGORIES_LIST_PER_PAGE}
              loading={isLoading}
              onPageChange={goToPage}
              labels={{
                previous: t?.landing?.products?.previous || "Previous",
                next: t?.landing?.products?.next || "Next",
                pageOf: t?.landing?.products?.pageOf,
                perPage: t?.landing?.products?.perPage || "per page",
                showingResults: t?.landing?.products?.showingResults,
              }}
            />
          )}
        </div>
      </section>

      <section className="bg-muted py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-xl font-medium text-foreground sm:text-2xl lg:text-3xl">
              {t?.landing?.industries?.cantFindTitle || "Can't find your industry?"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
              {t?.landing?.industries?.cantFindDesc ||
                "We're constantly expanding our network. Contact us to learn about upcoming industries."}
            </p>
            <Button className="mt-5 h-10 w-full gap-2 sm:mt-8 sm:h-11 sm:w-auto" asChild>
              <Link href="/contact">
                {t?.landing?.industries?.contactUsButton || "Contact Us"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
