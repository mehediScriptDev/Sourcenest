"use client"

import { useMemo, type ReactNode } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ArrowRight, Cpu, Cog, Shirt, Home, Heart, Car, UtensilsCrossed, FlaskConical, Package, Lightbulb, Wrench, HardHat, Sofa, Stethoscope, Wheat, Box, FileText, Factory, ShoppingBag, Globe } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { getPublicCategories } from "@/lib/api/categories"
import { queryKeys } from "@/lib/query-keys"
import DynamicIcon from "@/components/dynamic-icon"

const industryIconClass = "h-6 w-6"

const DEFAULT_CARD_COLORS = [
  { gradient: "from-blue-500/10 to-blue-600/5 group-hover:from-blue-500/20 group-hover:to-blue-600/10", iconColor: "#2563eb" },
  { gradient: "from-slate-500/10 to-slate-600/5 group-hover:from-slate-500/20 group-hover:to-slate-600/10", iconColor: "#475569" },
  { gradient: "from-rose-500/10 to-rose-600/5 group-hover:from-rose-500/20 group-hover:to-rose-600/10", iconColor: "#e11d48" },
  { gradient: "from-emerald-500/10 to-emerald-600/5 group-hover:from-emerald-500/20 group-hover:to-emerald-600/10", iconColor: "#059669" },
  { gradient: "from-pink-500/10 to-pink-600/5 group-hover:from-pink-500/20 group-hover:to-pink-600/10", iconColor: "#db2777" },
  { gradient: "from-red-500/10 to-red-600/5 group-hover:from-red-500/20 group-hover:to-red-600/10", iconColor: "#dc2626" },
  { gradient: "from-amber-500/10 to-amber-600/5 group-hover:from-amber-500/20 group-hover:to-amber-600/10", iconColor: "#d97706" },
  { gradient: "from-yellow-500/10 to-yellow-600/5 group-hover:from-yellow-500/20 group-hover:to-yellow-600/10", iconColor: "#ca8a04" },
]

// Map industry icons
const industryIcons: Record<string, ReactNode> = {
  "electronics-electrical": <Cpu className={industryIconClass} />,
  "machinery-equipment": <Cog className={industryIconClass} />,
  "textiles-apparel": <Shirt className={industryIconClass} />,
  "home-garden": <Home className={industryIconClass} />,
  "health-beauty": <Heart className={industryIconClass} />,
  "automotive-parts": <Car className={industryIconClass} />,
  "food-beverage": <UtensilsCrossed className={industryIconClass} />,
  "chemicals-materials": <FlaskConical className={industryIconClass} />,
  "packaging": <Package className={industryIconClass} />,
  "lighting": <Lightbulb className={industryIconClass} />,
  "metal-products": <Wrench className={industryIconClass} />,
  "construction-materials": <HardHat className={industryIconClass} />,
  "furniture": <Sofa className={industryIconClass} />,
  "medical-equipment": <Stethoscope className={industryIconClass} />,
  "agriculture": <Wheat className={industryIconClass} />,
  "plastic-products": <Box className={industryIconClass} />,
  "paper-products": <FileText className={industryIconClass} />,
  "industrial-machinery": <Factory className={industryIconClass} />,
  "consumer-goods": <ShoppingBag className={industryIconClass} />,
}

export function IndustriesSection() {
  const { t } = useTranslation()

  const categoriesQuery = useQuery({
    queryKey: queryKeys.publicCategories(50),
    queryFn: () => getPublicCategories({ perPage: 50 }),
  })

  const categories = useMemo(() => {
    if (!categoriesQuery.data?.success || !categoriesQuery.data.data) {
      return []
    }
    const featured = categoriesQuery.data.data.filter((c) => Number(c.featured) === 1)
    return featured.slice(0, 8)
  }, [categoriesQuery.data])

  if (!t || !t.landing?.featured) {
    return null
  }
  
  return (
    <section className="relative -mt-px bg-muted/50 py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12 lg:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary mb-3 sm:px-4 sm:py-2 sm:text-sm sm:mb-4">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t.landing.featured.industriesBadge}
          </span>
          <h2 className="font-serif text-xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-5xl">
            {t.landing.featured.industriesTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-lg">
            {t.landing.featured.industriesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {categories.map((industry, index) => {
            const hasBackendColor = Boolean(industry.color)
            const defaultPreset = DEFAULT_CARD_COLORS[index % DEFAULT_CARD_COLORS.length]
            
            // Detect if icon is a file URL (has file extension) or lucide icon name
            const isFileUrl = industry.icon && (
              industry.icon.startsWith("http") || 
              industry.icon.includes(".") || 
              industry.icon.startsWith("/")
            );
            
            // Build icon URL if it's a file path
            const iconUrl = isFileUrl && industry.icon
              ? (industry.icon.startsWith("http")
                  ? industry.icon
                  : `${process.env.NEXT_PUBLIC_API_URL || ""}${industry.icon.startsWith('/') ? '' : '/'}${industry.icon}`)
              : null;

            // Icon color: use backend value if provided, otherwise use default preset color
            const effectiveIconColor = (industry.icon_color && industry.icon_color.trim()) || defaultPreset.iconColor

            return (
              <Link
                key={industry.slug || industry.id}
                href={`/industries/${industry.slug || industry.id}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-secondary/50 hover:shadow-lg sm:rounded-2xl sm:hover:shadow-2xl sm:hover:-translate-y-2"
                {...(hasBackendColor ? { style: { backgroundColor: industry.color! } } : {})}
              >
                {/* Gradient background overlay — uses backend color or default jawasmiavai preset */}
                {!hasBackendColor && (
                  <div className={`absolute inset-0 bg-linear-to-br transition-all duration-300 ${defaultPreset.gradient}`} />
                )}

                <div className="relative p-3 sm:p-6 lg:p-8">
                  <div 
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-card shadow-sm transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl sm:shadow-md lg:h-14 lg:w-14"
                  >
                    {iconUrl ? (
                      <img src={iconUrl} alt={industry.name} className={`${industryIconClass} object-contain`} />
                    ) : industry.icon && (industry.icon.includes(".") || industry.icon.startsWith("/")) ? (
                      <img src={industry.icon} alt={industry.name} className={`${industryIconClass} object-contain`} />
                    ) : industry.icon ? (
                      <DynamicIcon 
                        name={industry.icon} 
                        className={industryIconClass}
                        color={effectiveIconColor}
                      />
                    ) : (
                      <div style={{ color: effectiveIconColor }}>
                        {industryIcons[industry.slug || ""] || <Package className={industryIconClass} />}
                      </div>
                    )}
                  </div>

                  <h3 
                    className="mt-2 truncate text-sm font-semibold leading-snug sm:mt-5 sm:text-xl"
                    style={{ color: industry.title_color || undefined }}
                  >
                    {industry.name}
                  </h3>

                  <p 
                    className="mt-2 hidden text-sm line-clamp-2 sm:block" 
                    title={industry.description}
                    style={{ color: industry.description_color || undefined }}
                  >
                    {industry.description || "Explore suppliers and products in this industry sector."}
                  </p>

                  <div className="mt-2 flex items-center gap-1 text-xs sm:mt-5 sm:gap-4 sm:text-sm" style={{ color: industry.supplier_count_color || undefined }}>
                    <Factory className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-semibold">{industry.supplier_count?.toLocaleString() || 0}</span>
                    <span className="hidden sm:inline">{t?.landing?.featured?.suppliersLabel || "suppliers"}</span>
                  </div>

                  <div 
                    className="mt-2 hidden items-center text-sm font-medium transition-colors sm:mt-5 sm:flex"
                    style={{ color: industry.btn_color || undefined }}
                  >
                    <span>{t?.landing?.featured?.exploreButton || "Explore"}</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* View All Button */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* View All Industries Button */}
          <Button size="lg" variant="default" className="gap-2" asChild>
            <Link href="/industries">
              <Package className="h-4 w-4" />
              {t?.landing?.industries?.viewAll || "View All Industries"}
            </Link>
          </Button>
          {/* Explore Global Map Button */}
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <Link href="/suppliers/map">
              <Globe className="h-4 w-4" />
              {t?.landing?.industries?.explorerMap || "Explore Global Map"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
