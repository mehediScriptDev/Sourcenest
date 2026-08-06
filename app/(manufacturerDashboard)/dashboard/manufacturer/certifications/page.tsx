"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Award,
  Upload,
  Trash2,
  Eye,
  MoreVertical,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { AddCertificationModal } from "@/components/manufacturers/add-certification-modal"
import { EditCertificationModal } from "@/components/manufacturers/edit-certification-modal"
import {
  fetchCertifications,
  deleteCertificate,
  Certificate,
} from "@/lib/api/manufacturer-certificates"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "@/lib/i18n"

const PER_PAGE = 10

const statusColors: Record<string, { color: string; icon: typeof CheckCircle }> = {
  valid: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  expiring: { color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  expired: { color: "bg-red-100 text-red-700", icon: AlertTriangle },
}

function calculateCertStatus(expiryDate: string): "valid" | "expiring" | "expired" {
  const today = new Date()
  const expiry = new Date(expiryDate)
  
  if (expiry < today) {
    return "expired"
  }
  
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
  
  if (expiry <= ninetyDaysFromNow) {
    return "expiring"
  }
  
  return "valid"
}

export default function ManufacturerCertificationsPage() {
  const { t } = useTranslation()
  const c = t.mfg.certifications
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const statusLabels: Record<string, string> = {
    valid: c.valid,
    expiring: c.expiringSoon,
    expired: c.expired,
  }
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCert, setEditingCert] = useState<Certificate | null>(null)
  const [deletingCertId, setDeletingCertId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const certsQueryKey = queryKeys.manufacturerCertifications(page)

  const certsQuery = useQuery({
    queryKey: certsQueryKey,
    queryFn: () => fetchCertifications(page, PER_PAGE),
    placeholderData: (previousData) => previousData,
  })

  const deleteCertMutation = useMutation({
    mutationFn: (id: number) => deleteCertificate(id),
  })

  const certs = certsQuery.data?.data ?? []
  const currentPage = certsQuery.data?.meta.current_page ?? page
  const lastPage = certsQuery.data?.meta.last_page ?? 1
  const total = certsQuery.data?.meta.total ?? 0
  const isLoading = certsQuery.isLoading && !certsQuery.data

  useEffect(() => {
    if (certsQuery.isError) {
      const error = certsQuery.error
      toast({
        variant: "destructive",
        title: t.common.error || "Error",
        description: error instanceof Error ? error.message : c.loadError,
      })
    }
  }, [certsQuery.isError, certsQuery.error, c.loadError, t.common.error, toast])

  const invalidateCerts = (targetPage = page) => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.manufacturerCertifications(targetPage),
    })
  }

  const handleCertificateAdded = () => {
    setPage(1)
    invalidateCerts(1)
  }

  const handleCertificateUpdated = (updated: Certificate) => {
    queryClient.setQueryData(certsQueryKey, (previous) => {
      if (!previous) return previous
      return {
        ...previous,
        data: previous.data.map((cert) => (cert.id === updated.id ? updated : cert)),
      }
    })
  }

  const handleDeleteCert = async (id: number) => {
    try {
      await deleteCertMutation.mutateAsync(id)
      toast({ title: c.deleted, description: c.deleteSuccess })
      const targetPage = certs.length === 1 && page > 1 ? page - 1 : page
      if (targetPage !== page) {
        setPage(targetPage)
      } else {
        invalidateCerts(targetPage)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.common.error || "Error",
        description: error instanceof Error ? error.message : c.deleteError,
      })
    } finally {
      setDeletingCertId(null)
    }
  }

  const validCount = certs.filter(
    (c) => calculateCertStatus(c.expiry_date) === "valid"
  ).length
  const expiringCount = certs.filter(
    (c) => calculateCertStatus(c.expiry_date) === "expiring"
  ).length
  const expiredCount = certs.filter(
    (c) => calculateCertStatus(c.expiry_date) === "expired"
  ).length

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{c.title}</h1>
          <p className="mt-1 text-muted-foreground">{c.subtitle}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {c.addCertification}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{c.loading}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <CheckCircle className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{validCount}</p>
                    <p className="text-sm text-muted-foreground">{c.validCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{expiringCount}</p>
                    <p className="text-sm text-muted-foreground">{c.expiringSoon}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{expiredCount}</p>
                    <p className="text-sm text-muted-foreground">{c.expired}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {certs.map((cert) => {
              const status = calculateCertStatus(cert.expiry_date)
              const { icon: StatusIcon, color: statusColor } = statusColors[status]
              const statusLabel = statusLabels[status]
              return (
                <Card key={cert.id} className="w-full">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Award className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">
                              {cert.certificateType?.name ||
                                c.certificateFallback.replace("{id}", String(cert.certificate_type_id))}
                            </h3>
                            <Badge className={`${statusColor} shrink-0`}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusLabel}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {c.issuedBy} {cert.issuing_body} • {cert.certificate_number}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {c.issued}: {new Date(cert.issue_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {c.expires}: {new Date(cert.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
                        {(cert.certificate_pdf_url ?? cert.certificate_pdf) && (
                          <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <a href={cert.certificate_pdf_url ?? cert.certificate_pdf} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3.5 w-3.5" />
                              {c.viewDocument}
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setEditingCert(cert)}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {c.update}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingCertId(cert.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {c.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {certs.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">{c.noCertifications}</p>
                  <Button onClick={() => setShowAddModal(true)} className="mt-4">
                    {c.addFirst}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {c.showing
                  .replace("{from}", String((currentPage - 1) * PER_PAGE + 1))
                  .replace("{to}", String(Math.min(currentPage * PER_PAGE, total)))
                  .replace("{total}", String(total))}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {c.previous}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {c.pageOf.replace("{page}", String(currentPage)).replace("{lastPage}", String(lastPage))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
                  disabled={currentPage >= lastPage || isLoading}
                >
                  {c.next}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AddCertificationModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleCertificateAdded}
      />

      <EditCertificationModal
        open={editingCert !== null}
        onOpenChange={(open) => !open && setEditingCert(null)}
        certificate={editingCert}
        onSuccess={handleCertificateUpdated}
      />

      <AlertDialog
        open={deletingCertId !== null}
        onOpenChange={(open) => !open && setDeletingCertId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{c.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{c.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCertId && handleDeleteCert(deletingCertId)}
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
