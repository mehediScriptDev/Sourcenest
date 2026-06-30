"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ProductReviewFormProps {
  productId: string
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (review: ProductReviewFormData) => void
}

export interface ProductReviewFormData {
  rating: number
  title: string
  content: string
}

export function ProductReviewForm({ 
  productId, 
  productName, 
  open, 
  onOpenChange,
  onSubmit 
}: ProductReviewFormProps) {
  const { user, isAuthenticated } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [orderId, setOrderId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [orders, setOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [hasFetchedOrders, setHasFetchedOrders] = useState(false)

  const isBuyer = user?.role === "buyer"

  // Fetch user's completed orders for this product when form opens
  useEffect(() => {
    if (open && isBuyer && !hasFetchedOrders) {
      setIsLoadingOrders(true)
      import("@/lib/api/orders").then(({ getBuyerOrders }) => {
        getBuyerOrders({ product_id: parseInt(productId), status: "completed" })
          .then((res) => {
            if (res.success && res.data) {
              setOrders(res.data)
              if (res.data.length > 0) {
                setOrderId(res.data[0].id.toString())
              }
            }
            setHasFetchedOrders(true)
            setIsLoadingOrders(false)
          })
          .catch(() => {
            setHasFetchedOrders(true)
            setIsLoadingOrders(false)
          })
      })
    }
  }, [open, isBuyer, productId, hasFetchedOrders])

  useEffect(() => {
    if (!open) {
      setHasFetchedOrders(false)
      setOrders([])
      setError(null)
    }
  }, [open])

  const handleSubmit = async () => {
    if (rating === 0 || !content.trim() || !orderId.trim()) return
    
    setIsSubmitting(true)
    setError(null)
    
    // Using dynamically imported API to avoid circular deps or missing imports
    const { createProductReview } = await import("@/lib/api/orders")
    
    const response = await createProductReview(parseInt(productId), {
      order_id: parseInt(orderId),
      rating,
      comment: content,
      // title is not supported by API yet, but we keep it in UI
    })
    
    if (response.success) {
      if (onSubmit) {
        onSubmit({
          rating,
          title,
          content
        })
      }
      
      setSubmitted(true)
      setIsSubmitting(false)
      
      // Reset and close after delay
      setTimeout(() => {
        setRating(0)
        setTitle("")
        setContent("")
        setOrderId("")
        setSubmitted(false)
        onOpenChange(false)
      }, 2000)
    } else {
      setError(response.message || "Failed to submit review. Please check your Order ID and try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with {productName}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">Sign in Required</h3>
            <p className="mt-2 text-muted-foreground">
              Please sign in to leave a review for this product.
            </p>
            <Button className="mt-4" asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </div>
        ) : !isBuyer ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">Buyer Account Required</h3>
            <p className="mt-2 text-muted-foreground">
              Only buyers can leave reviews for products.
            </p>
          </div>
        ) : isLoadingOrders ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Verifying purchase history...</p>
          </div>
        ) : hasFetchedOrders && orders.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">Purchase Required</h3>
            <p className="mt-2 text-muted-foreground">
              Only customers with a completed order can leave a review.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Star className="h-6 w-6 text-green-600 fill-green-600" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">Review Submitted!</h3>
            <p className="mt-2 text-muted-foreground">
              Thank you for your feedback. Your review will be published after moderation.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {/* Star Rating */}
              <div>
                <Label className="text-base">Overall Rating *</Label>
                <div className="mt-2 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30 hover:text-amber-200"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {rating === 5 ? "Excellent" : 
                       rating === 4 ? "Very Good" : 
                       rating === 3 ? "Good" : 
                       rating === 2 ? "Fair" : "Poor"}
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Order ID */}
              <div>
                <Label htmlFor="review-order-id">Select Order *</Label>
                <Select value={orderId} onValueChange={setOrderId}>
                  <SelectTrigger id="review-order-id" className="mt-2">
                    <SelectValue placeholder="Select an order to review" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        Order #{order.orderNumber} ({new Date(order.createdAt).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select the completed order you wish to review.
                </p>
              </div>

              {/* Review Title */}
              <div>
                <Label htmlFor="review-title">Review Title (Optional)</Label>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="mt-2"
                  maxLength={100}
                />
              </div>

              {/* Review Content */}
              <div>
                <Label htmlFor="review-content">Your Review *</Label>
                <Textarea
                  id="review-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share details about your experience with this product..."
                  className="mt-2"
                  rows={4}
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {content.length}/1000 characters
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={rating === 0 || !content.trim() || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
