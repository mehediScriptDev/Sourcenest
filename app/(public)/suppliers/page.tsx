"use client"

import { Suspense, useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { industries } from "@/lib/data/industries"
import { countries as allCountries, popularManufacturingCountries, exportMarketRegions } from "@/lib/data/countries"
import { SupplierActionButtons } from "@/components/suppliers/supplier-action-buttons"
import { CompareBar } from "@/components/suppliers/compare-bar"
import { getPublicSuppliers, SUPPLIERS_LIST_PER_PAGE, Supplier as ApiSupplier } from "@/lib/api/public-suppliers"
import { queryKeys } from "@/lib/query-keys"
import { Supplier } from "@/lib/data/suppliers"
import { ListPagination } from "@/components/common/list-pagination"
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Clock, 
  Package,
  CheckCircle,
  ChevronRight,
  X,
  Factory,
  Loader2
} from "lucide-react"

const reviewLevels = [
  { value: "basic", label: "Basic Reviewed" },
  { value: "standard", label: "Standard Reviewed" },
  { value: "premium", label: "Premium Reviewed" },
  { value: "enterprise", label: "Enterprise Reviewed" },
]

const certifications = [
  { value: "ISO9001", label: "ISO 9001" },
  { value: "ISO14001", label: "ISO 14001" },
  { value: "CE", label: "CE Marking" },
  { value: "BSCI", label: "BSCI" },
  { value: "SEDEX", label: "SEDEX" },
  { value: "ROHS", label: "RoHS" },
  { value: "FDA", label: "FDA Approved" },
]

const moqRanges = [
  { value: "1-100", label: "1-100 units" },
  { value: "100-500", label: "100-500 units" },
  { value: "500-1000", label: "500-1,000 units" },
  { value: "1000-5000", label: "1,000-5,000 units" },
  { value: "5000+", label: "5,000+ units" },
]

// Get popular manufacturing countries for quick filter
const popularCountries = allCountries.filter(c => popularManufacturingCountries.includes(c.code))

function mapApiSupplierToMockSupplier(apiSupplier: ApiSupplier): Supplier {
  return {
    id: apiSupplier.id.toString(),
    name: apiSupplier.name,
    slug: apiSupplier.slug,
    description: apiSupplier.short_description || "",
    shortDescription: apiSupplier.short_description || "",
    industry: apiSupplier.industry || "Unknown",
    industrySlug: apiSupplier.industry_slug || "unknown",
    categories: [],
    location: {
      city: apiSupplier.location.city || "",
      country: apiSupplier.location.country || "",
      countryCode: apiSupplier.location.country_code || ""
    },
    reviewed: apiSupplier.reviewed,
    reviewedLevel: (apiSupplier.reviewed_level as any) || "standard",
    yearEstablished: 0,
    employeeCount: "",
    productCount: apiSupplier.product_count,
    rating: apiSupplier.rating,
    reviewCount: apiSupplier.review_count,
    responseRate: apiSupplier.response_rate ? parseInt(apiSupplier.response_rate) : 0,
    responseTime: apiSupplier.response_time || "N/A",
    onTimeDelivery: apiSupplier.on_time_delivery ? parseInt(apiSupplier.on_time_delivery) : 0,
    certifications: apiSupplier.certifications || [],
    mainProducts: apiSupplier.main_products || [],
    exportMarkets: apiSupplier.export_markets || [],
  }
}

function SuppliersPageContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const countryParam = searchParams.get("country")
  const skipFilterPageReset = useRef(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all")
  const [selectedCertification, setSelectedCertification] = useState<string>("all")
  const [selectedMoq, setSelectedMoq] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filterOptionsQuery = useQuery({
    queryKey: queryKeys.publicSuppliersFilterOptions(),
    queryFn: () => getPublicSuppliers({ per_page: 100, page: 1 }),
  })

  const dynamicIndustries = useMemo(() => {
    if (!filterOptionsQuery.data?.data) return []
    const indMap = new Map<string, string>()
    filterOptionsQuery.data.data.forEach((s) => {
      if (s.industry && s.industry_slug) indMap.set(s.industry_slug, s.industry)
    })
    return Array.from(indMap.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filterOptionsQuery.data])

  const dynamicCertifications = useMemo(() => {
    if (!filterOptionsQuery.data?.data) return []
    const certSet = new Set<string>()
    filterOptionsQuery.data.data.forEach((s) => {
      s.certifications?.forEach((c) => certSet.add(c))
    })
    return Array.from(certSet)
      .sort()
      .map((c) => ({ value: c, label: c }))
  }, [filterOptionsQuery.data])

  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page")
    const parsed = pageParam ? parseInt(pageParam, 10) : 1
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  })

  const mappedCountry = countryParam
    ? allCountries.find((c) => c.code === countryParam)?.name
    : undefined

  const suppliersQuery = useQuery({
    queryKey: queryKeys.publicSuppliers(
      currentPage,
      debouncedSearch,
      selectedIndustry,
      selectedCertification,
      selectedMoq,
      mappedCountry ?? null
    ),
    queryFn: () =>
      getPublicSuppliers({
        page: currentPage,
        search: debouncedSearch || undefined,
        industry: selectedIndustry !== "all" ? selectedIndustry : undefined,
        country: mappedCountry || undefined,
        certification: selectedCertification !== "all" ? selectedCertification : undefined,
        moq: selectedMoq !== "all" ? selectedMoq : undefined,
      }),
    placeholderData: (previousData) => previousData,
  })

  const suppliers: Supplier[] =
    suppliersQuery.data?.data?.map(mapApiSupplierToMockSupplier) ?? []
  const isLoading = suppliersQuery.isLoading
  const totalPages = suppliersQuery.data?.meta?.last_page ?? 1
  const totalSuppliers = suppliersQuery.data?.meta?.total ?? suppliers.length
  const paginationFrom = suppliersQuery.data?.meta?.from ?? null
  const paginationTo = suppliersQuery.data?.meta?.to ?? null

  useEffect(() => {
    if (skipFilterPageReset.current) {
      skipFilterPageReset.current = false
      return
    }
    setCurrentPage(1)
    const params = new URLSearchParams(window.location.search)
    params.delete("page")
    const query = params.toString()
    router.replace(query ? `/suppliers?${query}` : "/suppliers", { scroll: false })
  }, [searchQuery, selectedIndustry, selectedCertification, selectedMoq, router])

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
    router.replace(query ? `/suppliers?${query}` : "/suppliers", { scroll: false })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedIndustry("all")
    setSelectedCertification("all")
    setSelectedMoq("all")
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || selectedIndustry !== "all" || selectedCertification !== "all" || selectedMoq !== "all"

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="min-w-0 flex-1">
        <section className="bg-primary py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-serif text-2xl font-medium tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                {t?.landing?.suppliers?.pageTitle || "Find Reviewed Suppliers"}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/80 sm:mt-4 sm:text-lg">
                {(t?.landing?.suppliers?.pageSubtitle || "Explore reviewed manufacturers from around the world").replace("{count}", totalSuppliers.toString())}
              </p>
            </div>

            <div className="mx-auto mt-6 max-w-3xl sm:mt-8">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4 sm:h-5 sm:w-5" />
                  <Input
                    type="text"
                    placeholder={t?.landing?.suppliers?.searchPlaceholder || "Search suppliers, products, or categories..."}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-11 bg-background pl-10 text-sm sm:h-12 sm:pl-12 sm:text-base"
                  />
                </div>
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="h-11 w-11 shrink-0 bg-primary-foreground text-primary hover:bg-primary-foreground/90 lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                  aria-label={t?.landing?.suppliers?.filters || "Filters"}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
              <aside className={`w-full lg:w-64 lg:shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">{t?.landing?.suppliers?.filters || "Filters"}</h2>
                    {hasActiveFilters && (
                      <button 
                        onClick={clearFilters}
                        className="text-sm text-secondary hover:underline"
                      >
                        {t?.landing?.suppliers?.clearAll || "Clear all"}
                      </button>
                    )}
                  </div>

                  <div className="mt-6 space-y-6">
                    {/* Industry Filter */}
                    <div>
                      <label className="text-sm font-medium text-foreground">{t?.landing?.suppliers?.industryLabel || "Industry"}</label>
                      <Select value={selectedIndustry} onValueChange={(val) => { setSelectedIndustry(val); setCurrentPage(1); }}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t?.landing?.suppliers?.allIndustries || "All Industries"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t?.landing?.suppliers?.allIndustries || "All Industries"}</SelectItem>
                          {dynamicIndustries.map((industry) => (
                            <SelectItem key={industry.slug} value={industry.slug}>
                              {industry.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Certification Filter */}
                    <div>
                      <label className="text-sm font-medium text-foreground">{t?.landing?.suppliers?.certificationLabel || "Certification"}</label>
                      <Select value={selectedCertification} onValueChange={(val) => { setSelectedCertification(val); setCurrentPage(1); }}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t?.landing?.suppliers?.anyCertification || "Any Certification"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t?.landing?.suppliers?.anyCertification || "Any Certification"}</SelectItem>
                          {dynamicCertifications.map((cert) => (
                            <SelectItem key={cert.value} value={cert.value}>
                              {cert.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* MOQ Filter */}
                    <div>
                      <label className="text-sm font-medium text-foreground">{t?.landing?.suppliers?.minimumOrderLabel || "Minimum Order"}</label>
                      <Select value={selectedMoq} onValueChange={(val) => { setSelectedMoq(val); setCurrentPage(1); }}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t?.landing?.suppliers?.anyMOQ || "Any MOQ"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t?.landing?.suppliers?.anyMOQ || "Any MOQ"}</SelectItem>
                          {moqRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {paginationFrom != null && paginationTo != null ? (
                      <>
                        {t?.landing?.products?.showingResults
                          ?.replace("{from}", String(paginationFrom))
                          ?.replace("{to}", String(paginationTo))
                          ?.replace("{total}", totalSuppliers.toLocaleString()) ||
                          `Showing ${paginationFrom}-${paginationTo} of ${totalSuppliers.toLocaleString()} suppliers`}
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-foreground">{totalSuppliers.toLocaleString()}</span>{" "}
                        {t?.landing?.suppliers?.suppliersFound || "suppliers found"}
                      </>
                    )}
                  </p>
                  <div className="lg:hidden">
                    <Select defaultValue="relevance">
                      <SelectTrigger className="h-9 w-full text-sm sm:w-44">
                        <SelectValue placeholder={t?.landing?.suppliers?.sortBy || "Sort by"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">{t?.landing?.suppliers?.relevance || "Relevance"}</SelectItem>
                        <SelectItem value="rating">{t?.landing?.suppliers?.highestRating || "Highest Rating"}</SelectItem>
                        <SelectItem value="response">{t?.landing?.suppliers?.fastestResponse || "Fastest Response"}</SelectItem>
                        <SelectItem value="products">{t?.landing?.suppliers?.mostProducts || "Most Products"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="hidden lg:block">
                    <Select defaultValue="relevance">
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder={t?.landing?.suppliers?.sortBy || "Sort by"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">{t?.landing?.suppliers?.relevance || "Relevance"}</SelectItem>
                        <SelectItem value="rating">{t?.landing?.suppliers?.highestRating || "Highest Rating"}</SelectItem>
                        <SelectItem value="response">{t?.landing?.suppliers?.fastestResponse || "Fastest Response"}</SelectItem>
                        <SelectItem value="products">{t?.landing?.suppliers?.mostProducts || "Most Products"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mb-4 flex flex-wrap items-center gap-1.5 sm:mb-6 sm:gap-2">
                    <span className="text-sm text-muted-foreground">{t?.landing?.suppliers?.activeFilters || "Active filters:"}</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        {t?.landing?.suppliers?.search || "Search:"} {searchQuery}
                        <button onClick={() => { setSearchQuery(""); setCurrentPage(1); }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedIndustry !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {dynamicIndustries.find(i => i.slug === selectedIndustry)?.name || selectedIndustry}
                        <button onClick={() => { setSelectedIndustry("all"); setCurrentPage(1); }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}

                {isLoading ? (
                  <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border sm:h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 sm:space-y-4">
                      {suppliers.map((supplier) => (
                        <Link
                          key={supplier.id}
                          href={`/suppliers/${supplier.slug}`}
                          className="group block min-w-0 rounded-xl border border-border bg-card p-3 transition-all hover:border-secondary hover:shadow-md sm:rounded-2xl sm:p-5"
                        >
                          <div className="flex gap-3 sm:gap-6">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-20 sm:w-20 sm:rounded-xl">
                              <Factory className="h-5 w-5 text-muted-foreground sm:h-10 sm:w-10" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-secondary sm:text-base">
                                      {supplier.name}
                                    </h3>
                                    {supplier.reviewed && (
                                      <Badge variant="secondary" className="hidden shrink-0 px-1.5 py-0 text-[10px] sm:inline-flex sm:px-2.5 sm:text-xs">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        {t?.landing?.suppliers?.reviewedBadge || "Reviewed"}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground sm:mt-1 sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                                    <span className="flex min-w-0 items-center gap-1">
                                      <MapPin className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
                                      <span className="truncate">
                                        {supplier.location.city}, {supplier.location.country}
                                      </span>
                                    </span>
                                    <span className="truncate">{supplier.industry}</span>
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                                  <SupplierActionButtons supplier={supplier} variant="icon" />
                                  <ChevronRight className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block" />
                                </div>
                              </div>

                              <p className="mt-2 hidden line-clamp-2 text-sm text-muted-foreground sm:mt-3 sm:block">
                                {supplier.shortDescription}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:mt-4 sm:gap-4 sm:text-sm">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 sm:h-4 sm:w-4" />
                                  <span className="font-medium text-foreground">{supplier.rating}</span>
                                  <span className="text-muted-foreground">({supplier.reviewCount})</span>
                                </div>
                                <div className="hidden items-center gap-1 text-muted-foreground sm:flex">
                                  <Clock className="h-4 w-4" />
                                  {supplier.responseTime}
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  {supplier.productCount.toLocaleString()} {t?.landing?.suppliers?.productsLabel || "products"}
                                </div>
                              </div>

                              <div className="mt-2 hidden flex-wrap gap-1.5 sm:mt-3 sm:flex sm:gap-2">
                                {supplier.mainProducts.slice(0, 4).map((product) => (
                                  <span 
                                    key={product}
                                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                  >
                                    {product}
                                  </span>
                                ))}
                                {supplier.mainProducts.length > 4 && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    +{supplier.mainProducts.length - 4} {t?.landing?.suppliers?.moreProducts?.split("{count}")[1] || "more"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {suppliers.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center sm:py-16">
                        <Factory className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 font-semibold text-foreground">{t?.landing?.suppliers?.noSuppliersFound || "No suppliers found"}</h3>
                        <p className="mt-2 text-muted-foreground">
                          {t?.landing?.suppliers?.adjustSearchFilters || "Try adjusting your search or filter criteria"}
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={clearFilters}
                        >
                          {t?.landing?.suppliers?.clearAllFilters || "Clear all filters"}
                        </Button>
                      </div>
                    )}

                    <ListPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      total={totalSuppliers}
                      from={paginationFrom}
                      to={paginationTo}
                      perPage={SUPPLIERS_LIST_PER_PAGE}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CompareBar />
    </div>
  )
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SuppliersPageContent />
    </Suspense>
  )
}
