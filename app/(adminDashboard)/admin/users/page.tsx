"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search,
  User,
  Factory,
  MoreVertical,
  Mail,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  Shield
  ,Loader2
} from "lucide-react"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { useTranslation } from "@/lib/i18n"

type UserStatus = "active" | "pending" | "suspended" | "deactivated" | "deleted"
type UserRole = "buyer" | "manufacturer" | "admin"

interface UserItem {
  id: string
  name: string
  email: string
  role: UserRole
  company: string | null
  status: UserStatus
  country?: string
  joinedAt?: string
}

type AdminUserDetail = Omit<UserItem, "company"> & {
  first_name?: string
  last_name?: string
  status_label?: string
  statuses?: Record<string, string>
  agreed_to_terms?: boolean
  two_factor_enabled?: boolean
  deactivated_at?: string | null
  deactivated_reason?: string | null
  created_at?: string
  updated_at?: string
  preferred_language?: string
  timezone?: string
  quote_notification?: number
  message_notification?: number
  supplier_update?: number
  weekly_digest?: number
  marketing_promotion?: number
  preferred_currency?: { code: string; symbol: string } | null
  login_history?: any[]
  company?: any
}

import { apiClient } from "@/lib/api/client"
import { normalizeUserRole } from "@/lib/roles/dashboard-route"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api/errors"
import { createConversation, getConversations } from "@/lib/api/messages"
import { useAuth } from "@/lib/auth-context"
import { queryKeys } from "@/lib/query-keys"

interface PaginationMeta {
  current_page: number
  last_page: number
  from: number
  to: number
  total: number
}

interface AdminUsersListData {
  users: UserItem[]
  meta: PaginationMeta | null
}

function mapApiUser(u: Record<string, unknown>): UserItem {
  return {
    id: String(u.id),
    name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
    email: String(u.email ?? ""),
    role: normalizeUserRole(String(u.role ?? "buyer")),
    company: (u.company as { company_name?: string } | null)?.company_name ?? null,
    status: String(u.status ?? "active").toLowerCase() as UserStatus,
    country: (u.company as { country?: string } | null)?.country ?? undefined,
    joinedAt: u.created_at ? String(u.created_at) : undefined,
  }
}

function mapApiUserDetail(u: Record<string, unknown>): AdminUserDetail {
  return {
    id: String(u.id),
    first_name: u.first_name ? String(u.first_name) : undefined,
    last_name: u.last_name ? String(u.last_name) : undefined,
    name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
    email: String(u.email ?? ""),
    role: normalizeUserRole(String(u.role ?? "buyer")),
    company: u.company ?? null,
    status: String(u.status ?? "active").toLowerCase() as UserStatus,
    status_label: u.status_label ? String(u.status_label) : undefined,
    statuses: (u.statuses as Record<string, string>) ?? undefined,
    agreed_to_terms: Boolean(u.agreed_to_terms),
    two_factor_enabled: Boolean(u.two_factor_enabled),
    deactivated_at: (u.deactivated_at as string | null) ?? null,
    deactivated_reason: (u.deactivated_reason as string | null) ?? null,
    created_at: u.created_at ? String(u.created_at) : undefined,
    updated_at: u.updated_at ? String(u.updated_at) : undefined,
    preferred_language: u.preferred_language ? String(u.preferred_language) : undefined,
    timezone: u.timezone ? String(u.timezone) : undefined,
    quote_notification: Number(u.quote_notification ?? 0),
    message_notification: Number(u.message_notification ?? 0),
    supplier_update: Number(u.supplier_update ?? 0),
    weekly_digest: Number(u.weekly_digest ?? 0),
    marketing_promotion: Number(u.marketing_promotion ?? 0),
    preferred_currency: (u.preferred_currency as AdminUserDetail["preferred_currency"]) ?? null,
    login_history: (u.login_history as AdminUserDetail["login_history"]) ?? [],
  }
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const p = t.admin.pages.users
  const c = t.admin.common
  const userStatus = t.admin.userStatus
  const roles = t.admin.roles

  const statusColors: Record<UserStatus, string> = {
    active: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    suspended: "bg-red-100 text-red-700",
    deactivated: "bg-slate-100 text-slate-700",
    deleted: "bg-rose-100 text-rose-700",
  }

  const getStatusInfo = (status?: string | UserStatus) => {
    const key = String(status ?? "active").toLowerCase() as UserStatus
    const color = statusColors[key]
    if (color) {
      return { label: userStatus[key], color }
    }

    const label = typeof status === "string" && status.trim()
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : roles.unknown

    return { label, color: "bg-slate-100 text-slate-700" }
  }

  const roleConfig: Record<UserRole, { label: string; icon: typeof User; color: string }> = {
    buyer: { label: roles.buyer, icon: User, color: "bg-blue-100 text-blue-700" },
    manufacturer: { label: roles.manufacturer, icon: Factory, color: "bg-purple-100 text-purple-700" },
    admin: { label: roles.admin, icon: Shield, color: "bg-red-100 text-red-700" },
  }

  const router = useRouter()
  const { toast } = useToast()
  const { user: currentAuthUser } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(5)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<AdminUserDetail | null>(null)
  const [detailUserId, setDetailUserId] = useState<string | null>(null)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null)
  const [deactivateReason, setDeactivateReason] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false)
  const [bulkDeactivateReason, setBulkDeactivateReason] = useState("")
  const [contactingUserId, setContactingUserId] = useState<string | null>(null)

  const usersQueryKey = queryKeys.adminUsers(page, perPage, searchQuery, roleFilter, statusFilter)

  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    queryFn: async (): Promise<AdminUsersListData> => {
      const params: Record<string, string | number> = { per_page: perPage, page }
      if (searchQuery) params.search = searchQuery
      if (roleFilter !== "all") params.role = roleFilter
      if (statusFilter !== "all") params.status = statusFilter

      const res = await apiClient.get("/admin/users", { params })
      const payload = res.data

      return {
        users: (payload.data ?? []).map((u: Record<string, unknown>) => mapApiUser(u)),
        meta: payload.meta ?? null,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const userDetailQuery = useQuery({
    queryKey: queryKeys.adminUserDetail(detailUserId ?? ""),
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${detailUserId}`)
      const u = res.data?.data
      if (!u) {
        throw new Error(c.userNotFound)
      }
      return mapApiUserDetail(u as Record<string, unknown>)
    },
    enabled: Boolean(detailUserId),
  })

  useEffect(() => {
    if (userDetailQuery.data) {
      setCurrentUser(userDetailQuery.data)
    }
  }, [userDetailQuery.data])

  useEffect(() => {
    if (userDetailQuery.isError) {
      toast({
        title: c.failedToLoadUserDetails,
        description: getApiErrorMessage(userDetailQuery.error) || String(userDetailQuery.error),
        variant: "destructive",
      })
    }
  }, [userDetailQuery.isError, userDetailQuery.error, toast, c.failedToLoadUserDetails])

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/users/${id}/active`),
  })

  const deactivateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.patch(`/admin/users/${id}/deactivate`, { reason: reason ?? undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.delete(`/admin/users/${id}`, { data: { reason: reason ?? undefined } }),
  })

  const users = usersQuery.data?.users ?? []
  const meta = usersQuery.data?.meta ?? null
  const isLoading = usersQuery.isLoading
  const detailLoading = userDetailQuery.isLoading
  const actionLoading =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    deleteMutation.isPending

  const patchUsersCache = (updater: (list: UserItem[]) => UserItem[]) => {
    queryClient.setQueryData(usersQueryKey, (previous: AdminUsersListData | undefined) => {
      if (!previous) return previous
      return { ...previous, users: updater(previous.users) }
    })
  }

  const filteredUsers = users

  const allSelected = filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const updateUserStatus = async (id: string, status: UserStatus, reason?: string) => {
    const actionText = status === 'active' ? c.activatingUserProgress : status === 'deactivated' ? c.deactivatingUserProgress : c.updatingUserProgress
    toast({ title: actionText })

    try {
      if (status === 'active') {
        await activateMutation.mutateAsync(id)
        patchUsersCache((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'active' } : u)))
        toast({ title: p.userActivated })
        return
      }

      if (status === 'deactivated') {
        await deactivateMutation.mutateAsync({ id, reason })
        patchUsersCache((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'deactivated' } : u)))
        toast({ title: p.userDeactivated })
        return
      }

      if (status === 'suspended') {
        patchUsersCache((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'suspended' } : u)))
        toast({ title: c.userSuspendedLocal })
        return
      }

      patchUsersCache((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
      toast({ title: c.userStatusUpdatedLocal })
    } catch (err) {
      toast({ title: c.actionFailed, description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const bulkUpdateStatus = async (status: UserStatus) => {
    if (selectedUsers.length === 0) return

    if (status === 'active') {
      toast({ title: c.activatingUsers })
      try {
        await Promise.all(selectedUsers.map((id) => activateMutation.mutateAsync(id)))
        patchUsersCache((prev) =>
          prev.map((u) => (selectedUsers.includes(u.id) ? { ...u, status: 'active' } : u))
        )
        setSelectedUsers([])
        toast({ title: c.usersActivated })
        return
      } catch (err) {
        toast({ title: c.bulkActivationFailed, description: getApiErrorMessage(err), variant: 'destructive' })
        return
      }
    }

    if (status === 'deactivated') {
      setBulkDeactivateOpen(true)
      return
    }

    patchUsersCache((prev) =>
      prev.map((u) => (selectedUsers.includes(u.id) ? { ...u, status } : u))
    )
    setSelectedUsers([])
    toast({ title: c.statusUpdatedLocal })
  }

  const deleteUser = async (id: string, reason?: string) => {
    toast({ title: c.deletingUser })
    try {
      await deleteMutation.mutateAsync({ id, reason })
      patchUsersCache((prev) => prev.filter((u) => u.id !== id))
      toast({ title: p.userDeleted })
    } catch (err) {
      toast({ title: c.deleteFailed, description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const performBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return
    toast({ title: c.deactivatingUsers })
    try {
      await Promise.all(
        selectedUsers.map((id) =>
          deactivateMutation.mutateAsync({ id, reason: bulkDeactivateReason ?? undefined })
        )
      )
      patchUsersCache((prev) =>
        prev.map((u) => (selectedUsers.includes(u.id) ? { ...u, status: 'deactivated' } : u))
      )
      setSelectedUsers([])
      toast({ title: c.usersDeactivated })
      setBulkDeactivateOpen(false)
      setBulkDeactivateReason("")
    } catch (err) {
      toast({ title: c.bulkDeactivateFailed, description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const openUserDetails = (user: UserItem) => {
    setCurrentUser(user as AdminUserDetail)
    setDetailUserId(user.id)
    setShowUserDialog(true)
  }

  const buyerCount = users.filter(u => u.role === "buyer").length
  const manufacturerCount = users.filter(u => u.role === "manufacturer").length

  const contactUser = async () => {
    if (!currentUser?.id || !currentAuthUser?.id) return

    setContactingUserId(currentUser.id)
    try {
      const adminId = parseInt(currentAuthUser.id)
      const userId = parseInt(currentUser.id)
      
      // Check if a conversation already exists with this user
      const existingConversations = await getConversations()
      const existingConversation = existingConversations.find(conv => 
        conv.participants.some(p => p.id === currentUser.id.toString())
      )
      
      if (existingConversation) {
        // Conversation already exists, navigate to it
        setShowUserDialog(false)
        toast({ title: p.conversationFound, description: c.openingConversation })
        router.push(`/messages?conversation=${existingConversation.id}`)
      } else {
        // Create a new conversation
        const conversation = await createConversation([adminId, userId])
        
        if (conversation) {
          setShowUserDialog(false)
          toast({ title: c.conversationStarted, description: c.redirectingToMessages })
          router.push(`/messages?conversation=${conversation.id}`)
        } else {
          toast({ title: c.error, description: c.failedToStartConversation, variant: "destructive" })
        }
      }
    } catch (err) {
      const errorMsg = getApiErrorMessage(err)
      // Handle the "conversation already exists" error gracefully
      if (errorMsg?.includes("already exists")) {
        toast({ title: c.conversationExists, description: c.conversationExistsDesc, variant: "default" })
        // Fetch conversations again and find the one that was just checked
        const existingConversations = await getConversations()
        const existingConversation = existingConversations.find(conv => 
          conv.participants.some(p => p.id === currentUser?.id?.toString())
        )
        if (existingConversation) {
          setShowUserDialog(false)
          router.push(`/messages?conversation=${existingConversation.id}`)
        }
      } else {
        toast({ title: c.error, description: errorMsg || c.failedToContactUser, variant: "destructive" })
      }
    } finally {
      setContactingUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground">{p.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {p.subtitle}
          <span className="ml-3">
            <Badge variant="outline" className="mr-2">{p.buyersBadge.replace("{count}", String(buyerCount))}</Badge>
            <Badge variant="outline">{p.manufacturersBadge.replace("{count}", String(manufacturerCount))}</Badge>
          </span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={c.searchUsers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={c.role} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{c.allRoles}</SelectItem>
              <SelectItem value="buyer">{c.buyers}</SelectItem>
              <SelectItem value="manufacturer">{c.manufacturers}</SelectItem>
              <SelectItem value="admin">{c.admins}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={c.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{c.allStatus}</SelectItem>
              <SelectItem value="active">{userStatus.active}</SelectItem>
              <SelectItem value="pending">{userStatus.pending}</SelectItem>
              <SelectItem value="suspended">{userStatus.suspended}</SelectItem>
              <SelectItem value="deactivated">{userStatus.deactivated}</SelectItem>
              <SelectItem value="deleted">{userStatus.deleted}</SelectItem>
              <SelectItem value="scheduled_deletion">{c.scheduledDeletion}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder={c.perPage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">{c.perPageOption.replace("{count}", "5")}</SelectItem>
              <SelectItem value="10">{c.perPageOption.replace("{count}", "10")}</SelectItem>
              <SelectItem value="25">{c.perPageOption.replace("{count}", "25")}</SelectItem>
              <SelectItem value="50">{c.perPageOption.replace("{count}", "50")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <span className="text-sm font-medium">{p.selectedCount.replace("{count}", String(selectedUsers.length))}</span>
            <div className="flex gap-2">
            <Button size="sm" onClick={() => bulkUpdateStatus("active")}>
              <CheckCircle className="mr-1 h-3 w-3" />
              {c.activate}
            </Button>
            {/* <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("suspended")}> 
              <Ban className="mr-1 h-3 w-3" />
              Suspend
            </Button> */}
            <Button size="sm" variant="outline" onClick={() => { setBulkDeactivateReason(""); setBulkDeactivateOpen(true); }}>
              {c.deactivate}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSelectedUsers([])}>
            {c.clear}
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{p.loadingUsers}</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Mobile: card list */}
          <div className="block sm:hidden space-y-3">
        {filteredUsers.map((user) => {
          const RoleIcon = roleConfig[user.role].icon
          const s = getStatusInfo(user.status)
          return (
            <div key={user.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleSelect(user.id)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="ml-3">
                      <Badge className={roleConfig[user.role].color}>{roleConfig[user.role].label}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="truncate">{user.company}</div>
                    <div className="ml-4">{user.joinedAt}</div>
                    <div className="ml-4">
                      <Badge className={s.color}>{s.label}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openUserDetails(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {c.viewDetails}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          {c.sendEmail}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status !== "active" && (
                          <DropdownMenuItem onClick={() => updateUserStatus(user.id, "active")}>
                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                            {c.activate}
                          </DropdownMenuItem>
                        )}
                        {/* {user.status !== "suspended" && (
                          <DropdownMenuItem onClick={() => updateUserStatus(user.id, "suspended")}>
                            <Ban className="mr-2 h-4 w-4 text-red-600" />
                            Suspend
                          </DropdownMenuItem>
                        )} */}
                        {user.status !== "deactivated" && (
                          <DropdownMenuItem onClick={() => { setDeactivateTarget(user.id); setDeactivateReason(""); setDeactivateOpen(true); }}>
                            {c.deactivate}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => { setDeleteTarget(user.id); setDeleteReason(""); setDeleteOpen(true); }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {c.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{p.noUsers}</p>
          </div>
        )}

        <AdminPagination
          page={page}
          meta={meta}
          itemCount={users.length}
          onPageChange={setPage}
          variant="card"
        />
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">{p.tableUser}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden sm:table-cell">{p.tableRole}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden md:table-cell">{p.tableCompany}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden lg:table-cell">{p.tableCountry}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground hidden lg:table-cell">{p.tableJoined}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">{p.tableStatus}</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">{p.tableActions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const RoleIcon = roleConfig[user.role].icon
              return (
                <tr key={user.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Checkbox 
                      checked={selectedUsers.includes(user.id)} 
                      onCheckedChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <RoleIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge className={roleConfig[user.role].color}>
                      {roleConfig[user.role].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {user.company}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {user.country}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {user.joinedAt}
                  </td>
                  <td className="px-4 py-3">
                    {
                      (() => {
                        const s = getStatusInfo(user.status)
                        return (
                          <Badge className={s.color}>{s.label}</Badge>
                        )
                      })()
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openUserDetails(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {c.viewDetails}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          {c.sendEmail}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status !== "active" && (
                          <DropdownMenuItem onClick={() => updateUserStatus(user.id, "active")}>
                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                            {c.activate}
                          </DropdownMenuItem>
                        )}
                        {/* {user.status !== "suspended" && (
                          <DropdownMenuItem onClick={() => updateUserStatus(user.id, "suspended")}>
                            <Ban className="mr-2 h-4 w-4 text-red-600" />
                            Suspend
                          </DropdownMenuItem>
                        )} */}
                        {user.status !== "deactivated" && (
                          <DropdownMenuItem onClick={() => { setDeactivateTarget(user.id); setDeactivateReason(""); setDeactivateOpen(true); }}>
                            {c.deactivate}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => { setDeleteTarget(user.id); setDeleteReason(""); setDeleteOpen(true); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {c.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{p.noUsers}</p>
          </div>
        )}
        <AdminPagination
          page={page}
          meta={meta}
          itemCount={users.length}
          onPageChange={setPage}
          variant="footer"
        />
      </div>
        </>
      )}

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <AdminDialogContent mobile="fullscreen" size="lg" variant="structured">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left sm:px-6">
            <DialogTitle>{p.userDetails}</DialogTitle>
            <DialogDescription>
              {p.userDetailsDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {detailLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">{p.loadingDetails}</div>
          )}

          {!detailLoading && currentUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  {currentUser.role === "admin" ? (
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  ) : currentUser.role === "manufacturer" ? (
                    <Factory className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{currentUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">ID: {currentUser.id}</p>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <Badge className={roleConfig[currentUser.role].color}>{roleConfig[currentUser.role].label}</Badge>
                  </div>
                  <div>
                    <Badge className={getStatusInfo(currentUser.status).color}>{currentUser.status_label ?? getStatusInfo(currentUser.status).label}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{p.companyLabel}</span>
                  <p className="font-medium">{typeof currentUser.company === 'string' ? currentUser.company : (currentUser.company?.company_name ?? "-")}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">{p.timezoneLabel}</span>
                  <p className="font-medium">{currentUser.timezone ?? "-"}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">{p.languageLabel}</span>
                  <p className="font-medium">{currentUser.preferred_language ?? "-"}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">{p.currencyLabel}</span>
                  <p className="font-medium">{currentUser.preferred_currency ? `${currentUser.preferred_currency.code} - ${currentUser.preferred_currency.symbol}` : "-"}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">{p.createdAtLabel}</span>
                  <p className="font-medium">{currentUser.created_at ?? currentUser.joinedAt ?? "-"}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">{p.updatedAtLabel}</span>
                  <p className="font-medium">{currentUser.updated_at ?? "-"}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">{p.agreedTermsLabel}</span>
                  <p className="font-medium">{currentUser.agreed_to_terms ? c.yes : c.no}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">{p.twoFactorLabel}</span>
                  <p className="font-medium">{currentUser.two_factor_enabled ? c.yes : c.no}</p>
                </div>

                {currentUser.deactivated_at && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">{p.deactivatedAtLabel}</span>
                    <p className="font-medium">{currentUser.deactivated_at}</p>
                    {currentUser.deactivated_reason && (
                      <p className="text-sm text-muted-foreground">{p.reasonLabel} {currentUser.deactivated_reason}</p>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <span className="text-muted-foreground">{p.notificationsLabel}</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline">{p.notificationsQuotes.replace("{count}", String(currentUser.quote_notification ?? 0))}</Badge>
                    <Badge variant="outline">{p.notificationsMessages.replace("{count}", String(currentUser.message_notification ?? 0))}</Badge>
                    <Badge variant="outline">{p.notificationsSupplierUpdates.replace("{count}", String(currentUser.supplier_update ?? 0))}</Badge>
                    <Badge variant="outline">{p.notificationsWeeklyDigest.replace("{count}", String(currentUser.weekly_digest ?? 0))}</Badge>
                    <Badge variant="outline">{p.notificationsMarketing.replace("{count}", String(currentUser.marketing_promotion ?? 0))}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border px-5 py-4 sm:px-6">
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>{c.close}</Button>
            <Button onClick={contactUser} disabled={contactingUserId !== null}>
              {contactingUserId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {c.contacting}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {c.contactUser}
                </>
              )}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
      {/* Deactivate single user dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AdminDialogContent size="md">
          <DialogHeader>
            <DialogTitle>{p.deactivateUser}</DialogTitle>
            <DialogDescription>{p.deactivateDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>{c.reason}</Label>
            <Textarea value={deactivateReason} onChange={(e) => setDeactivateReason((e.target as HTMLTextAreaElement).value)} placeholder={p.reasonForDeactivation} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={actionLoading}>{c.cancel}</Button>
            <Button onClick={async () => {
              if (!deactivateTarget) return
              await updateUserStatus(deactivateTarget, 'deactivated', deactivateReason)
              setDeactivateOpen(false)
              setDeactivateTarget(null)
              setDeactivateReason("")
            }} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {c.deactivate}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Delete single user dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AdminDialogContent size="md">
          <DialogHeader>
            <DialogTitle>{p.deleteUser}</DialogTitle>
            <DialogDescription>{p.deleteUserDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>{c.reason}</Label>
            <Textarea value={deleteReason} onChange={(e) => setDeleteReason((e.target as HTMLTextAreaElement).value)} placeholder={p.reasonForDeletion} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={actionLoading}>{c.cancel}</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteTarget) return
              await deleteUser(deleteTarget, deleteReason)
              setDeleteOpen(false)
              setDeleteTarget(null)
              setDeleteReason("")
            }} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {c.delete}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Bulk deactivate dialog */}
      <Dialog open={bulkDeactivateOpen} onOpenChange={setBulkDeactivateOpen}>
        <AdminDialogContent size="md">
          <DialogHeader>
            <DialogTitle>{p.bulkDeactivateTitle}</DialogTitle>
            <DialogDescription>{p.bulkDeactivateDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>{c.reason}</Label>
            <Textarea value={bulkDeactivateReason} onChange={(e) => setBulkDeactivateReason((e.target as HTMLTextAreaElement).value)} placeholder={p.reasonForBulkDeactivation} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeactivateOpen(false)} disabled={actionLoading}>{c.cancel}</Button>
            <Button onClick={async () => { await performBulkDeactivate(); }} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {c.deactivate}
            </Button>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>
    </div>
  )
}
