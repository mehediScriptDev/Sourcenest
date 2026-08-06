"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { 
  ArrowLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react"
import { 
  defaultHelpCenterData, 
  getCategoryBySlug, 
  getArticleBySlug,
  getCategoryNames 
} from "@/lib/data/help-center"

export default function HelpArticlePage({ params }: { params: Promise<{ category: string; article: string }> }) {
  const { t } = useTranslation()
  const { category, article } = use(params)
  
  const categoryData = getCategoryBySlug(defaultHelpCenterData, category)
  if (!categoryData) {
    notFound()
  }
  
  const articleData = getArticleBySlug(categoryData, article)
  if (!articleData) {
    notFound()
  }

  const categoryNames = getCategoryNames(defaultHelpCenterData)

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="border-b border-border bg-muted/50 py-4">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/help" className="text-muted-foreground hover:text-foreground">
                {t?.help?.backToHelp}
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Link href={`/help/${category}`} className="text-muted-foreground hover:text-foreground">
                {categoryNames[category] || categoryData.title}
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground truncate max-w-[200px]">{articleData.title}</span>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Link 
              href={`/help/${category}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {categoryData.title}
            </Link>

            <article className="prose prose-slate max-w-none">
              <h1 className="mb-4 font-serif text-2xl font-medium text-foreground sm:mb-6 sm:text-3xl lg:text-4xl">
                {articleData.title}
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                {articleData.content}
              </p>

              {articleData.steps && articleData.steps.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6 my-8">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Step-by-step guide</h2>
                  <ol className="space-y-3">
                    {articleData.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                          {index + 1}
                        </span>
                        <span className="text-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </article>

            {/* Support */}
            <div className="mt-12 rounded-xl border border-border bg-muted/50 p-6 text-center">
              <Link 
                href="/contact?type=support" 
                className="inline-flex items-center gap-2 text-sm text-secondary hover:underline"
              >
                <MessageSquare className="h-4 w-4" />
                Still need help? {t?.help?.contactSupportCta}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
