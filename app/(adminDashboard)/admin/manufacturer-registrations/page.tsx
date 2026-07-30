"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import type { ManufacturerApplication, ManufacturerRegistrationResponse } from "@/lib/api/admin-manufacturer-registrations"
import { fetchManufacturerRegistrations, deleteManufacturer, approveManufacturer, rejectManufacturer, createManufacturerSupportTicket } from "@/lib/api/admin-manufacturer-registrations"
import { queryKeys } from "@/lib/query-keys"
import { ManufacturerApplicationDetailDialog } from "@/components/admin/manufacturer-application-detail-dialog"
import RequestReviewDialog from "@/components/admin/request-review-dialog"
import RequestAdditionalInfoDialog from "@/components/admin/request-additional-info-dialog"
import {
  Factory,
  Check,
  Trash2,
  Eye,
  Globe,
  MapPin,
  Mail,
  Building2,
  MoreVertical,
  FileQuestion,
  X,
  Loader2,
  ScanEye,
  HelpCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PER_PAGE = 10

function displayName(row: ManufacturerApplication) {
  const n = [row.first_name, row.last_name].filter(Boolean).join(" ").trim()
  return n || "—"
}

function displayCompany(row: ManufacturerApplication) {
  return row.company_name?.trim() || "—"
}

function isPending(row: ManufacturerApplication) {
  return (row.status || "pending") === "pending"
}

export default function ManufacturerRegistrationsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.mfgRegistrations
  const c = t.admin.common
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  
  const [viewOpen, setViewOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<ManufacturerApplication | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ManufacturerApplication | null>(null)
  const [messageTarget, setMessageTarget] = useState<ManufacturerApplication | null>(null)
  const [supportSubject, setSupportSubject] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const [supportDepartment, setSupportDepartment] = useState("account")
  const [supportPriority, setSupportPriority] = useState("medium")
  const [showSupportDialog, setShowSupportDialog] = useState(false)
  const [infoTarget, setInfoTarget] = useState<ManufacturerApplication | null>(null)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<ManufacturerApplication | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<ManufacturerApplication | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)

  const registrationsQueryKey = queryKeys.adminManufacturerRegistrations(currentPage, PER_PAGE)

  const registrationsQuery = useQuery({
    queryKey: registrationsQueryKey,
    queryFn: () => fetchManufacturerRegistrations(currentPage, "pending", PER_PAGE),
    placeholderData: (previousData) => previousData,
  })

  useEffect(() => {
    if (registrationsQuery.isError) {
      toast({
        title: c.error,
        description: p.loadFailed,
        variant: "destructive",
      })
    }
  }, [registrationsQuery.isError, toast, c.error, p.loadFailed])

  const approveMutation = useMutation({
    mutationFn: (id: string | number) => approveManufacturer(id),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string | number; reason: string }) =>
      rejectManufacturer(id, reason),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteManufacturer(id),
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

  const data = registrationsQuery.data ?? null
  const loading = registrationsQuery.isLoading
  const approvingId = approveMutation.isPending ? approveMutation.variables ?? null : null
  const rejectingId = rejectMutation.isPending ? rejectMutation.variables?.id ?? null : null
  const deletingId = deleteMutation.isPending ? deleteMutation.variables ?? null : null
  const creatingSupport = supportTicketMutation.isPending

  const patchRegistrationsCache = (
    updater: (rows: ManufacturerApplication[]) => ManufacturerApplication[]
  ) => {
    queryClient.setQueryData(registrationsQueryKey, (previous: ManufacturerRegistrationResponse | undefined) => {
      if (!previous) return previous
      const nextData = updater(previous.data)
      const removedCount = previous.data.length - nextData.length
      const nextMeta =
        previous.meta && removedCount > 0
          ? { ...previous.meta, total: Math.max((previous.meta.total ?? 0) - removedCount, 0) }
          : previous.meta
      return { ...previous, data: nextData, meta: nextMeta }
    })
  }

  const rows = [...(data?.data || [])].reverse()
  const meta = data?.meta

  const openView = (row: ManufacturerApplication) => {
    setViewTarget(row)
    setViewOpen(true)
  }

  const onApprove = async (row: ManufacturerApplication) => {
    if (!isPending(row)) {
      toast({
        title: c.alreadyProcessed,
        description: p.alreadyProcessed,
        variant: "destructive",
      })
      return
    }

    try {
      await approveMutation.mutateAsync(row.id)

      toast({
        title: c.success,
        description: c.approvedDesc.replace("{name}", displayName(row)),
      })

      patchRegistrationsCache((prev) => prev.filter((item) => item.id !== row.id))

      if (viewTarget?.id === row.id) {
        setViewOpen(false)
        setViewTarget(null)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : c.failedToApproveManufacturer
      toast({
        title: c.error,
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const openSupport = (row: ManufacturerApplication) => {
    setMessageTarget(row)
    const company = displayCompany(row)
    setSupportSubject(p.defaultSupportSubject.replace("{company}", company !== "—" ? company : displayName(row)))
    setSupportMessage("")
    setSupportDepartment("account")
    setSupportPriority("medium")
    setShowSupportDialog(true)
  }

  const submitSupportTicket = async () => {
    if (!messageTarget) return

    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast({
        title: c.missingReason,
        description: p.supportFieldsRequired,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await supportTicketMutation.mutateAsync({
        id: messageTarget.id,
        payload: {
          subject: supportSubject.trim(),
          message: supportMessage.trim(),
          department_type: supportDepartment,
          priority: supportPriority,
        },
      })

      toast({
        title: c.success,
        description: response.message || p.supportTicketCreated,
      })

      setShowSupportDialog(false)
      setMessageTarget(null)
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            p.supportTicketFailed
      toast({
        title: c.error,
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const openInfoRequest = (row: ManufacturerApplication) => {
    setInfoTarget(row)
    setShowInfoDialog(true)
  }

  const openReject = (row: ManufacturerApplication) => {
    setRejectTarget(row)
    setRejectReason("")
    setShowRejectDialog(true)
  }

  const submitReject = async () => {
    if (!rejectTarget) return

    if (!rejectReason.trim()) {
      toast({
        title: c.missingReason,
        description: c.rejectReasonRequired,
        variant: "destructive",
      })
      return
    }

    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id, reason: rejectReason })

      toast({
        title: c.success,
        description: c.companyRejected.replace("{company}", displayCompany(rejectTarget)),
      })

      setShowRejectDialog(false)
      const rejectedId = rejectTarget.id
      setRejectTarget(null)
      setRejectReason("")

      if (viewTarget?.id === rejectedId) {
        setViewOpen(false)
        setViewTarget(null)
      }

      patchRegistrationsCache((prev) => prev.filter((item) => item.id !== rejectedId))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : c.failedToRejectManufacturer
      toast({
        title: c.error,
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    
    try {
      const name = displayCompany(deleteTarget)
      const deletedId = deleteTarget.id

      await deleteMutation.mutateAsync(deletedId)
      
      toast({
        title: c.success,
        description: c.deletedSuccessfullyName.replace("{name}", name),
      })
      
      setDeleteTarget(null)
      if (viewTarget?.id === deletedId) {
        setViewOpen(false)
        setViewTarget(null)
      }
      
      patchRegistrationsCache((prev) => prev.filter((item) => item.id !== deletedId))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : c.failedToDeleteManufacturer
      toast({
        title: c.error,
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const ActionButtons = ({ row, layout = "row" }: { row: ManufacturerApplication; layout?: "row" | "stack" }) => {
    const pending = isPending(row)
    const isStack = layout === "stack"
    const wrap = isStack
      ? "flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap"
      : "flex items-center justify-end gap-1.5"

    const btnBaseClass = isStack 
      ? "h-10 px-4 gap-2.5 min-w-0 flex-1 sm:flex-none sm:min-w-24 text-sm font-medium" 
      : "h-8 w-8"

    if (isStack) {
      return (
        <div className={wrap}>
          <Button
            size="default"
            variant="default"
            className={btnBaseClass}
            disabled={!pending || approvingId === row.id}
            title={pending ? c.approveApplication : c.onlyPendingCanApprove}
            onClick={() => onApprove(row)}
          >
            {approvingId === row.id ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <span className="truncate">{c.approving}</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 shrink-0" />
                <span className="truncate">{c.approve}</span>
              </>
            )}
          </Button>
          <Button
            size="default"
            variant="destructive"
            className={btnBaseClass}
            disabled={deletingId === row.id}
            title={c.removeFromList}
            onClick={() => setDeleteTarget(row)}
          >
            {deletingId === row.id ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <span className="truncate">{c.deleting}</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{c.delete}</span>
              </>
            )}
          </Button>
          <Button
            size="default"
            variant="outline"
            className={btnBaseClass}
            title={c.viewFullApplication}
            onClick={() => openView(row)}
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span className="truncate">{c.view}</span>
          </Button>
        </div>
      )
    }

    return (
      <div className={wrap}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openView(row)}>
              <Eye className="mr-2 h-4 w-4" />
              {c.viewDetails}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openSupport(row)}>
              <HelpCircle className="mr-2 h-4 w-4" />
              {p.createSupport}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openInfoRequest(row)}>
              <FileQuestion className="mr-2 h-4 w-4" />
              {c.requestInfo}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setReviewTarget(row); setShowReviewDialog(true) }}>
              <ScanEye className="mr-2 h-4 w-4 text-secondary" />
              <span className="text-secondary font-medium">{p.requestReview}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {pending && (
              <DropdownMenuItem 
                onClick={() => onApprove(row)}
                disabled={approvingId === row.id}
              >
                <Check className="mr-2 h-4 w-4 text-emerald-600" />
                {approvingId === row.id ? c.approving : c.approve}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => openReject(row)}
              disabled={rejectingId === row.id}
            >
              <X className="mr-2 h-4 w-4 text-red-600" />
              {rejectingId === row.id ? c.rejecting : c.reject}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive" 
              onClick={() => setDeleteTarget(row)}
              disabled={deletingId === row.id}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deletingId === row.id ? c.deleting : c.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

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
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 font-medium text-foreground">{c.loading}</p>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Factory className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 font-medium text-foreground">{p.noPending}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {c.allReviewed}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop / tablet: horizontal scroll table */}
          <Card className="hidden sm:block lg:px-6">
            <div className="w-full overflow-x-auto overscroll-x-contain">
              <Table className="min-w-160 w-full table-fixed sm:min-w-180 lg:min-w-0 lg:table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[22%] min-w-35">{p.tableName}</TableHead>
                    <TableHead className="w-[24%] min-w-40">{p.tableEmail}</TableHead>
                    <TableHead className="w-[12%] whitespace-nowrap">{p.tableApplied}</TableHead>
                    <TableHead className="w-[10%]">{p.tableStatus}</TableHead>
                    <TableHead className="w-[22%] min-w-55 text-right">{p.tableActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={String(row.id)}>
                      <TableCell className="align-top">
                        <div className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="font-medium leading-snug">{displayName(row)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="flex items-start gap-1.5 break-all text-sm">
                          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {row.email}
                        </span>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap text-sm text-muted-foreground">
                        {row.created_at
                          ? (() => {
                              try {
                                return format(new Date(row.created_at), "MMM d, yyyy")
                              } catch {
                                return row.created_at
                              }
                            })()
                          : "—"}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="secondary" className="capitalize">
                          {row.manufacture_status_label || row.status || c.pending}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <ActionButtons row={row} layout="row" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <AdminPagination
              page={currentPage}
              meta={meta}
              itemCount={rows.length}
              onPageChange={setCurrentPage}
              variant="footer"
            />
          </Card>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {rows.map((row) => (
              <Card key={String(row.id)}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-foreground">
                        {displayName(row)}
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground break-all">
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {row.email}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {row.manufacture_status_label || row.status || c.pending}
                    </Badge>
                  </div>
                  {row.created_at && (
                    <p className="text-xs text-muted-foreground">
                      {c.applied}{" "}
                      {(() => {
                        try {
                          return format(new Date(row.created_at), "MMM d, yyyy")
                        } catch {
                          return row.created_at
                        }
                      })()}
                    </p>
                  )}
                  <ActionButtons row={row} layout="stack" />
                </CardContent>
              </Card>
            ))}
            <AdminPagination
              page={currentPage}
              meta={meta}
              itemCount={rows.length}
              onPageChange={setCurrentPage}
              variant="card"
            />
          </div>
        </>
      )}

      {viewTarget ? (
        <ManufacturerApplicationDetailDialog
          open={viewOpen}
          onOpenChange={(o) => {
            setViewOpen(o)
            if (!o) setViewTarget(null)
          }}
          application={viewTarget}
          manufacturerId={viewTarget.id}
        />
      ) : null}

      {/* Create Support Dialog */}
      <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{p.createSupport}</DialogTitle>
            <DialogDescription>
              {p.createSupportDescription}
            </DialogDescription>
          </DialogHeader>

          {messageTarget && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">{displayName(messageTarget)}</p>
              <p className="text-muted-foreground break-all">{messageTarget.email}</p>
              {displayCompany(messageTarget) !== "—" && (
                <p className="text-muted-foreground">{displayCompany(messageTarget)}</p>
              )}
              {(messageTarget.country || messageTarget.company?.country) && (
                <p className="text-muted-foreground">
                  {messageTarget.country || messageTarget.company?.country}
                </p>
              )}
              <Badge variant="secondary" className="capitalize">
                {messageTarget.manufacture_status_label || messageTarget.status || c.pending}
              </Badge>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-subject">{p.supportSubject}</Label>
              <Input
                id="support-subject"
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder={p.supportSubjectPlaceholder}
                disabled={creatingSupport}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{p.supportDepartment}</Label>
                <Select value={supportDepartment} onValueChange={setSupportDepartment} disabled={creatingSupport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">{p.departments.account}</SelectItem>
                    <SelectItem value="general">{p.departments.general}</SelectItem>
                    <SelectItem value="sales">{p.departments.sales}</SelectItem>
                    <SelectItem value="technical">{p.departments.technical}</SelectItem>
                    <SelectItem value="billing">{p.departments.billing}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{p.supportPriority}</Label>
                <Select value={supportPriority} onValueChange={setSupportPriority} disabled={creatingSupport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{p.priorities.low}</SelectItem>
                    <SelectItem value="medium">{p.priorities.medium}</SelectItem>
                    <SelectItem value="high">{p.priorities.high}</SelectItem>
                    <SelectItem value="urgent">{p.priorities.urgent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-message">{p.supportMessage}</Label>
              <Textarea
                id="support-message"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder={p.supportMessagePlaceholder}
                className="min-h-30"
                disabled={creatingSupport}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupportDialog(false)} disabled={creatingSupport}>
              {c.cancel}
            </Button>
            <Button onClick={submitSupportTicket} disabled={creatingSupport}>
              {creatingSupport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {p.creatingSupport}
                </>
              ) : (
                p.createSupportTicket
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RequestAdditionalInfoDialog
        open={showInfoDialog}
        onOpenChange={(open) => {
          setShowInfoDialog(open)
          if (!open) setInfoTarget(null)
        }}
        manufacturer={infoTarget}
      />

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.rejectApplication}</DialogTitle>
            <DialogDescription>
              {c.rejectApplicationFor.replace("{target}", rejectTarget ? displayCompany(rejectTarget) : c.na)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>{c.reasonForRejectionRequired}</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={c.rejectExplanationPlaceholder}
              className="mt-2 min-h-25"
              disabled={rejectingId === rejectTarget?.id}
              required
            />
            {!rejectReason.trim() && (
              <p className="text-xs text-amber-600">{p.reasonRequired}</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRejectDialog(false)}
              disabled={rejectingId === rejectTarget?.id}
            >
              {c.cancel}
            </Button>
            <Button 
              variant="destructive" 
              onClick={submitReject}
              disabled={rejectingId === rejectTarget?.id || !rejectReason.trim()}
            >
              {rejectingId === rejectTarget?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {c.rejecting}
                </>
              ) : (
                c.reject
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{p.deleteApplication}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? c.deleteApplicationConfirmText.replace("{name}", displayCompany(deleteTarget))
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="mt-0" disabled={deletingId !== null}>
              {c.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete()}
              disabled={deletingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingId === deleteTarget?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {c.deleting}
                </>
              ) : (
                c.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Review Dialog */}
      {reviewTarget && (
        <RequestReviewDialog
          open={showReviewDialog}
          onOpenChange={(o) => {
            setShowReviewDialog(o)
            if (!o) setReviewTarget(null)
          }}
          manufacturer={reviewTarget}
        />
      )}
    </div>
  )
}


