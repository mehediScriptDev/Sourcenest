import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPublicSupplierDetails, getPublicSupplierProducts, getPublicSupplierReviews, getPublicSupplierCatalogs, getPublicSupplierCertifications, Supplier as ApiSupplier } from "@/lib/api/public-suppliers"
import { SupplierReviewsSection } from "@/components/suppliers/supplier-reviews-section"
import { SupplierPageActions } from "@/components/suppliers/supplier-page-actions"
import { CompareBar } from "@/components/suppliers/compare-bar"
import { 
  MapPin, 
  Star, 
  Clock, 
  Package,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  FileText,
  Calendar,
  Users,
  Globe,
  Award,
  TrendingUp,
  Factory,
  Shield,
  Download,
  Eye,
  BookOpen,
  Image,
  Building2,
  Wrench,
  Languages,
  CreditCard,
  Camera
} from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const res = await getPublicSupplierDetails(slug)
  const supplier = res?.data
  
  if (!supplier) {
    return { title: "Supplier Not Found" }
  }

  return {
    title: supplier.name,
    description: supplier.short_description || "",
  }
}

export default async function SupplierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const res = await getPublicSupplierDetails(slug)
  
  if (!res || !res.data) {
    notFound()
  }

  const apiSupplier = res.data

  // Map API data to the old format
  const supplier = {
    id: apiSupplier.id.toString(),
    name: apiSupplier.name,
    slug: apiSupplier.slug,
    description: apiSupplier.long_description || apiSupplier.short_description || "",
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
    reviewedLevel: (apiSupplier.reviewed_level as "basic" | "standard" | "premium" | "enterprise") || "standard",
    yearEstablished: parseInt(apiSupplier.year_established || "2000") || 2000,
    employeeCount: apiSupplier.employee_count || "Unknown",
    annualRevenue: apiSupplier.revenue || undefined,
    productCount: apiSupplier.product_count || 0,
    rating: apiSupplier.rating || 0,
    reviewCount: apiSupplier.review_count || 0,
    responseRate: apiSupplier.response_rate ? parseInt(apiSupplier.response_rate) : 0,
    responseTime: apiSupplier.response_time || "N/A",
    onTimeDelivery: apiSupplier.on_time_delivery ? parseInt(apiSupplier.on_time_delivery) : 0,
    certifications: apiSupplier.certifications || [],
    mainProducts: apiSupplier.main_products || [],
    exportMarkets: apiSupplier.export_markets || [],
    businessType: apiSupplier.business_type ? [apiSupplier.business_type as any] : [],
    capabilities: (apiSupplier.capabilities as ("oem" | "odm" | "private-label" | "customization")[]) || [],
    languages: apiSupplier.languages || [],
    paymentTerms: apiSupplier.payment_terms || [],
    factoryPhotos: apiSupplier.factory_photos || [],
    minOrderValue: apiSupplier.min_order_value ? `$${apiSupplier.min_order_value}` : undefined,
  }

  const productsRes = await getPublicSupplierProducts(apiSupplier.id.toString())
  const apiProducts = productsRes?.data || []

  // We use apiProducts directly now

  const reviewsRes = await getPublicSupplierReviews(apiSupplier.id.toString())
  const apiReviews = reviewsRes?.data.reviews || []
  const apiReviewStats = reviewsRes?.data.review_stats || {
    average_rating: 0,
    total_reviews: 0,
    breakdown: [
      { rating: 5, count: 0, percentage: 0 },
      { rating: 4, count: 0, percentage: 0 },
      { rating: 3, count: 0, percentage: 0 },
      { rating: 2, count: 0, percentage: 0 },
      { rating: 1, count: 0, percentage: 0 }
    ]
  }

  const catalogsRes = await getPublicSupplierCatalogs(apiSupplier.id.toString())
  const apiCatalogs = catalogsRes?.data || []

  const certsRes = await getPublicSupplierCertifications(apiSupplier.id.toString())
  const apiCertifications = certsRes?.data?.profile_certifications || supplier.certifications || []

  // Map API reviews to expected format for the section
  const supplierReviews: any[] = apiReviews.map(r => ({
    id: r.id.toString(),
    supplierId: apiSupplier.id.toString(),
    buyerId: r.reviewer.id.toString(),
    buyerName: `${r.reviewer.first_name} ${r.reviewer.last_name}`,
    buyerCompany: r.reviewer.company_name,
    buyerCountry: r.reviewer.country,
    rating: r.rating,
    title: r.title,
    content: r.comment,
    date: r.created_at,
    helpful: 0,
    reviewed: true,
    status: "published" as const,
    orderDetails: r.order ? {
      productCategory: "Mixed",
      orderValue: `${r.order.total_amount} ${r.order.currency_code}`,
      orderDate: r.created_at
    } : undefined
  }))

  const ratingSummary = {
    average: apiReviewStats.average_rating,
    total: apiReviewStats.total_reviews,
    distribution: {
      5: apiReviewStats.breakdown.find(b => b.rating === 5)?.count || 0,
      4: apiReviewStats.breakdown.find(b => b.rating === 4)?.count || 0,
      3: apiReviewStats.breakdown.find(b => b.rating === 3)?.count || 0,
      2: apiReviewStats.breakdown.find(b => b.rating === 2)?.count || 0,
      1: apiReviewStats.breakdown.find(b => b.rating === 1)?.count || 0
    }
  }

  const reviewBadgeColors = {
    basic: "bg-gray-100 text-gray-700",
    standard: "bg-blue-100 text-blue-700",
    premium: "bg-amber-100 text-amber-700",
    enterprise: "bg-emerald-100 text-emerald-700"
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Link href="/suppliers" className="text-muted-foreground hover:text-foreground">
                Suppliers
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground line-clamp-1">{supplier.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-card py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* Logo Placeholder */}
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-muted">
                  <Factory className="h-12 w-12 text-muted-foreground" />
                </div>
                
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
                      {supplier.name}
                    </h1>
                    {supplier.reviewed && (
                      <Badge className={reviewBadgeColors[supplier.reviewedLevel]}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {supplier.reviewedLevel.charAt(0).toUpperCase() + supplier.reviewedLevel.slice(1)} Reviewed
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {supplier.location.city}, {supplier.location.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Est. {supplier.yearEstablished}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {supplier.employeeCount} employees
                    </span>
                  </div>

                  <p className="mt-4 max-w-2xl text-muted-foreground">
                    {supplier.shortDescription}
                  </p>

                  {/* Review Badges */}
                  {supplier.reviewed && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1 bg-green-50 border-green-200 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Reviewed Manufacturer
                      </Badge>
                      <Badge variant="outline" className="gap-1 bg-blue-50 border-blue-200 text-blue-700">
                        <Shield className="h-3 w-3" />
                        Business License Reviewed
                      </Badge>
                      {supplier.reviewedLevel === "premium" || supplier.reviewedLevel === "enterprise" ? (
                        <Badge variant="outline" className="gap-1 bg-amber-50 border-amber-200 text-amber-700">
                          <Factory className="h-3 w-3" />
                          Factory Information Reviewed
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className="gap-1 bg-purple-50 border-purple-200 text-purple-700">
                        <Calendar className="h-3 w-3" />
                        {new Date().getFullYear() - supplier.yearEstablished}+ Years in Business
                      </Badge>
                      <Badge variant="outline" className="gap-1 bg-cyan-50 border-cyan-200 text-cyan-700">
                        <Globe className="h-3 w-3" />
                        {supplier.exportMarkets.length} Export Markets
                      </Badge>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-6 flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="text-lg font-semibold text-foreground">{supplier.rating}</span>
                      <span className="text-sm text-muted-foreground">({supplier.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Response: {supplier.responseTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{supplier.onTimeDelivery}% on-time delivery</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <SupplierPageActions supplier={supplier} />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products ({apiProducts.length})</TabsTrigger>
                <TabsTrigger value="catalog">Factory Catalog</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Company Profile */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-semibold text-lg text-foreground">Company Profile</h2>
                      <p className="mt-4 text-muted-foreground leading-relaxed">
                        {supplier.description}
                      </p>
                    </div>

                    {/* Main Products */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-semibold text-lg text-foreground">Main Products</h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {supplier.mainProducts.map((product) => (
                          <Badge key={product} variant="outline" className="text-sm">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Export Markets */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Export Markets
                      </h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {supplier.exportMarkets.map((market) => (
                          <Badge key={market} variant="secondary" className="text-sm">
                            {market}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Business Type & Capabilities */}
                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Business Type */}
                      {supplier.businessType && supplier.businessType.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-6">
                          <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Business Type
                          </h2>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {supplier.businessType.map((type) => (
                              <Badge key={type} variant="outline" className="text-sm capitalize">
                                {type.replace("-", " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Manufacturing Capabilities */}
                      {supplier.capabilities && supplier.capabilities.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-6">
                          <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            Manufacturing Capabilities
                          </h2>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {supplier.capabilities.map((cap) => (
                              <Badge key={cap} variant="secondary" className="text-sm uppercase">
                                {cap.replace("-", " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Languages & Payment Terms */}
                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Languages */}
                      {supplier.languages && supplier.languages.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-6">
                          <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                            <Languages className="h-5 w-5" />
                            Languages
                          </h2>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {supplier.languages.map((lang) => (
                              <Badge key={lang} variant="outline" className="text-sm">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment Terms */}
                      {supplier.paymentTerms && supplier.paymentTerms.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-6">
                          <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment Terms
                          </h2>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {supplier.paymentTerms.map((term) => (
                              <Badge key={term} variant="outline" className="text-sm">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Factory Photos */}
                    {supplier.factoryPhotos && supplier.factoryPhotos.length > 0 && (
                      <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          Factory Photos
                        </h2>
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          {supplier.factoryPhotos.map((photo, index) => (
                            <div key={index} className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Factory className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                                <Eye className="h-6 w-6 text-secondary" />
                              </div>
                              <span className="absolute bottom-2 left-2 text-xs font-medium text-muted-foreground">
                                Photo {index + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Quick Facts */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-semibold text-lg text-foreground">Quick Facts</h2>
                      <dl className="mt-4 space-y-4">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Industry</dt>
                          <dd className="font-medium text-foreground">{supplier.industry}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Established</dt>
                          <dd className="font-medium text-foreground">{supplier.yearEstablished}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Employees</dt>
                          <dd className="font-medium text-foreground">{supplier.employeeCount}</dd>
                        </div>
                        {supplier.annualRevenue && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Annual Revenue</dt>
                            <dd className="font-medium text-foreground">{supplier.annualRevenue}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Products</dt>
                          <dd className="font-medium text-foreground">{supplier.productCount.toLocaleString()}</dd>
                        </div>
                        {supplier.minOrderValue && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Min Order</dt>
                            <dd className="font-medium text-foreground">{supplier.minOrderValue}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Response Stats */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-semibold text-lg text-foreground">Response Stats</h2>
                      <dl className="mt-4 space-y-4">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Response Rate</dt>
                          <dd className="font-medium text-foreground">{supplier.responseRate}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Response Time</dt>
                          <dd className="font-medium text-foreground">{supplier.responseTime}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">On-time Delivery</dt>
                          <dd className="font-medium text-foreground">{supplier.onTimeDelivery}%</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Certifications Preview */}
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certifications
                      </h2>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {supplier.certifications.slice(0, 4).map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                        {supplier.certifications.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{supplier.certifications.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {apiProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-4/3 bg-muted">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="absolute inset-0 h-full w-full object-cover" 
                          />
                        ) : product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0].url} 
                            alt={product.name} 
                            className="absolute inset-0 h-full w-full object-cover" 
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* {product.category && (
                          <Badge className="absolute left-3 top-3">{product.category.name}</Badge>
                        )} */}
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-secondary line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>

                        {product.pricing_quantities ? (
                          <div className="mt-3">
                            <span className="text-lg font-semibold text-foreground">
                              ${parseFloat(product.pricing_quantities.min_price?.price?.amount || "0").toFixed(2)} - ${parseFloat(product.pricing_quantities.max_price?.price?.amount || "0").toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground"> / {product.pricing_quantities.unit}</span>
                          </div>
                        ) : product.price ? (
                          <div className="mt-3">
                            <span className="text-lg font-semibold text-foreground">
                              ${parseFloat(product.price.amount || "0").toFixed(2)}
                            </span>
                          </div>
                        ) : null}

                        {product.pricing_quantities && (
                          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                            <span>MOQ: {product.pricing_quantities.minimum_order_quantity}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {apiProducts.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border py-16 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 font-semibold text-foreground">No products listed yet</h3>
                    <p className="mt-2 text-muted-foreground">
                      Contact the supplier to learn about their product offerings
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Factory Catalog Tab */}
              <TabsContent value="catalog">
                {apiCatalogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-16 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 font-semibold text-foreground">No Catalogs Available</h3>
                    <p className="mt-2 text-muted-foreground">
                      This supplier has not uploaded any catalogs yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {apiCatalogs.map((catalog) => (
                      <div key={catalog.id} className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 shrink-0">
                            <BookOpen className="h-6 w-6 text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{catalog.name}</h3>
                            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                              <span>PDF Document</span>
                              <span className="h-3 w-px bg-border" />
                              <span>{catalog.file_size}</span>
                              <span className="h-3 w-px bg-border" />
                              <span>Updated {new Date(catalog.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" className="gap-2" size="sm" asChild>
                            <Link href={catalog.file_path} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button className="gap-2" size="sm" asChild>
                            <Link href={catalog.file_path} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4" />
                              Download
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>


              {/* Certifications Tab */}
              <TabsContent value="certifications">
                {apiCertifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-16 text-center">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 font-semibold text-foreground">No Certifications Available</h3>
                    <p className="mt-2 text-muted-foreground">
                      This supplier has not added any approved certifications yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {apiCertifications.map((cert) => (
                      <div key={cert} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 shrink-0">
                            <Shield className="h-6 w-6 text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{cert}</h3>
                            <p className="text-sm text-muted-foreground">Reviewed certification</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <SupplierReviewsSection
                  supplierId={supplier.id}
                  supplierName={supplier.name}
                  reviews={supplierReviews}
                  ratingSummary={ratingSummary}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
      <CompareBar />
    </div>
  )
}
