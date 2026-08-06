"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReviewCard } from "@/components/reviews/review-card"
import { RatingSummary } from "@/components/reviews/rating-summary"
import { ProductReviewForm } from "@/components/reviews/product-review-form"
import { PenLine, MessageSquareText } from "lucide-react"
import type { Review } from "@/lib/data/reviews"

interface ProductReviewsSectionProps {
  productId: string
  productName: string
  reviews: Review[]
  ratingSummary: {
    average: number
    total: number
    distribution: {
      5: number
      4: number
      3: number
      2: number
      1: number
    }
  }
}

type SortOption = "newest" | "highest" | "lowest" | "helpful"

export function ProductReviewsSection({
  productId,
  productName,
  reviews,
  ratingSummary
}: ProductReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filterRating, setFilterRating] = useState<string>("all")

  const sortedReviews = [...reviews]
    .filter(review => filterRating === "all" || review.rating === parseInt(filterRating))
    .sort((a, b) => {
      switch (sortBy) {
        case "highest":
          return b.rating - a.rating
        case "lowest":
          return a.rating - b.rating
        case "helpful":
          return b.helpful - a.helpful
        case "newest":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

  const handleReviewSubmit = () => {
    // In production, this would refresh the reviews list
    console.log("Review submitted")
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <RatingSummary
            average={ratingSummary.average}
            total={ratingSummary.total}
            distribution={ratingSummary.distribution}
          />
          
          <div className="flex shrink-0 flex-col gap-2">
            <Button 
              onClick={() => setShowReviewForm(true)}
              className="w-full gap-2 sm:w-auto lg:self-end"
              size="default"
            >
              <PenLine className="h-4 w-4" />
              Write a Review
            </Button>
            <p className="text-xs text-muted-foreground sm:max-w-[250px] lg:text-right">
              Only buyers with an active or completed order can leave a review.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-4">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground sm:text-sm">
          Showing {sortedReviews.length} of {reviews.length} reviews
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center sm:py-16">
            <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">No Reviews Yet</h3>
            <p className="mt-2 text-muted-foreground">
              {filterRating !== "all" 
                ? "No reviews match your filter criteria"
                : "Be the first to share your experience with this product"
              }
            </p>
            {filterRating === "all" && (
              <>
                <Button 
                  onClick={() => setShowReviewForm(true)}
                  className="mt-4 gap-2"
                >
                  <PenLine className="h-4 w-4" />
                  Write the First Review
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Only buyers with an active or completed order can leave a review.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Load More */}
      {sortedReviews.length > 0 && sortedReviews.length >= 5 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Reviews
          </Button>
        </div>
      )}

      {/* Review Form Dialog */}
      <ProductReviewForm
        productId={productId}
        productName={productName}
        open={showReviewForm}
        onOpenChange={setShowReviewForm}
        onSubmit={handleReviewSubmit}
      />
    </div>
  )
}
