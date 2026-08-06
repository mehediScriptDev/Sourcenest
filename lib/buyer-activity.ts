import {
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Package,
  type LucideIcon,
} from "lucide-react"

export interface BuyerActivityItem {
  id: number
  type: string
  title: string
  description: string
  link?: string | null
  time: string
  time_at: string
}

const activityBadgeColors: Record<string, string> = {
  message_sent: "bg-blue-100 text-blue-700",
  rfq_created: "bg-amber-100 text-amber-700",
  product_viewed: "bg-gray-100 text-gray-700",
  supplier_viewed: "bg-gray-100 text-gray-700",
  product_saved: "bg-pink-100 text-pink-700",
  supplier_saved: "bg-pink-100 text-pink-700",
}

const activityLabelKeys: Record<string, string> = {
  message_sent: "message",
  rfq_created: "rfq_sent",
  product_viewed: "view",
  supplier_viewed: "view",
  product_saved: "save",
  supplier_saved: "save",
}

const activityIcons: Record<string, LucideIcon> = {
  message_sent: MessageSquare,
  rfq_created: FileText,
  product_viewed: Package,
  supplier_viewed: Eye,
  product_saved: Heart,
  supplier_saved: Heart,
}

export function getBuyerActivityBadgeClass(type: string): string {
  return activityBadgeColors[type] ?? "bg-muted text-muted-foreground"
}

export function getBuyerActivityLabelKey(type: string): string {
  return activityLabelKeys[type] ?? type
}

export function getBuyerActivityIcon(type: string): LucideIcon {
  return activityIcons[type] ?? Eye
}
