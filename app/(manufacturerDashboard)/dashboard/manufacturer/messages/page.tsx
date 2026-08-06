"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ChatView, ChatConversation, ChatMessage, ChatParticipant } from "@/components/chat/chat-view"
import { useAuth } from "@/lib/auth-context"
import { getConversations, getMessages, sendMessage, markAsRead, createConversation } from "@/lib/api/messages"
import { getEcho } from "@/lib/echo"
import { Loader2 } from "lucide-react"

export default function ManufacturerMessagesPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [hasProcessedAutoMessage, setHasProcessedAutoMessage] = useState(false)
  const [prefillMessage, setPrefillMessage] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()

  const buildIncomingMessage = (data: any): ChatMessage | null => {
    const msg = data?.message
    if (!msg?.id) return null
    return {
      id: msg.id.toString(),
      senderId: msg.sender_id?.toString() || "",
      text: msg.body || msg.content || msg.message || "",
      timestamp: "Just now",
      isRead: false,
    }
  }

  // Fetch conversations
  useEffect(() => {
    let isMounted = true;
    async function loadConversations() {
      if (!isAuthenticated || !user) return
      
      setIsLoading(true)
      try {
        const data = await getConversations()

        if (isMounted) {
          setConversations(data)
          if (data.length > 0 && !selectedConvId) {
            setSelectedConvId(data[0].id)
          }
        }
      } catch (error) {
        console.error("Failed to load manufacturer conversations:", error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadConversations()
    return () => { isMounted = false; }
  }, [isAuthenticated, user])

  // Handle Auto Message
  useEffect(() => {
    async function processAutoMessage() {
      if (!isAuthenticated || hasProcessedAutoMessage || conversations.length === 0) return
      
      const autoMessage = searchParams.get('auto_message')
      const prefill = searchParams.get('prefill')
      const supplierSlug = searchParams.get('supplier')
      const productSlug = searchParams.get('product')
      const productName = searchParams.get('productName') || productSlug
      
      if ((autoMessage === '1' || prefill === '1') && supplierSlug && productSlug) {
        setHasProcessedAutoMessage(true)
        
        const isAutoSend = autoMessage === '1'
        
        // Remove query params to avoid duplicate sending on refresh
        router.replace('/dashboard/manufacturer/messages')
        
        setIsMessagesLoading(true)
        try {
          let conv = conversations.find(c => c.participants.some(p => 
            p.id === supplierSlug || 
            (supplierSlug === "admin" && (p.id === "1" || p.role === "admin")) ||
            p.name.toLowerCase().includes(supplierSlug.split('-')[0])
          ))
          
          if (!conv) {
            const supplierId = supplierSlug === "admin" ? 1 : supplierSlug;
            conv = await createConversation([supplierId, user?.id?.toString() || "mfg-1"], `Inquiry about ${productSlug}`) || undefined;
            if (conv) {
              setConversations(prev => [conv!, ...prev])
            }
          }
          
          if (conv) {
            setSelectedConvId(conv.id)
            const defaultText = `Hello,\n\nI am interested in your product "${productName}".\n\nProduct Link: ${window.location.origin}/products/${productSlug}\n\n\nCould you please provide more details regarding pricing, minimum order quantity, and available shipping options?\n\nI look forward to hearing from you soon.\n\nBest regards.`
            
            if (isAutoSend) {
              const sentMsg = await sendMessage(conv.id, defaultText)
              if (sentMsg) {
                setMessages(prev => [...prev, sentMsg])
                setConversations(prev => prev.map(c => 
                  c.id === conv!.id 
                    ? { ...c, lastMessage: sentMsg, updatedAt: "Just now" } 
                    : c
                ))
              }
            } else {
              setPrefillMessage(defaultText)
            }
          }
        } catch (error) {
          console.error("Auto message failed:", error)
        } finally {
          setIsMessagesLoading(false)
        }
      } else if (!selectedConvId && conversations.length > 0) {
        setSelectedConvId(conversations[0].id)
      }
    }
    processAutoMessage()
  }, [isAuthenticated, searchParams, hasProcessedAutoMessage, conversations, selectedConvId, router, user])

  // Fetch messages
  useEffect(() => {
    async function loadMessages() {
      if (!selectedConvId) return
      
      setIsMessagesLoading(true)
      try {
        const data = await getMessages(selectedConvId)
        setMessages(data)
      } catch (error) {
        console.error("Failed to load messages:", error)
      } finally {
        setIsMessagesLoading(false)
      }
    }

    loadMessages()
  }, [selectedConvId])

  // Fallback sync when realtime event is not received.
  useEffect(() => {
    if (!selectedConvId) return

    const interval = setInterval(async () => {
      try {
        const latest = await getMessages(selectedConvId)
        setMessages((prev) => {
          if (prev.length === 0) return latest
          const existingIds = new Set(prev.map((m) => m.id))
          const unseen = latest.filter((m) => !existingIds.has(m.id))
          return unseen.length ? [...prev, ...unseen] : prev
        })
      } catch {
        // Silent retry on next tick
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedConvId])

  useEffect(() => {
    if (!selectedConvId) return
    const echo = getEcho()
    if (!echo) return

    const channel = echo.private(`chat.room.${selectedConvId}`)
    channel.listen(".message.sent", (data: any) => {
      const newMsg = buildIncomingMessage(data)
      if (!newMsg) return

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId ? { ...c, lastMessage: newMsg, updatedAt: "Just now" } : c
        )
      )
    })

    return () => {
      echo.leave(`chat.room.${selectedConvId}`)
    }
  }, [selectedConvId])

  const currentUser: ChatParticipant = {
    id: user?.id?.toString() || "mfg-1",
    name: user?.name || user?.company || "Manufacturer",
    role: "manufacturer",
    company: user?.company,
    avatar: user?.avatar
  }

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!selectedConvId) return false

    const sentMsg = await sendMessage(selectedConvId, text, files)
    if (sentMsg) {
      setMessages(prev => [...prev, sentMsg])
      setConversations(prev => prev.map(c => 
        c.id === selectedConvId 
          ? { ...c, lastMessage: sentMsg, updatedAt: "Just now" } 
          : c
      ))
      return true
    }
    return false
  }

  const handleSelectConversation = async (conv: ChatConversation) => {
    setSelectedConvId(conv.id)
    
    if (conv.unreadCount > 0) {
      const success = await markAsRead(conv.id)
      if (success) {
        setConversations(prev => prev.map(c => 
          c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ))
      }
    }
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex h-[calc(100dvh-120px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100dvh-8rem)] w-full min-w-0 max-w-full overflow-x-hidden">
      <ChatView
        conversations={conversations}
        messages={messages}
        currentUser={currentUser}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        selectedConversationId={selectedConvId}
        isLoading={isMessagesLoading}
        initialMessage={prefillMessage}
      />
    </div>
  )
}
