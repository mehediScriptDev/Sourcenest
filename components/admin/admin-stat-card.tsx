import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AdminStatCardProps {
  title: string
  value: string | number | ReactNode
  icon?: LucideIcon
  iconClassName?: string
  iconWrapperClassName?: string
  valueClassName?: string
  trend?: {
    value: string | number
    direction: "up" | "down"
  }
  layout?: "vertical" | "horizontal" | "spaceBetween"
  className?: string
  contentClassName?: string
}

export function AdminStatCard({
  title,
  value,
  icon: Icon,
  iconClassName = "text-muted-foreground",
  iconWrapperClassName = "bg-muted",
  valueClassName = "text-foreground",
  trend,
  layout = "horizontal",
  className,
  contentClassName
}: AdminStatCardProps) {
  
  const renderContent = () => {
    switch (layout) {
      case "vertical":
        return (
          <>
            <div className="flex items-center justify-between">
              {Icon ? (
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconWrapperClassName)}>
                  <Icon className={cn("h-5 w-5", iconClassName)} />
                </div>
              ) : (
                <div />
              )}
              {trend && (
                <Badge 
                  variant={trend.direction === "up" ? "secondary" : "outline"}
                  className={cn(
                    "gap-1",
                    trend.direction === "up" ? "bg-emerald-100 text-emerald-700" : ""
                  )}
                >
                  {trend.direction === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trend.value}
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </>
        )
      case "spaceBetween":
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
            </div>
            {Icon && (
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconWrapperClassName)}>
                <Icon className={cn("h-5 w-5", iconClassName)} />
              </div>
            )}
          </div>
        )
      case "horizontal":
      default:
        return (
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconWrapperClassName)}>
                <Icon className={cn("h-5 w-5", iconClassName)} />
              </div>
            )}
            <div>
              <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>
        )
    }
  }

  return (
    <Card className={className}>
      <CardContent className={cn(
        "flex flex-col justify-center h-full px-4",
        contentClassName,
        "py-0!"
      )}>
        {renderContent()}
      </CardContent>
    </Card>
  )
}
