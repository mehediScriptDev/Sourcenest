import { apiClient } from "./client"
import { formatDistanceToNow } from "date-fns"
import Swal from "sweetalert2"

// Types based on the ChatView component
export interface ChatParticipant {
  id: string
  name: string
  avatar?: string
  role: "buyer" | "manufacturer" | "admin"
  company?: string
  country?: string
}

export interface ChatMessage {
  id: string
  senderId: string
  text: string
  timestamp: string
  isRead: boolean
  attachments?: string[]
}

export interface ChatConversation {
  id: string
  participants: ChatParticipant[]
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: string
}

/**
 * Raw API Response Types
 */
interface ApiUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  company_name?: string
  country?: string
  avatar?: string
}

interface ApiMessage {
  id: number | string
  conversation_id?: number | string
  user_id?: number | string
  sender_id?: number | string
  message?: string
  body?: string
  content?: string
  is_read?: boolean | number
  created_at?: string
  updated_at?: string
  attachments?: any[]
}

interface ApiConversation {
  id: number
  name: string | null
  created_by: number
  created_at: string
  updated_at: string
  is_unread: boolean
  last_message_sent_at: string | null
  creator: ApiUser
  participants: ApiUser[]
  last_message?: ApiMessage
}

/**
 * Normalizes an API user to the frontend ChatParticipant type
 */
function normalizeParticipant(user: ApiUser): ChatParticipant {
  return {
    id: user.id.toString(),
    name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || 'Unknown User',
    role: user.role as any,
    company: user.company_name,
    country: user.country,
    avatar: user.avatar
  }
}

function normalizeMessage(msg: ApiMessage): ChatMessage {
  let formattedTime = "Recently"
  try {
    if (msg.created_at) {
      formattedTime = formatDistanceToNow(new Date(msg.created_at.replace(' ', 'T')), { addSuffix: true })
    }
  } catch (e) {
    console.error("Date formatting error:", e)
  }

  const senderId = msg.sender_id || msg.user_id || "";
  const text = msg.body || msg.content || msg.message || "";

  let msgAttachments: string[] = []
  if (msg.attachments && Array.isArray(msg.attachments)) {
    msgAttachments = msg.attachments.map((att: any) => {
      // Depending on backend, it might be an object or a direct string URL
      if (typeof att === 'string') return att;
      return att.url || att.file_url || att.path || "";
    }).filter(Boolean)
  }

  return {
    id: msg.id ? msg.id.toString() : `msg-${Date.now()}`,
    senderId: senderId.toString(),
    text: text,
    timestamp: formattedTime,
    isRead: !!msg.is_read,
    attachments: msgAttachments.length > 0 ? msgAttachments : undefined
  }
}

/**
 * Normalizes an API conversation to the frontend ChatConversation type
 */
function normalizeConversation(conv: ApiConversation): ChatConversation {
  const lastActivity = conv.last_message_sent_at || conv.updated_at || conv.created_at
  let formattedTime = "Recently"
  
  try {
    if (lastActivity) {
      formattedTime = formatDistanceToNow(new Date(lastActivity.replace(' ', 'T')), { addSuffix: true })
    }
  } catch (e) {
    console.error("Date formatting error:", e)
  }

  return {
    id: conv.id.toString(),
    participants: (conv.participants || []).map(normalizeParticipant),
    unreadCount: conv.is_unread ? 1 : 0,
    updatedAt: formattedTime,
    lastMessage: conv.last_message ? normalizeMessage(conv.last_message) : undefined 
  }
}

/**
 * Fetch all conversations for the current user
 */
export async function getConversations(params?: Record<string, any>): Promise<ChatConversation[]> {
  try {
    const response = await apiClient.get("/conversations", { params })
    const data = response.data?.data || response.data || []
    if (!Array.isArray(data)) return []
    
    return data.map(normalizeConversation)
  } catch (error) {
    console.error("Failed to fetch conversations:", error)
    return []
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(participantIds: (string|number)[], name?: string): Promise<ChatConversation | null> {
  try {
    const response = await apiClient.post("/conversations", {
      participant_ids: participantIds.map(id => Number(id))
    });

    const apiData = response.data?.data || response.data;
    
    if (apiData && apiData.id) {
      return normalizeConversation(apiData);
    }
    
    return null;
  } catch (error: any) {
    console.error("Failed to create conversation:", error);
    if (error.response) {
      console.error("API Response Error:", error.response.data);
    }
    return null;
  }
}

/**
 * Fetch messages for a specific conversation
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`)
    const data = response.data?.data || response.data || []
    if (!Array.isArray(data)) return []
    
    // Sort messages ascending (oldest first, newest last)
    const sortedData = [...data].sort((a: any, b: any) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at.replace(' ', 'T')).getTime() - new Date(b.created_at.replace(' ', 'T')).getTime()
      }
      return Number(a.id) - Number(b.id)
    })
    
    return sortedData.map((msg: any) => normalizeMessage(msg))
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return []
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(conversationId: string, text: string, files?: File[]): Promise<ChatMessage | null> {
  try {
    let response;
    
    if (files && files.length > 0) {
      const formData = new FormData()
      formData.append("body", text || " ") // ensure body is sent if required, or empty string
      
      files.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file)
      })
      
      response = await apiClient.post(`/conversations/${conversationId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } else {
      response = await apiClient.post(`/conversations/${conversationId}/messages`, { body: text })
    }
    
    const data = response.data?.data || response.data
    
    if (data && data.id) {
      return normalizeMessage(data)
    }
    
    return null;
  } catch (error: any) {
    console.error("Failed to send message:", error)
    
    // Extract validation message
    let errorMessage = "Failed to send message. Please try again."
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.errors) {
      const firstErrorKey = Object.keys(error.response.data.errors)[0]
      if (firstErrorKey) {
        errorMessage = error.response.data.errors[firstErrorKey][0]
      }
    }
    
    Swal.fire({
      title: "Upload Failed",
      text: errorMessage,
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#ef4444"
    })
    
    return null;
  }
}

/**
 * Mark a conversation as read
 */
export async function markAsRead(conversationId: string): Promise<boolean> {
  try {
    await apiClient.put(`/conversations/${conversationId}/read`);
    return true;
  } catch (e) {
    // Ignore if endpoint doesn't exist
    return false;
  }
}
