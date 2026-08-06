"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
  ArrowLeft,
  Loader2,
  Factory
} from "lucide-react"
import {
  fetchAdminPromotionById,
  fetchAdminPromotionParticipants,
  enrollAdminPromotionParticipant,
} from "@/lib/api/admin-promotions"
import { queryKeys } from "@/lib/query-keys"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

export default function PromotionDetailsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.promotions
  const c = t.admin.common
  const params = useParams()
  const router = useRouter()
  const promotionId = params.id as string
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const detailQueryKey = queryKeys.adminPromotionDetail(promotionId)

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: async () => {
      const [promoRes, partsRes] = await Promise.all([
        fetchAdminPromotionById(promotionId),
        fetchAdminPromotionParticipants(promotionId),
      ])
      return { promoRes, partsRes }
    },
    enabled: Boolean(promotionId),
  })

  const approveMutation = useMutation({
    mutationFn: (userId: number) => enrollAdminPromotionParticipant(promotionId, userId),
  })

  const promotion =
    detailQuery.data?.promoRes.success && detailQuery.data.promoRes.data.promotion
      ? detailQuery.data.promoRes.data.promotion
      : null
  const participants = detailQuery.data?.partsRes.success
    ? detailQuery.data.partsRes.data
    : []
  const loading = detailQuery.isLoading
  const error =
    !loading && detailQuery.data && (!detailQuery.data.promoRes.success || !promotion)
      ? detailQuery.data.promoRes.message || c.failedToLoadPromotion
      : null
  const approvingUserId = approveMutation.isPending
    ? (approveMutation.variables ?? null)
    : null

  const handleApproveParticipant = async (userId: number) => {
    toast({
      title: p.approving,
      description: p.approvingDesc,
    })

    const res = await approveMutation.mutateAsync(userId)

    if (res.success) {
      toast({
        title: c.success,
        description: res.message || c.participantApproved,
      })
      await queryClient.invalidateQueries({ queryKey: detailQueryKey })
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminPromotions() })
    } else {
      toast({
        title: c.error,
        description: res.message || c.approveParticipantFailed,
        variant: "destructive",
      })
    }
  }

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
          {c.backToPromotions}
        </Button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">{c.error}</p>
          <p className="mt-1">{error || c.promotionNotFound}</p>
        </div>
      </div>
    )
  }

  const percentUsed = promotion.stats.fill_percentage
  const spotsRemaining = promotion.stats.spots_remaining

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.detailsTitle}</h1>
          <p className="text-muted-foreground">{p.detailsSubtitle}</p>
        </div>
      </div>

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
                    <Badge className="bg-secondary text-secondary-foreground">{c.active}</Badge>
                  ) : (
                    <Badge variant="secondary">{c.inactive}</Badge>
                  )}
                </CardTitle>
                <CardDescription>{promotion.short_description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">{p.programDetails}</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.linkedPlan}</span>
                  <span className="font-medium text-foreground">
                    {promotion.plan.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.duration}</span>
                  <span className="font-medium text-foreground">{c.monthsFree.replace("{count}", String(promotion.duration_months))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.maxSpots}</span>
                  <span className="font-medium text-foreground">{promotion.slots}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.created}</span>
                  <span className="font-medium text-foreground">
                    {promotion.created_at ? new Date(promotion.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">{p.enrollmentProgress}</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.spotsUsed}</span>
                  <span className="font-medium text-foreground">{promotion.stats.spots_joined} / {promotion.stats.slots_total}</span>
                </div>
                <div className="h-3 rounded-full bg-secondary/20">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.percentFilled
                    .replace("{percent}", percentUsed.toFixed(1))
                    .replace("{remaining}", String(spotsRemaining))}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="rounded-lg bg-green-500/10 p-2 text-center">
                    <p className="text-lg font-bold text-green-600">{promotion.stats.accepted}</p>
                    <p className="text-xs text-muted-foreground">{p.accepted}</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-2 text-center">
                    <p className="text-lg font-bold text-amber-600">{promotion.stats.pending}</p>
                    <p className="text-xs text-muted-foreground">{c.pending}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 p-2 text-center">
                    <p className="text-lg font-bold text-red-600">{promotion.stats.rejected}</p>
                    <p className="text-xs text-muted-foreground">{c.rejected}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                {c.enrolledParticipants}
              </CardTitle>
              <CardDescription>{c.enrolledParticipantsDesc}</CardDescription>
            </div>
            <Badge variant="outline">{c.participantsCount.replace("{count}", String(participants.length))}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{p.noParticipants}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{c.participant}</TableHead>
                  <TableHead>{p.participantEmail}</TableHead>
                  <TableHead>{p.participantStatus}</TableHead>
                  <TableHead>{c.joinedLabel}</TableHead>
                  <TableHead className="text-right">{p.participantActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.user_id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {participant.supplier?.company_name || participant.supplier?.first_name 
                          ? `${participant.supplier.first_name} ${participant.supplier.last_name}` 
                          : c.userIdFallback.replace("{id}", String(participant.user_id))}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{participant.supplier?.email || "—"}</TableCell>
                    <TableCell>
                      {String(participant.status).toLowerCase() === "approved" || String(participant.status) === "1" ? (
                        <Badge className="bg-secondary/20 text-secondary">{participant.status_label || c.approved_status}</Badge>
                      ) : (
                        <Badge variant="secondary">{participant.status_label || c.pending}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {participant.joined_at ? new Date(participant.joined_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!(String(participant.status).toLowerCase() === "approved" || String(participant.status) === "1") && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 mr-2 h-8 px-2 text-xs"
                          disabled={approvingUserId === participant.user_id}
                          onClick={() => void handleApproveParticipant(participant.user_id)}
                        >
                          {approvingUserId === participant.user_id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {c.approveParticipant}
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
