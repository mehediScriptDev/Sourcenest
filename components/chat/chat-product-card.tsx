"use client"

import { useState, useEffect } from "react"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProduct, type Product } from "@/lib/api/products"

interface ChatProductCardProps {
  name: string
  url: string
  fallbackImage?: string
  fallbackDesc?: string
  isMine: boolean
}

export function ChatProductCard({ name, url, fallbackImage, fallbackDesc, isMine }: ChatProductCardProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Extract slug from the URL
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/')
        const slug = pathParts[pathParts.length - 1]

        if (slug) {
          const response = await getProduct(slug)
          if (response.success && response.data) {
            setProduct(response.data)
          }
        }
      } catch (error) {
        console.error("Failed to fetch product for chat history", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [url])

  const image = product?.images?.[0] || product?.image || fallbackImage
  const description = (product as any)?.shortDescription || product?.description || fallbackDesc

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg p-2.5 border",
      isMine ? "bg-black/10 border-black/10" : "bg-muted/50 border-border/50"
    )}>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md overflow-hidden",
        isMine ? "bg-black/10 text-secondary-foreground/70" : "bg-background text-muted-foreground"
      )}>
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-5 w-5" />
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Product Reference</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate font-medium hover:underline leading-snug">
          {product?.name || name}
        </a>
        {description && !loading && (
          <p className="text-xs opacity-80 line-clamp-1 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}
