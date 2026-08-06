"use client"

import { useState, useEffect } from "react"
import { ChatView, ChatConversation, ChatMessage, ChatParticipant } from "@/components/chat/chat-view"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { getAdminConversations, getAdminMessages } from "@/lib/api/admin-messages"
import { useTranslation } from "@/lib/i18n"

export default function AdminMessagesPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.messages
  const { user, isAuthenticated } = useAuth()
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)

  useEffect(() => {
    async function loadConversations() {
      if (!isAuthenticated) return

      setIsLoading(true)
      try {
        const data = await getAdminConversations({ per_page: 50 })
        setConversations(data)

        const params = new URLSearchParams(window.location.search)
        const requestedConvId = params.get("conversation")

        if (requestedConvId) {
          setSelectedConvId(requestedConvId)
        } else if (data.length > 0 && !selectedConvId) {
          setSelectedConvId(data[0].id)
        }
      } catch (error) {
        console.error("Failed to load admin conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [isAuthenticated])

  useEffect(() => {
    async function loadMessages() {
      if (!selectedConvId) return

      setIsMessagesLoading(true)
      try {
        const data = await getAdminMessages(selectedConvId)
        setMessages(data)
      } catch (error) {
        console.error("Failed to load messages:", error)
      } finally {
        setIsMessagesLoading(false)
      }
    }

    loadMessages()
  }, [selectedConvId])

  useEffect(() => {
    if (!selectedConvId) return

    const interval = setInterval(async () => {
      try {
        const latest = await getAdminMessages(selectedConvId)
        setMessages((prev) => {
          if (prev.length === 0) return latest
          const existingIds = new Set(prev.map((m) => m.id))
          const unseen = latest.filter((m) => !existingIds.has(m.id))
          return unseen.length ? [...prev, ...unseen] : prev
        })
      } catch {
        // Silent retry on next tick
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedConvId])

  const currentUser: ChatParticipant = {
    id: user?.id?.toString() || "admin-observer",
    name: user?.name || p.adminFallback,
    role: "admin",
  }

  const handleSelectConversation = (conv: ChatConversation) => {
    setSelectedConvId(conv.id)
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-140px)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          <p className="text-sm text-muted-foreground">{p.loadingConversations}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-[calc(100dvh-140px)] flex flex-col">
      <div className="shrink-0">
        <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {p.subtitle}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ChatView
          conversations={conversations}
          messages={messages}
          currentUser={currentUser}
          onSelectConversation={handleSelectConversation}
          onSendMessage={async () => false}
          selectedConversationId={selectedConvId}
          isLoading={isMessagesLoading}
          readOnly
          observerMode
        />
      </div>
    </div>
  )
}
