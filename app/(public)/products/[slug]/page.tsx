"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getProduct, type Product } from "@/lib/api/products"
import { queryKeys } from "@/lib/query-keys"
import { useFavorites } from "@/lib/favorites-context"
import { useAuth } from "@/lib/auth-context"
import { 
  Package,
  ChevronRight,
  MessageSquare,
  Clock,
  CheckCircle,
  Truck,
  Sparkles,
  BoxIcon,
  Zap,
  Loader2,
  AlertCircle,
  FileText,
  Heart,
  Scale
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ProductReviewsSection } from "@/components/products/product-reviews-section"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string // This is the product ID in the URL
  const { user } = useAuth()
  
  const dashboardPath = user?.role === 'manufacturer' 
    ? '/dashboard/manufacturer/messages'
    : user?.role === 'admin'
    ? '/admin/messages'
    : '/dashboard/buyer/messages'
  const { 
    addProductToFavorites, 
    removeProductFromFavorites, 
    isProductSaved,
    addProductToCompare,
    removeProductFromCompare,
    isProductInCompare,
    productCompareCount,
    maxProductCompare
  } = useFavorites()

  const productQuery = useQuery({
    queryKey: queryKeys.publicProductDetail(slug),
    queryFn: () => getProduct(slug),
    enabled: Boolean(slug),
  })

  const product: Product | null =
    productQuery.data?.success && productQuery.data.data ? productQuery.data.data : null
  const loading = productQuery.isLoading
  const error =
    productQuery.data?.success === false
      ? productQuery.data.message || "Product not found"
      : productQuery.isError
        ? "Product not found"
        : null

  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    if (!product) return
    const allImages = product.images || []
    const firstImg = allImages.length > 0 ? allImages[0] : product.image
    if (firstImg) setActiveImage(firstImg)
  }, [product])

  const handleFavoriteClick = () => {
    if (!product) return
    if (isSaved(product.id)) {
      removeProductFromFavorites(product.id.toString())
    } else {
      // Create a compatible object for favorites context
      addProductToFavorites({
        id: product.id.toString(),
        name: product.name,
        slug: product.slug,
        category: product.category.name,
        price: {
          min: parseFloat(product.pricing_quantities.min_price.price.amount),
          max: parseFloat(product.pricing_quantities.max_price.price.amount),
          unit: product.pricing_quantities.unit,
          currency: product.pricing_quantities.currency.code
        },
        supplierId: "0", // Placeholder - not available from API yet
        supplierSlug: "", // Placeholder
        supplierName: "", // Placeholder
        image: product.image || "/placeholder-product.png",
        rating: 0,
        verified: product.is_approved
      } as any)
    }
  }

  function isSaved(productId: number): boolean {
    return isProductSaved(productId.toString())
  }

  if (loading) {
    return (
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background">
        <SiteHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Product Not Found</p>
                  <p className="text-sm mt-1">{error || "The product you're looking for doesn't exist."}</p>
                </div>
              </div>
              <Button className="mt-4" variant="outline" onClick={() => router.push("/products")}>
                Back to Products
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const minPrice = parseFloat(product.pricing_quantities.min_price.price.amount)
  const maxPrice = parseFloat(product.pricing_quantities.max_price.price.amount)
  const isSavedProduct = isSaved(product.id)
  const productInCompare = isProductInCompare(product.slug)

  const handleCompareClick = () => {
    if (productInCompare) {
      removeProductFromCompare(product.slug)
      return
    }

    addProductToCompare(product)
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="min-w-0 flex-1">
        <div className="border-b border-border bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
            <nav className="flex items-center gap-1.5 overflow-x-auto text-xs whitespace-nowrap sm:gap-2 sm:text-sm">
              <Link href="/" className="shrink-0 text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
              <Link href="/products" className="shrink-0 text-muted-foreground hover:text-foreground">
                Products
              </Link>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block sm:h-4 sm:w-4" />
              <Link
                href={`/industries/${product.category.slug}`}
                className="hidden shrink-0 text-muted-foreground hover:text-foreground sm:inline"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
              <span className="min-w-0 truncate font-medium text-foreground">{product.name}</span>
            </nav>
          </div>
        </div>

        <section className="py-5 sm:py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="min-w-0">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted sm:rounded-2xl">
                  {activeImage ? (
                    <img 
                      src={activeImage} 
                      alt={product.name} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/30 sm:h-24 sm:w-24" />
                    </div>
                  )}
                </div>
                
                {product.images && product.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:mt-4 sm:gap-4">
                    {product.images.slice(0, 4).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(img)}
                        className={cn(
                          "aspect-square overflow-hidden rounded-md border-2 bg-muted transition-colors sm:rounded-lg",
                          activeImage === img ? "border-primary" : "border-transparent hover:border-primary/50"
                        )}
                      >
                        <img 
                          src={img} 
                          alt={`${product.name} ${i + 1}`} 
                          className="h-full w-full object-cover" 
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Badge className="text-xs sm:text-sm">{product.category.name}</Badge>
                  {product.customization_options && product.customization_options.length > 0 && (
                    <Badge variant="outline" className="text-xs sm:text-sm">Customizable</Badge>
                  )}
                </div>

                <h1 className="mt-3 font-serif text-xl font-medium text-foreground sm:mt-4 sm:text-2xl lg:text-3xl">
                  {product.name}
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
                  {product.description}
                </p>

                <div className="mt-4 rounded-xl border border-border bg-card p-3 sm:mt-6 sm:p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xl font-bold text-foreground sm:text-2xl">
                        ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                      </span>
                      <span className="ml-1.5 text-sm text-muted-foreground sm:ml-2">/ {product.pricing_quantities.unit}</span>
                    </div>
                    <span className="text-xs text-muted-foreground sm:text-sm">USD</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">
                    Price varies based on quantity and customization
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-4">
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Minimum Order</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                      {product.pricing_quantities.minimum_order_quantity} {product.pricing_quantities.unit}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Lead Time</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                      {product.pricing_quantities.lead_time} days
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                      <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Production</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                      {product.pricing_quantities.production_duration} {product.pricing_quantities.production_unit}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Capacity</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                      {product.pricing_quantities.production_capacity} units
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                    <Button className="w-full flex-1 gap-2" size="default" variant="secondary" asChild>
                      <Link href={`/rfq/new?product_id=${product.id}&supplier=${product.supplierId || product.supplierSlug || ""}`}>
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        Request Quote
                      </Link>
                    </Button>
                    <Button variant="outline" size="default" className="w-full flex-1" asChild>
                      <Link href={`${dashboardPath}?supplier=${product.supplierId || product.supplierSlug || "admin"}&product=${product.id}&productName=${encodeURIComponent(product.name)}&productImage=${encodeURIComponent(product.images?.[0] || (product as any).image || '')}&productDesc=${encodeURIComponent(product.description || '')}&prefill=1`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contact Supplier
                      </Link>
                    </Button>
                  </div>

                  <div className="flex gap-2.5 sm:gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="default"
                            variant={isSavedProduct ? "secondary" : "outline"}
                            className="flex-1 gap-2"
                            onClick={handleFavoriteClick}
                          >
                            <Heart className={cn("h-4 w-4", isSavedProduct && "fill-current")} />
                            {isSavedProduct ? "Saved" : "Save"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isSavedProduct ? "Remove from favorites" : "Save to favorites"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="default"
                            variant={productInCompare ? "secondary" : "outline"}
                            className="flex-1 gap-2"
                            onClick={handleCompareClick}
                            disabled={!productInCompare && productCompareCount >= maxProductCompare}
                          >
                            <Scale className="h-4 w-4" />
                            {productInCompare ? "In Compare" : "Compare"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {productInCompare
                            ? "Remove from comparison"
                            : productCompareCount >= maxProductCompare
                              ? `Maximum ${maxProductCompare} products`
                              : "Add product to comparison"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {productCompareCount >= 2 && (
                    <Button
                      size="default"
                      variant="default"
                      className="w-full gap-2"
                      onClick={() => router.push("/products/compare")}
                    >
                      <Scale className="h-4 w-4" />
                      Compare Products ({productCompareCount})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border py-6 sm:py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-xl font-medium text-foreground sm:text-2xl">
              Product Specifications
            </h2>
            
            {product.specifications && product.specifications.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card sm:mt-6">
                <div className="divide-y divide-border">
                  {product.specifications.map((spec, index) => (
                    <div
                      key={spec.id}
                      className={cn(
                        "flex flex-col gap-0.5 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4",
                        index % 2 === 0 && "bg-muted/50"
                      )}
                    >
                      <div className="text-sm font-medium text-foreground sm:w-1/3">
                        {spec.specification_title}
                      </div>
                      <div className="text-sm text-muted-foreground sm:flex-1">
                        {spec.specification_value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.product_key_features && product.product_key_features.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                  Key Features
                </h3>
                <ul className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3">
                  {product.product_key_features.map((feature) => (
                    <li key={feature.id} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <span className="text-sm text-muted-foreground">{feature.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.customization_options && product.customization_options.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  Customization Options
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                  {product.customization_options.map((option) => (
                    <Badge key={option.id} variant="secondary" className="text-xs sm:text-sm">
                      {option.option}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {product.shipping_packaging && (
              <div className="mt-6 sm:mt-8">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                  <BoxIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Packaging Details
                </h3>
                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card sm:mt-4">
                  <div className="divide-y divide-border">
                    {[
                      { label: "Type", value: product.shipping_packaging.packaging_type },
                      { label: "Dimensions", value: product.shipping_packaging.packaging_dimensions },
                      { label: "Weight", value: product.shipping_packaging.packaging_weight },
                      { label: "Port", value: product.shipping_packaging.port_of_loading },
                      {
                        label: "Cost/Unit",
                        value: `$${parseFloat(product.shipping_packaging.packaging_cost_per_unit.price.amount).toFixed(2)}`,
                      },
                    ].map((row, index) => (
                      <div
                        key={row.label}
                        className={cn(
                          "flex flex-col gap-0.5 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4",
                          index % 2 === 0 && "bg-muted/50"
                        )}
                      >
                        <div className="text-sm font-medium text-foreground sm:w-1/3">{row.label}</div>
                        <div className="text-sm text-muted-foreground sm:flex-1">{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {product.shipping_methods && product.shipping_methods.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                  Available Shipping Methods
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                  {product.shipping_methods.map((method) => (
                    <Badge key={method.id} variant="outline" className="text-xs sm:text-sm">
                      {method.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 max-w-2xl sm:mb-8">
              <h2 className="font-serif text-xl font-medium text-foreground sm:text-2xl lg:text-3xl">
                Product Reviews
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Read what other buyers have to say about their experience with this product.
              </p>
            </div>
            
            <ProductReviewsSection
              productId={product.id.toString()}
              productName={product.name}
              reviews={
                product.reviews
                  ? product.reviews.map(pr => ({
                      id: pr.id.toString(),
                      supplierId: product.supplierId || "",
                      productId: product.id.toString(),
                      buyerId: pr.reviewer.id.toString(),
                      buyerName: `${pr.reviewer.first_name} ${pr.reviewer.last_name}`,
                      buyerCompany: pr.reviewer.company_name,
                      buyerCountry: pr.reviewer.country,
                      rating: pr.rating,
                      title: pr.title,
                      content: pr.comment,
                      date: pr.created_at,
                      reviewed: true,
                      helpful: 0,
                      status: "published",
                      orderDetails: {
                        productCategory: product.category.name,
                        orderValue: pr.order.total_amount.toString(),
                        orderDate: pr.created_at
                      }
                    }))
                  : []
              }
              ratingSummary={
                product.review_stats
                  ? {
                      average: product.review_stats.average_rating,
                      total: product.review_stats.total_reviews,
                      distribution: {
                        5: product.review_stats.breakdown.find(b => b.rating === 5)?.count || 0,
                        4: product.review_stats.breakdown.find(b => b.rating === 4)?.count || 0,
                        3: product.review_stats.breakdown.find(b => b.rating === 3)?.count || 0,
                        2: product.review_stats.breakdown.find(b => b.rating === 2)?.count || 0,
                        1: product.review_stats.breakdown.find(b => b.rating === 1)?.count || 0
                      }
                    }
                  : { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
              }
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
