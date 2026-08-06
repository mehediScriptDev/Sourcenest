"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { industries, getIndustryBySlug } from "@/lib/data/industries"
import { suppliers } from "@/lib/data/suppliers"
import { products } from "@/lib/data/products"
import { countries as countryData } from "@/lib/data/countries"
import { getPublicCategories } from "@/lib/api/categories"
import { queryKeys } from "@/lib/query-keys"
import { 
  ArrowRight, 
  Cpu, 
  Cog, 
  Shirt, 
  Home, 
  Heart, 
  Car, 
  UtensilsCrossed, 
  FlaskConical,
  Factory,
  Package,
  ChevronRight,
  Star,
  CheckCircle,
  MapPin,
  Filter,
  Globe,
  ShieldCheck,
  Search,
  X,
  Lightbulb,
  Wrench,
  HardHat,
  Sofa,
  Stethoscope,
  Wheat,
  Box,
  FileText,
  ShoppingBag
} from "lucide-react"

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="h-10 w-10" />,
  Cog: <Cog className="h-10 w-10" />,
  Shirt: <Shirt className="h-10 w-10" />,
  Home: <Home className="h-10 w-10" />,
  Heart: <Heart className="h-10 w-10" />,
  Car: <Car className="h-10 w-10" />,
  UtensilsCrossed: <UtensilsCrossed className="h-10 w-10" />,
  FlaskConical: <FlaskConical className="h-10 w-10" />,
  Package: <Package className="h-10 w-10" />,
  Lightbulb: <Lightbulb className="h-10 w-10" />,
  Wrench: <Wrench className="h-10 w-10" />,
  HardHat: <HardHat className="h-10 w-10" />,
  Sofa: <Sofa className="h-10 w-10" />,
  Stethoscope: <Stethoscope className="h-10 w-10" />,
  Wheat: <Wheat className="h-10 w-10" />,
  Box: <Box className="h-10 w-10" />,
  FileText: <FileText className="h-10 w-10" />,
  Factory: <Factory className="h-10 w-10" />,
  ShoppingBag: <ShoppingBag className="h-10 w-10" />,
}

const certifications = [
  "ISO 9001",
  "ISO 14001", 
  "CE Certified",
  "FDA Approved",
  "BSCI",
  "SA8000"
]

const moqRanges = [
  { label: "Under 100 units", value: "0-100" },
  { label: "100-500 units", value: "100-500" },
  { label: "500-1000 units", value: "500-1000" },
  { label: "1000+ units", value: "1000+" },
]

export default function IndustryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const categoriesQuery = useQuery({
    queryKey: queryKeys.publicCategories(100),
    queryFn: () => getPublicCategories({ perPage: 100 }),
  })

  const publicCategories = categoriesQuery.data?.success ? categoriesQuery.data.data : []

  const backendCurrentCategory = useMemo(
    () => publicCategories.find((category) => category.slug === slug),
    [publicCategories, slug]
  )

  const industry = useMemo(() => {
    if (backendCurrentCategory) {
      const backendSubcategories = backendCurrentCategory.sub_categories?.length
        ? backendCurrentCategory.sub_categories
        : backendCurrentCategory.subcategories || []

      return {
        id: String(backendCurrentCategory.id),
        name: backendCurrentCategory.name,
        slug: backendCurrentCategory.slug || slug,
        description: backendCurrentCategory.description || "",
        icon: "Package",
        supplierCount: backendCurrentCategory.supplier_count || 0,
        productCount: backendCurrentCategory.product_count || 0,
        categories: backendSubcategories.length > 0
          ? backendSubcategories.map((sub, idx) => ({
              id: String(sub.id),
              name: sub.name,
              slug: sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-'),
              description: sub.description || "Explore a wide range of products and suppliers in this category",
              productCount: (sub as any).product_count || 0,
              subcategories: Array.isArray(sub.tags) && sub.tags.length > 0 
                ? sub.tags 
                : [], // Removed fake static tags
            }))
          : [],
      }
    }

    return getIndustryBySlug(slug)
  }, [backendCurrentCategory, slug])

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")

  // Get featured countries for this industry
  const featuredCountries = useMemo(() => {
    const featured = countryData.filter(c => c.featured)
    if (featured.length > 0) {
      return featured.slice(0, 8)
    }
    // Fallback to popular manufacturing countries if no featured ones
    return countryData
      .filter(c => ["CN", "IN", "VN", "TH", "TR", "DE", "ID", "BD"].includes(c.code))
      .slice(0, 8)
  }, [])



  const clearFilters = () => {
    setSearchQuery("")
  }

  const hasActiveFilters = !!searchQuery

  if (!industry) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Industry Not Found</h1>
            <p className="mt-2 text-muted-foreground">The industry you are looking for does not exist.</p>
            <Button className="mt-4" asChild>
              <Link href="/industries">Browse All Industries</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Link href="/industries" className="text-muted-foreground hover:text-foreground">
                Industries
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{industry.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-primary py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/10 text-primary-foreground">
                  {iconMap[industry.icon] || <Factory className="h-10 w-10" />}
                </div>
                <div>
                  <h1 className="font-serif text-3xl font-medium tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                    {industry.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-lg text-primary-foreground/80">
                    {industry.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button variant="secondary" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                  <Link href={`/suppliers?industry=${industry.slug}`}>
                    View All Suppliers
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
                <div className="text-3xl font-bold text-primary-foreground">{industry.supplierCount.toLocaleString()}</div>
                <div className="mt-1 text-sm text-primary-foreground/70">Reviewed Suppliers</div>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
                <div className="text-3xl font-bold text-primary-foreground">{industry.productCount.toLocaleString()}</div>
                <div className="mt-1 text-sm text-primary-foreground/70">Products</div>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
                <div className="text-3xl font-bold text-primary-foreground">{industry.categories.length}</div>
                <div className="mt-1 text-sm text-primary-foreground/70">Categories</div>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
                <div className="text-3xl font-bold text-primary-foreground">45+</div>
                <div className="mt-1 text-sm text-primary-foreground/70">Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories & Quick Filters Section */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-4">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Search */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                      <Search className="h-4 w-4" />
                      Search
                    </h3>
                    <div className="mt-3">
                      <Input
                        placeholder="Search suppliers or products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
                    Browse Categories
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Explore specialized categories within {industry.name}
                  </p>
                </div>

                {industry.categories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                    {industry.categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/products?category=${industry.slug}`}
                        className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-secondary hover:shadow-md"
                      >
                        <h3 className="font-semibold text-foreground group-hover:text-secondary">
                          {category.name}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{category.productCount.toLocaleString()} products</span>
                        </div>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1">
                            {category.subcategories.slice(0, 3).map((sub) => (
                              <span key={sub} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {sub}
                              </span>
                            ))}
                            {category.subcategories.length > 3 && (
                              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                +{category.subcategories.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium text-foreground">No subcategories found</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      There are no categories available for {industry.name} at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="bg-primary py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-2xl font-medium text-primary-foreground sm:text-3xl">
              Ready to Source from {industry.name}?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
              Connect with reviewed suppliers and start your sourcing journey today.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                <Link href="/rfq/new">
                  Submit RFQ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary" asChild>
                <Link href={`/suppliers?industry=${industry.slug}`}>
                  Browse Suppliers
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
