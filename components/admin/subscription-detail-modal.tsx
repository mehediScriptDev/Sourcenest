"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, Calendar, RefreshCcw } from "lucide-react"
import { getAdminSubscriptionDetail, AdminSubscriptionDetail } from "@/lib/api/admin-subscriptions"
import { format } from "date-fns"

interface SubscriptionDetailModalProps {
  subscriptionId: number | string | null
  isOpen: boolean
  onClose: () => void
}

export function SubscriptionDetailModal({ subscriptionId, isOpen, onClose }: SubscriptionDetailModalProps) {
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
          setError(res.message || "Failed to load details")
        }
        setLoading(false)
      }
      fetchDetail()
    } else {
      setDetail(null)
    }
  }, [isOpen, subscriptionId])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscription Details</DialogTitle>
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
            {/* Header Info */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {detail.manufacturer?.name || "Unknown Company"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {detail.manufacturer?.email || ""}
                </p>
              </div>
              <Badge variant={detail.status === "active" ? "default" : "secondary"} className="capitalize">
                {detail.status_label || detail.status}
              </Badge>
            </div>

            {/* Plan Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 text-sm text-muted-foreground">Current Plan</div>
                <div className="font-semibold text-foreground">{detail.plan?.name || "N/A"}</div>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  {detail.billing_interval === "year" 
                    ? `${detail.plan?.yearly_price?.amount}/year` 
                    : `${detail.plan?.monthly_price?.amount}/month`}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 text-sm text-muted-foreground">Billing Status</div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                  Auto-renew: {detail.auto_renew ? "Enabled" : "Disabled"}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Next billing: {detail.ends_at ? format(new Date(detail.ends_at), "MMM dd, yyyy") : "N/A"}
                </div>
              </div>
            </div>

            {/* Payments History */}
            <div>
              <h4 className="mb-3 font-medium text-foreground">Payment History</h4>
              {detail.payments && detail.payments.length > 0 ? (
                <div className="rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Date</th>
                        <th className="px-4 py-2 text-left font-medium">Amount</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2 text-left font-medium">Method</th>
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
                <p className="text-sm text-muted-foreground">No payments found.</p>
              )}
            </div>

            {/* Logs */}
            <div>
              <h4 className="mb-3 font-medium text-foreground">Subscription Logs</h4>
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
                            Changed from {log.from_plan.name} to {log.to_plan.name}
                          </p>
                        )}
                        {!log.from_plan && log.to_plan && (
                          <p className="text-muted-foreground">
                            Subscribed to {log.to_plan.name}
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
                <p className="text-sm text-muted-foreground">No logs found.</p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
