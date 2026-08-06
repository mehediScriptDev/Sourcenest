"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Flag,
  User,
  Clock,
  Loader2,
  Search,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import {
  fetchAdminSupplierReports,
  fetchAdminSupplierReport,
  updateAdminSupplierReport,
  type AdminSupplierReport,
} from "@/lib/api/admin-supplier-reports"
import type { SupplierReportStatus } from "@/lib/api/supplier-reports"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { queryKeys } from "@/lib/query-keys"

const REPORTS_PER_PAGE = 15

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-700",
}

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  investigating: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-700",
}

export default function AdminReportsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const p = t.admin.pages.reports
  const c = t.admin.common
  const rs = t.admin.reportStatus
  const queryClient = useQueryClient()

  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [viewingReport, setViewingReport] = useState<AdminSupplierReport | null>(null)
  const [viewingReportId, setViewingReportId] = useState<number | null>(null)

  const priorityLabels: Record<string, string> = {
    high: c.high,
    medium: c.medium,
    low: c.low,
  }

  const reportsQuery = useQuery({
    queryKey: queryKeys.adminSupplierReports(
      currentPage,
      statusFilter,
      priorityFilter,
      REPORTS_PER_PAGE
    ),
    queryFn: () =>
      fetchAdminSupplierReports({
        status: statusFilter === "all" ? undefined : statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        page: currentPage,
        per_page: REPORTS_PER_PAGE,
      }),
    placeholderData: (previousData) => previousData,
  })

  const reportDetailQuery = useQuery({
    queryKey: viewingReportId
      ? queryKeys.adminSupplierReportDetail(viewingReportId)
      : ["admin-supplier-report", "idle"],
    queryFn: () => fetchAdminSupplierReport(viewingReportId as number),
    enabled: viewingReportId !== null,
  })

  const updateReportMutation = useMutation({
    mutationFn: ({
      reportId,
      status,
    }: {
      reportId: number
      status: SupplierReportStatus
    }) => updateAdminSupplierReport(reportId, { status }),
  })

  const reports = reportsQuery.data?.data || []
  const loading = reportsQuery.isLoading
  const totalReports = reportsQuery.data?.meta?.total ?? reports.length
  const totalPages = reportsQuery.data?.meta?.last_page ?? 1
  const paginationFrom = reportsQuery.data?.meta?.from ?? null
  const paginationTo = reportsQuery.data?.meta?.to ?? null

  const reportsError = reportsQuery.error
  useEffect(() => {
    if (reportsError) {
      toast({
        title: c.error,
        description:
          reportsError instanceof Error ? reportsError.message : c.loadFailed,
        variant: "destructive",
      })
    }
  }, [c.error, c.loadFailed, reportsError, toast])

  const viewLoading = reportDetailQuery.isLoading
  useEffect(() => {
    if (reportDetailQuery.data?.data) {
      setViewingReport(reportDetailQuery.data.data)
    }
  }, [reportDetailQuery.data])

  const reportDetailError = reportDetailQuery.error
  useEffect(() => {
    if (reportDetailError && viewingReportId !== null) {
      toast({
        title: c.error,
        description:
          reportDetailError instanceof Error ? reportDetailError.message : c.loadFailed,
        variant: "destructive",
      })
      setViewingReport(null)
      setViewingReportId(null)
    }
  }, [c.error, c.loadFailed, reportDetailError, toast, viewingReportId])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value)
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openCount = reports.filter(
    (report) => report.status === "open" || report.status === "investigating"
  ).length

  const handleStatusUpdate = async (
    report: AdminSupplierReport,
    status: SupplierReportStatus
  ) => {
    try {
      setUpdatingId(report.id)
      const result = await updateReportMutation.mutateAsync({
        reportId: report.id,
        status,
      })

      toast({
        title: p.reportUpdated,
        description: result.message || p.reportUpdatedDesc,
      })

      if (viewingReport?.id === report.id) {
        setViewingReport(result.data)
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.adminSupplierReports(
          currentPage,
          statusFilter,
          priorityFilter,
          REPORTS_PER_PAGE
        ),
      })
    } catch (error) {
      toast({
        title: c.error,
        description: error instanceof Error ? error.message : c.actionFailed,
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const openViewReport = async (report: AdminSupplierReport) => {
    setViewingReport(report)
    setViewingReportId(report.id)
  }

  const getStatusLabel = (status: string, statusLabel?: string) => {
    if (statusLabel) return statusLabel
    if (status === "open") return rs.open
    if (status === "investigating") return rs.investigating
    if (status === "resolved") return rs.resolved
    if (status === "dismissed") return rs.dismissed
    return status
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          {p.title}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {p.subtitle}
          {openCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {c.openCount.replace("{count}", String(openCount))}
            </Badge>
          )}
        </p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={c.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{p.allStatus}</SelectItem>
            <SelectItem value="open">{rs.open}</SelectItem>
            <SelectItem value="investigating">{rs.investigating}</SelectItem>
            <SelectItem value="resolved">{rs.resolved}</SelectItem>
            <SelectItem value="dismissed">{rs.dismissed}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={c.priority} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{p.allPriority}</SelectItem>
            <SelectItem value="high">{c.high}</SelectItem>
            <SelectItem value="medium">{c.medium}</SelectItem>
            <SelectItem value="low">{c.low}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          {p.noReportsFound}
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <Flag className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{report.reason_label}</h3>
                      <Badge className={priorityColors[report.priority] || priorityColors.medium}>
                        {p.priorityTemplate.replace(
                          "{priority}",
                          priorityLabels[report.priority] ?? report.priority_label ?? report.priority
                        )}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {report.reason}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.target}{" "}
                      <span className="font-medium">
                        {report.target || report.supplier?.company_name || c.na}
                      </span>
                    </p>
                    {report.details && (
                      <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{report.details}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {report.reporter?.email || c.na}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {report.created_at || c.na}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Badge
                    className={statusColors[report.status] || statusColors.open}
                    variant="secondary"
                  >
                    {getStatusLabel(report.status, report.status_label)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openViewReport(report)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    {p.viewReport}
                  </Button>
                  {(report.status === "open" || report.status === "investigating") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === report.id}
                        onClick={() => handleStatusUpdate(report, "investigating")}
                      >
                        <Search className="mr-1 h-3 w-3" />
                        {c.investigate}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === report.id}
                        onClick={() => handleStatusUpdate(report, "dismissed")}
                      >
                        <X className="mr-1 h-3 w-3" />
                        {c.dismiss}
                      </Button>
                      <Button
                        size="sm"
                        disabled={updatingId === report.id}
                        onClick={() => handleStatusUpdate(report, "resolved")}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {c.resolve}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <AdminPagination
            page={currentPage}
            meta={{
              current_page: currentPage,
              last_page: totalPages,
              total: totalReports,
              from: paginationFrom,
              to: paginationTo,
              per_page: REPORTS_PER_PAGE,
            }}
            itemCount={reports.length}
            loading={loading}
            onPageChange={goToPage}
            showPerPage
            perPage={REPORTS_PER_PAGE}
            variant="card"
            className="mt-2"
          />
        </div>
      )}

      <Dialog
        open={viewingReport !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingReport(null)
            setViewingReportId(null)
          }
        }}
      >
        <AdminDialogContent variant="structured" mobile="fullscreen" size="lg" className="lg:max-w-3xl">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-4 text-left sm:px-6 sm:py-5">
            <DialogTitle className="font-serif font-medium text-xl sm:text-2xl">{p.reportDetailsTitle}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {viewLoading && !viewingReport ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewingReport ? (
              <div className="space-y-4 sm:space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusColors[viewingReport.status] || statusColors.open}>
                    {getStatusLabel(viewingReport.status, viewingReport.status_label)}
                  </Badge>
                  <Badge className={priorityColors[viewingReport.priority] || priorityColors.medium}>
                    {p.priorityTemplate.replace(
                      "{priority}",
                      priorityLabels[viewingReport.priority] ??
                        viewingReport.priority_label ??
                        viewingReport.priority
                    )}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {viewingReport.reason_label || viewingReport.reason}
                  </Badge>
                </div>

                <div className="grid min-w-0 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-muted-foreground">{c.target}</p>
                    <p className="wrap-break-word font-medium">
                      {viewingReport.target || viewingReport.supplier?.company_name || c.na}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground">{p.reportedBy}</p>
                    <p className="wrap-break-word font-medium">
                      {viewingReport.reporter?.name
                        ? `${viewingReport.reporter.name} (${viewingReport.reporter.email})`
                        : viewingReport.reporter?.email || c.na}
                    </p>
                  </div>
                  {viewingReport.supplier && (
                    <div className="min-w-0">
                      <p className="text-muted-foreground">{p.supplier}</p>
                      <p className="wrap-break-word font-medium">
                        {viewingReport.supplier.company_name || viewingReport.supplier.name || c.na}
                      </p>
                      <p className="wrap-break-word text-muted-foreground">
                        {viewingReport.supplier.email}
                      </p>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-muted-foreground">{c.created}</p>
                    <p className="font-medium">{viewingReport.created_at || c.na}</p>
                  </div>
                  {viewingReport.source_page && (
                    <div className="min-w-0 sm:col-span-2">
                      <p className="text-muted-foreground">{p.sourcePage}</p>
                      <p className="wrap-break-word font-medium">{viewingReport.source_page}</p>
                    </div>
                  )}
                </div>

                {viewingReport.details && (
                  <div className="rounded-xl border-2 border-amber-400/70 bg-amber-50 p-4 shadow-sm dark:border-amber-500/50 dark:bg-amber-950/30">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                      {p.reportMessage}
                    </p>
                    <p className="wrap-break-word whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground sm:text-base">
                      {viewingReport.details}
                    </p>
                  </div>
                )}

                {viewingReport.status_logs && viewingReport.status_logs.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">{p.statusHistory}</p>
                      <div className="space-y-2">
                        {viewingReport.status_logs.map((log) => (
                          <div
                            key={log.id}
                            className="rounded-lg border border-border bg-muted/40 p-3 text-sm"
                          >
                            <p className="font-medium">
                              {log.from_status_label
                                ? `${log.from_status_label} → ${log.to_status_label}`
                                : log.to_status_label}
                            </p>
                            {log.message && (
                              <p className="mt-1 wrap-break-word text-muted-foreground">{log.message}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {log.admin?.name || log.admin?.email || c.na} · {log.created_at || c.na}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {viewLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {c.loading}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {viewingReport &&
            (viewingReport.status === "open" || viewingReport.status === "investigating") && (
              <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={updatingId === viewingReport.id}
                    onClick={() => handleStatusUpdate(viewingReport, "investigating")}
                  >
                    <Search className="mr-1 h-3 w-3" />
                    {c.investigate}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={updatingId === viewingReport.id}
                    onClick={() => handleStatusUpdate(viewingReport, "dismissed")}
                  >
                    <X className="mr-1 h-3 w-3" />
                    {c.dismiss}
                  </Button>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={updatingId === viewingReport.id}
                    onClick={() => handleStatusUpdate(viewingReport, "resolved")}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {c.resolve}
                  </Button>
                </div>
              </div>
            )}
        </AdminDialogContent>
      </Dialog>
    </div>
  )
}
