"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
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
import { getPublicSuppliers, Supplier as ApiSupplier } from "@/lib/api/public-suppliers"
import { Supplier } from "@/lib/data/suppliers"
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

export default function SuppliersPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all")
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [selectedCertification, setSelectedCertification] = useState<string>("all")
  const [selectedMoq, setSelectedMoq] = useState<string>("all")
  const [selectedExportMarket, setSelectedExportMarket] = useState<string>("all")
  const [reviewedOnly, setReviewedOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSuppliers, setTotalSuppliers] = useState(0)

  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true)
      const res = await getPublicSuppliers({
        page: currentPage,
        search: searchQuery || undefined,
        industry: selectedIndustry !== "all" ? selectedIndustry : undefined,
        country: selectedCountry !== "all" ? selectedCountry : undefined,
        certification: selectedCertification !== "all" ? selectedCertification : undefined,
        moq: selectedMoq !== "all" ? selectedMoq : undefined,
        export_market: selectedExportMarket !== "all" ? selectedExportMarket : undefined,
        reviewed: reviewedOnly ? true : undefined,
      })

      if (res && res.data) {
        setSuppliers(res.data.map(mapApiSupplierToMockSupplier))
        setTotalPages(res.meta.last_page)
        setTotalSuppliers(res.meta.total)
      } else {
        setSuppliers([])
        setTotalSuppliers(0)
      }
      setIsLoading(false)
    }

    const timerId = setTimeout(() => {
      fetchSuppliers()
    }, 400)

    return () => clearTimeout(timerId)
  }, [searchQuery, selectedIndustry, selectedCountry, selectedCertification, selectedMoq, selectedExportMarket, reviewedOnly, currentPage])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedIndustry("all")
    setSelectedCountry("all")
    setSelectedCertification("all")
    setSelectedMoq("all")
    setSelectedExportMarket("all")
    setReviewedOnly(false)
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || selectedIndustry !== "all" || selectedCountry !== "all" || 
    selectedCertification !== "all" || selectedMoq !== "all" || selectedExportMarket !== "all" || reviewedOnly

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-serif text-3xl font-medium tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                {t?.landing?.suppliers?.pageTitle || "Find Reviewed Suppliers"}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
                {(t?.landing?.suppliers?.pageSubtitle || "Explore reviewed manufacturers from around the world").replace("{count}", totalSuppliers.toString())}
              </p>
            </div>

            {/* Search Bar */}
            <div className="mx-auto mt-8 max-w-3xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t?.landing?.suppliers?.searchPlaceholder || "Search suppliers, products, or categories..."}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-12 bg-background pl-12 text-base"
                  />
                </div>
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Filters Sidebar */}
              <aside className={`w-full lg:w-64 lg:shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
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
                          {industries.map((industry) => (
                            <SelectItem key={industry.slug} value={industry.slug}>
                              {industry.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Country Filter */}
                    <div>
                      <label className="text-sm font-medium text-foreground">{t?.landing?.suppliers?.countryLabel || "Country"}</label>
                      <Select value={selectedCountry} onValueChange={(val) => { setSelectedCountry(val); setCurrentPage(1); }}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t?.landing?.suppliers?.allCountries || "All Countries"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          <SelectItem value="all">{t?.landing?.suppliers?.allCountries || "All Countries"}</SelectItem>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{t?.landing?.suppliers?.popular || "Popular"}</div>
                          {popularCountries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{t?.landing?.suppliers?.allCountries || "All Countries"}</div>
                          {allCountries.filter(c => !popularManufacturingCountries.includes(c.code)).map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
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
                          {certifications.map((cert) => (
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

                    {/* Export Market Filter */}
                    <div>
                      <label className="text-sm font-medium text-foreground">{t?.landing?.suppliers?.exportMarketLabel || "Export Market"}</label>
                      <Select value={selectedExportMarket} onValueChange={(val) => { setSelectedExportMarket(val); setCurrentPage(1); }}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t?.landing?.suppliers?.anyRegion || "Any Region"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t?.landing?.suppliers?.anyRegion || "Any Region"}</SelectItem>
                          {exportMarketRegions.map((region) => (
                            <SelectItem key={region} value={region.toLowerCase().replace(" ", "-")}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reviewed Only */}
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="reviewed" 
                        checked={reviewedOnly}
                        onCheckedChange={(checked) => { setReviewedOnly(checked as boolean); setCurrentPage(1); }}
                      />
                      <label htmlFor="reviewed" className="text-sm text-foreground cursor-pointer">
                        {t?.landing?.suppliers?.reviewedSuppliersOnly || "Reviewed suppliers only"}
                      </label>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Results */}
              <div className="flex-1">
                {/* Results Header */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">{totalSuppliers}</span> {t?.landing?.suppliers?.suppliersFound || "suppliers found"}
                  </p>
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

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="mb-6 flex flex-wrap items-center gap-2">
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
                        {industries.find(i => i.slug === selectedIndustry)?.name}
                        <button onClick={() => { setSelectedIndustry("all"); setCurrentPage(1); }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedCountry !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {allCountries.find(c => c.code === selectedCountry)?.name}
                        <button onClick={() => { setSelectedCountry("all"); setCurrentPage(1); }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {reviewedOnly && (
                      <Badge variant="secondary" className="gap-1">
                        {t?.landing?.suppliers?.reviewedOnly || "Reviewed Only"}
                        <button onClick={() => { setReviewedOnly(false); setCurrentPage(1); }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Supplier Cards */}
                    <div className="space-y-4">
                      {suppliers.map((supplier) => (
                        <Link
                          key={supplier.id}
                          href={`/suppliers/${supplier.slug}`}
                          className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-secondary hover:shadow-md"
                        >
                          <div className="flex flex-col gap-6 sm:flex-row">
                            {/* Logo Placeholder */}
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted">
                              <Factory className="h-10 w-10 text-muted-foreground" />
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground group-hover:text-secondary">
                                      {supplier.name}
                                    </h3>
                                    {supplier.reviewed && (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        {t?.landing?.suppliers?.reviewedBadge || "Reviewed"}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {supplier.location.city}, {supplier.location.country}
                                    </span>
                                    <span>{supplier.industry}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <SupplierActionButtons supplier={supplier} variant="icon" />
                                  <ChevronRight className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block" />
                                </div>
                              </div>

                              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                                {supplier.shortDescription}
                              </p>

                              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span className="font-medium text-foreground">{supplier.rating}</span>
                                  <span className="text-muted-foreground">({supplier.reviewCount})</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {supplier.responseTime}
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Package className="h-4 w-4" />
                                  {supplier.productCount.toLocaleString()} {t?.landing?.suppliers?.productsLabel || "products"}
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
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

                    {/* Empty State */}
                    {suppliers.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border py-16 text-center">
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8 flex justify-center gap-2">
                        <Button
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center justify-center px-4">
                          <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                        </div>
                        <Button
                          variant="outline"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    )}
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
