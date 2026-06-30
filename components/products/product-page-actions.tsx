"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFavorites } from "@/lib/favorites-context"
import { Product } from "@/lib/data/products"
import { ReportDialog } from "@/components/report/report-dialog"
import { Heart, MessageSquare, FileText, Scale, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductPageActionsProps {
  product: Product
}

export function ProductPageActions({ product }: ProductPageActionsProps) {
  const router = useRouter()
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
  
  const isSaved = isProductSaved(product.id)
  const productInCompare = isProductInCompare(product.slug)

  const handleFavoriteClick = () => {
    if (isSaved) {
      removeProductFromFavorites(product.id)
    } else {
      addProductToFavorites(product)
    }
  }

  const handleCompareClick = () => {
    if (productInCompare) {
      removeProductFromCompare(product.slug)
    } else {
      addProductToCompare(product)
    }
  }

  return (
    <div className="mt-8 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1 gap-2" asChild>
          <Link href={`/rfq/new?product=${product.id}&supplier=${product.supplierSlug}`}>
            <FileText className="h-4 w-4" />
            Request Quote
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="flex-1 gap-2" asChild>
          <Link href={`/messages/new?supplier=${product.supplierSlug}&product=${product.id}&productName=${encodeURIComponent(product.name)}&productImage=${encodeURIComponent(product.images?.[0] || (product as any).image || '')}&productDesc=${encodeURIComponent(product.shortDescription || product.description || '')}`}>
            <MessageSquare className="h-4 w-4" />
            Contact Supplier
          </Link>
        </Button>
      </div>

      <div className="flex gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={isSaved ? "secondary" : "outline"}
                className="flex-1 gap-2"
                onClick={handleFavoriteClick}
              >
                <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                {isSaved ? "Saved" : "Save"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isSaved ? "Remove from favorites" : "Save to favorites"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
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
          size="lg" 
          variant="default"
          className="w-full gap-2"
          onClick={() => router.push("/products/compare")}
        >
          <Scale className="h-4 w-4" />
          Compare Products ({productCompareCount})
        </Button>
      )}

      {/* Report Button */}
      <ReportDialog type="product" targetId={product.id} targetName={product.name}>
        <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:text-destructive">
          <Flag className="h-4 w-4" />
          Report Product
        </Button>
      </ReportDialog>
    </div>
  )
}
