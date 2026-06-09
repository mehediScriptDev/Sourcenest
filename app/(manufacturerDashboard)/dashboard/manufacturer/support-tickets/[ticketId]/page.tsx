"use client"

import { useParams } from "next/navigation"
import { CustomerSupportChatView } from "@/components/support/customer-support-chat-view"

export default function ManufacturerSupportTicketDetailPage() {
  const params = useParams()
  return (
    <CustomerSupportChatView 
      basePath="/dashboard/manufacturer/support-tickets" 
      initialTicketId={params.ticketId as string} 
    />
  )
}
