import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ManufacturerStatCardProps {
  title: string
  value?: string | number | React.ReactNode
  icon?: React.ComponentType<any>
  trend?: {
    value: string
    direction: "up" | "down" | string
  }
  iconClassName?: string
  iconWrapperClassName?: string
  badgeClassName?: string
  className?: string
  layout?: "vertical" | "horizontal"
  children?: React.ReactNode
}

export default function ManufacturerStatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconClassName = "text-secondary",
  iconWrapperClassName = "bg-secondary/10",
  badgeClassName,
  className,
  layout = "vertical",
  children
}: ManufacturerStatCardProps) {
  const isUp = trend?.direction === "up"

  if (layout === "horizontal") {
    return (
      <Card className={cn("w-full overflow-hidden", className)}>
        <CardContent className="p-4 sm:p-5 py-0 sm:py-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconWrapperClassName)}>
                <Icon className={cn("h-5 w-5", iconClassName)} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {children ? (
                children
              ) : (
                <>
                  <p className="text-xl font-bold text-foreground truncate sm:text-2xl">{value}</p>
                  <p className="text-sm text-muted-foreground truncate">{title}</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardContent className="p-4 py-0 sm:p-5 lg:p-6">
        <div className="flex items-center justify-between gap-2 min-w-0">
          {Icon && (
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconWrapperClassName)}>
              <Icon className={cn("h-5 w-5", iconClassName)} />
            </div>
          )}
          {trend && (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs gap-1 font-medium",
                isUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                badgeClassName
              )}
            >
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          {children ? (
            children
          ) : (
            <>
              <p className="text-xl font-bold text-foreground sm:text-2xl">{value}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
