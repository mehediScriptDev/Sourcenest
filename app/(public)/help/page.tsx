"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Users,
  Factory,
  CreditCard,
  Shield,
  Settings,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  FileQuestion,
} from "lucide-react"
import {
  defaultHelpCenterData,
  getEnabledCategories,
  getEnabledArticles,
  getEnabledPopularArticles,
  searchHelpArticles,
} from "@/lib/data/help-center"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Factory,
  CreditCard,
  Shield,
  Settings,
  HelpCircle,
}

export default function HelpCenterPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const data = defaultHelpCenterData
  const categories = getEnabledCategories(data)
  const popularArticles = getEnabledPopularArticles(data)
  const { settings } = data

  const trimmedQuery = searchQuery.trim()
  const isSearching = trimmedQuery.length > 0
  const searchResults = useMemo(
    () => searchHelpArticles(data, trimmedQuery),
    [data, trimmedQuery],
  )

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-8 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-serif text-3xl font-medium tracking-tight text-primary-foreground min-[400px]:text-4xl sm:text-5xl lg:text-6xl">
                {t?.help?.hero?.title}
              </h1>
              <p className="mt-3 text-sm text-primary-foreground/80 sm:mt-4 sm:text-base lg:text-lg">
                {t?.help?.hero?.subtitle}
              </p>

              <div className="mx-auto mt-8 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t?.help?.hero?.searchPlaceholder}
                    className="h-14 border-0 bg-background pl-12 pr-4 text-base shadow-lg"
                    aria-label={t?.help?.hero?.searchPlaceholder}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search results */}
        {isSearching && (
          <section className="border-b border-border py-8 sm:py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl font-medium text-foreground">
                {t?.help?.searchResultsTitle}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t?.help?.searchResultsCount?.replace("{count}", String(searchResults.length))}
              </p>

              {searchResults.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                  {searchResults.map((result) => (
                    <Link
                      key={`${result.categorySlug}-${result.article.slug}`}
                      href={`/help/${result.categorySlug}/${result.article.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
                    >
                      <div className="min-w-0 pr-3">
                        <span className="text-xs text-muted-foreground">
                          {result.categoryTitle}
                        </span>
                        <h3 className="mt-1 font-medium text-foreground group-hover:text-secondary">
                          {result.article.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {result.article.content}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-secondary" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-8 text-center sm:p-10">
                  <Search className="mx-auto h-10 w-10 text-muted-foreground/60" />
                  <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
                    {t?.help?.searchNoResults}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {t?.help?.searchNoResultsHint}
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="/faq">
                        <FileQuestion className="h-4 w-4" />
                        {t?.help?.searchViewFaq}
                      </Link>
                    </Button>
                    <Button asChild className="gap-2">
                      <Link href="/contact?type=support">
                        <MessageSquare className="h-4 w-4" />
                        {t?.help?.searchContactSupport}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Categories */}
        {!isSearching && (
          <section className="py-8 sm:py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl font-medium text-foreground">
                {t?.help?.browseCategoryTitle}
              </h2>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                {categories.map((category) => {
                  const Icon = iconMap[category.icon] || HelpCircle
                  const enabledArticles = getEnabledArticles(category)

                  return (
                    <Link
                      key={category.id}
                      href={`/help/${category.slug}`}
                      className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-lg sm:rounded-2xl sm:p-6"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                        <Icon className="h-6 w-6 text-secondary" />
                      </div>
                      <h3 className="mt-4 font-semibold text-foreground group-hover:text-secondary">
                        {category.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                      <ul className="mt-4 space-y-2">
                        {enabledArticles.slice(0, 3).map((article) => (
                          <li key={article.id} className="text-sm text-muted-foreground">
                            • {article.title}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-secondary">
                        {t?.help?.viewAllArticles}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Popular Articles */}
        {!isSearching && popularArticles.length > 0 && (
          <section className="bg-muted/50 py-8 sm:py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl font-medium text-foreground">
                {t?.help?.popularArticlesTitle}
              </h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {popularArticles.map((article) => {
                  const category = categories.find((c) => c.id === article.categoryId)

                  return (
                    <Link
                      key={article.id}
                      href={`/help/${article.categorySlug}/${article.articleSlug}`}
                      className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
                    >
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {category?.title || article.categorySlug}
                        </span>
                        <h3 className="mt-1 font-medium text-foreground group-hover:text-secondary">
                          {article.title}
                        </h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-secondary" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Contact Support */}
        {settings.contactSupport.enabled && (
          <section className="py-8 sm:py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl rounded-xl bg-primary p-5 text-center text-primary-foreground sm:rounded-2xl sm:p-8 lg:p-10">
                <MessageSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                <h2 className="mt-4 font-serif text-xl font-medium sm:mt-6 sm:text-2xl">
                  {t?.help?.contactSupport?.title}
                </h2>
                <p className="mt-4 text-primary-foreground/80">
                  {t?.help?.contactSupport?.subtitle}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/contact?type=support"
                    className="inline-flex items-center justify-center rounded-md bg-primary-foreground px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary-foreground/90"
                  >
                    {t?.help?.contactSupport?.contactButtonText}
                  </Link>
                  <Link
                    href="/faq"
                    className="inline-flex items-center justify-center rounded-md border border-primary-foreground/30 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                  >
                    {t?.help?.contactSupport?.faqButtonText}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
