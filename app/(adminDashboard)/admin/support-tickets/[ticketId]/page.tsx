"use client"

import { useParams } from "next/navigation"
import { AdminSupportChatView } from "@/components/support/admin-support-chat-view"

export default function AdminSupportTicketDetailPage() {
  const params = useParams()
  return (
    <AdminSupportChatView 
      basePath="/admin/support-tickets" 
      initialTicketId={params.ticketId as string} 
    />
  )
}
