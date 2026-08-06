"use client"

import { useEffect, useState } from "react"
import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, Calendar, RefreshCcw } from "lucide-react"
import { getAdminSubscriptionDetail, AdminSubscriptionDetail } from "@/lib/api/admin-subscriptions"
import { format } from "date-fns"
import { useTranslation } from "@/lib/i18n"

interface SubscriptionDetailModalProps {
  subscriptionId: number | string | null
  isOpen: boolean
  onClose: () => void
}

export function SubscriptionDetailModal({ subscriptionId, isOpen, onClose }: SubscriptionDetailModalProps) {
  const { t } = useTranslation()
  const c = t.admin.components.subscriptionDetail
  const common = t.admin.common
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<AdminSubscriptionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && subscriptionId) {
      const fetchDetail = async () => {
        setLoading(true)
        setError(null)
        const res = await getAdminSubscriptionDetail(subscriptionId)
        if (res.success && res.data) {
          setDetail(res.data)
        } else {
          setError(res.message || c.loadFailed)
        }
        setLoading(false)
      }
      fetchDetail()
    } else {
      setDetail(null)
    }
  }, [isOpen, subscriptionId, c.loadFailed])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AdminDialogContent mobile="fullscreen" size="lg">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-destructive">
            {error}
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {detail.manufacturer?.name || c.unknownCompany}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {detail.manufacturer?.email || ""}
                </p>
              </div>
              <Badge variant={detail.status === "active" ? "default" : "secondary"} className="capitalize">
                {detail.status_label || detail.status}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 text-sm text-muted-foreground">{c.currentPlan}</div>
                <div className="font-semibold text-foreground">{detail.plan?.name || common.na}</div>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  {detail.billing_interval === "year" 
                    ? `${detail.plan?.yearly_price?.amount}${common.perYear}` 
                    : `${detail.plan?.monthly_price?.amount}${common.perMonth}`}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 text-sm text-muted-foreground">{c.billingStatus}</div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                  {detail.auto_renew ? c.autoRenewEnabled : c.autoRenewDisabled}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {c.nextBilling} {detail.ends_at ? format(new Date(detail.ends_at), "MMM dd, yyyy") : common.na}
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium text-foreground">{c.paymentHistory}</h4>
              {detail.payments && detail.payments.length > 0 ? (
                <div className="rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">{common.date}</th>
                        <th className="px-4 py-2 text-left font-medium">{common.amount}</th>
                        <th className="px-4 py-2 text-left font-medium">{common.status}</th>
                        <th className="px-4 py-2 text-left font-medium">{common.method}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detail.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-2">{format(new Date(payment.created_at), "MMM dd, yyyy")}</td>
                          <td className="px-4 py-2">${payment.amount}</td>
                          <td className="px-4 py-2 capitalize">{payment.status}</td>
                          <td className="px-4 py-2 capitalize">{payment.payment_method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{c.noPayments}</p>
              )}
            </div>

            <div>
              <h4 className="mb-3 font-medium text-foreground">{c.subscriptionLogs}</h4>
              {detail.logs && detail.logs.length > 0 ? (
                <div className="space-y-3">
                  {detail.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-foreground capitalize">
                          {log.event_type.replace(/_/g, " ")}
                        </p>
                        {log.from_plan && log.to_plan && (
                          <p className="text-muted-foreground">
                            {c.changedFrom.replace("{from}", log.from_plan.name).replace("{to}", log.to_plan.name)}
                          </p>
                        )}
                        {!log.from_plan && log.to_plan && (
                          <p className="text-muted-foreground">
                            {c.subscribedTo.replace("{plan}", log.to_plan.name)}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                      {log.paid_amount != null && log.paid_amount > 0 && (
                        <div className="font-medium text-emerald-600">
                          +${log.paid_amount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{c.noLogs}</p>
              )}
            </div>
          </div>
        ) : null}
      </AdminDialogContent>
    </Dialog>
  )
}
