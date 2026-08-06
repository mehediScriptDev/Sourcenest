"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Package } from "lucide-react"
import { getProducts } from "@/lib/api/products"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"

export function FeaturedProductsSection() {
  const router = useRouter()
  const { t } = useTranslation()

  const productsQuery = useQuery({
    queryKey: queryKeys.publicHomeFeaturedProducts(),
    queryFn: () => getProducts(1),
  })

  const products =
    productsQuery.data?.success && productsQuery.data.data
      ? productsQuery.data.data.slice(0, 6)
      : []
  const loading = productsQuery.isLoading

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {t.landing.featured.productsTitle}
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              {t.landing.featured.productsSubtitle}
            </p>
          </div>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/products">
              {t.common.view} All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-12 py-12 flex justify-center items-center text-muted-foreground">
            <Package className="h-8 w-8 animate-pulse mr-2 opacity-50" />
            <span>Loading products...</span>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${product.id}`)}
                className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg sm:rounded-2xl"
              >
                <div className="relative aspect-square bg-muted overflow-hidden sm:aspect-4/3">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {product.image || product.images?.[0] ? (
                      <img
                        src={product.image || product.images?.[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground/30 sm:h-16 sm:w-16" />
                    )}
                  </div>
                  {product.category?.name && (
                    <Badge className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate px-1.5 py-0.5 text-[10px] sm:left-3 sm:top-3 sm:px-2.5 sm:text-xs">
                      {product.category.name}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-2.5 sm:p-5">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-secondary sm:line-clamp-1 sm:text-base">
                    {product.name}
                  </h3>
                  <Link
                    href={product.supplierSlug ? `/suppliers/${product.supplierSlug}` : "#"}
                    className="mt-1 hidden truncate text-sm text-muted-foreground hover:text-secondary sm:block"
                    onClick={(e) => {
                      if (product.supplierSlug) e.stopPropagation()
                      else e.preventDefault()
                    }}
                  >
                    by {product.supplierName || "Unknown Supplier"}
                  </Link>
                  <div className="mt-auto grid grid-cols-1 gap-2 border-t border-border pt-2.5 text-xs sm:mt-4 sm:grid-cols-2 sm:gap-3 sm:pt-4 sm:text-sm">
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">MOQ</span>
                      <span className="mt-0.5 line-clamp-2 font-medium text-foreground sm:truncate">
                        {product.pricing_quantities?.minimum_order_quantity?.toLocaleString() || 1}{" "}
                        <span className="text-muted-foreground">{product.pricing_quantities?.unit || "units"}</span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">Lead</span>
                      <span className="mt-0.5 line-clamp-1 font-medium text-foreground sm:truncate">
                        {product.pricing_quantities?.lead_time || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
