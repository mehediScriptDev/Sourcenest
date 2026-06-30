"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProducts, type Product } from "@/lib/api/products"
import { getPublicSuppliers, type Supplier } from "@/lib/api/public-suppliers"
import { getAllPublicCategories, type BackendCategory } from "@/lib/api/categories"
import { 
  Search, 
  Package,
  Factory,
  Layers,
  CheckCircle,
  Star,
  MapPin,
  Clock,
  ArrowRight
} from "lucide-react"

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState("all")

  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [industries, setIndustries] = useState<BackendCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "")
  }, [searchParams])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const q = searchParams.get("q") || ""
      
      try {
        const [productsRes, suppliersRes, catsRes] = await Promise.all([
          getProducts(1, { search: q }),
          getPublicSuppliers({ search: q }),
          getAllPublicCategories()
        ])

        if (productsRes.success) {
          setProducts(productsRes.data)
        } else {
          setProducts([])
        }

        if (suppliersRes && suppliersRes.success) {
          setSuppliers(suppliersRes.data)
        } else {
          setSuppliers([])
        }

        if (catsRes.success) {
          let cats = catsRes.data
          if (q) {
            cats = cats.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
          }
          setIndustries(cats)
        } else {
          setIndustries([])
        }
      } catch (err) {
        console.error("Failed to fetch search results", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push(`/search`)
    }
  }

  const totalResults = products.length + suppliers.length + industries.length

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Search Header */}
        <section className="bg-primary py-12 lg:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-center font-serif text-3xl font-medium text-primary-foreground sm:text-4xl">
              Search SourceNest
            </h1>
            <form onSubmit={handleSearch} className="mt-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search products, suppliers, industries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 bg-background pl-12 text-base"
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg"
                  variant="secondary" 
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Results */}
        <section className="py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="py-20 text-center text-muted-foreground">
                <Package className="mx-auto h-8 w-8 animate-pulse mb-4 text-muted-foreground/50" />
                <p>Searching SourceNest...</p>
              </div>
            ) : (
              <>
                {searchParams.get("q") && (
                  <p className="mb-6 text-muted-foreground">
                    <span className="font-medium text-foreground">{totalResults}</span> results for 
                    <span className="font-medium text-foreground"> "{searchParams.get("q")}"</span>
                  </p>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">All Results</TabsTrigger>
                    <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
                    <TabsTrigger value="suppliers">Suppliers ({suppliers.length})</TabsTrigger>
                    <TabsTrigger value="industries">Industries ({industries.length})</TabsTrigger>
                  </TabsList>

                  {/* All Results Tab */}
                  <TabsContent value="all" className="space-y-10">
                    {/* Products Section */}
                    {products.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <h2 className="flex items-center gap-2 font-semibold text-lg text-foreground">
                            <Package className="h-5 w-5" />
                            Products
                          </h2>
                          <Button variant="ghost" className="gap-1 text-secondary" asChild>
                            <Link href={`/products?search=${searchParams.get("q") || ""}`}>
                              View all
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {products.slice(0, 3).map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.id}`}
                              className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                                  {product.image || product.images?.[0] ? (
                                    <img 
                                      src={product.image || product.images?.[0]} 
                                      alt={product.name} 
                                      className="h-full w-full object-cover" 
                                    />
                                  ) : (
                                    <Package className="h-8 w-8 text-muted-foreground/30" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground group-hover:text-secondary line-clamp-2">
                                    {product.name}
                                  </h3>
                                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                                    {product.supplierName || "Unknown Supplier"}
                                  </p>
                                  {product.price_display ? (
                                    <p className="mt-2 text-sm font-semibold text-foreground">
                                      {product.price_display}
                                    </p>
                                  ) : product.pricing_quantities?.min_price?.price?.amount ? (
                                    <p className="mt-2 text-sm font-semibold text-foreground">
                                      ${product.pricing_quantities.min_price.price.amount}
                                      {product.pricing_quantities.max_price?.price?.amount ? ` - $${product.pricing_quantities.max_price.price.amount}` : ""}
                                      {product.pricing_quantities.unit ? ` / ${product.pricing_quantities.unit}` : ""}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suppliers Section */}
                    {suppliers.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <h2 className="flex items-center gap-2 font-semibold text-lg text-foreground">
                            <Factory className="h-5 w-5" />
                            Suppliers
                          </h2>
                          <Button variant="ghost" className="gap-1 text-secondary" asChild>
                            <Link href={`/suppliers?search=${searchParams.get("q") || ""}`}>
                              View all
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        <div className="mt-4 space-y-4">
                          {suppliers.slice(0, 2).map((supplier) => (
                            <Link
                              key={supplier.id}
                              href={`/suppliers/${supplier.slug}`}
                              className="group block rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
                                  {supplier.logo ? (
                                    <img src={supplier.logo} alt={supplier.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <Factory className="h-7 w-7 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-foreground group-hover:text-secondary">
                                      {supplier.name}
                                    </h3>
                                    {supplier.reviewed && (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Reviewed
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {supplier.location?.city || "Unknown City"}, {supplier.location?.country || "Unknown Country"} • {supplier.industry || "General"}
                                  </p>
                                  <div className="mt-2 flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1">
                                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                      {supplier.rating || "N/A"}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {supplier.product_count || 0} products
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Industries Section */}
                    {industries.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <h2 className="flex items-center gap-2 font-semibold text-lg text-foreground">
                            <Layers className="h-5 w-5" />
                            Industries
                          </h2>
                          <Button variant="ghost" className="gap-1 text-secondary" asChild>
                            <Link href="/industries">
                              View all
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-4">
                          {industries.slice(0, 4).map((industry) => (
                            <Link
                              key={industry.id}
                              href={industry.slug ? `/industries/${industry.slug}` : `/industries`}
                              className="rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-secondary hover:shadow-sm"
                            >
                              <span className="font-medium text-foreground">{industry.name}</span>
                              <span className="ml-2 text-sm text-muted-foreground">
                                {(industry.supplier_count || 0).toLocaleString()} suppliers
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {totalResults === 0 && (
                      <div className="py-12 text-center">
                        <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">No results found for "{searchParams.get("q")}"</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Products Tab */}
                  <TabsContent value="products">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md"
                        >
                          <div className="aspect-4/3 bg-muted flex items-center justify-center overflow-hidden">
                            {product.image || product.images?.[0] ? (
                              <img 
                                src={product.image || product.images?.[0]} 
                                alt={product.name} 
                                className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                              />
                            ) : (
                              <Package className="h-12 w-12 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-foreground group-hover:text-secondary line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{product.supplierName || "Unknown Supplier"}</p>
                            {product.price_display ? (
                              <p className="mt-2 font-semibold text-foreground">
                                {product.price_display}
                              </p>
                            ) : product.pricing_quantities?.min_price?.price?.amount ? (
                              <p className="mt-2 font-semibold text-foreground">
                                ${product.pricing_quantities.min_price.price.amount}
                                {product.pricing_quantities.max_price?.price?.amount ? ` - $${product.pricing_quantities.max_price.price.amount}` : ""}
                                {product.pricing_quantities.unit ? ` / ${product.pricing_quantities.unit}` : ""}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      ))}
                    </div>
                    {products.length === 0 && (
                      <div className="py-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">No products found</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Suppliers Tab */}
                  <TabsContent value="suppliers">
                    <div className="space-y-4">
                      {suppliers.map((supplier) => (
                        <Link
                          key={supplier.id}
                          href={`/suppliers/${supplier.slug}`}
                          className="group block rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
                              {supplier.logo ? (
                                <img src={supplier.logo} alt={supplier.name} className="h-full w-full object-cover" />
                              ) : (
                                <Factory className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground group-hover:text-secondary">
                                  {supplier.name}
                                </h3>
                                {supplier.reviewed && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Reviewed
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {supplier.location?.city || "Unknown"}, {supplier.location?.country || "Unknown"}
                                </span>
                                <span>{supplier.industry || "General"}</span>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {supplier.short_description || "No description available."}
                              </p>
                              <div className="mt-3 flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  {supplier.rating || "N/A"}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {supplier.response_time || "N/A"}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Package className="h-4 w-4" />
                                  {supplier.product_count || 0} products
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {suppliers.length === 0 && (
                      <div className="py-12 text-center">
                        <Factory className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">No suppliers found</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Industries Tab */}
                  <TabsContent value="industries">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {industries.map((industry) => (
                        <Link
                          key={industry.id}
                          href={industry.slug ? `/industries/${industry.slug}` : `/industries`}
                          className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
                        >
                          <div className="flex items-start gap-4">
                            {industry.icon_url && (
                               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                                 <img src={industry.icon_url} alt={industry.name} className="h-full w-full object-cover" />
                               </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-foreground group-hover:text-secondary">
                                {industry.name}
                              </h3>
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {industry.description || "Explore suppliers in this industry."}
                              </p>
                              <div className="mt-4 flex items-center gap-4 text-sm">
                                <span className="font-medium text-foreground">
                                  {(industry.supplier_count || 0).toLocaleString()} suppliers
                                </span>
                                <span className="text-muted-foreground">
                                  {(industry.product_count || 0).toLocaleString()} products
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {industries.length === 0 && (
                      <div className="py-12 text-center">
                        <Layers className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">No industries found</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Search className="mx-auto h-8 w-8 animate-pulse text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Loading Search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
