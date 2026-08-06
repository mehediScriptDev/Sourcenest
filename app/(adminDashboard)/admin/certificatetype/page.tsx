"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Card, CardContent } from "@/components/ui/card"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Award,
  Building2,
  Calendar,
  CheckCircle,
  Copy,
  Edit,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import {
  CertificateType,
  createAdminCertificateType,
  deleteAdminCertificateType,
  getAdminCertificateTypes,
  updateAdminCertificateType,
} from "@/lib/api/admin-certificate-types"
import {
  AdminCertification,
  deleteAdminCertification,
  getAdminCertifications,
} from "@/lib/api/admin-certifications"
import { queryKeys } from "@/lib/query-keys"

const CERTIFICATIONS_PER_PAGE = 12
const TYPES_PER_PAGE = 12

type CertificateVisualStatus = "valid" | "expiring" | "expired" | "unknown"

interface GroupedCertificationStats {
  valid: number
  expiring: number
  expired: number
  lastUpdated: string
}

interface GroupedCertification {
  manufacturerEmail: string
  manufacturerName: string
  certifications: AdminCertification[]
  stats: GroupedCertificationStats
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
}

function calculateCertificationStatus(expiryDate: string): CertificateVisualStatus {
  if (!expiryDate) {
    return "unknown"
  }

  const expiry = new Date(expiryDate)
  if (Number.isNaN(expiry.getTime())) {
    return "unknown"
  }

  const today = new Date()
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

function groupCertificationsByManufacturer(
  certifications: AdminCertification[],
  unknownManufacturerLabel: string
): GroupedCertification[] {
  const groupMap = new Map<string, GroupedCertification>()

  for (const cert of certifications) {
    const email = cert.manufacturer_email || "unknown"
    const name = cert.manufacturer_name || unknownManufacturerLabel

    if (!groupMap.has(email)) {
      groupMap.set(email, {
        manufacturerEmail: email,
        manufacturerName: name,
        certifications: [],
        stats: {
          valid: 0,
          expiring: 0,
          expired: 0,
          lastUpdated: "",
        },
      })
    }

    const group = groupMap.get(email)!
    group.certifications.push(cert)

    // Update stats
    const status = calculateCertificationStatus(cert.expiry_date)
    if (status === "valid") group.stats.valid++
    else if (status === "expiring") group.stats.expiring++
    else if (status === "expired") group.stats.expired++

    // Update last updated date
    if (cert.updated_at) {
      if (!group.stats.lastUpdated || new Date(cert.updated_at) > new Date(group.stats.lastUpdated)) {
        group.stats.lastUpdated = cert.updated_at
      }
    }
  }

  return Array.from(groupMap.values())
}

export default function AdminCertificateTypePage() {
  const { t } = useTranslation()
  const p = t.admin.pages.certificatetype
  const c = t.admin.common
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const typeStatusConfig = useMemo(
    () => ({
      active: { label: c.active, color: "bg-emerald-100 text-emerald-700" },
      inactive: { label: c.inactive, color: "bg-gray-100 text-gray-700" },
    }),
    [c.active, c.inactive]
  )

  const certificateStatusConfig = useMemo<
    Record<
      CertificateVisualStatus,
      { label: string; color: string; icon: typeof CheckCircle }
    >
  >(
    () => ({
      valid: {
        label: p.valid,
        color: "bg-emerald-100 text-emerald-700",
        icon: CheckCircle,
      },
      expiring: {
        label: p.expiringSoon,
        color: "bg-amber-100 text-amber-700",
        icon: AlertTriangle,
      },
      expired: {
        label: p.expired,
        color: "bg-red-100 text-red-700",
        icon: AlertTriangle,
      },
      unknown: {
        label: c.noExpiry,
        color: "bg-gray-100 text-gray-700",
        icon: AlertTriangle,
      },
    }),
    [p.valid, p.expiringSoon, p.expired, c.noExpiry]
  )

  const formatDisplayDate = (rawDate: string): string => {
    if (!rawDate) {
      return c.na
    }

    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) {
      return c.na
    }

    return date.toLocaleDateString()
  }

  const [activeTab, setActiveTab] = useState("certificates")

  const [certificationsSearch, setCertificationsSearch] = useState("")
  const [certificationsPage, setCertificationsPage] = useState(1)
  const [deletingCertificationId, setDeletingCertificationId] = useState<
    string | number | null
  >(null)

  const certificationsQueryKey = queryKeys.adminCertifications(
    certificationsPage,
    CERTIFICATIONS_PER_PAGE
  )

  const certificationsQuery = useQuery({
    queryKey: certificationsQueryKey,
    queryFn: () => getAdminCertifications("", certificationsPage, CERTIFICATIONS_PER_PAGE),
    placeholderData: (previousData) => previousData,
  })

  const groupedCertifications = useMemo(() => {
    if (!certificationsQuery.data?.success) {
      return []
    }
    return groupCertificationsByManufacturer(
      certificationsQuery.data.data,
      c.unknownManufacturer
    )
  }, [certificationsQuery.data, c.unknownManufacturer])

  const certificationsTotalPages =
    certificationsQuery.data?.pagination?.last_page ?? 1
  const certificationsTotalItems =
    certificationsQuery.data?.pagination?.total ??
    certificationsQuery.data?.data?.length ??
    0
  const certificationsLoading =
    certificationsQuery.isLoading && !certificationsQuery.data

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingType, setEditingType] = useState<CertificateType | null>(null)
  const [deletingTypeId, setDeletingTypeId] = useState<string | number | null>(null)
  const [typeSearchQuery, setTypeSearchQuery] = useState("")
  const [typeCurrentPage, setTypeCurrentPage] = useState(1)

  const typesQueryKey = queryKeys.adminCertificateTypes(
    typeCurrentPage,
    TYPES_PER_PAGE,
    typeSearchQuery
  )

  const typesQuery = useQuery({
    queryKey: typesQueryKey,
    queryFn: () => getAdminCertificateTypes(typeSearchQuery, typeCurrentPage, TYPES_PER_PAGE),
    placeholderData: (previousData) => previousData,
  })

  const types = typesQuery.data?.success ? typesQuery.data.data : []
  const typeTotalPages = typesQuery.data?.pagination?.last_page ?? 1
  const typeTotalItems =
    typesQuery.data?.pagination?.total ?? typesQuery.data?.data?.length ?? 0
  const typesLoading = typesQuery.isLoading && !typesQuery.data

  const createTypeMutation = useMutation({
    mutationFn: createAdminCertificateType,
  })
  const updateTypeMutation = useMutation({
    mutationFn: ({
      typeId,
      input,
    }: {
      typeId: string | number
      input: { name: string; slug: string; status: "active" | "inactive" }
    }) => updateAdminCertificateType(typeId, input),
  })
  const deleteTypeMutation = useMutation({
    mutationFn: deleteAdminCertificateType,
  })
  const deleteCertMutation = useMutation({
    mutationFn: deleteAdminCertification,
  })

  const isTypeSubmitting =
    createTypeMutation.isPending ||
    updateTypeMutation.isPending ||
    deleteTypeMutation.isPending
  const isDeletingCertification = deleteCertMutation.isPending

  const [newType, setNewType] = useState({
    name: "",
    slug: "",
    status: "active" as "active" | "inactive",
  })
  const [editType, setEditType] = useState({
    name: "",
    slug: "",
    status: "active" as "active" | "inactive",
  })

  useEffect(() => {
    const response = certificationsQuery.data
    if (response && !response.success) {
      toast({
        title: c.error,
        description: response.message || c.failedToLoadCerts,
        variant: "destructive",
      })
    }
  }, [certificationsQuery.data, c.error, c.failedToLoadCerts, toast])

  useEffect(() => {
    const response = typesQuery.data
    if (response && !response.success) {
      toast({
        title: c.error,
        description: response.message || c.failedToLoadCertTypes,
        variant: "destructive",
      })
    }
  }, [typesQuery.data, c.error, c.failedToLoadCertTypes, toast])

  const handleDeleteCertification = async () => {
    if (!deletingCertificationId) {
      return
    }

    try {
      const response = await deleteCertMutation.mutateAsync(deletingCertificationId)
      if (response.success) {
        toast({
          title: c.success,
          description: response.message || p.certDeletedSuccess,
        })

        const totalCertsInGroups = groupedCertifications.reduce(
          (acc, group) => acc + group.certifications.length,
          0
        )
        const shouldGoToPreviousPage = totalCertsInGroups === 1 && certificationsPage > 1

        if (shouldGoToPreviousPage) {
          setCertificationsPage((prev) => Math.max(1, prev - 1))
        } else {
          await queryClient.invalidateQueries({ queryKey: certificationsQueryKey })
        }
      } else {
        toast({
          title: c.error,
          description: response.message || p.certDeleteFailed,
          variant: "destructive",
        })
      }
    } catch (_error) {
      toast({
        title: c.error,
        description: c.unexpectedErrorDeletingCert,
        variant: "destructive",
      })
    } finally {
      setDeletingCertificationId(null)
    }
  }

  const deleteType = async (id: string | number) => {
    try {
      const response = await deleteTypeMutation.mutateAsync(id)
      if (response.success) {
        toast({
          title: c.success,
          description: response.message || c.certTypeDeleted,
        })
        await queryClient.invalidateQueries({ queryKey: typesQueryKey })
      } else {
        toast({
          title: c.error,
          description: response.message || c.failedToDeleteCertType,
          variant: "destructive",
        })
      }
    } catch (_error) {
      toast({
        title: c.error,
        description: c.unexpectedError,
        variant: "destructive",
      })
    } finally {
      setDeletingTypeId(null)
    }
  }

  const addType = async () => {
    if (!newType.name.trim() || !newType.slug.trim()) {
      toast({
        title: c.validationError,
        description: c.fillRequiredFields,
        variant: "destructive",
      })
      return
    }

    const status =
      newType.status === "active" || newType.status === "inactive"
        ? newType.status
        : "active"

    try {
      const response = await createTypeMutation.mutateAsync({
        name: newType.name,
        slug: newType.slug,
        status,
      })

      if (response.success) {
        setNewType({ name: "", slug: "", status: "active" })
        setShowAddDialog(false)
        setTypeCurrentPage(1)
        toast({
          title: c.success,
          description: response.message || c.certTypeCreated,
        })
        await queryClient.invalidateQueries({
          queryKey: queryKeys.adminCertificateTypes(1, TYPES_PER_PAGE, typeSearchQuery),
        })
      } else {
        toast({
          title: c.error,
          description: response.message || c.failedToCreateCertType,
          variant: "destructive",
        })
      }
    } catch (_error) {
      toast({
        title: c.error,
        description: c.unexpectedError,
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (type: CertificateType) => {
    setEditingType(type)
    setEditType({
      name: type.name,
      slug: type.slug,
      status: type.status,
    })
    setShowEditDialog(true)
  }

  const saveEditType = async () => {
    if (!editingType || !editType.name.trim() || !editType.slug.trim()) {
      toast({
        title: c.validationError,
        description: c.fillRequiredFields,
        variant: "destructive",
      })
      return
    }

    const status =
      editType.status === "active" || editType.status === "inactive"
        ? editType.status
        : "active"

    try {
      const response = await updateTypeMutation.mutateAsync({
        typeId: editingType.id,
        input: {
          name: editType.name,
          slug: editType.slug,
          status,
        },
      })

      if (response.success) {
        setShowEditDialog(false)
        setEditingType(null)
        toast({
          title: c.success,
          description: response.message || c.certTypeUpdated,
        })
        await queryClient.invalidateQueries({ queryKey: typesQueryKey })
      } else {
        toast({
          title: c.error,
          description: response.message || c.failedToUpdateCertType,
          variant: "destructive",
        })
      }
    } catch (_error) {
      toast({
        title: c.error,
        description: c.unexpectedError,
        variant: "destructive",
      })
    }
  }

  const validCount = useMemo(
    () =>
      groupedCertifications.reduce((acc, group) => acc + group.stats.valid, 0),
    [groupedCertifications]
  )

  const expiringCount = useMemo(
    () =>
      groupedCertifications.reduce((acc, group) => acc + group.stats.expiring, 0),
    [groupedCertifications]
  )

  const expiredCount = useMemo(
    () =>
      groupedCertifications.reduce((acc, group) => acc + group.stats.expired, 0),
    [groupedCertifications]
  )

  const filteredGroupedCertifications = useMemo(() => {
    if (!certificationsSearch.trim()) {
      return groupedCertifications
    }

    const searchTerm = certificationsSearch.toLowerCase()

    return groupedCertifications
      .map((group) => ({
        ...group,
        certifications: group.certifications.filter((cert) =>
          [
            cert.manufacturer_name,
            cert.manufacturer_email,
            cert.certificate_type_name,
            cert.issuing_body,
            cert.certificate_number,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchTerm)
        ),
      }))
      .filter((group) => group.certifications.length > 0)
  }, [groupedCertifications, certificationsSearch])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">
          {p.title}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {p.subtitle}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-2">
          <TabsTrigger value="certificates" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            {c.allCertificates}
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <Award className="h-4 w-4" />
            {p.certificateTypesTab}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={c.searchCertificatesPlaceholder}
                value={certificationsSearch}
                onChange={(e) => {
                  setCertificationsSearch(e.target.value)
                  setCertificationsPage(1)
                }}
                className="pl-9"
                disabled={certificationsLoading}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => void certificationsQuery.refetch()}
              disabled={certificationsLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {c.refresh}
            </Button>
          </div>

          {certificationsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">{c.loadingCertificates}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <AdminStatCard
                  title={p.valid}
                  value={validCount}
                  icon={CheckCircle}
                  iconClassName="text-emerald-700"
                  iconWrapperClassName="bg-emerald-100"
                  layout="horizontal"
                  contentClassName="p-4 sm:p-5"
                />
                <AdminStatCard
                  title={p.expiringSoon}
                  value={expiringCount}
                  icon={AlertTriangle}
                  iconClassName="text-amber-700"
                  iconWrapperClassName="bg-amber-100"
                  layout="horizontal"
                  contentClassName="p-4 sm:p-5"
                />
                <AdminStatCard
                  title={p.expired}
                  value={expiredCount}
                  icon={AlertTriangle}
                  iconClassName="text-red-700"
                  iconWrapperClassName="bg-red-100"
                  layout="horizontal"
                  contentClassName="p-4 sm:p-5"
                />
              </div>

              <div className="space-y-4">
                {filteredGroupedCertifications.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredGroupedCertifications.map((group, index) => (
                      <AccordionItem key={group.manufacturerEmail} value={`group-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex w-full flex-col gap-3 text-left">
                            <div className="flex flex-col gap-1">
                              <h3 className="font-semibold text-foreground">{group.manufacturerName}</h3>
                              <p className="text-sm text-muted-foreground">{group.manufacturerEmail}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {group.stats.valid > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  {p.validCount.replace("{count}", String(group.stats.valid))}
                                </Badge>
                              )}
                              {group.stats.expiring > 0 && (
                                <Badge className="bg-amber-100 text-amber-700">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  {p.expiringCount.replace("{count}", String(group.stats.expiring))}
                                </Badge>
                              )}
                              {group.stats.expired > 0 && (
                                <Badge className="bg-red-100 text-red-700">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  {p.expiredCount.replace("{count}", String(group.stats.expired))}
                                </Badge>
                              )}
                              {group.stats.lastUpdated && (
                                <span className="text-xs text-muted-foreground">
                                  {c.lastUpdatedLabel} {formatDisplayDate(group.stats.lastUpdated)}
                                </span>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-3">
                            {group.certifications.map((certification) => {
                              const status = calculateCertificationStatus(certification.expiry_date)
                              const statusUi = certificateStatusConfig[status]
                              const StatusIcon = statusUi.icon

                              return (
                                <Card key={certification.id} className="w-full overflow-hidden">
                                  <CardContent className="p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-start gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                          <FileText className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                          <h4 className="font-semibold text-foreground truncate text-sm">
                                            {certification.certificate_type_name ||
                                              c.certificateFallback.replace(
                                                "{id}",
                                                String(certification.certificate_type_id)
                                              )}
                                          </h4>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {c.issuedBy} {certification.issuing_body || c.na} •{" "}
                                            {certification.certificate_number || c.na}
                                          </p>
                                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                            <span>
                                              {c.issued} {formatDisplayDate(certification.issue_date)}
                                            </span>
                                            <span>
                                              {c.expires} {formatDisplayDate(certification.expiry_date)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <Badge className={statusUi.color}>
                                          <StatusIcon className="mr-1 h-3 w-3" />
                                          {statusUi.label}
                                        </Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {certification.certificate_pdf && (
                                              <DropdownMenuItem asChild>
                                                <a
                                                  href={certification.certificate_pdf}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="cursor-pointer"
                                                >
                                                  <Eye className="mr-2 h-4 w-4" />
                                                  {c.viewDocument}
                                                </a>
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => setDeletingCertificationId(certification.id)}
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
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">
                        {certificationsSearch
                          ? c.noCertificatesMatch
                          : c.noSubmittedCertificates}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <AdminPagination
                page={certificationsPage}
                meta={{
                  current_page: certificationsPage,
                  last_page: certificationsTotalPages,
                  total: certificationsTotalItems,
                }}
                onPageChange={setCertificationsPage}
                loading={certificationsLoading}
                hideWhenSinglePage
                showSummary={false}
                align="center"
                pageLabel={p.pageTotal
                  .replace("{page}", String(certificationsPage))
                  .replace("{lastPage}", String(certificationsTotalPages))
                  .replace("{total}", String(certificationsTotalItems))}
                className="py-4"
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{c.certificateTypeLibrary}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {c.certificateTypeLibraryDesc}
              </p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gap-2"
              disabled={typesLoading}
            >
              <Plus className="h-4 w-4" />
              {c.addCertificateType}
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={c.searchCertTypesPlaceholder}
                value={typeSearchQuery}
                onChange={(e) => {
                  setTypeSearchQuery(e.target.value)
                  setTypeCurrentPage(1)
                }}
                className="pl-9"
                disabled={typesLoading}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => void typesQuery.refetch()}
              disabled={typesLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {c.refresh}
            </Button>
          </div>

          {typesLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">{c.loadingCertTypes}</p>
              </CardContent>
            </Card>
          )}

          {!typesLoading && types.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {typeSearchQuery ? p.noCertTypesMatch : p.noCertTypesAvailable}
                </p>
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  {c.addFirstCertType}
                </Button>
              </CardContent>
            </Card>
          )}

          {!typesLoading && types.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {types.map((type) => (
                  <Card key={type.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex h-full flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                            <Award className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <Badge className={typeStatusConfig[type.status].color}>
                            {typeStatusConfig[type.status].label}
                          </Badge>
                        </div>

                        <div className="flex-1 space-y-2">
                          <h3 className="line-clamp-2 font-semibold text-foreground">{type.name}</h3>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-semibold">{c.slugLabel2}</span>
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                                {type.slug}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                                    void navigator.clipboard.writeText(type.slug)
                                  }
                                  toast({
                                    title: c.copied,
                                    description: p.slugCopied,
                                  })
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 border-t pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => openEditDialog(type)}
                            disabled={isTypeSubmitting}
                          >
                            <Edit className="h-3 w-3" />
                            <span className="hidden sm:inline">{c.edit}</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                disabled={isTypeSubmitting}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(type)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {c.edit}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeletingTypeId(type.id)}
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
                ))}
              </div>

              <AdminPagination
                page={typeCurrentPage}
                meta={{
                  current_page: typeCurrentPage,
                  last_page: typeTotalPages,
                  total: typeTotalItems,
                }}
                onPageChange={setTypeCurrentPage}
                loading={typesLoading}
                hideWhenSinglePage
                showSummary={false}
                align="center"
                pageLabel={p.pageTotal
                  .replace("{page}", String(typeCurrentPage))
                  .replace("{lastPage}", String(typeTotalPages))
                  .replace("{total}", String(typeTotalItems))}
                className="py-4"
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) {
            setNewType({ name: "", slug: "", status: "active" })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.addCertificateType}</DialogTitle>
            <DialogDescription>{c.createCertTypeDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{c.certificateName} *</Label>
              <Input
                placeholder={c.certNamePlaceholder}
                value={newType.name}
                onChange={(e) => {
                  const name = e.target.value
                  setNewType({ ...newType, name, slug: generateSlug(name) })
                }}
                className="mt-2"
                disabled={isTypeSubmitting}
              />
            </div>
            <div>
              <Label>{c.slugField} *</Label>
              <Input
                placeholder={c.slugPlaceholder}
                value={newType.slug}
                onChange={(e) => setNewType({ ...newType, slug: e.target.value })}
                className="mt-2"
                disabled={isTypeSubmitting}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {p.autoGeneratedSlugEditHelp}
              </p>
            </div>
            <div>
              <Label>{c.status}</Label>
              <Select
                value={newType.status}
                onValueChange={(value) =>
                  setNewType({ ...newType, status: value as "active" | "inactive" })
                }
                disabled={isTypeSubmitting}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={c.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{c.active}</SelectItem>
                  <SelectItem value="inactive">{c.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isTypeSubmitting}
            >
              {c.cancel}
            </Button>
            <Button onClick={addType} disabled={isTypeSubmitting}>
              {isTypeSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {c.adding}
                </>
              ) : (
                c.addType
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open)
          if (!open) {
            setEditingType(null)
            setEditType({ name: "", slug: "", status: "active" })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.editCertificateType}</DialogTitle>
            <DialogDescription>{c.editCertTypeDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{c.certificateName} *</Label>
              <Input
                placeholder={c.certNamePlaceholder}
                value={editType.name}
                onChange={(e) => setEditType({ ...editType, name: e.target.value })}
                className="mt-2"
                disabled={isTypeSubmitting}
              />
            </div>
            <div>
              <Label>{c.slugField} *</Label>
              <Input
                placeholder={c.slugPlaceholder}
                value={editType.slug}
                onChange={(e) => setEditType({ ...editType, slug: e.target.value })}
                className="mt-2"
                disabled={isTypeSubmitting}
              />
            </div>
            <div>
              <Label>{c.status}</Label>
              <Select
                value={editType.status}
                onValueChange={(value) =>
                  setEditType({ ...editType, status: value as "active" | "inactive" })
                }
                disabled={isTypeSubmitting}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={c.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{c.active}</SelectItem>
                  <SelectItem value="inactive">{c.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isTypeSubmitting}
            >
              {c.cancel}
            </Button>
            <Button onClick={saveEditType} disabled={isTypeSubmitting}>
              {isTypeSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {c.saving}
                </>
              ) : (
                c.saveChanges
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingCertificationId !== null} onOpenChange={() => setDeletingCertificationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{c.deleteCertConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{p.deleteCertDocDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCertification}>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteCertification()}
              disabled={isDeletingCertification}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingCertification ? (
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

      <AlertDialog open={!!deletingTypeId} onOpenChange={() => setDeletingTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{c.deleteCertTypeConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{p.deleteCertTypeShortDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTypeSubmitting}>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTypeId && void deleteType(deletingTypeId)}
              disabled={isTypeSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isTypeSubmitting ? (
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
    </div>
  )
}