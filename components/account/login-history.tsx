"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/lib/i18n"

type LoginEntry = {
  id: number
  ip_address: string
  user_agent: string
  device_name: string | null
  logged_in_at: string
}

export default function AccountLoginHistory({ backHref }: { backHref: string }) {
  const { t } = useTranslation()
  const [items, setItems] = useState<LoginEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await apiClient.get(`/account/login-history?page=${page}`)
        if (cancelled) return
        const payload = res.data
        setItems(Array.isArray(payload.data) ? payload.data : [])
        setMeta(payload.meta ?? null)
      } catch (err) {
        setItems([])
        setMeta(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [page])

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{t.mfg.loginHistory.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.mfg.loginHistory.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href={backHref}>{t.common.back}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.mfg.loginHistory.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.mfg.loginHistory.timestamp}</TableHead>
                    <TableHead>{t.mfg.loginHistory.ipAddress}</TableHead>
                    <TableHead>{t.mfg.loginHistory.device}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        {t.common.noResults}
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="whitespace-nowrap">{it.logged_in_at}</TableCell>
                      <TableCell className="whitespace-nowrap">{it.ip_address}</TableCell>
                      <TableCell className="max-w-0 truncate">{it.device_name ?? it.user_agent}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {meta && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.links || !meta.links.find((l: any) => l.active && l.page > 1)}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t.common.back}
              </Button>
              <span className="text-sm text-muted-foreground">Page {meta.current_page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                {t.common.next}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
