"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n"
import {
  activateAccount,
  deactivateAccount,
  requestAccountDeletion,
} from "@/lib/api/account"
import { getApiErrorMessage } from "@/lib/api/errors"
import { Loader2 } from "lucide-react"

export function AccountDangerZone() {
  const { toast } = useToast()
  const router = useRouter()
  const { logout } = useAuth()
  const { t } = useTranslation()

  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [deactivatePassword, setDeactivatePassword] = useState("")
  const [deactivateReason, setDeactivateReason] = useState("")
  const [activatePassword, setActivatePassword] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteReason, setDeleteReason] = useState("")

  const [loading, setLoading] = useState<"deactivate" | "activate" | "delete" | null>(null)

  const resetDeactivate = () => {
    setDeactivatePassword("")
    setDeactivateReason("")
  }

  const resetActivate = () => {
    setActivatePassword("")
  }

  const resetDelete = () => {
    setDeletePassword("")
    setDeleteReason("")
  }

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading("deactivate")
    try {
      const res = await deactivateAccount(
        deactivatePassword,
        deactivateReason.trim() || undefined
      )
      if (res.success) {
        toast({
          title: "Account deactivated",
          description: res.message || "Your account has been deactivated.",
        })
        setDeactivateOpen(false)
        resetDeactivate()
        logout()
        router.push("/auth/signin")
      } else {
        toast({
          title: "Could not deactivate",
          description: res.message || "Please check your password and try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Could not deactivate",
        description: getApiErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading("activate")
    try {
      const res = await activateAccount(activatePassword)
      if (res.success) {
        toast({
          title: "Account active",
          description: res.message || "Your account is active again.",
        })
        setActivateOpen(false)
        resetActivate()
      } else {
        toast({
          title: "Could not activate",
          description: res.message || "Please check your password and try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Could not activate",
        description: getApiErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading("delete")
    try {
      const res = await requestAccountDeletion(deletePassword, deleteReason.trim() || "User request")
      if (res.success) {
        toast({
          title: "Deletion requested",
          description:
            res.message ||
            "If your account was scheduled for deletion, follow the email instructions or use Restore account on the sign-in page.",
        })
        setDeleteOpen(false)
        resetDelete()
        logout()
        router.push("/auth/signin")
      } else {
        toast({
          title: "Request failed",
          description: res.message || "Please check your password and try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Request failed",
        description: getApiErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">{t.settings.accountStatus}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t.settings.deactivateAccount}</p>
            <p className="text-sm text-muted-foreground">
              {t.settings.deactivateDesc}
            </p>
          </div>
          <Dialog
            open={deactivateOpen}
            onOpenChange={(o) => {
              setDeactivateOpen(o)
              if (!o) resetDeactivate()
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                {t.settings.deactivateBtn}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleDeactivate}>
                <DialogHeader>
                  <DialogTitle>{t.settings.deactivateAccount}</DialogTitle>
                  <DialogDescription>
                    {t.settings.confirmPassword}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deactivate-pw">{t.settings.passwordLabel}</Label>
                    <Input
                      id="deactivate-pw"
                      type="password"
                      autoComplete="current-password"
                      value={deactivatePassword}
                      onChange={(e) => setDeactivatePassword(e.target.value)}
                      required
                      disabled={loading === "deactivate"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deactivate-reason">{t.settings.reasonOptional}</Label>
                    <Textarea
                      id="deactivate-reason"
                      value={deactivateReason}
                      onChange={(e) => setDeactivateReason(e.target.value)}
                      rows={2}
                      disabled={loading === "deactivate"}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" variant="destructive" disabled={loading === "deactivate"}>
                    {loading === "deactivate" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.settings.deactivating}
                      </>
                    ) : (
                      t.settings.confirmDeactivation
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t.settings.reactivateAccount}</p>
              <p className="text-sm text-muted-foreground">
                {t.settings.reactivateDesc}
              </p>
            </div>
            <Dialog
              open={activateOpen}
              onOpenChange={(o) => {
                setActivateOpen(o)
                if (!o) resetActivate()
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  {t.settings.reactivateBtn}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleActivate}>
                  <DialogHeader>
                    <DialogTitle>{t.settings.reactivateAccount}</DialogTitle>
                    <DialogDescription>{t.settings.enterPasswordToRestore}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="activate-pw">{t.settings.passwordLabel}</Label>
                      <Input
                        id="activate-pw"
                        type="password"
                        autoComplete="current-password"
                        value={activatePassword}
                        onChange={(e) => setActivatePassword(e.target.value)}
                        required
                        disabled={loading === "activate"}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading === "activate"}>
                      {loading === "activate" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.settings.reactivating}
                        </>
                      ) : (
                        t.settings.reactivateBtn
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t.settings.deleteAccount}</p>
              <p className="text-sm text-muted-foreground">
                {t.settings.deleteDesc}
              </p>
            </div>
            <Dialog
              open={deleteOpen}
              onOpenChange={(o) => {
                setDeleteOpen(o)
                if (!o) resetDelete()
              }}
            >
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0">
                  {t.settings.deleteAccount}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleDelete}>
                  <DialogHeader>
                    <DialogTitle>{t.settings.deleteAccount}</DialogTitle>
                    <DialogDescription>
                      {t.settings.deleteRequestDesc}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="delete-pw">{t.settings.passwordLabel}</Label>
                      <Input
                        id="delete-pw"
                        type="password"
                        autoComplete="current-password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        required
                        disabled={loading === "delete"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delete-reason">{t.settings.reasonRequired}</Label>
                      <Textarea
                        id="delete-reason"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        rows={2}
                        placeholder={t.settings.reasonPlaceholder}
                        disabled={loading === "delete"}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" variant="destructive" disabled={loading === "delete"}>
                      {loading === "delete" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.settings.submitting}
                        </>
                      ) : (
                        t.settings.submitDeletionRequest
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {t.settings.startedDeletionMistake}{" "}
          <Link href="/auth/restore-account" className="font-medium text-secondary hover:underline">
            {t.settings.restoreAccount}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
