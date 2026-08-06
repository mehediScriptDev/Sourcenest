"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Send, ArrowLeft, MessageSquare, User, Factory, Globe, CheckCircle, X, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChatProductCard } from "./chat-product-card"
import { useTranslation } from "@/lib/i18n"

export interface ChatProductReference {
  name: string
  images?: string[]
  description?: string
  minOrder?: string | number
  price?: string
  url: string
}

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

interface ChatViewProps {
  conversations: ChatConversation[]
  messages: ChatMessage[]
  currentUser: ChatParticipant
  onSelectConversation: (conversation: ChatConversation) => void
  onSendMessage: (text: string, files?: File[]) => Promise<boolean | void> | boolean | void
  selectedConversationId?: string
  isLoading?: boolean
  initialMessage?: string
  initialProductRef?: ChatProductReference | null
  readOnly?: boolean
  observerMode?: boolean
}

export function ChatView({
  conversations,
  messages,
  currentUser,
  onSelectConversation,
  onSendMessage,
  selectedConversationId,
  isLoading = false,
  initialMessage = "",
  initialProductRef = null,
  readOnly = false,
  observerMode = false,
}: ChatViewProps) {
  const [showSidebar, setShowSidebar] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState(initialMessage)
  const [productRef, setProductRef] = useState<ChatProductReference | null>(initialProductRef)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (initialMessage) {
      setNewMessage(initialMessage)
    }
  }, [initialMessage, selectedConversationId])

  useEffect(() => {
    if (initialProductRef) {
      setProductRef(initialProductRef)
    }
  }, [initialProductRef, selectedConversationId])

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)
  const otherParticipant = selectedConversation?.participants.find(p => p.id !== currentUser.id)

  const formatObserverTitle = (participants: ChatParticipant[]) => {
    const buyer = participants.find(p => p.role === "buyer")
    const manufacturer = participants.find(p => p.role === "manufacturer")
    if (buyer && manufacturer) {
      return `${buyer.name} ↔ ${manufacturer.name}`
    }
    return participants.map(p => p.name).join(" ↔ ")
  }

  const getParticipantById = (senderId: string) =>
    selectedConversation?.participants.find(p => p.id === senderId)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const filteredConversations = conversations.filter(c => {
    if (observerMode) {
      const title = formatObserverTitle(c.participants).toLowerCase()
      const participantMatch = c.participants.some(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return title.includes(searchQuery.toLowerCase()) || participantMatch
    }

    const other = c.participants.find(p => p.id !== currentUser.id)
    return other?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           other?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleSend = async () => {
    if (!selectedConversationId && conversations.length === 0) return

    let finalMessage = newMessage
    if (productRef) {
      const refText = `[Product Reference: ${productRef.name}]\nLink: ${productRef.url}\nImage: ${productRef.images?.[0] || ""}\nDesc: ${productRef.description || ""}\n\n`
      finalMessage = refText + finalMessage
    }

    if (finalMessage.trim() || selectedFiles.length > 0) {
      const success = await onSendMessage(finalMessage, selectedFiles)
      if (success !== false) {
        setNewMessage("")
        setProductRef(null)
        setSelectedFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Sidebar */}
      <div className={cn(
        "flex h-full w-full flex-col border-r border-border md:w-80 lg:w-96",
        !showSidebar && "hidden md:flex"
      )}>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.mfg.messages.searchChats || "Search conversations..."}
              className="pl-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-secondary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
          {filteredConversations.map((conv) => {
            const other = conv.participants.find(p => p.id !== currentUser.id)
            const observerTitle = observerMode ? formatObserverTitle(conv.participants) : other?.name
            const observerSubtitle = observerMode
              ? conv.participants
                  .map(p => p.company)
                  .filter(Boolean)
                  .join(" • ")
              : other?.company
            const isActive = conv.id === selectedConversationId
            return (
              <button
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv)
                  setShowSidebar(false)
                }}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-lg p-3 text-left transition-all",
                  isActive ? "bg-secondary/10 shadow-sm" : "hover:bg-muted/50"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarImage src={other?.avatar} alt={other?.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {other?.role === "manufacturer" ? <Factory className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground shadow-sm">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-sm font-semibold truncate",
                      conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {observerTitle}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {conv.updatedAt}
                    </span>
                  </div>
                  {observerSubtitle && (
                    <p className="text-xs text-muted-foreground truncate">{observerSubtitle}</p>
                  )}
                  <p className={cn(
                    "mt-1 text-xs truncate",
                    conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {conv.lastMessage?.text || "No messages yet"}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex h-full flex-1 flex-col min-w-0",
        showSidebar && "hidden md:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center border-b border-border p-4 bg-card/50 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3 min-w-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden -ml-2"
                  onClick={() => setShowSidebar(true)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border border-border shrink-0">
                  <AvatarImage src={otherParticipant?.avatar} />
                  <AvatarFallback className="bg-muted">
                    {otherParticipant?.role === "manufacturer" ? <Factory className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {observerMode
                        ? formatObserverTitle(selectedConversation.participants)
                        : otherParticipant?.name}
                    </span>
                    {!observerMode && otherParticipant?.role === "manufacturer" && (
                      <Badge variant="secondary" className="h-5 px-1 text-[10px] bg-emerald-100 text-emerald-700">
                        <CheckCircle className="mr-0.5 h-3 w-3" />
                        {t.mfg.inquiries.accepted || "Approved"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    {observerMode ? (
                      <span className="truncate">
                        {selectedConversation.participants.map(p => `${p.name} (${p.role})`).join(" • ")}
                      </span>
                    ) : (
                      <>
                        {otherParticipant?.company && <span className="truncate">{otherParticipant.company}</span>}
                        {otherParticipant?.country && (
                          <>
                            <span className="shrink-0">•</span>
                            <span className="flex items-center gap-0.5 truncate">
                              <Globe className="h-3 w-3" />
                              {otherParticipant.country}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 scroll-smooth"
            >
              {messages.map((msg, index) => {
                const sender = getParticipantById(msg.senderId)
                const isMine = observerMode
                  ? sender?.role === "manufacturer"
                  : msg.senderId === currentUser.id
                
                // Parse Product Reference
                let productRefMatch = null;
                let actualText = msg.text;
                
                const newRefRegex = /^\[Product Reference: (.*?)\]\nLink: (.*?)\nImage: (.*?)\nDesc: (.*?)\n\n([\s\S]*)$/;
                const oldRefRegex = /^\[Product Reference: (.*?)\]\nLink: (.*?)\n\n([\s\S]*)$/;
                
                const newMatch = msg.text.match(newRefRegex);
                if (newMatch) {
                  productRefMatch = { name: newMatch[1], url: newMatch[2], image: newMatch[3], desc: newMatch[4] };
                  actualText = newMatch[5];
                } else {
                  const oldMatch = msg.text.match(oldRefRegex);
                  if (oldMatch) {
                    productRefMatch = { name: oldMatch[1], url: oldMatch[2], image: "", desc: "" };
                    actualText = oldMatch[3];
                  }
                }

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
                      isMine ? "items-end" : "items-start"
                    )}
                  >
                    {observerMode && sender && (
                      <span className="mb-1 px-1 text-[10px] font-medium text-muted-foreground">
                        {sender.name} ({sender.role})
                      </span>
                    )}
                    <div className={cn(
                      "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      isMine 
                        ? "bg-secondary text-secondary-foreground rounded-tr-none" 
                        : "bg-card border border-border text-foreground rounded-tl-none"
                    )}>
                      {productRefMatch ? (
                        <div className="flex flex-col gap-2.5">
                          <ChatProductCard 
                            name={productRefMatch.name} 
                            url={productRefMatch.url} 
                            fallbackImage={productRefMatch.image} 
                            fallbackDesc={productRefMatch.desc} 
                            isMine={isMine} 
                          />
                          <div className="whitespace-pre-wrap">{actualText}</div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{actualText}</div>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att, i) => (
                            <a 
                              key={i} 
                              href={att} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-md border border-border bg-background"
                            >
                              {att.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                <img src={att} alt="Attachment" className="max-h-32 object-cover" />
                              ) : (
                                <div className="flex items-center gap-2 p-2 text-xs text-foreground">
                                  <Package className="h-4 w-4" />
                                  <span>Attachment {i + 1}</span>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input Area */}
            {!readOnly && (
            <div className="border-t border-border p-4 bg-card">
              <div className="flex flex-col rounded-md border border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-colors">
                {productRef && (
                  <div className="border-b border-border bg-muted/30 p-3">
                    <div className="group relative flex items-start gap-4 rounded-lg border border-border/50 bg-background p-3 shadow-sm transition-all hover:border-border hover:shadow-md">
                      <button 
                        type="button" 
                        onClick={() => setProductRef(null)}
                        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Remove product reference"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        {productRef.images && productRef.images[0] ? (
                          <img
                            src={productRef.images[0]}
                            alt={productRef.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center py-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Product Reference</span>
                        <h4 className="font-medium text-foreground line-clamp-1 pr-6 text-sm">{productRef.name}</h4>
                        {productRef.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{productRef.description}</p>
                        )}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                          {productRef.minOrder && (
                            <span>Min. Order: {productRef.minOrder}</span>
                          )}
                          {productRef.price && (
                             <span className="font-medium text-foreground">
                               {productRef.price}
                             </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* File Previews */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border-t border-border">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs">
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button 
                          onClick={() => removeFile(i)}
                          className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative flex-1 bg-muted/30">
                  <Textarea
                    placeholder={t.mfg.messages.typeMessage || "Type a message..."}
                    className="pr-12 border-none focus-visible:ring-0 min-h-[60px] py-3 resize-none bg-transparent"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <div className="absolute right-14 top-1/2 -translate-y-1/2">
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M4.5 4.5V10.5C4.5 12.1569 5.84315 13.5 7.5 13.5C9.15685 13.5 10.5 12.1569 10.5 10.5V4.5C10.5 3.39543 9.60457 2.5 8.5 2.5C7.39543 2.5 6.5 3.39543 6.5 4.5V9.5C6.5 10.0523 6.94772 10.5 7.5 10.5C8.05228 10.5 8.5 10.0523 8.5 9.5V4.5H9.5V9.5C9.5 10.6046 8.60457 11.5 7.5 11.5C6.39543 11.5 5.5 10.6046 5.5 9.5V4.5C5.5 2.84315 6.84315 1.5 8.5 1.5C10.1569 1.5 11.5 2.84315 11.5 4.5V10.5C11.5 12.7091 9.70914 14.5 7.5 14.5C5.29086 14.5 3.5 12.7091 3.5 10.5V4.5H4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                  </div>
                  <Button 
                    size="icon" 
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 transition-all",
                      newMessage.trim() || productRef ? "bg-secondary text-secondary-foreground scale-100" : "bg-muted text-muted-foreground scale-90"
                    )}
                    onClick={handleSend}
                    disabled={(!newMessage.trim() && !productRef && selectedFiles.length === 0)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            )}
            {readOnly && (
              <div className="border-t border-border bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
                {t.admin.pages.messages.readOnlyNotice}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-muted/5">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
              <MessageSquare className="h-10 w-10 text-secondary" />
            </div>
            <h3 className="text-xl font-serif font-medium text-foreground">{t.mfg.messages.title || "Your Messages"}</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {t.mfg.messages.selectChat || "Select a conversation from the list to start messaging."}
            </p>
            <Button variant="outline" className="mt-6 border-secondary text-secondary hover:bg-secondary/10 md:hidden" onClick={() => setShowSidebar(true)}>
              {t.mfg.dashboard.viewAll || "View Conversations"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
