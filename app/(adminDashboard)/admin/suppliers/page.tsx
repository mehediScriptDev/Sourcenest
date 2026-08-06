"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  fetchSuppliers,
  deleteManufacturer,
  rejectManufacturer,
  createManufacturerSupportTicket,
} from "@/lib/api/admin-manufacturer-registrations"
import type {
  ManufacturerApplication,
  ManufacturerRegistrationResponse,
  PaginationMeta,
} from "@/lib/api/admin-manufacturer-registrations"
import {
  Search,
  Factory,
  MoreVertical,
  X,
  Eye,
  HelpCircle,
  AlertTriangle,
  Trash2,
  Mail,
  FileQuestion,
  Loader2,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { AdminPagination } from "@/components/admin/admin-pagination"
import RequestAdditionalInfoDialog from "@/components/admin/request-additional-info-dialog"
import { queryKeys } from "@/lib/query-keys"

interface VerificationDocuments {
  businessLicense?: { name: string; uploadedAt: string }
  website?: string
  city: string
  country: string
  factoryPhotos?: { name: string }[]
  additionalNotes?: string
}

interface Supplier extends ManufacturerApplication {
  verification?: string
  submittedAt?: string
  verificationDocs?: VerificationDocuments
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  active: "bg-emerald-100 text-emerald-700",
  deactivated: "bg-slate-100 text-slate-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
  needs_info: "bg-blue-100 text-blue-700",
}

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  pending: "secondary",
  approved: "default",
  active: "default",
  deactivated: "outline",
  rejected: "destructive",
  suspended: "destructive",
  needs_info: "outline",
}

const PER_PAGE = 10

export default function AdminSuppliersPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.suppliers
  const support = t.admin.pages.mfgRegistrations
  const c = t.admin.common
  const supplierStatus = t.admin.supplierStatus
  const queryClient = useQueryClient()

  const getStatusConfig = (statusKey: string) => {
    const key = statusKey as keyof typeof supplierStatus
    return {
      label: supplierStatus[key] ?? supplierStatus.draft,
      variant: statusVariants[statusKey] ?? "outline",
      color: statusColors[statusKey] ?? statusColors.draft,
    }
  }
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSuppliers, setSelectedSuppliers] = useState<(string | number)[]>([])
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showSupportDialog, setShowSupportDialog] = useState(false)
  const [supportTarget, setSupportTarget] = useState<Supplier | null>(null)
  const [supportSubject, setSupportSubject] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const [supportDepartment, setSupportDepartment] = useState("account")
  const [supportPriority, setSupportPriority] = useState("medium")
  const [currentPage, setCurrentPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter])

  const suppliersQueryKey = queryKeys.adminSuppliers(
    currentPage,
    PER_PAGE,
    statusFilter,
    debouncedSearch
  )

  const suppliersQuery = useQuery({
    queryKey: suppliersQueryKey,
    queryFn: async () => {
      const response = await fetchSuppliers(currentPage, PER_PAGE, {
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      })
      return {
        ...response,
        data: response.data.filter(
          (row) => (row.manufacture_status || row.status) !== "pending"
        ) as Supplier[],
      }
    },
    placeholderData: (previousData) => previousData,
  })

  useEffect(() => {
    if (suppliersQuery.isError) {
      toast({
        title: c.error,
        description: p.loadFailed,
        variant: "destructive",
      })
    }
  }, [suppliersQuery.isError, toast, c.error, p.loadFailed])

  const deleteMutation = useMutation({
    mutationFn: (supplierId: string | number) => deleteManufacturer(supplierId),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string | number; reason: string }) =>
      rejectManufacturer(id, reason),
  })

  const supportTicketMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number
      payload: {
        subject: string
        message: string
        department_type: string
        priority: string
      }
    }) => createManufacturerSupportTicket(id, payload),
  })

  const suppliers = suppliersQuery.data?.data ?? []
  const meta = suppliersQuery.data?.meta ?? null
  const loading = suppliersQuery.isLoading
  const deleting = deleteMutation.isPending ? deleteMutation.variables ?? null : null
  const rejecting = rejectMutation.isPending
  const creatingSupport = supportTicketMutation.isPending

  const filteredSuppliers = suppliers

  const allSelected =
    filteredSuppliers.length > 0 && selectedSuppliers.length === filteredSuppliers.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedSuppliers([])
    } else {
      setSelectedSuppliers(filteredSuppliers.map((s) => s.id))
    }
  }

  const toggleSelect = (id: string | number) => {
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const patchSuppliersCache = (updater: (data: Supplier[]) => Supplier[]) => {
    queryClient.setQueryData(suppliersQueryKey, (previous: ManufacturerRegistrationResponse | undefined) => {
      if (!previous) return previous
      const nextData = updater(previous.data as Supplier[])
      const nextMeta = previous.meta
        ? { ...previous.meta, total: Math.max((previous.meta.total ?? 0) - (previous.data.length - nextData.length), 0) }
        : previous.meta
      return { ...previous, data: nextData, meta: nextMeta }
    })
  }

  const deleteSupplier = async (supplierId: string | number) => {
    try {
      await deleteMutation.mutateAsync(supplierId)
      patchSuppliersCache((prev) => prev.filter((s) => s.id !== supplierId))
      setSelectedSuppliers((prev) => prev.filter((x) => x !== supplierId))

      toast({
        title: c.success,
        description: p.deleteSuccess,
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : p.deleteFailed
      toast({
        title: c.error,
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const bulkDelete = async () => {
    for (const id of selectedSuppliers) {
      await deleteSupplier(id)
    }
    setSelectedSuppliers([])
  }

  const openReview = (supplier: Supplier) => {
    setCurrentSupplier(supplier)
    setShowReviewDialog(true)
  }

  const openInfoRequest = (supplier: Supplier) => {
    setCurrentSupplier(supplier)
    setShowInfoDialog(true)
  }

  const openReject = (supplier: Supplier) => {
    setCurrentSupplier(supplier)
    setRejectReason("")
    setShowRejectDialog(true)
  }

  const supplierDisplayName = (supplier: Supplier) =>
    [supplier.first_name, supplier.last_name].filter(Boolean).join(" ").trim() || "—"

  const supplierCompanyName = (supplier: Supplier) =>
    supplier.company_name?.trim() || supplier.company?.company_name?.trim() || "—"

  const openSupport = (supplier: Supplier) => {
    setSupportTarget(supplier)
    const company = supplierCompanyName(supplier)
    setSupportSubject(
      support.defaultSupportSubject.replace(
        "{company}",
        company !== "—" ? company : supplierDisplayName(supplier)
      )
    )
    setSupportMessage("")
    setSupportDepartment("account")
    setSupportPriority("medium")
    setShowSupportDialog(true)
  }

  const submitSupportTicket = async () => {
    if (!supportTarget) return

    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast({
        title: support.missingReason,
        description: support.supportFieldsRequired,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await supportTicketMutation.mutateAsync({
        id: supportTarget.id,
        payload: {
          subject: supportSubject.trim(),
          message: supportMessage.trim(),
          department_type: supportDepartment,
          priority: supportPriority,
        },
      })

      toast({
        title: c.success,
        description: response.message || support.supportTicketCreated,
      })

      setShowSupportDialog(false)
      setSupportTarget(null)
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            support.supportTicketFailed
      toast({
        title: c.error,
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const submitRejection = async () => {
    if (!currentSupplier) return
    if (!rejectReason.trim()) {
      toast({
        title: c.error,
        description: c.rejectReasonRequired,
        variant: "destructive",
      })
      return
    }

    try {
      await rejectMutation.mutateAsync({ id: currentSupplier.id, reason: rejectReason })
      patchSuppliersCache((prev) => prev.filter((s) => s.id !== currentSupplier.id))
      setShowRejectDialog(false)
      toast({
        title: c.success,
        description: p.rejectSuccess,
      })
    } catch (error: unknown) {
      toast({
        title: c.error,
        description: error instanceof Error ? error.message : p.rejectFailed,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
          <p className="mt-1 text-muted-foreground">{p.subtitle}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={c.searchSuppliers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={c.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{c.allStatus}</SelectItem>
              <SelectItem value="draft">{supplierStatus.draft}</SelectItem>
              <SelectItem value="approved">{supplierStatus.approved}</SelectItem>
              <SelectItem value="active">{supplierStatus.active}</SelectItem>
              <SelectItem value="deactivated">{supplierStatus.deactivated}</SelectItem>
              <SelectItem value="rejected">{supplierStatus.rejected}</SelectItem>
              <SelectItem value="suspended">{supplierStatus.suspended}</SelectItem>
              <SelectItem value="needs_info">{supplierStatus.needs_info}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSuppliers.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <span className="text-sm font-medium">
            {c.selectedCount.replace("{count}", String(selectedSuppliers.length))}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={deleting !== null}>
              <Trash2 className="mr-1 h-3 w-3" />
              {c.delete}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSelectedSuppliers([])}>
            {c.clear}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{p.loading}</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <Factory className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">{p.noSuppliers}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {/* Header Row */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              <div className="flex-1">{p.tableSupplier}</div>
              <div className="w-32">{c.status}</div>
              <div className="w-24">{c.rating}</div>
              <div className="w-32">{c.actions}</div>
            </div>

            {filteredSuppliers.map((supplier) => {
              const displayName =
                [supplier.first_name, supplier.last_name].filter(Boolean).join(" ") || "—"
              const displayCompany =
                supplier.company_name || supplier.company?.company_name || "—"
              const statusKey = (supplier.manufacture_status || supplier.status || "draft").toLowerCase()
              const config = getStatusConfig(statusKey)

              return (
                <div key={supplier.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <Checkbox
                      checked={selectedSuppliers.includes(supplier.id)}
                      onCheckedChange={() => toggleSelect(supplier.id)}
                    />
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <Factory className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{displayName}</h3>
                        <p className="text-sm text-muted-foreground">{displayCompany}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-32 shrink-0">
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>

                    <div className="w-24 shrink-0 text-sm text-muted-foreground">{c.na}</div>

                    <div className="flex items-center gap-2 w-32 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openReview(supplier)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {c.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSupport(supplier)} disabled={creatingSupport}>
                            <HelpCircle className="mr-2 h-4 w-4" />
                            {creatingSupport ? support.creatingSupport : support.createSupport}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openInfoRequest(supplier)}>
                            <FileQuestion className="mr-2 h-4 w-4 text-blue-600" />
                            {p.requestInfo}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openReject(supplier)}>
                            <X className="mr-2 h-4 w-4 text-red-600" />
                            {c.reject}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => void deleteSupplier(supplier.id)}
                            disabled={deleting === supplier.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleting === supplier.id ? c.deleting : c.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <AdminPagination
            page={currentPage}
            meta={meta as PaginationMeta | null}
            itemCount={filteredSuppliers.length}
            onPageChange={setCurrentPage}
            variant="card"
          />
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <AdminDialogContent mobile="fullscreen" size="xl">
          <DialogHeader>
            <DialogTitle>{p.supplierDetails}</DialogTitle>
            <DialogDescription>{p.supplierDetailsDesc}</DialogDescription>
          </DialogHeader>
          {currentSupplier && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                  <Factory className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {[currentSupplier.first_name, currentSupplier.last_name].filter(Boolean).join(" ")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentSupplier.company_name || currentSupplier.company?.company_name}
                  </p>
                </div>
                <Badge
                  className={
                    getStatusConfig(
                      (currentSupplier.manufacture_status || currentSupplier.status)?.toLowerCase() ||
                        "draft"
                    ).color
                  }
                >
                  {
                    getStatusConfig(
                      (currentSupplier.manufacture_status || currentSupplier.status)?.toLowerCase() ||
                        "draft"
                    ).label
                  }
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{c.emailColon}</span>
                  <p className="font-medium">{currentSupplier.email}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              {c.close}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      <RequestAdditionalInfoDialog
        open={showInfoDialog}
        onOpenChange={(open) => {
          setShowInfoDialog(open)
          if (!open) setCurrentSupplier(null)
        }}
        manufacturer={currentSupplier}
      />

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AdminDialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {p.rejectSupplier}
            </DialogTitle>
            <DialogDescription>{p.rejectSupplierDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{p.reasonForRejection}</Label>
              <Textarea
                placeholder={c.rejectPlaceholder}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={rejecting}>
              {c.cancel}
            </Button>
            <Button variant="destructive" onClick={() => void submitRejection()} disabled={rejecting}>
              {rejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {c.rejecting}
                </>
              ) : (
                p.rejectSupplierButton
              )}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Create Support Dialog */}
      <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <AdminDialogContent size="md">
          <DialogHeader>
            <DialogTitle>{support.createSupport}</DialogTitle>
            <DialogDescription>{support.createSupportDescription}</DialogDescription>
          </DialogHeader>

          {supportTarget && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">{supplierDisplayName(supportTarget)}</p>
              <p className="text-muted-foreground break-all">{supportTarget.email}</p>
              {supplierCompanyName(supportTarget) !== "—" && (
                <p className="text-muted-foreground">{supplierCompanyName(supportTarget)}</p>
              )}
              {(supportTarget.country || supportTarget.company?.country) && (
                <p className="text-muted-foreground">
                  {supportTarget.country || supportTarget.company?.country}
                </p>
              )}
              <Badge
                className={
                  getStatusConfig(
                    (supportTarget.manufacture_status || supportTarget.status || "draft").toLowerCase()
                  ).color
                }
              >
                {
                  getStatusConfig(
                    (supportTarget.manufacture_status || supportTarget.status || "draft").toLowerCase()
                  ).label
                }
              </Badge>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-support-subject">{support.supportSubject}</Label>
              <Input
                id="supplier-support-subject"
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder={support.supportSubjectPlaceholder}
                disabled={creatingSupport}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{support.supportDepartment}</Label>
                <Select
                  value={supportDepartment}
                  onValueChange={setSupportDepartment}
                  disabled={creatingSupport}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">{support.departments.account}</SelectItem>
                    <SelectItem value="general">{support.departments.general}</SelectItem>
                    <SelectItem value="sales">{support.departments.sales}</SelectItem>
                    <SelectItem value="technical">{support.departments.technical}</SelectItem>
                    <SelectItem value="billing">{support.departments.billing}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{support.supportPriority}</Label>
                <Select
                  value={supportPriority}
                  onValueChange={setSupportPriority}
                  disabled={creatingSupport}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{support.priorities.low}</SelectItem>
                    <SelectItem value="medium">{support.priorities.medium}</SelectItem>
                    <SelectItem value="high">{support.priorities.high}</SelectItem>
                    <SelectItem value="urgent">{support.priorities.urgent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-support-message">{support.supportMessage}</Label>
              <Textarea
                id="supplier-support-message"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder={support.supportMessagePlaceholder}
                className="min-h-30"
                disabled={creatingSupport}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupportDialog(false)} disabled={creatingSupport}>
              {c.cancel}
            </Button>
            <Button onClick={() => void submitSupportTicket()} disabled={creatingSupport}>
              {creatingSupport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {support.creatingSupport}
                </>
              ) : (
                support.createSupportTicket
              )}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  )
}
