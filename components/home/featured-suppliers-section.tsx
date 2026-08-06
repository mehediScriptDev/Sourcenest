"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, MapPin, CheckCircle, Building2 } from "lucide-react"
import { getPublicSuppliers } from "@/lib/api/public-suppliers"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"

export function FeaturedSuppliersSection() {
  const { t } = useTranslation()

  const suppliersQuery = useQuery({
    queryKey: queryKeys.publicHomeFeaturedSuppliers(),
    queryFn: () => getPublicSuppliers(),
  })

  const suppliers =
    suppliersQuery.data?.success && suppliersQuery.data.data
      ? suppliersQuery.data.data.slice(0, 4)
      : []
  const loading = suppliersQuery.isLoading

  return (
    <section className="bg-muted/50 py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {t.landing.featured.suppliersTitle}
            </h2>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              {t.landing.featured.suppliersSubtitle}
            </p>
          </div>
          <Button variant="outline" className="h-11 gap-2 px-6" asChild>
            <Link href="/suppliers">
              {t.landing.featured.viewAllSuppliers}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-10 py-12 flex justify-center items-center text-muted-foreground">
            <Building2 className="h-8 w-8 animate-pulse mr-2 opacity-50" />
            <span>Loading suppliers...</span>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:gap-6">
            {suppliers.map((supplier) => (
              <Link
                key={supplier.id}
                href={`/suppliers/${supplier.slug}`}
                className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-3 transition-all duration-300 hover:border-secondary/50 hover:shadow-lg sm:rounded-2xl sm:p-5 sm:hover:shadow-xl"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                      {supplier.logo ? (
                        <img src={supplier.logo} alt={supplier.name} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-secondary sm:text-base">
                          {supplier.name}
                        </h3>
                        {supplier.reviewed && (
                          <CheckCircle className="h-3.5 w-3.5 shrink-0 text-secondary sm:h-4 sm:w-4" />
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                        <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                        <span className="truncate">
                          {supplier.location?.city || "Unknown"}, {supplier.location?.country || "Unknown"}
                        </span>
                      </div>
                      {supplier.industry && (
                        <Badge variant="secondary" className="mt-1.5 max-w-full truncate px-1.5 py-0 text-[10px] font-medium sm:mt-2 sm:px-2.5 sm:text-xs">
                          {supplier.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground line-clamp-2 sm:mt-3 sm:block">
                    {supplier.short_description || "No description available."}
                  </p>
                </div>
                
                <div className="mt-2 hidden flex-wrap gap-1.5 pt-1 sm:mt-3 sm:flex sm:gap-2 sm:pt-2">
                  {supplier.main_products?.slice(0, 3).map((product) => (
                    <Badge key={product} variant="outline" className="max-w-full truncate bg-background/50 px-1.5 py-0 text-[10px] font-normal sm:px-2.5 sm:text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
