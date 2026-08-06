"use client"

import { Button } from "@/components/ui/button"

export interface ListPaginationLabels {
  previous?: string
  next?: string
  pageOf?: string
  perPage?: string
  showingResults?: string
}

interface ListPaginationProps {
  currentPage: number
  totalPages: number
  total: number
  from: number | null
  to: number | null
  perPage: number
  loading?: boolean
  onPageChange: (page: number) => void
  labels?: ListPaginationLabels
}

export function ListPagination({
  currentPage,
  totalPages,
  total,
  from,
  to,
  perPage,
  loading = false,
  onPageChange,
  labels,
}: ListPaginationProps) {
  if (total <= 0) return null

  return (
    <div className="mt-6 flex flex-col items-stretch gap-3 sm:mt-8">
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            disabled={currentPage === 1 || loading}
            onClick={() => onPageChange(currentPage - 1)}
          >
            {labels?.previous || "Previous"}
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true
              if (page === 1 || page === totalPages) return true
              return Math.abs(page - currentPage) <= 1
            })
            .map((page, index, visiblePages) => {
              const prevPage = visiblePages[index - 1]
              const showEllipsis = prevPage != null && page - prevPage > 1

              return (
                <span key={page} className="flex items-center gap-1.5">
                  {showEllipsis && (
                    <span className="px-1 text-sm text-muted-foreground">…</span>
                  )}
                  <Button
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    className="h-9 min-w-9 px-3"
                    disabled={loading}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Button>
                </span>
              )
            })}

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            disabled={currentPage === totalPages || loading}
            onClick={() => onPageChange(currentPage + 1)}
          >
            {labels?.next || "Next"}
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        {from != null && to != null && labels?.showingResults
          ? labels.showingResults
              .replace("{from}", String(from))
              .replace("{to}", String(to))
              .replace("{total}", total.toLocaleString())
          : labels?.pageOf
              ?.replace("{page}", String(currentPage))
              ?.replace("{lastPage}", String(totalPages)) ||
            `Page ${currentPage} of ${totalPages}`}
        {` · ${perPage} ${labels?.perPage || "per page"}`}
      </p>
    </div>
  )
}
