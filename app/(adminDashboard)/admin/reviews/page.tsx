"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AdminPagination } from "@/components/admin/admin-pagination"
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
import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
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
  AdminReviewsStatsData,
  AdminReviewsMeta,
} from "@/lib/api/admin-product-reviews"
import { useTranslation } from "@/lib/i18n"
import { queryKeys } from "@/lib/query-keys"
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

export default function AdminReviewsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.reviews
  const c = t.admin.common

  const statusConfig = useMemo(() => ({
    published: { label: c.published, color: "bg-green-100 text-green-700", icon: CheckCircle },
    pending: { label: c.pending, color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
    hidden: { label: c.hidden, color: "bg-gray-100 text-gray-700", icon: EyeOff },
    flagged: { label: c.flagged, color: "bg-red-100 text-red-700", icon: Flag },
  }), [c])

  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [selectedReview, setSelectedReview] = useState<BackendReview | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null)
  const [page, setPage] = useState<number>(1)
  const reviewsQueryKey = queryKeys.adminReviews(page, statusFilter, ratingFilter, searchQuery)
  const reviewStatsQuery = useQuery({
    queryKey: queryKeys.adminReviewStats(),
    queryFn: () => getAdminReviewsStats(),
  })

  const reviewsQuery = useQuery({
    queryKey: reviewsQueryKey,
    queryFn: () =>
      getAdminReviews(page, {
        status: statusFilter,
        rating: ratingFilter,
        search: searchQuery,
      }),
    placeholderData: (previousData) => previousData,
  })

  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: number; status: BackendReview["status"] }) =>
      updateAdminReviewStatus(reviewId, status),
  })

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => deleteAdminReview(reviewId),
  })

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, ratingFilter])

  const loadingReviews = reviewsQuery.isLoading
  const loadingStats = reviewStatsQuery.isLoading
  const stats: AdminReviewsStatsData | null =
    reviewStatsQuery.data?.success && reviewStatsQuery.data.data ? reviewStatsQuery.data.data : null
  const rawReviews = reviewsQuery.data?.success ? reviewsQuery.data.data : []
  const reviews = rawReviews.map((review) =>
    review.status === "flagged"
      ? { ...review, status: "published" as const, status_label: c.published }
      : review
  )
  const meta: AdminReviewsMeta | null = reviewsQuery.data?.success ? reviewsQuery.data.meta : null
  const totalReviews = meta?.total ?? 0
  const perPage = meta?.perPage ?? 15

  const updateReviewStatus = async (reviewId: number, status: BackendReview["status"]) => {
    try {
      const res = await updateReviewMutation.mutateAsync({ reviewId, status })
      if (res.success) {
        queryClient.setQueryData(reviewsQueryKey, (previous: {
          success: boolean
          message?: string
          data: BackendReview[]
          meta: AdminReviewsMeta | null
        } | undefined) => {
          if (!previous?.success) return previous
          return {
            ...previous,
            data: previous.data.map((review) =>
              review.id === reviewId
                ? { ...review, status, status_label: statusConfig[status]?.label ?? status }
                : review
            ),
          }
        })
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminReviewStats() })
      }
    } catch (error) {
      console.error("Error updating review status:", error)
    }
  }

  const deleteReview = async (reviewId: number) => {
    try {
      const res = await deleteReviewMutation.mutateAsync(reviewId)
      if (res.success) {
        queryClient.setQueryData(reviewsQueryKey, (previous: {
          success: boolean
          message?: string
          data: BackendReview[]
          meta: AdminReviewsMeta | null
        } | undefined) => {
          if (!previous?.success) return previous
          const nextData = previous.data.filter((review) => review.id !== reviewId)
          const nextMeta = previous.meta
            ? { ...previous.meta, total: Math.max(previous.meta.total - 1, 0) }
            : previous.meta
          return { ...previous, data: nextData, meta: nextMeta }
        })
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminReviewStats() })
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
          {p.title}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {p.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard
          title={p.totalReviews}
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
          title={p.published}
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
            placeholder={c.searchReviewsPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={c.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{c.allStatus}</SelectItem>
            <SelectItem value="published">{c.published}</SelectItem>
            <SelectItem value="pending">{c.pending}</SelectItem>
            <SelectItem value="hidden">{c.hidden}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder={c.rating} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{c.allRatings}</SelectItem>
            <SelectItem value="5">{c.stars.replace("{count}", "5")}</SelectItem>
            <SelectItem value="4">{c.stars.replace("{count}", "4")}</SelectItem>
            <SelectItem value="3">{c.stars.replace("{count}", "3")}</SelectItem>
            <SelectItem value="2">{c.stars.replace("{count}", "2")}</SelectItem>
            <SelectItem value="1">{p.oneStar}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Reviews Cards */}
      <div className="block sm:hidden space-y-4">
        {loadingReviews ? (
          <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">{p.loading}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold text-foreground">{p.noReviews}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.tryAdjustFilters}</p>
          </div>
        ) : (
          reviews.map((review) => {
            const config = statusConfig[review.status]
            const StatusIcon = config ? config.icon : MessageSquare
            
            return (
              <div key={review.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-foreground">{review.reviewer.full_name}</div>
                      <div className="text-sm text-muted-foreground">{review.reviewer.company_name}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedReview(review)
                          setShowViewDialog(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          {c.viewDetails}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {review.status !== "published" && (
                          <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "published")}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {c.approve}
                          </DropdownMenuItem>
                        )}
                        {review.status !== "hidden" && (
                          <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "hidden")}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            {c.hide}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteReviewId(review.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {c.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{p.tableSupplier}</span>
                      <span className="font-medium text-foreground">{review.supplier.company_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{p.tableRating}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{review.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{p.tableDate}</span>
                      <span className="font-medium text-foreground">{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    {review.title && <p className="font-medium text-foreground mb-1">{review.title}</p>}
                    <p className="text-muted-foreground line-clamp-3">{review.comment}</p>
                  </div>
                  
                  <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                    <Badge className={config ? config.color : "bg-gray-100 text-gray-700"}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config ? config.label : review.status}
                    </Badge>
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-primary text-sm font-medium"
                      onClick={() => {
                        setSelectedReview(review)
                        setShowViewDialog(true)
                      }}
                    >
                      {c.viewDetails}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {!loadingReviews && reviews.length > 0 && (
          <AdminPagination
            page={page}
            meta={meta}
            itemCount={reviews.length}
            onPageChange={setPage}
            variant="card"
            summaryText={p.showingReviews
              .replace("{from}", String((page - 1) * perPage + 1))
              .replace("{to}", String(Math.min(page * perPage, totalReviews)))
              .replace("{total}", String(totalReviews))}
          />
        )}
      </div>

      {/* Desktop Reviews Table */}
      <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{p.tableReviewer}</TableHead>
              <TableHead>{p.tableSupplier}</TableHead>
              <TableHead>{p.tableRating}</TableHead>
              <TableHead>{p.tableReview}</TableHead>
              <TableHead>{p.tableDate}</TableHead>
              <TableHead>{p.tableStatus}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingReviews ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>{p.loading}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-semibold text-foreground">{p.noReviews}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {c.tryAdjustFilters}
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
                            {c.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {review.status !== "published" && (
                            <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "published")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {c.approve}
                            </DropdownMenuItem>
                          )}
                          {review.status !== "hidden" && (
                            <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "hidden")}>
                              <EyeOff className="mr-2 h-4 w-4" />
                              {c.hide}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteReviewId(review.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {c.delete}
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

        {!loadingReviews && reviews.length > 0 && (
          <AdminPagination
            page={page}
            meta={meta}
            itemCount={reviews.length}
            onPageChange={setPage}
            variant="footer"
            summaryText={p.showingReviews
              .replace("{from}", String((page - 1) * perPage + 1))
              .replace("{to}", String(Math.min(page * perPage, totalReviews)))
              .replace("{total}", String(totalReviews))}
          />
        )}
      </div>

      {/* View Review Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <AdminDialogContent mobile="fullscreen" size="lg">
          <DialogHeader>
            <DialogTitle>{c.reviewDetails}</DialogTitle>
            <DialogDescription>
              {c.reviewNumber.replace("{id}", String(selectedReview?.id ?? ""))}
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{c.reviewer}</p>
                  <p className="font-medium">{selectedReview.reviewer.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReview.reviewer.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{c.supplier}</p>
                  <p className="font-medium">{selectedReview.supplier.company_name}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{c.rating}</p>
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
                  <p className="text-sm text-muted-foreground">{c.title}</p>
                  <p className="font-medium">{selectedReview.title}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">{p.reviewContent}</p>
                <p className="mt-1 text-foreground">{selectedReview.comment}</p>
              </div>

              {selectedReview.order && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium text-foreground">{c.orderInformation}</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{p.orderCategory}</p>
                      <p>{selectedReview.product?.category || c.na}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{c.orderValue}</p>
                      <p>
                        ${Number(selectedReview.order.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedReview.order.currency_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{c.orderDate}</p>
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
                  {p.submitted} {formatDate(selectedReview.created_at)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              {c.close}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{p.deleteReview}</AlertDialogTitle>
            <AlertDialogDescription>
              {p.deleteReviewPlatformDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReviewId && deleteReview(deleteReviewId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {c.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
