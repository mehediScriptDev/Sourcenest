"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sparkles,
  Users,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Factory
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { fetchAdminPromotionById, fetchAdminPromotionParticipants, enrollAdminPromotionParticipant, type Promotion, type PromotionParticipant } from "@/lib/api/admin-promotions"
import { useToast } from "@/hooks/use-toast"

export default function PromotionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const promotionId = params.id as string
  const { toast } = useToast()

  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [participants, setParticipants] = useState<PromotionParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvingUserId, setApprovingUserId] = useState<number | null>(null)

  const handleApproveParticipant = async (userId: number) => {
    setApprovingUserId(userId)
    toast({
      title: "Approving participant...",
      description: "Please wait while we process the promotion enrollment.",
    })
    
    const res = await enrollAdminPromotionParticipant(promotionId, userId)
    setApprovingUserId(null)
    
    if (res.success) {
      toast({
        title: "Success",
        description: res.message || "Participant enrollment approved successfully.",
      })
      const [promoRes, partsRes] = await Promise.all([
        fetchAdminPromotionById(promotionId),
        fetchAdminPromotionParticipants(promotionId)
      ])
      if (promoRes.success && promoRes.data.promotion) {
        setPromotion(promoRes.data.promotion)
      }
      if (partsRes.success) {
        setParticipants(partsRes.data)
      }
    } else {
      toast({
        title: "Error",
        description: res.message || "Failed to approve participant.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setLoading(true)
      const [promoRes, partsRes] = await Promise.all([
        fetchAdminPromotionById(promotionId),
        fetchAdminPromotionParticipants(promotionId)
      ])
      
      if (cancelled) return
      
      if (promoRes.success && promoRes.data.promotion) {
        setPromotion(promoRes.data.promotion)
        setParticipants(partsRes.success ? partsRes.data : [])
      } else {
        setError(promoRes.message || "Failed to load promotion details.")
      }
      setLoading(false)
    }
    void loadData()
    return () => { cancelled = true }
  }, [promotionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !promotion) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Promotions
        </Button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="mt-1">{error || "Promotion not found."}</p>
        </div>
      </div>
    )
  }

  const percentUsed = promotion.stats.fill_percentage
  const spotsRemaining = promotion.stats.spots_remaining

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promotion Details</h1>
          <p className="text-muted-foreground">Manage promotion & participants</p>
        </div>
      </div>

      {/* Promotion Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <Sparkles className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {promotion.promotion_title}
                  {promotion.status ? (
                    <Badge className="bg-secondary text-secondary-foreground">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </CardTitle>
                <CardDescription>{promotion.short_description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Program Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Program Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Linked Plan:</span>
                  <span className="font-medium text-foreground">
                    {promotion.plan.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium text-foreground">{promotion.duration_months} months free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Spots:</span>
                  <span className="font-medium text-foreground">{promotion.slots}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium text-foreground">
                    {promotion.created_at ? new Date(promotion.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Enrollment Progress</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spots Used:</span>
                  <span className="font-medium text-foreground">{promotion.stats.spots_joined} / {promotion.stats.slots_total}</span>
                </div>
                <div className="h-3 rounded-full bg-secondary/20">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {percentUsed.toFixed(1)}% filled • {spotsRemaining} spots remaining
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="rounded-lg bg-green-500/10 p-2 text-center">
                    <p className="text-lg font-bold text-green-600">{promotion.stats.accepted}</p>
                    <p className="text-xs text-muted-foreground">Accepted</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-2 text-center">
                    <p className="text-lg font-bold text-amber-600">{promotion.stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 p-2 text-center">
                    <p className="text-lg font-bold text-red-600">{promotion.stats.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Enrolled Participants
              </CardTitle>
              <CardDescription>Suppliers who joined under this promotion</CardDescription>
            </div>
            <Badge variant="outline">{participants.length} Participants</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No participants found for this promotion yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.user_id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {p.supplier?.company_name || p.supplier?.first_name 
                          ? `${p.supplier.first_name} ${p.supplier.last_name}` 
                          : `User #${p.user_id}`}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.supplier?.email || "—"}</TableCell>
                    <TableCell>
                      {String(p.status).toLowerCase() === "approved" || String(p.status) === "1" ? (
                        <Badge className="bg-secondary/20 text-secondary">{p.status_label || "Approved"}</Badge>
                      ) : (
                        <Badge variant="secondary">{p.status_label || "Pending"}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.joined_at ? new Date(p.joined_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!(String(p.status).toLowerCase() === "approved" || String(p.status) === "1") && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 mr-2 h-8 px-2 text-xs"
                          disabled={approvingUserId === p.user_id}
                          onClick={() => handleApproveParticipant(p.user_id)}
                        >
                          {approvingUserId === p.user_id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          Approve
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
