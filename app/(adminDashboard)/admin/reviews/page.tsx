"use client"

import { useState, useEffect } from "react"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  getAdminReviewsStats,
  getAdminReviews,
  updateAdminReviewStatus,
  deleteAdminReview,
  BackendReview,
  AdminReviewsStatsData
} from "@/lib/api/admin-product-reviews"
import {
  Search,
  Star,
  MoreVertical,
  Eye,
  EyeOff,
  Flag,
  Trash2,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from "lucide-react"

const statusConfig = {
  published: { label: "Published", color: "bg-green-100 text-green-700", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  hidden: { label: "Hidden", color: "bg-gray-100 text-gray-700", icon: EyeOff },
  flagged: { label: "Flagged", color: "bg-red-100 text-red-700", icon: Flag }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<BackendReview[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [totalReviews, setTotalReviews] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [perPage, setPerPage] = useState(15)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [selectedReview, setSelectedReview] = useState<BackendReview | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null)
  const [page, setPage] = useState<number>(1)

  const [stats, setStats] = useState<AdminReviewsStatsData | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const loadStats = async () => {
    try {
      setLoadingStats(true)
      const res = await getAdminReviewsStats()
      if (res.success && res.data) {
        setStats(res.data)
      }
    } catch (error) {
      console.error("Error fetching admin reviews stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    let active = true
    async function loadReviews() {
      try {
        setLoadingReviews(true)
        const res = await getAdminReviews(page, {
          status: statusFilter,
          rating: ratingFilter,
          search: searchQuery,
        })
        if (active && res.success) {
          const mappedReviews = res.data.map(r => {
            if (r.status === "flagged") {
              return { ...r, status: "published" as const, status_label: "Published" }
            }
            return r
          })
          setReviews(mappedReviews)
          if (res.meta) {
            setTotalReviews(res.meta.total)
            setLastPage(res.meta.lastPage)
            setPerPage(res.meta.perPage)
          }
        }
      } catch (error) {
        console.error("Error fetching admin reviews list:", error)
      } finally {
        if (active) {
          setLoadingReviews(false)
        }
      }
    }
    loadReviews()
    return () => {
      active = false
    }
  }, [page, statusFilter, ratingFilter, searchQuery])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, ratingFilter])

  const updateReviewStatus = async (reviewId: number, status: BackendReview["status"]) => {
    try {
      const res = await updateAdminReviewStatus(reviewId, status)
      if (res.success) {
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, status, status_label: status.charAt(0).toUpperCase() + status.slice(1) } : r
        ))
        loadStats()
      }
    } catch (error) {
      console.error("Error updating review status:", error)
    }
  }

  const deleteReview = async (reviewId: number) => {
    try {
      const res = await deleteAdminReview(reviewId)
      if (res.success) {
        setReviews(prev => prev.filter(r => r.id !== reviewId))
        loadStats()
      }
    } catch (error) {
      console.error("Error deleting review:", error)
    }
    setDeleteReviewId(null)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500" />
          Reviews Management
        </h1>
        <p className="mt-1 text-muted-foreground">
          Moderate and manage supplier reviews
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard
          title="Total Reviews"
          value={
            loadingStats ? (
              <span className="inline-block h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              stats?.total_reviews ?? 0
            )
          }
          icon={MessageSquare}
          layout="spaceBetween"
        />
        <AdminStatCard
          title="Published"
          value={
            loadingStats ? (
              <span className="inline-block h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              (stats?.published ?? 0) + (stats?.flagged ?? 0)
            )
          }
          valueClassName="text-green-600"
          icon={CheckCircle}
          iconClassName="text-green-600"
          iconWrapperClassName="bg-green-100"
          layout="spaceBetween"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reviews by buyer name, company, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Rating" />
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

      {/* Reviews Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reviewer</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingReviews ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading reviews...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-semibold text-foreground">No reviews found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => {
                const config = statusConfig[review.status]
                const StatusIcon = config ? config.icon : MessageSquare
                return (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.reviewer.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.reviewer.company_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{review.supplier.company_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-muted-foreground">
                        {review.title || review.comment.substring(0, 50)}...
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={config ? config.color : "bg-gray-100 text-gray-700"}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {config ? config.label : review.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedReview(review)
                            setShowViewDialog(true)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {review.status !== "published" && (
                            <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "published")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {review.status !== "hidden" && (
                            <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "hidden")}>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Hide
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteReviewId(review.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loadingReviews && reviews.length > 0 && (
          <div className="px-4 py-3 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, totalReviews)} of {totalReviews}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">Page {page} / {lastPage}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= lastPage}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Review Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Review #{selectedReview?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reviewer</p>
                  <p className="font-medium">{selectedReview.reviewer.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReview.reviewer.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedReview.supplier.company_name}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= selectedReview.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {selectedReview.title && (
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedReview.title}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Review Content</p>
                <p className="mt-1 text-foreground">{selectedReview.comment}</p>
              </div>

              {selectedReview.order && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium text-foreground">Order Information</p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p>{selectedReview.product?.category || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Order Value</p>
                      <p>
                        ${Number(selectedReview.order.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedReview.order.currency_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Order Date</p>
                      <p>{formatDate(selectedReview.order.created_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <Badge className={statusConfig[selectedReview.status]?.color || "bg-gray-100 text-gray-700"}>
                  {statusConfig[selectedReview.status]?.label || selectedReview.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Submitted: {formatDate(selectedReview.created_at)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The review will be permanently removed from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReviewId && deleteReview(deleteReviewId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
