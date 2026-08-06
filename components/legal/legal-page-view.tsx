"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Loader2 } from "lucide-react"
import { fetchLegalPageBySlug } from "@/lib/api/legal-pages"
import type { LegalPage } from "@/lib/api/legal-pages"

interface LegalPageViewProps {
  slug: "privacy" | "terms" | "cookies"
  fallbackTitle: string
}

export default function LegalPageView({ slug, fallbackTitle }: LegalPageViewProps) {
  const [page, setPage] = useState<LegalPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchLegalPageBySlug(slug)
        if (active) {
          setPage(data)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [slug])

  const title = page?.title || fallbackTitle
  const lastUpdated = page?.last_updated || ""
  const sections = page?.sections ?? []

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl font-medium text-foreground min-[400px]:text-4xl sm:text-5xl">
                {title}
              </h1>
              {lastUpdated ? (
                <p className="mt-4 text-muted-foreground">Last updated: {lastUpdated}</p>
              ) : null}

              <div className="prose prose-neutral mt-8 max-w-none">
                {sections.length > 0 ? (
                  sections.map((section) => (
                    <div key={section.id}>
                      <h2 className="mt-8 font-serif text-2xl font-medium text-foreground">
                        {section.title}
                      </h2>
                      <p className="mt-4 whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Content is not available yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
