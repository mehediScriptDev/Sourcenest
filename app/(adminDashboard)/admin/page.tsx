"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAdminDashboard, AdminDashboardData, type GetAdminDashboardResponse } from "@/lib/api/admin-dashboard"
import { approveManufacturer, rejectManufacturer } from "@/lib/api/admin-manufacturer-registrations"
import { queryKeys } from "@/lib/query-keys"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Users,
  Factory,
  Package,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  MapPin,
  Mail,
  Calendar,
  X,
  FileQuestion,
  Loader2
} from "lucide-react"

// A helper to map stat keys to icons
const getStatIcon = (key: string) => {
  switch(key) {
    case 'total_users': return Users
    case 'active_suppliers': return Factory
    case 'products_listed': return Package
    case 'rfqs_this_month': return FileText
    default: return FileText
  }
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.dashboard
  const c = t.admin.common
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const dashboardQueryKey = queryKeys.adminDashboard()

  const dashboardQuery = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: getAdminDashboard,
  })

  const data = dashboardQuery.data?.success ? dashboardQuery.data.data : null
  const loading = dashboardQuery.isLoading
  const [processingId, setProcessingId] = useState<string | null>(null)

  const patchDashboard = (updater: (prev: AdminDashboardData) => AdminDashboardData) => {
    queryClient.setQueryData(dashboardQueryKey, (previous: GetAdminDashboardResponse | undefined) => {
      if (!previous?.data) return previous
      return { ...previous, data: updater(previous.data) }
    })
  }

  // Modals state
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const openReview = (item: any) => {
    setCurrentItem(item)
    setShowReviewDialog(true)
  }

  // Call real approval/rejection endpoints based on item type
  const approveItem = async (id: string) => {
    if (!data) return
    const item = data.pending_approvals.find((i) => i.id === id)
    if (!item) return

    setProcessingId(id)
    try {
      // Use manufacturer approval for both manufacturer and supplier
      if (item.type === 'manufacturer' || item.type === 'supplier' || item.type === 'Supplier' || item.type === 'Manufacturer' || !item.type) {
        await approveManufacturer(id)
        toast({
          title: c.approved,
          description: c.approvedDesc.replace("{name}", item.name),
        })
      } else {
        toast({
          title: c.notice,
          description: c.approvalNotWired.replace("{type}", item.type),
        })
      }

      patchDashboard((prev) => ({
        ...prev,
        pending_approvals: prev.pending_approvals.filter((i) => i.id !== id),
      }))
    } catch (error: unknown) {
      toast({
        title: c.error,
        description: error instanceof Error ? error.message : c.approveFailed,
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const rejectItem = async () => {
    if (!currentItem || !data) return
    if (!rejectReason.trim()) {
      toast({
        title: c.error,
        description: c.rejectReasonRequired,
        variant: "destructive"
      })
      return
    }

    setProcessingId(currentItem.id)
    try {
      if (currentItem.type === 'manufacturer' || currentItem.type === 'supplier' || currentItem.type === 'Supplier' || currentItem.type === 'Manufacturer' || !currentItem.type) {
        await rejectManufacturer(currentItem.id, rejectReason)
        toast({
          title: c.rejected,
          description: c.rejectedDesc.replace("{name}", currentItem.name),
        })
      }

      patchDashboard((prev) => ({
        ...prev,
        pending_approvals: prev.pending_approvals.filter((i) => i.id !== currentItem.id),
      }))
      setShowRejectDialog(false)
      setCurrentItem(null)
      setRejectReason("")
    } catch (error: unknown) {
      toast({
        title: c.error,
        description: error instanceof Error ? error.message : c.rejectFailed,
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <p className="text-muted-foreground">{p.loadFailed}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
        <p className="mt-1 text-muted-foreground">{p.subtitle}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat) => {
          const Icon = getStatIcon(stat.key)
          return (
            <AdminStatCard
              key={stat.key}
              title={stat.label}
              value={stat.value}
              icon={Icon}
              layout="vertical"
              trend={{
                value: stat.change,
                direction: stat.trend as "up" | "down"
              }}
              contentClassName="px-5 py-4"
            />
          )
        })}
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {p.pendingApprovals}
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/suppliers">
              {p.viewAll}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.pending_approvals.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="mt-3 text-muted-foreground">{p.noPendingApprovals}</p>
              </div>
            ) : (
              data.pending_approvals.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Card Header */}
                  <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-5 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Factory className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.industry || p.noIndustry}</p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 shrink-0">
                      {item.status}
                    </Badge>
                  </div>
                  
                  {/* Card Body */}
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description || p.noDescription}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.country || p.notSpecified}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.submitted_at}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Footer */}
                  <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-5 py-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openReview(item)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      {c.review}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => approveItem(item.id)}
                      disabled={processingId === item.id}
                    >
                      {processingId === item.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {c.approve}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{p.recentActivity}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recent_activity.length === 0 ? (
              <p className="text-muted-foreground text-center">{p.noRecentActivity}</p>
            ) : (
              data.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-secondary" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-foreground">{activity.action}</span>
                      <span className="text-muted-foreground"> - {activity.detail}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <AdminDialogContent mobile="fullscreen" size="md" variant="structured">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left sm:px-6">
            <DialogTitle>{p.reviewApplication}</DialogTitle>
            <DialogDescription>
              {p.reviewApplicationDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {currentItem && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Factory className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{currentItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentItem.industry || p.noIndustry}</p>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <p className="text-sm text-foreground">{currentItem.description || p.noDescription}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{p.countryLabel}</p>
                    <p className="font-medium text-foreground">{currentItem.country || c.na}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{p.submitted}</p>
                    <p className="font-medium text-foreground">{currentItem.submitted_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{p.emailLabel}</p>
                    <p className="font-medium text-foreground">{currentItem.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:px-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReviewDialog(false)
                setShowRejectDialog(true)
              }}
              className="text-destructive hover:text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              {c.reject}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              <FileQuestion className="mr-2 h-4 w-4" />
              {p.requestInfo}
            </Button>
            <Button onClick={() => {
              if (currentItem) {
                approveItem(currentItem.id)
                setShowReviewDialog(false)
              }
            }}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {c.approve}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AdminDialogContent size="md">
          <DialogHeader>
            <DialogTitle>{p.rejectApplication}</DialogTitle>
            <DialogDescription>
              {p.rejectApplicationDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{p.rejectionReason}</Label>
              <Textarea
                placeholder={p.rejectionPlaceholderLong}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {c.cancel}
            </Button>
            <Button variant="destructive" onClick={rejectItem} disabled={processingId === currentItem?.id}>
              {processingId === currentItem?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {c.rejecting}
                </>
              ) : (
                p.rejectApplication
              )}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  )
}
