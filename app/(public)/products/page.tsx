"use client"

import { Suspense, useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "@/lib/i18n"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { getProducts, mapProductSortParam, PRODUCTS_LIST_PER_PAGE, type Product } from "@/lib/api/products"
import { getPublicCategories, type BackendCategory } from "@/lib/api/categories"
import { queryKeys } from "@/lib/query-keys"
import { ProductActionButtons } from "@/components/products/product-action-buttons"
import { countries as countryData } from "@/lib/data/countries"
import { getPublicSuppliers } from "@/lib/api/public-suppliers"



import { 
  Search, 
  Filter, 
  Package,
  ChevronRight,
  X,
  Factory,
  CheckCircle,
  Loader2,
  MapPin,
  ShieldCheck,
  Globe
} from "lucide-react"

function buildPublicProductFilters(
  allCategories: BackendCategory[],
  selectedCategory: string,
  debouncedSearch: string,
  selectedCountry: string,
  selectedMoq: string,
  selectedCerts: string[],
  selectedMarkets: string[],
  sortBy: string
): Record<string, unknown> {
  const filters: Record<string, unknown> = {}

  if (selectedCategory !== "all") {
    filters.category = selectedCategory
    let foundCat = allCategories.find(
      (c) => (c.slug || c.name.toLowerCase().replace(/\s+/g, "-")) === selectedCategory
    )
    if (foundCat) {
      filters.category_id = foundCat.id
      filters.category_slug = foundCat.slug || selectedCategory
    } else {
      for (const cat of allCategories) {
        const sub = (cat.sub_categories || cat.subcategories || []).find(
          (s) => (s.slug || s.name.toLowerCase().replace(/\s+/g, "-")) === selectedCategory
        )
        if (sub) {
          foundCat = cat
          filters.category_id = cat.id
          filters.category_slug = cat.slug
          break
        }
      }
    }
  }

  if (debouncedSearch) {
    filters.search = debouncedSearch
  }
  if (selectedCountry) filters.country = selectedCountry
  if (selectedMoq) filters.moq = selectedMoq
  if (selectedCerts.length > 0) filters.certifications = selectedCerts.join(",")
  if (selectedMarkets.length > 0) filters.markets = selectedMarkets.join(",")

  const sortParam = mapProductSortParam(sortBy)
  if (sortParam) filters.sort = sortParam

  filters.per_page = PRODUCTS_LIST_PER_PAGE
  return filters
}

function ProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const moqRanges = useMemo(() => [
    { label: `< 100 ${t?.landing?.products?.pieces || "pieces"}`, value: "<100" },
    { label: `100 - 500 ${t?.landing?.products?.pieces || "pieces"}`, value: "100-500" },
    { label: `500 - 1000 ${t?.landing?.products?.pieces || "pieces"}`, value: "500-1000" },
    { label: `> 1000 ${t?.landing?.products?.pieces || "pieces"}`, value: ">1000" },
  ], [t])

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all")
  const [sortBy, setSortBy] = useState("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page")
    const parsed = pageParam ? parseInt(pageParam, 10) : 1
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  })
  const skipFilterPageReset = useRef(true)

  // New Quick Filters states
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [selectedMoq, setSelectedMoq] = useState<string>("")
  const [selectedCerts, setSelectedCerts] = useState<string[]>([])
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Get featured countries
  const featuredCountries = useMemo(() => {
    const featured = countryData.filter(c => c.featured)
    if (featured.length > 0) {
      return featured.slice(0, 8)
    }
    return countryData
      .filter(c => ["CN", "IN", "VN", "TH", "TR", "DE", "ID", "BD"].includes(c.code))
      .slice(0, 8)
  }, [])

  const categoriesQuery = useQuery({
    queryKey: queryKeys.publicCategories(100),
    queryFn: () => getPublicCategories({ perPage: 100 }),
  })

  const supplierFiltersQuery = useQuery({
    queryKey: queryKeys.publicSuppliersFilterSource(),
    queryFn: () => getPublicSuppliers(),
  })

  const allCategories = categoriesQuery.data?.success ? categoriesQuery.data.data : []

  const dynamicCertifications = useMemo(() => {
    const suppliers = supplierFiltersQuery.data?.data
    if (!suppliers) return []
    const certSet = new Set<string>()
    suppliers.forEach((supplier) => {
      supplier.certifications?.forEach((cert) => certSet.add(cert))
    })
    return Array.from(certSet).sort()
  }, [supplierFiltersQuery.data])

  const dynamicExportMarkets = useMemo(() => {
    const suppliers = supplierFiltersQuery.data?.data
    if (!suppliers) return []
    const marketSet = new Set<string>()
    suppliers.forEach((supplier) => {
      supplier.export_markets?.forEach((market) => marketSet.add(market))
    })
    return Array.from(marketSet).sort()
  }, [supplierFiltersQuery.data])

  const certsKey = selectedCerts.join(",")
  const marketsKey = selectedMarkets.join(",")

  const productsQuery = useQuery({
    queryKey: queryKeys.publicProducts(
      currentPage,
      debouncedSearch,
      selectedCategory,
      sortBy,
      selectedCountry,
      selectedMoq,
      certsKey,
      marketsKey,
      allCategories.length
    ),
    queryFn: () =>
      getProducts(
        currentPage,
        buildPublicProductFilters(
          allCategories,
          selectedCategory,
          debouncedSearch,
          selectedCountry,
          selectedMoq,
          selectedCerts,
          selectedMarkets,
          sortBy
        )
      ),
    placeholderData: (previousData) => previousData,
  })

  const products: Product[] = productsQuery.data?.success ? productsQuery.data.data : []
  const loading = productsQuery.isLoading
  const error =
    productsQuery.data?.success === false
      ? productsQuery.data.message || "Failed to load products"
      : null
  const totalPages = productsQuery.data?.success ? productsQuery.data.meta?.last_page || 1 : 1
  const totalProducts = productsQuery.data?.success
    ? productsQuery.data.meta?.total ?? products.length
    : 0
  const paginationFrom = productsQuery.data?.success ? productsQuery.data.meta?.from ?? null : null
  const paginationTo = productsQuery.data?.success ? productsQuery.data.meta?.to ?? null : null

  // Reset page when filters change (skip initial mount so ?page=2 URLs still work)
  useEffect(() => {
    if (skipFilterPageReset.current) {
      skipFilterPageReset.current = false
      return
    }

    setCurrentPage(1)
    const params = new URLSearchParams(window.location.search)
    params.delete("page")
    const query = params.toString()
    router.replace(query ? `/products?${query}` : "/products", { scroll: false })
  }, [selectedCategory, searchQuery, sortBy, selectedCountry, selectedMoq, selectedCerts, selectedMarkets, router])

  // Use the fetched categories for the dropdown
  const categories = useMemo(() => {
    const list = allCategories.map(c => ({ slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'), name: c.name }))
    // If selectedCategory is not in the list (e.g. it's a subcategory), add it temporarily so the dropdown doesn't break
    if (selectedCategory !== "all" && !list.find(c => c.slug === selectedCategory)) {
      // Find the subcategory name
      let subName = selectedCategory
      for (const cat of allCategories) {
        const sub = (cat.sub_categories || cat.subcategories || []).find(s => (s.slug || s.name.toLowerCase().replace(/\s+/g, '-')) === selectedCategory)
        if (sub) {
          subName = sub.name
          break
        }
      }
      list.push({ slug: selectedCategory, name: subName })
    }
    return list
  }, [allCategories, selectedCategory])

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
    router.replace(query ? `/products?${query}` : "/products", { scroll: false })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Sync category from URL params when they change
  useEffect(() => {
    const cat = searchParams.get("category")
    if (cat) {
      setSelectedCategory(cat)
    }

    const pageParam = searchParams.get("page")
    const parsed = pageParam ? parseInt(pageParam, 10) : 1
    if (Number.isFinite(parsed) && parsed > 0) {
      setCurrentPage(parsed)
    }
  }, [searchParams])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSortBy("relevance")
    setSelectedCountry("")
    setSelectedMoq("")
    setSelectedCerts([])
    setSelectedMarkets([])
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || sortBy !== "relevance" || selectedCountry || selectedMoq || selectedCerts.length > 0 || selectedMarkets.length > 0

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="min-w-0 flex-1">
        {/* Hero Section */}
        <section className="bg-primary py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-serif text-2xl font-medium tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                {t?.landing?.products?.pageTitle || "Discover Products"}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/80 sm:mt-4 sm:text-lg">
                {t?.landing?.products?.pageDescription?.replace("{productCount}", totalProducts.toLocaleString()) || `Browse ${totalProducts.toLocaleString()}+ products from reviewed manufacturers worldwide`}
              </p>
            </div>

            <div className="mx-auto mt-6 max-w-3xl sm:mt-8">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4 sm:h-5 sm:w-5" />
                  <Input
                    type="text"
                    placeholder={t?.landing?.products?.searchPlaceholder || "Search products, categories..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 bg-background pl-10 text-sm sm:h-12 sm:pl-12 sm:text-base"
                  />
                </div>
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="h-11 w-11 shrink-0 bg-primary-foreground text-primary hover:bg-primary-foreground/90 lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                  aria-label={t?.landing?.products?.filters || "Filters"}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6 sm:py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
              {/* Filters Sidebar */}
              <aside className={`w-full lg:w-64 lg:shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">{t?.landing?.products?.filters || "Filters"}</h2>
                    {hasActiveFilters && (
                      <button 
                        onClick={clearFilters}
                        className="text-sm text-secondary hover:underline"
                      >
                        {t?.landing?.products?.clearAll || "Clear all"}
                      </button>
                    )}
                  </div>

                  <div className="mt-6 space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="text-sm font-medium text-foreground">{t?.landing?.products?.categoryLabel || "Category"}</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t?.landing?.products?.allCategories || "All Categories"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t?.landing?.products?.allCategories || "All Categories"}</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.slug} value={category.slug}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="text-sm font-medium text-foreground">{t?.landing?.products?.sortLabel || "Sort By"}</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t?.landing?.products?.sortBy || "Sort by"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">{t?.landing?.products?.relevance || "Relevance"}</SelectItem>
                          <SelectItem value="price-low">{t?.landing?.products?.priceLow || "Price: Low to High"}</SelectItem>
                          <SelectItem value="price-high">{t?.landing?.products?.priceHigh || "Price: High to Low"}</SelectItem>
                          <SelectItem value="moq-low">{t?.landing?.products?.lowestMOQ || "Lowest MOQ"}</SelectItem>
                          <SelectItem value="newest">{t?.landing?.products?.newestFirst || "Newest First"}</SelectItem>
                          <SelectItem value="popularity">{t?.landing?.products?.mostPopular || "Most Popular"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Country Filter */}
                    <div className="border-t border-border pt-5">
                      <label className="text-sm font-medium text-foreground">{t?.landing?.products?.country || "Country"}</label>
                      <Select 
                        value={selectedCountry || "all"} 
                        onValueChange={(val) => setSelectedCountry(val === "all" ? "" : val)}
                      >
                        <SelectTrigger className="mt-2 w-full">
                          <SelectValue placeholder={t?.landing?.products?.country || "Select country"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t?.landing?.products?.allCountries || "All Countries"}</SelectItem>
                          {featuredCountries.map((country) => (
                            <SelectItem key={country.code} value={country.name.toLowerCase()}>
                              {country.flag || ""} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* MOQ Range */}
                    <div className="border-t border-border pt-5">
                      <label className="text-sm font-medium text-foreground">{t?.landing?.products?.minimumOrder || "Minimum Order"}</label>
                      <Select 
                        value={selectedMoq || "all"} 
                        onValueChange={(val) => setSelectedMoq(val === "all" ? "" : val)}
                      >
                        <SelectTrigger className="mt-2 w-full">
                          <SelectValue placeholder={t?.landing?.products?.minimumOrder || "Select MOQ range"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t?.landing?.products?.anyMoq || "Any MOQ"}</SelectItem>
                          {moqRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Certifications */}
                    <div className="border-t border-border pt-5">
                      <label className="text-sm font-medium text-foreground">{t?.landing?.products?.certifications || "Certifications"}</label>
                      <div className="mt-3 space-y-2">
                        {dynamicCertifications.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No certifications available</p>
                        ) : dynamicCertifications.map((cert) => (
                          <label
                            key={cert}
                            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <Checkbox
                              checked={selectedCerts.includes(cert)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCerts([...selectedCerts, cert])
                                } else {
                                  setSelectedCerts(selectedCerts.filter(c => c !== cert))
                                }
                              }}
                            />
                            <ShieldCheck className="h-3 w-3" />
                            {cert}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Export Markets 
                    <div className="border-t border-border pt-5">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Globe className="h-4 w-4" />
                        {t?.landing?.products?.exportMarkets || "Export Markets"}
                      </label>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {dynamicExportMarkets.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No markets available</p>
                        ) : dynamicExportMarkets.map((market) => (
                          <Badge 
                            key={market}
                            variant={selectedMarkets.includes(market) ? "default" : "outline"} 
                            className={`cursor-pointer transition-colors ${selectedMarkets.includes(market) ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : 'hover:bg-secondary hover:text-secondary-foreground'}`}
                            onClick={() => {
                              if (selectedMarkets.includes(market)) {
                                setSelectedMarkets(selectedMarkets.filter(m => m !== market))
                              } else {
                                setSelectedMarkets([...selectedMarkets, market])
                              }
                            }}
                          >
                            {market}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    */}
                  </div>
                </div>
              </aside>

              {/* Results */}
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {paginationFrom != null && paginationTo != null ? (
                      <>
                        {t?.landing?.products?.showingResults
                          ?.replace("{from}", String(paginationFrom))
                          ?.replace("{to}", String(paginationTo))
                          ?.replace("{total}", totalProducts.toLocaleString()) ||
                          `Showing ${paginationFrom}-${paginationTo} of ${totalProducts.toLocaleString()} products`}
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-foreground">{totalProducts.toLocaleString()}</span>{" "}
                        {t?.landing?.products?.productsFound || "products found"}
                      </>
                    )}
                  </p>
                  <div className="lg:hidden">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-9 w-full text-sm sm:w-[200px]">
                        <SelectValue placeholder={t?.landing?.products?.sortBy || "Sort by"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">{t?.landing?.products?.relevance || "Relevance"}</SelectItem>
                        <SelectItem value="price-low">{t?.landing?.products?.priceLow || "Price: Low to High"}</SelectItem>
                        <SelectItem value="price-high">{t?.landing?.products?.priceHigh || "Price: High to Low"}</SelectItem>
                        <SelectItem value="moq-low">{t?.landing?.products?.lowestMOQ || "Lowest MOQ"}</SelectItem>
                        <SelectItem value="newest">{t?.landing?.products?.newestFirst || "Newest First"}</SelectItem>
                        <SelectItem value="popularity">{t?.landing?.products?.mostPopular || "Most Popular"}</SelectItem>
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
                        <button onClick={() => setSearchQuery("")}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedCategory !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {categories.find(c => c.slug === selectedCategory)?.name}
                        <button onClick={() => setSelectedCategory("all")}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {sortBy !== "relevance" && (
                      <Badge variant="secondary" className="gap-1">
                        {t?.landing?.products?.sortDisplay || "Sort:"} {sortBy}
                        <button onClick={() => setSortBy("relevance")}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedCountry && (
                      <Badge variant="secondary" className="gap-1">
                        {t?.landing?.products?.country || "Country"}: {selectedCountry}
                        <button onClick={() => setSelectedCountry("")}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedMoq && (
                      <Badge variant="secondary" className="gap-1">
                        {t?.landing?.products?.moqLabel || "MOQ:"} {moqRanges.find(r => r.value === selectedMoq)?.label || selectedMoq}
                        <button onClick={() => setSelectedMoq("")}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedCerts.map(cert => (
                      <Badge key={cert} variant="secondary" className="gap-1">
                        {t?.landing?.products?.certifications || "Cert:"} {cert}
                        <button onClick={() => setSelectedCerts(selectedCerts.filter(c => c !== cert))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedMarkets.map(market => (
                      <Badge key={market} variant="secondary" className="gap-1">
                        {t?.landing?.products?.exportMarkets || "Market:"} {market}
                        <button onClick={() => setSelectedMarkets(selectedMarkets.filter(m => m !== market))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                    <p className="font-semibold">{t?.landing?.products?.errorLoadingProducts || "Error loading products"}</p>
                    <p className="mt-1">{error}</p>
                  </div>
                )}

                {/* Product Cards */}
                {!loading && !error && (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                      {products.map((product) => {
                        const minPrice = product.pricing_quantities?.min_price?.price?.amount
                        const maxPrice = product.pricing_quantities?.max_price?.price?.amount
                        const unit = product.pricing_quantities?.unit || "units"
                        const moq = product.pricing_quantities?.minimum_order_quantity ?? 1
                        const leadTime = product.pricing_quantities?.lead_time || "N/A"
                        const imageSrc = product.image || product.images?.[0]

                        return (
                        <div
                          key={product.id}
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md sm:rounded-2xl sm:hover:shadow-lg"
                        >
                          <div className="relative aspect-square overflow-hidden bg-muted sm:aspect-4/3">
                            {imageSrc ? (
                              <img 
                                src={imageSrc} 
                                alt={product.name} 
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="h-10 w-10 text-muted-foreground/30 sm:h-12 sm:w-12" />
                              </div>
                            )}
                            {product.category?.name && (
                              <Badge className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate px-1.5 py-0.5 text-[10px] sm:left-3 sm:top-3 sm:px-2.5 sm:text-xs">
                                {product.category.name}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-secondary sm:line-clamp-1 sm:text-base">
                              {product.name}
                            </h3>

                            <p className="mt-1 hidden line-clamp-2 text-sm text-muted-foreground sm:block">
                              {product.description}
                            </p>

                            {minPrice && maxPrice && (
                              <div className="mt-2 sm:mt-3">
                                <span className="text-sm font-semibold text-foreground sm:text-lg">
                                  ${parseFloat(minPrice).toFixed(2)} - ${parseFloat(maxPrice).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-muted-foreground sm:text-sm"> / {unit}</span>
                              </div>
                            )}

                            <div className="mt-auto grid grid-cols-1 gap-2 border-t border-border pt-2.5 text-xs sm:mt-3 sm:grid-cols-2 sm:gap-3 sm:pt-3 sm:text-sm">
                              <div className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">MOQ</span>
                                <span className="mt-0.5 line-clamp-2 font-medium text-foreground sm:truncate">
                                  {moq.toLocaleString()}{" "}
                                  <span className="text-muted-foreground">{unit}</span>
                                </span>
                              </div>
                              <div className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">Lead</span>
                                <span className="mt-0.5 line-clamp-1 font-medium text-foreground sm:truncate">
                                  {leadTime} {t?.landing?.products?.daysLabel || "days"}
                                </span>
                              </div>
                            </div>

                            {product.inquiry_count > 0 && (
                              <div className="mt-1.5 hidden text-xs text-amber-600 sm:mt-2 sm:block">
                                ⭐ {product.inquiry_count} {t?.landing?.products?.inquiriesLabel || "inquiries"}
                              </div>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>

                    {totalProducts > 0 && (
                      <div className="mt-6 flex flex-col items-stretch gap-3 sm:mt-8">
                        {totalPages > 1 && (
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3"
                              disabled={currentPage === 1 || loading}
                              onClick={() => goToPage(currentPage - 1)}
                            >
                              {t?.landing?.products?.previous || "Previous"}
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter((page) => {
                                if (totalPages <= 7) return true
                                if (page === 1 || page === totalPages) return true
                                return Math.abs(page - currentPage) <= 1
                              })
                              .map((page, index, visiblePages) => {
                                const prevPage = visiblePages[index - 1]
                                const showEllipsis = prevPage != null && page - prevPage > 1

                                return (
                                  <span key={page} className="flex items-center gap-1.5">
                                    {showEllipsis && (
                                      <span className="px-1 text-sm text-muted-foreground">…</span>
                                    )}
                                    <Button
                                      variant={page === currentPage ? "default" : "outline"}
                                      size="sm"
                                      className="h-9 min-w-9 px-3"
                                      disabled={loading}
                                      onClick={() => goToPage(page)}
                                    >
                                      {page}
                                    </Button>
                                  </span>
                                )
                              })}

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3"
                              disabled={currentPage === totalPages || loading}
                              onClick={() => goToPage(currentPage + 1)}
                            >
                              {t?.landing?.products?.next || "Next"}
                            </Button>
                          </div>
                        )}

                        <p className="text-center text-xs text-muted-foreground sm:text-sm">
                          {t?.landing?.products?.pageOf
                            ?.replace("{page}", String(currentPage))
                            ?.replace("{lastPage}", String(totalPages)) ||
                            `Page ${currentPage} of ${totalPages}`}
                          {` · ${PRODUCTS_LIST_PER_PAGE} ${t?.landing?.products?.perPage || "per page"}`}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Empty State */}
                {!loading && !error && products.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center sm:py-16">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 font-semibold text-foreground">{t?.landing?.products?.noProductsFound || "No products found"}</h3>
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
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
