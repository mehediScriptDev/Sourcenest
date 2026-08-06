"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Clock } from "lucide-react"
import {
  BuyerActivityItem,
  getBuyerActivityBadgeClass,
  getBuyerActivityIcon,
  getBuyerActivityLabelKey,
} from "@/lib/buyer-activity"

interface BuyerActivityListProps {
  activities: BuyerActivityItem[]
  emptyMessage: string
  getLabel: (type: string) => string
  compact?: boolean
}

export function BuyerActivityList({
  activities,
  emptyMessage,
  getLabel,
  compact = false,
}: BuyerActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className={compact ? "p-6 text-center text-muted-foreground" : "p-8 text-center text-muted-foreground"}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={compact ? "divide-y divide-border" : ""}>
      {activities.map((activity) => {
        const Icon = getBuyerActivityIcon(activity.type)
        const labelKey = getBuyerActivityLabelKey(activity.type)
        const href = activity.link || "/dashboard/buyer/activity"

        return (
          <Link
            key={activity.id}
            href={href}
            className={
              compact
                ? "flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/50 transition-colors min-w-0"
                : "flex items-start gap-4 border-b border-border p-4 last:border-b-0 hover:bg-muted/50 transition-colors"
            }
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={compact ? "text-sm font-medium text-foreground truncate" : "font-medium text-foreground"}>
                      {activity.title}
                    </h3>
                    <Badge className={getBuyerActivityBadgeClass(activity.type)} variant="secondary">
                      {getLabel(labelKey)}
                    </Badge>
                  </div>
                  <p className={`mt-1 text-sm text-muted-foreground ${compact ? "truncate" : "line-clamp-1"}`}>
                    {activity.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </span>
                  {!compact && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
