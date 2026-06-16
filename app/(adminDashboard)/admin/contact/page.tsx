"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Swal from "sweetalert2"
import { getAdminContacts, getAdminContactById, deleteAdminContact, updateAdminContactReadStatus, type AdminContact } from "@/lib/api/admin-contacts"

export default function AdminContactsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contacts, setContacts] = useState<AdminContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  
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

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true)
      setError(null)
      
      const filters: Record<string, unknown> = { per_page: perPage }
      if (search) filters.search = search
      
      const response = await getAdminContacts(page, filters)
      
      if (response.success) {
        setContacts(response.data)
        setLastPage(response.meta?.lastPage ?? 1)
        setTotal(response.meta?.total ?? 0)
      } else {
        setError(response.message || "Failed to fetch contact submissions.")
        setContacts([])
      }
      setLoading(false)
    }

    fetchContacts()
  }, [page, perPage, search])

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
      const readResponse = await updateAdminContactReadStatus(contact.id, true)
      if (readResponse.success) {
        // Update local state proactively
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_read: true } : c))
      }
    }
    
    // Fetch fresh data
    const response = await getAdminContactById(contact.id)
    if (response.success && response.data) {
      setSelectedContact(response.data)
      setContacts(prev => prev.map(c => c.id === contact.id ? response.data! : c))
    }
  }

  const handleDeleteContact = async (e: React.MouseEvent, contact: AdminContact) => {
    e.stopPropagation() // Prevent opening the dialog
    
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Submission?",
      text: `Are you sure you want to delete the message from ${contact.name}?`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      customClass: {
        confirmButton: "rounded-lg px-6 py-2 font-semibold",
        cancelButton: "rounded-lg px-6 py-2 font-semibold",
      },
    })

    if (!result.isConfirmed) return

    const response = await deleteAdminContact(contact.id)
    if (response.success) {
      setContacts(prev => prev.filter(c => c.id !== contact.id))
      setTotal(prev => Math.max(0, prev - 1))
      
      if (selectedContact?.id === contact.id) {
        setIsDialogOpen(false)
      }
      
      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The submission has been deleted.",
        confirmButtonColor: "#503322",
        customClass: { confirmButton: "rounded-lg px-6 py-2 font-semibold" },
      })
    } else {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: response.message || "Failed to delete submission.",
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
            Contact Submissions
          </h1>
          <p className="mt-1 text-muted-foreground">
            View and manage inquiries received from the contact page.
          </p>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or company..."
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
            <p className="text-muted-foreground font-medium">Loading submissions...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-1">Failed to load data</h3>
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
                  <TableHead className="font-semibold text-foreground pl-6">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Email</TableHead>
                  <TableHead className="font-semibold text-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Status</TableHead>
                  <TableHead className="font-semibold text-foreground w-[120px] text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                        <p className="font-medium text-lg text-foreground">No submissions found</p>
                        <p className="text-sm">We couldn't find any contact inquiries matching your criteria.</p>
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
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/70">Read</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">New</span>
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
                <p className="font-medium text-lg text-foreground">No submissions found</p>
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
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/70">Read</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">New</span>
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
                        View
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
          
          {/* Pagination */}
          {(lastPage > 1 || total > 0) && (
            <div className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{contacts.length}</span> of <span className="font-medium text-foreground">{total}</span> submissions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => updateQueryParams({ page: Math.max(1, page - 1) })}
                  className="bg-background"
                >
                  Previous
                </Button>
                <div className="flex items-center justify-center min-w-12 text-sm font-medium bg-background border border-border h-9 rounded-md">
                  {page} / {Math.max(1, lastPage)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === lastPage || lastPage === 0}
                  onClick={() => updateQueryParams({ page: Math.min(lastPage, page + 1) })}
                  className="bg-background"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message Viewer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
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
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Message</h4>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
              <Button 
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={(e) => selectedContact && handleDeleteContact(e, selectedContact)}
              >
                Delete
              </Button>
              <Button className="gap-2" onClick={() => {
                if (selectedContact) {
                  window.location.href = `mailto:${selectedContact.email}?subject=Re: ${selectedContact.inquiry_type} Inquiry`;
                }
              }}>
                <Mail className="h-4 w-4" />
                Reply via Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
