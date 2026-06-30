"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAdminDashboard, AdminDashboardData } from "@/lib/api/admin-dashboard"
import { approveManufacturer, rejectManufacturer } from "@/lib/api/admin-manufacturer-registrations"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
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
  const { toast } = useToast()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Modals state
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      const res = await getAdminDashboard()
      if (res.success && res.data) {
        setData(res.data)
      }
      setLoading(false)
    }
    fetchDashboard()
  }, [])

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
          title: "Approved",
          description: `${item.name} has been approved.`,
        })
      } else {
        toast({
          title: "Notice",
          description: `Approval for type ${item.type} is not fully wired yet. Removed from list.`,
        })
      }

      setData({
        ...data,
        pending_approvals: data.pending_approvals.filter((i) => i.id !== id)
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve application.",
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
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      })
      return
    }

    setProcessingId(currentItem.id)
    try {
      if (currentItem.type === 'manufacturer' || currentItem.type === 'supplier' || currentItem.type === 'Supplier' || currentItem.type === 'Manufacturer' || !currentItem.type) {
        await rejectManufacturer(currentItem.id, rejectReason)
        toast({
          title: "Rejected",
          description: `${currentItem.name} has been rejected.`,
        })
      }

      setData({
        ...data,
        pending_approvals: data.pending_approvals.filter((i) => i.id !== currentItem.id)
      })
      setShowRejectDialog(false)
      setCurrentItem(null)
      setRejectReason("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application.",
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
        <p className="text-muted-foreground">Failed to load admin dashboard data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of platform activity and pending tasks
        </p>
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
            Pending Approvals
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/suppliers">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.pending_approvals.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="mt-3 text-muted-foreground">All approvals completed</p>
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
                      <p className="text-sm text-muted-foreground">{item.industry || "No industry specified"}</p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 shrink-0">
                      {item.status}
                    </Badge>
                  </div>
                  
                  {/* Card Body */}
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description || "No description provided."}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.country || "Not specified"}</span>
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
                      Review
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
                      Approve
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
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recent_activity.length === 0 ? (
              <p className="text-muted-foreground text-center">No recent activity.</p>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Business Application</DialogTitle>
            <DialogDescription>
              Review the business details and take action
            </DialogDescription>
          </DialogHeader>
          {currentItem && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Factory className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{currentItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentItem.industry || "No industry specified"}</p>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <p className="text-sm text-foreground">{currentItem.description || "No description provided."}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Country</p>
                    <p className="font-medium text-foreground">{currentItem.country || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium text-foreground">{currentItem.submitted_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{currentItem.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReviewDialog(false)
                setShowRejectDialog(true)
              }}
              className="text-destructive hover:text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              <FileQuestion className="mr-2 h-4 w-4" />
              Request Info
            </Button>
            <Button onClick={() => {
              if (currentItem) {
                approveItem(currentItem.id)
                setShowReviewDialog(false)
              }
            }}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this business application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Please explain why this application is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectItem} disabled={processingId === currentItem?.id}>
              {processingId === currentItem?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
