"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Globe,
  MapPin,
  Search,
  ArrowRight,
  ChevronRight,
  FileQuestion,
  MessageSquare,
  Loader2,
} from "lucide-react"
import {
  getSuppliersMap,
  getSuppliersMapGroups,
  getSuppliersMapTopCountries,
  type ApiSupplierMapCountry,
  type ApiSupplierMapResponse,
  type ApiSupplierMapGroup,
  type ApiSupplierMapTopCountry,
} from "@/lib/api/public-suppliers"
import { getPublicCategoriesTotal } from "@/lib/api/categories"
import { getProducts } from "@/lib/api/products"

const regions = [
  {
    name: "Asia",
    color: "bg-red-500",
    descriptionKey: "worldsManufacturingHub",
    industries: ["Electronics", "Textiles", "Machinery", "Plastics"],
  },
  {
    name: "Europe",
    color: "bg-blue-500",
    descriptionKey: "qualityPrecisionManufacturing",
    industries: ["Automotive", "Machinery", "Food Processing", "Chemicals"],
  },
  {
    name: "Americas",
    color: "bg-green-500",
    descriptionKey: "innovationTechnologyLeaders",
    industries: ["Technology", "Aerospace", "Agriculture", "Automotive"],
  },
  {
    name: "Africa",
    color: "bg-amber-500",
    descriptionKey: "emergingManufacturingMarkets",
    industries: ["Textiles", "Agriculture", "Mining", "Food Processing"],
  },
  {
    name: "Oceania",
    color: "bg-cyan-500",
    descriptionKey: "highQualityProduction",
    industries: ["Agriculture", "Mining", "Food Processing", "Machinery"],
  },
]

const featuredCountries = [
  { code: "CN", name: "China", suppliers: 5420, growth: "+12%", topIndustry: "Electronics" },
  { code: "IN", name: "India", suppliers: 2890, growth: "+18%", topIndustry: "Textiles" },
  { code: "VN", name: "Vietnam", suppliers: 1650, growth: "+25%", topIndustry: "Furniture" },
  { code: "DE", name: "Germany", suppliers: 1240, growth: "+5%", topIndustry: "Machinery" },
  { code: "TR", name: "Turkey", suppliers: 980, growth: "+15%", topIndustry: "Textiles" },
  { code: "MX", name: "Mexico", suppliers: 870, growth: "+10%", topIndustry: "Automotive" },
  { code: "TH", name: "Thailand", suppliers: 820, growth: "+8%", topIndustry: "Electronics" },
  { code: "PL", name: "Poland", suppliers: 650, growth: "+14%", topIndustry: "Furniture" },
]

function formatStatCount(value: number): string {
  if (value >= 1_000_000) return `${Math.floor(value / 1_000_000)}M+`
  if (value >= 10_000) return `${Math.floor(value / 1_000)}K+`
  return value.toLocaleString()
}

function flagUrl(countryCode: string | null | undefined, width: 40 | 80 = 40): string {
  if (!countryCode) return ""
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`
}

export default function GlobalSupplierMapPage() {
  const { t } = useTranslation()
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAllCountries, setShowAllCountries] = useState(false)
  const [mapData, setMapData] = useState<ApiSupplierMapResponse["data"] | null>(null)
  const [groupsData, setGroupsData] = useState<ApiSupplierMapGroup[]>([])
  const [topCountriesData, setTopCountriesData] = useState<ApiSupplierMapTopCountry[]>([])
  const [regionCountries, setRegionCountries] = useState<ApiSupplierMapCountry[]>([])
  const [searchResults, setSearchResults] = useState<ApiSupplierMapCountry[]>([])
  const [industriesCount, setIndustriesCount] = useState<number | null>(null)
  const [productsCount, setProductsCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRegion, setIsLoadingRegion] = useState(false)
  const [isSearchLoading, setIsSearchLoading] = useState(false)

  const trimmedSearch = searchQuery.trim()
  const isSearching = trimmedSearch.length > 0

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [mapRes, groupsRes, topCountriesRes, productsRes, industriesTotal] = await Promise.all([
        getSuppliersMap(),
        getSuppliersMapGroups(),
        getSuppliersMapTopCountries(),
        getProducts(1, { per_page: 1 }),
        getPublicCategoriesTotal(),
      ])

      if (mapRes?.success) setMapData(mapRes.data)
      if (groupsRes?.success) setGroupsData(groupsRes.data.groups)
      if (topCountriesRes?.success) setTopCountriesData(topCountriesRes.data.countries)
      if (productsRes?.success && productsRes.meta) setProductsCount(productsRes.meta.total)
      setIndustriesCount(industriesTotal)

      setIsLoading(false)
    }
    void loadData()
  }, [])

  useEffect(() => {
    if (!selectedRegion || isSearching) {
      setRegionCountries([])
      return
    }

    let mounted = true
    const loadRegionCountries = async () => {
      setIsLoadingRegion(true)
      const res = await getSuppliersMap({ group: selectedRegion, per_page: 200 })
      if (mounted && res?.success) {
        setRegionCountries(res.data.countries)
      }
      if (mounted) setIsLoadingRegion(false)
    }

    void loadRegionCountries()
    return () => {
      mounted = false
    }
  }, [selectedRegion, isSearching])

  useEffect(() => {
    if (!isSearching) {
      setSearchResults([])
      setIsSearchLoading(false)
      return
    }

    let mounted = true
    setIsSearchLoading(true)
    const timer = setTimeout(async () => {
      const res = await getSuppliersMap({ search: trimmedSearch, per_page: 50 })
      if (mounted) {
        setSearchResults(res?.success ? res.data.countries : [])
        setIsSearchLoading(false)
      }
    }, 300)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [trimmedSearch, isSearching])

  const dynamicRegions = regions.map((region) => {
    const apiGroup = groupsData.find((g) => g.group === region.name)
    return { ...region, supplierCount: apiGroup ? apiGroup.suppliers_count : 0 }
  })

  const matchedRegions = useMemo(() => {
    if (!isSearching) return []
    const q = trimmedSearch.toLowerCase()
    return dynamicRegions.filter((region) => region.name.toLowerCase().includes(q))
  }, [dynamicRegions, isSearching, trimmedSearch])

  const hasSearchResults = matchedRegions.length > 0 || searchResults.length > 0

  const displayFeatured =
    topCountriesData.length > 0
      ? topCountriesData.map((c) => ({
          code: c.country_code,
          name: c.country,
          suppliers: c.manufacturers_count,
          growth: "",
          topIndustry: "",
        }))
      : featuredCountries

  const openRegionFromSearch = (regionName: string) => {
    setSearchQuery("")
    setSelectedRegion(regionName)
    setShowAllCountries(false)
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-primary py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Badge className="mb-4 bg-primary-foreground/20 text-primary-foreground">
                <Globe className="mr-1 h-3 w-3" />
                {t?.landing?.suppliersMap?.globalNetwork || "Global Network"}
              </Badge>
              <h1 className="font-serif text-3xl font-medium text-primary-foreground sm:text-4xl lg:text-5xl">
                {t?.landing?.suppliersMap?.pageTitle || "Global Supplier Map"}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
                {t?.landing?.suppliersMap?.pageDescription ||
                  "Explore manufacturers and suppliers from around the world. Find the perfect partner for your sourcing needs."}
              </p>
              <div className="mt-8 flex justify-center">
                <div className="relative w-full max-w-xl">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={
                      t?.landing?.suppliersMap?.searchPlaceholder || "Search countries or regions..."
                    }
                    className="h-12 w-full rounded-full border-0 bg-background pl-12 pr-4 text-foreground shadow-lg"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value.trim()) {
                        setSelectedRegion(null)
                        setShowAllCountries(false)
                      }
                    }}
                    aria-label={t?.landing?.suppliersMap?.searchPlaceholder || "Search countries or regions"}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/50 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "..." : formatStatCount(mapData?.total_suppliers ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t?.landing?.suppliersMap?.reviewedSuppliersLabel || "Reviewed Suppliers"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "..." : formatStatCount(mapData?.total_countries ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t?.landing?.suppliersMap?.countriesLabel || "Countries"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "..." : formatStatCount(industriesCount ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t?.landing?.suppliersMap?.industriesLabel || "Industries"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "..." : formatStatCount(productsCount ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t?.landing?.suppliersMap?.productsLabel || "Products"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {isSearching && (
          <section className="border-b border-border py-8 sm:py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl font-medium text-foreground">
                {t?.landing?.suppliersMap?.searchResultsTitle || "Search Results"}
              </h2>

              {isSearchLoading ? (
                <div className="mt-8 flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : hasSearchResults ? (
                <div className="mt-8 space-y-8">
                  {matchedRegions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {t?.landing?.suppliersMap?.searchRegionsTitle || "Matching Regions"}
                      </h3>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                        {matchedRegions.map((region) => (
                          <button
                            key={region.name}
                            type="button"
                            onClick={() => openRegionFromSearch(region.name)}
                            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${region.color}`}
                              >
                                <Globe className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{region.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {region.supplierCount.toLocaleString()}{" "}
                                  {t?.landing?.suppliersMap?.suppliers || "suppliers"}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {t?.landing?.suppliersMap?.searchCountriesTitle || "Matching Countries"}
                      </h3>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {searchResults.map((country) => (
                          <Link
                            key={country.country_code || country.name}
                            href={`/suppliers?country=${country.country_code || ""}`}
                            className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                          >
                            <img
                              src={country.flag_icon || flagUrl(country.country_code)}
                              width="20"
                              alt={country.name}
                              className="h-5 w-7 rounded-sm object-cover shadow-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{country.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {country.suppliers_count}{" "}
                                {t?.landing?.suppliersMap?.suppliers || "suppliers"} · {country.group}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-8 text-center sm:p-10">
                  <Search className="mx-auto h-10 w-10 text-muted-foreground/60" />
                  <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
                    {t?.landing?.suppliersMap?.searchNoResults || "Your search was not found"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {t?.landing?.suppliersMap?.searchNoResultsHint ||
                      "We couldn't find any countries or regions matching your search. Try a different term, browse our FAQ, or contact support."}
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="/faq">
                        <FileQuestion className="h-4 w-4" />
                        {t?.landing?.suppliersMap?.searchViewFaq || "View FAQ"}
                      </Link>
                    </Button>
                    <Button asChild className="gap-2">
                      <Link href="/contact?type=support">
                        <MessageSquare className="h-4 w-4" />
                        {t?.landing?.suppliersMap?.searchContactSupport || "Contact Support"}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {!isSearching && (
          <section className="py-8 sm:py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h2 className="font-serif text-2xl font-medium text-foreground lg:text-3xl">
                  {t?.landing?.suppliersMap?.exploreByRegion || "Explore by Region"}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t?.landing?.suppliersMap?.clickRegionToView ||
                    "Click on a region to view suppliers from that area"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-5">
                {dynamicRegions.map((region) => (
                  <Card
                    key={region.name}
                    className={`h-full cursor-pointer transition-all hover:shadow-lg ${
                      selectedRegion === region.name ? "ring-2 ring-secondary" : ""
                    }`}
                    onClick={() => {
                      setSelectedRegion(selectedRegion === region.name ? null : region.name)
                      setShowAllCountries(false)
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${region.color}`}
                        >
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{region.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {region.supplierCount.toLocaleString()}{" "}
                            {t?.landing?.suppliersMap?.suppliers || "suppliers"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {t?.landing?.suppliersMap?.[
                          region.descriptionKey as keyof typeof t.landing.suppliersMap
                        ] || region.name}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {region.industries.slice(0, 3).map((industry) => (
                          <Badge key={industry} variant="secondary" className="text-xs">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedRegion && (
                <div className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-secondary" />
                        {t?.landing?.suppliersMap?.countriesIn?.replace("{region}", selectedRegion) ||
                          `Countries in ${selectedRegion}`}
                      </CardTitle>
                      <CardDescription>
                        {regionCountries.length}{" "}
                        {t?.landing?.suppliersMap?.countriesAvailable || "countries available"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingRegion ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                        </div>
                      ) : regionCountries.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                          {t?.landing?.suppliersMap?.searchNoResults || "Your search was not found"}
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {regionCountries
                              .slice(0, showAllCountries ? undefined : 20)
                              .map((country) => (
                                <Link
                                  key={country.country_code || country.name}
                                  href={`/suppliers?country=${country.country_code || ""}`}
                                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                                >
                                  <img
                                    src={country.flag_icon || flagUrl(country.country_code)}
                                    width="20"
                                    alt={country.name}
                                    className="h-5 w-7 rounded-sm object-cover shadow-sm"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{country.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {country.suppliers_count} suppliers
                                    </p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                              ))}
                          </div>
                          {regionCountries.length > 20 && !showAllCountries && (
                            <div className="mt-4 text-center">
                              <Button variant="outline" onClick={() => setShowAllCountries(true)}>
                                {t?.landing?.suppliersMap?.viewAllCountries?.replace(
                                  "{count}",
                                  regionCountries.length.toString(),
                                ) || `View All ${regionCountries.length} Countries`}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </section>
        )}

        {!isSearching && (
          <section className="border-t border-border bg-muted/30 py-8 sm:py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-foreground lg:text-3xl">
                    {t?.landing?.suppliersMap?.topManufacturingCountries ||
                      "Top Manufacturing Countries"}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {t?.landing?.suppliersMap?.countriesMostReviewedSuppliers ||
                      "Countries with the most reviewed suppliers on our platform"}
                  </p>
                </div>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/suppliers" className="w-full text-center sm:w-auto">
                    {t?.landing?.suppliersMap?.viewAllSuppliers || "View All Suppliers"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {displayFeatured.map((country) => (
                  <Link
                    key={country.code || country.name}
                    href={`/suppliers?country=${country.code || ""}`}
                    className="block h-full"
                  >
                    <Card className="h-full rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg">
                      <CardContent className="md:pt-3">
                        <div className="mb-4 flex items-center gap-3">
                          <img
                            src={flagUrl(country.code, 80)}
                            width="32"
                            alt={country.name}
                            className="h-8 w-11 rounded-sm object-cover shadow-sm"
                          />
                          <div>
                            <h3 className="font-semibold">{country.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {country.suppliers.toLocaleString()}{" "}
                              {t?.landing?.featured?.suppliersLabel || "suppliers"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            {country.growth && <span>{country.growth}</span>}
                            {country.growth && (
                              <span className="text-muted-foreground">
                                {t?.landing?.suppliersMap?.growth || "growth"}
                              </span>
                            )}
                          </div>
                          {country.topIndustry && (
                            <Badge variant="secondary" className="text-xs">
                              {country.topIndustry}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="py-12 text-center">
                <h2 className="font-serif text-2xl font-medium lg:text-3xl">
                  {t?.landing?.suppliersMap?.cantFindTitle || "Can't find what you're looking for?"}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
                  {t?.landing?.suppliersMap?.cantFindDesc ||
                    "Submit a Request for Quotation and let reviewed manufacturers come to you with competitive offers."}
                </p>
                <div className="mx-auto mt-8 flex w-full max-w-lg flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button size="lg" variant="secondary" className="w-full justify-center sm:w-auto" asChild>
                    <Link href="/rfq/new" className="w-full text-center sm:w-auto">
                      {t?.landing?.suppliersMap?.submitRFQ || "Submit RFQ"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
                    asChild
                  >
                    <Link href="/suppliers" className="w-full text-center sm:w-auto">
                      {t?.landing?.suppliersMap?.browseAllSuppliers || "Browse All Suppliers"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
