"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Mail, 
  Building2, 
  Clock, 
  CalendarIcon, 
  Search, 
  MessageSquare,
  Eye,
  CheckCircle2,
  Filter,
  Trash2
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Swal from "sweetalert2"
import { getAdminContacts, getAdminContactById, deleteAdminContact, updateAdminContactReadStatus, type AdminContact } from "@/lib/api/admin-contacts"
import { useTranslation } from "@/lib/i18n"
import { queryKeys } from "@/lib/query-keys"

export default function AdminContactsPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.contact
  const c = t.admin.common
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Viewing details
  const [selectedContact, setSelectedContact] = useState<AdminContact | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Get query parameters
  const perPage = parseInt(searchParams.get("per_page") ?? "10", 10)
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const search = searchParams.get("search") ?? ""

  // Update URL query parameters
  const updateQueryParams = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(params).forEach(([key, value]) => {
      if (value === "") {
        newParams.delete(key)
      } else {
        newParams.set(key, String(value))
      }
    })
    router.push(`/admin/contact?${newParams.toString()}`)
  }

  const contactsQueryKey = queryKeys.adminContacts(page, perPage, search)
  const contactsQuery = useQuery({
    queryKey: contactsQueryKey,
    queryFn: () => {
      const filters: Record<string, unknown> = { per_page: perPage }
      if (search) filters.search = search
      return getAdminContacts(page, filters)
    },
    placeholderData: (previousData) => previousData,
  })

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => deleteAdminContact(id),
  })

  const updateReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      updateAdminContactReadStatus(id, isRead),
  })

  const contacts = contactsQuery.data?.success ? contactsQuery.data.data : []
  const loading = contactsQuery.isLoading
  const error =
    contactsQuery.data?.success === false
      ? contactsQuery.data.message || c.failedToFetchContact
      : null
  const lastPage = contactsQuery.data?.success ? contactsQuery.data.meta?.lastPage ?? 1 : 1
  const total = contactsQuery.data?.success ? contactsQuery.data.meta?.total ?? 0 : 0

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a")
    } catch {
      return dateString
    }
  }
  
  const handleViewMessage = async (contact: AdminContact) => {
    // Open immediately with available data
    setSelectedContact(contact)
    setIsDialogOpen(true)
    
    // If it's unread, mark it as read using the dedicated endpoint
    if (!contact.is_read) {
      const readResponse = await updateReadMutation.mutateAsync({ id: contact.id, isRead: true })
      if (readResponse.success) {
        // Update local state proactively
        queryClient.setQueryData(contactsQueryKey, (previous: {
          success: boolean
          data: AdminContact[]
          meta: { lastPage?: number; total?: number } | null
          message?: string
        } | undefined) => {
          if (!previous?.success) return previous
          return {
            ...previous,
            data: previous.data.map((item) =>
              item.id === contact.id ? { ...item, is_read: true } : item
            ),
          }
        })
      }
    }
    
    // Fetch fresh data
    const response = await getAdminContactById(contact.id)
    if (response.success && response.data) {
      setSelectedContact(response.data)
      queryClient.setQueryData(contactsQueryKey, (previous: {
        success: boolean
        data: AdminContact[]
        meta: { lastPage?: number; total?: number } | null
        message?: string
      } | undefined) => {
        if (!previous?.success) return previous
        return {
          ...previous,
          data: previous.data.map((item) => (item.id === contact.id ? response.data! : item)),
        }
      })
    }
  }

  const handleDeleteContact = async (e: React.MouseEvent, contact: AdminContact) => {
    e.stopPropagation() // Prevent opening the dialog
    
    const result = await Swal.fire({
      icon: "warning",
      title: p.deleteTitle,
      text: c.deleteSubmissionConfirm.replace("{name}", contact.name),
      showCancelButton: true,
      confirmButtonText: c.delete,
      cancelButtonText: c.cancel,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      customClass: {
        confirmButton: "rounded-lg px-6 py-2 font-semibold",
        cancelButton: "rounded-lg px-6 py-2 font-semibold",
      },
    })

    if (!result.isConfirmed) return

    const response = await deleteContactMutation.mutateAsync(contact.id)
    if (response.success) {
      queryClient.setQueryData(contactsQueryKey, (previous: {
        success: boolean
        data: AdminContact[]
        meta: { lastPage?: number; total?: number } | null
        message?: string
      } | undefined) => {
        if (!previous?.success) return previous
        const nextData = previous.data.filter((item) => item.id !== contact.id)
        const nextMeta = previous.meta
          ? { ...previous.meta, total: Math.max((previous.meta.total ?? 0) - 1, 0) }
          : previous.meta
        return { ...previous, data: nextData, meta: nextMeta }
      })
      
      if (selectedContact?.id === contact.id) {
        setIsDialogOpen(false)
      }
      
      await Swal.fire({
        icon: "success",
        title: c.deleted,
        text: c.submissionDeleted,
        confirmButtonColor: "#503322",
        customClass: { confirmButton: "rounded-lg px-6 py-2 font-semibold" },
      })
    } else {
      await Swal.fire({
        icon: "error",
        title: c.error,
        text: response.message || c.failedToDeleteSubmission,
        confirmButtonColor: "#6366f1",
        customClass: { confirmButton: "rounded-lg px-6 py-2 font-semibold" },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">
            {p.title}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {p.subtitle}
          </p>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={c.searchSubmissionsPlaceholder}
            className="pl-9 bg-background"
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateQueryParams({ search: e.currentTarget.value, page: 1 })
              }
            }}
            onBlur={(e) => updateQueryParams({ search: e.target.value, page: 1 })}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 bg-card rounded-xl border border-border">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground font-medium">{p.loading}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-1">{p.loadFailed}</h3>
          <p className="text-destructive/80 max-w-md">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
          
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground pl-6">{p.tableName}</TableHead>
                  <TableHead className="font-semibold text-foreground">{p.tableEmail}</TableHead>
                  <TableHead className="font-semibold text-foreground">{p.tableType}</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">{p.tableStatus}</TableHead>
                  <TableHead className="font-semibold text-foreground w-[120px] text-right pr-6">{p.tableAction}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                        <p className="font-medium text-lg text-foreground">{p.noSubmissions}</p>
                        <p className="text-sm">{p.noSubmissionsDesc}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow 
                      key={contact.id}
                      className="group cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleViewMessage(contact)}
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {contact.name}
                          </div>
                          {contact.company_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {contact.company_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <a href={`mailto:${contact.email}`} className="hover:underline hover:text-primary" onClick={(e) => e.stopPropagation()}>
                            {contact.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant="outline" 
                          className="bg-primary/5 text-primary border-primary/20 capitalize font-medium px-2.5 py-0.5"
                        >
                          {contact.inquiry_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {contact.is_read ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/70">{c.read}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">{c.new}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 pr-6">
                        <div className="flex items-center gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMessage(contact);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteContact(e, contact)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-border">
            {contacts.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                <p className="font-medium text-lg text-foreground">{p.noSubmissions}</p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="p-4 space-y-4 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => handleViewMessage(contact)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground text-base">
                        {contact.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <a href={`mailto:${contact.email}`} className="hover:underline truncate max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                          {contact.email}
                        </a>
                      </div>
                      {contact.company_name && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[200px]">{contact.company_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {contact.is_read ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/70">{c.read}</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">{c.new}</span>
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                      )}
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize text-[10px] px-2 py-0">
                        {contact.inquiry_type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-medium text-foreground">
                        {formatDate(contact.created_at).split(" at ")[0]}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(contact.created_at).split(" at ")[1]}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMessage(contact);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {c.view}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => handleDeleteContact(e, contact)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <AdminPagination
            page={page}
            meta={{ lastPage, total, currentPage: page }}
            itemCount={contacts.length}
            onPageChange={(nextPage) => updateQueryParams({ page: nextPage })}
            variant="footer"
            summaryText={p.showingSubmissions
              .replace("{shown}", String(contacts.length))
              .replace("{total}", String(total))}
          />
        </div>
      )}

      {/* Message Viewer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AdminDialogContent variant="structured" mobile="fullscreen" size="lg">
          <div className="p-6 border-b border-border bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl">{selectedContact?.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <a href={`mailto:${selectedContact?.email}`} className="text-primary hover:underline">
                    {selectedContact?.email}
                  </a>
                  {selectedContact?.company_name && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {selectedContact.company_name}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
              <Badge 
                variant="outline" 
                className="bg-primary/10 text-primary border-primary/20 capitalize px-3 py-1 text-sm font-medium"
              >
                {selectedContact?.inquiry_type}
              </Badge>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 bg-background">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{c.message}</h4>
            <div className="text-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-4 rounded-lg border border-border">
              {selectedContact?.message}
            </div>
          </div>
          
          <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              {selectedContact?.created_at && formatDate(selectedContact.created_at)}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{c.close}</Button>
              {selectedContact && (
                <>
                  <Button variant="outline" asChild>
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedContact.email}&su=Re: ${encodeURIComponent(selectedContact.inquiry_type || '')} Inquiry`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {c.replyViaGmail}
                    </a>
                  </Button>
                  <Button 
                    className="gap-2" 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedContact.email);
                      Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: p.emailCopied,
                        showConfirmButton: false,
                        timer: 2000
                      });
                    }}
                  >
                    {c.copyEmail}
                  </Button>
                </>
              )}
            </div>
          </div>
        </AdminDialogContent>
      </Dialog>
    </div>
  )
}
