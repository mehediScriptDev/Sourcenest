"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function HeroSearchForm() {
  const { t } = useTranslation()
  const hero = t.landing.hero
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl sm:mt-10">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={hero.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 border-0 bg-background pl-12 pr-4 text-base shadow-lg sm:h-14"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full bg-secondary px-8 text-secondary-foreground hover:bg-secondary/90 sm:h-14 sm:w-auto"
        >
          {hero.searchButton}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
