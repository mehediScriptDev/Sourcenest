"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  ScanEye,
  Shield,
  Clock,
  Eye,
  Loader2,
  Building2,
  Filter,
  Search,
} from "lucide-react"
import type { AdditionalInformationRequest } from "@/lib/api/manufacturer-additional-information"
import {
  fetchAllManufacturerAdditionalInformationRequests,
  type AdditionalInformationRequestStatus,
} from "@/lib/api/admin-manufacturer-additional-information"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"
import AdditionalInformationReviewPanel, {
  VerificationRequestStatusBadge,
} from "@/components/admin/additional-information-review-panel"

const PER_PAGE = 10

export default function ReviewManagementPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.reviewManagement
  const c = t.admin.common
  const rs = t.admin.reviewStatus
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<AdditionalInformationRequestStatus>("open")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [selectedRequest, setSelectedRequest] = useState<AdditionalInformationRequest | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter])

  const requestsQueryKey = queryKeys.adminReviewManagement(
    currentPage,
    PER_PAGE,
    statusFilter,
    debouncedSearch
  )

  const requestsQuery = useQuery({
    queryKey: requestsQueryKey,
    queryFn: () =>
      fetchAllManufacturerAdditionalInformationRequests(currentPage, PER_PAGE, {
        status: statusFilter === "open" ? "open" : statusFilter,
        unverifiedOnly: false,
        search: debouncedSearch || undefined,
      }),
    placeholderData: (previousData) => previousData,
  })

  useEffect(() => {
    if (requestsQuery.isError) {
      toast({
        title: c.error,
        description: p.loadFailed,
        variant: "destructive",
      })
    }
  }, [requestsQuery.isError, toast, c.error, p.loadFailed])

  const requests = requestsQuery.data?.data ?? []
  const loading = requestsQuery.isLoading
  const meta = requestsQuery.data?.meta ?? null

  const openPanel = (request: AdditionalInformationRequest) => {
    setSelectedRequest(request)
    setPanelOpen(true)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    try {
      return format(new Date(dateStr), "MMM d, yyyy")
    } catch {
      return dateStr
    }
  }

  const manufacturerLabel = (request: AdditionalInformationRequest) =>
    request.manufacturer?.company_name ||
    request.manufacturer?.name ||
    request.manufacturer?.email ||
    "—"

  const statusOptions: { value: AdditionalInformationRequestStatus; label: string }[] = [
    { value: "open", label: p.filterOpen },
    { value: "pending", label: rs.pending },
    { value: "submitted", label: rs.submitted },
    { value: "accepted", label: rs.accepted },
    { value: "rejected", label: rs.rejected },
    { value: "expired", label: rs.expired },
    { value: "all", label: c.allStatuses },
  ]

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            {p.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">
            {p.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={p.searchPlaceholder}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as AdditionalInformationRequestStatus)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={p.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 font-medium text-foreground">{c.loading}</p>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ScanEye className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 font-medium text-foreground">{p.noRequests}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {debouncedSearch
                ? p.noSearchResults
                : statusFilter !== "open" && statusFilter !== "all"
                  ? p.noReviewsWithStatus.replace(
                      "{status}",
                      rs[statusFilter as keyof typeof rs] || statusFilter
                    )
                  : p.noOpenRequests}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden sm:block lg:px-6">
            <div className="w-full overflow-x-auto overscroll-x-contain">
              <Table className="min-w-[760px] w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%]">{p.tableManufacturer}</TableHead>
                    <TableHead className="w-[18%]">{p.tableRequestTypes}</TableHead>
                    <TableHead className="w-[14%]">{p.tableReference}</TableHead>
                    <TableHead className="w-[10%]">{p.tableStatus}</TableHead>
                    <TableHead className="w-[12%]">{p.tableRequested}</TableHead>
                    <TableHead className="w-[12%]">{p.tableSubmitted}</TableHead>
                    <TableHead className="w-[8%] text-right">{p.tableActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={String(request.id)} className="group">
                      <TableCell className="align-top">
                        <div className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm leading-snug">
                              {manufacturerLabel(request)}
                            </p>
                            {request.manufacturer?.email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {request.manufacturer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-1">
                          {request.allowed_type_labels.slice(0, 2).map((label) => (
                            <Badge key={label} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                          {request.allowed_type_labels.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{request.allowed_type_labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-secondary" />
                          <span className="font-mono text-sm font-bold text-secondary">
                            {request.reference_id ||
                              `SN-MFR-${String(request.id).padStart(6, "0")}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <VerificationRequestStatusBadge
                          status={request.status}
                          label={request.status_label}
                        />
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(request.submitted_at)}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openPanel(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <AdminPagination
              page={currentPage}
              meta={meta}
              itemCount={requests.length}
              onPageChange={setCurrentPage}
              variant="footer"
            />
          </Card>

          <div className="flex flex-col gap-3 sm:hidden">
            {requests.map((request) => (
              <Card key={String(request.id)}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm leading-snug">
                        {manufacturerLabel(request)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {request.allowed_type_labels.join(", ")}
                      </p>
                    </div>
                    <VerificationRequestStatusBadge
                      status={request.status}
                      label={request.status_label}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-md bg-secondary/5 border border-secondary/10 px-2 py-1">
                      <Shield className="h-3 w-3 text-secondary" />
                      <span className="font-mono text-xs font-bold text-secondary">
                        {request.reference_id ||
                          `SN-MFR-${String(request.id).padStart(6, "0")}`}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="mr-0.5 inline h-3 w-3" />
                      {formatDate(request.created_at)}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => openPanel(request)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {c.viewDetails}
                  </Button>
                </CardContent>
              </Card>
            ))}
            <AdminPagination
              page={currentPage}
              meta={meta}
              itemCount={requests.length}
              onPageChange={setCurrentPage}
              variant="card"
            />
          </div>
        </>
      )}

      {selectedRequest && (
        <AdditionalInformationReviewPanel
          open={panelOpen}
          onOpenChange={(open) => {
            setPanelOpen(open)
            if (!open) setSelectedRequest(null)
          }}
          request={selectedRequest}
          onReviewComplete={() => {
            void queryClient.invalidateQueries({ queryKey: requestsQueryKey })
          }}
        />
      )}
    </div>
  )
}
