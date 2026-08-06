"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export interface AdminPaginationMeta {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  from?: number | null
  to?: number | null
  currentPage?: number
  lastPage?: number
  perPage?: number
}

interface AdminPaginationProps {
  page: number
  meta?: AdminPaginationMeta | null
  itemCount?: number
  onPageChange: (page: number) => void
  className?: string
  showSummary?: boolean
  summaryText?: string
  pageLabel?: string
  perPage?: number
  showPerPage?: boolean
  loading?: boolean
  hideWhenSinglePage?: boolean
  align?: "between" | "center"
  variant?: "default" | "footer" | "card"
}

function resolveMeta(
  meta: AdminPaginationMeta | null | undefined,
  page: number,
  itemCount: number,
) {
  const currentPage = meta?.current_page ?? meta?.currentPage ?? page
  const lastPage = meta?.last_page ?? meta?.lastPage ?? 1
  const from = meta?.from ?? (itemCount > 0 ? 1 : 0)
  const to = meta?.to ?? itemCount
  const total = meta?.total ?? itemCount

  return { currentPage, lastPage, from, to, total }
}

function getVisiblePages(currentPage: number, lastPage: number): number[] {
  return Array.from({ length: lastPage }, (_, index) => index + 1).filter((page) => {
    if (lastPage <= 7) return true
    if (page === 1 || page === lastPage) return true
    return Math.abs(page - currentPage) <= 1
  })
}

const variantClasses: Record<NonNullable<AdminPaginationProps["variant"]>, string> = {
  default: "",
  footer: "border-t border-border bg-muted/20 px-4 py-3",
  card: "rounded-xl border border-border bg-card px-4 py-3",
}

export function AdminPagination({
  page,
  meta,
  itemCount = 0,
  onPageChange,
  className,
  showSummary = true,
  summaryText,
  pageLabel,
  perPage,
  showPerPage = false,
  loading = false,
  hideWhenSinglePage = false,
  align = "between",
  variant = "default",
}: AdminPaginationProps) {
  const { t } = useTranslation()
  const c = t.admin.common
  const { currentPage, lastPage, from, to, total } = resolveMeta(meta, page, itemCount)
  const visiblePages = useMemo(
    () => getVisiblePages(currentPage, lastPage),
    [currentPage, lastPage],
  )

  if (lastPage <= 1 && total === 0) {
    return null
  }

  if (hideWhenSinglePage && lastPage <= 1) {
    return null
  }

  const defaultSummary = c.showing
    .replace("{from}", String(from ?? 0))
    .replace("{to}", String(to ?? 0))
    .replace("{total}", String(total))

  const defaultPageLabel = c.pageOf
    .replace("{page}", String(currentPage))
    .replace("{lastPage}", String(lastPage))

  const resolvedSummary = summaryText ?? defaultSummary
  const resolvedPageLabel = pageLabel ?? defaultPageLabel
  const isPrevDisabled = currentPage <= 1 || loading
  const isNextDisabled = currentPage >= lastPage || loading

  return (
    <div className={cn(variantClasses[variant], className)}>
      <div
        className={cn(
          "flex flex-col gap-3",
          align === "center"
            ? "items-center"
            : "sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        {showSummary && (
          <div
            className={cn(
              "text-sm text-muted-foreground",
              align === "between" && "order-last text-center sm:order-first sm:text-left",
            )}
          >
            {resolvedSummary}
            {showPerPage && perPage
              ? ` · ${perPage} ${c.perPage}`
              : null}
          </div>
        )}

        <nav
          aria-label={c.pageOf
            .replace("{page}", String(currentPage))
            .replace("{lastPage}", String(lastPage))}
          className={cn(
            "flex flex-wrap items-center justify-center gap-1.5",
            align === "between" && "sm:justify-end",
          )}
        >
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1 px-2.5 sm:px-3"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={isPrevDisabled}
            aria-label={c.previous}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{c.previous}</span>
          </Button>

          <span className="px-1 text-sm font-medium text-muted-foreground md:hidden">
            {resolvedPageLabel}
          </span>

          <div className="hidden items-center gap-1 md:flex">
            {visiblePages.map((visiblePage, index) => {
              const previousPage = visiblePages[index - 1]
              const showEllipsis = previousPage != null && visiblePage - previousPage > 1

              return (
                <span key={visiblePage} className="flex items-center gap-1">
                  {showEllipsis && (
                    <span className="px-1 text-sm text-muted-foreground">…</span>
                  )}
                  <Button
                    size="sm"
                    variant={visiblePage === currentPage ? "default" : "outline"}
                    className="h-9 min-w-9 px-3"
                    onClick={() => onPageChange(visiblePage)}
                    disabled={loading}
                    aria-current={visiblePage === currentPage ? "page" : undefined}
                  >
                    {visiblePage}
                  </Button>
                </span>
              )
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1 px-2.5 sm:px-3"
            onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
            disabled={isNextDisabled}
            aria-label={c.next}
          >
            <span className="hidden sm:inline">{c.next}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </div>
  )
}
