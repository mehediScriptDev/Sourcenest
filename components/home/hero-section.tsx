import { Globe, Shield, MessageSquare } from "lucide-react"
import { HeroSearchForm } from "@/components/home/hero-search-form"
import { HeroLocaleSync } from "@/components/home/hero-locale-sync"
import { HeroPopularCategories } from "@/components/home/hero-popular-categories"
import en from "@/lib/i18n/locales/en"

const hero = en.landing.hero

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary">
      <div className="absolute inset-0 opacity-5" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div id="hero-locale-root" className="relative mx-auto max-w-7xl px-4 py-12 pb-16 sm:px-6 sm:py-16 sm:pb-20 lg:px-8 lg:py-16 lg:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary/20 px-3 py-1.5 text-xs text-primary-foreground sm:mb-6 sm:px-4 sm:text-sm">
            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            <span data-hero="badge">{hero.badge}</span>
          </div>

          <h1 className="font-serif text-3xl font-medium tracking-tight text-primary-foreground min-[400px]:text-4xl sm:text-5xl lg:text-6xl">
            <span className="block text-balance" data-hero="title1">
              {hero.title1}
            </span>
            <span className="block text-balance" data-hero="title2">
              {hero.title2}
            </span>
          </h1>

          <p
            data-hero="subtitle"
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/80 sm:mt-6 sm:text-xl"
          >
            {hero.subtitle}
          </p>

          <HeroSearchForm />

          <HeroPopularCategories />

          <div className="mt-10 grid grid-cols-3 gap-3 sm:mt-14 sm:gap-6">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 sm:h-12 sm:w-12">
                <Globe className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" aria-hidden />
              </div>
              <span className="text-lg font-semibold text-primary-foreground sm:text-2xl">50+</span>
              <span data-hero="statCountries" className="text-xs text-primary-foreground/70 sm:text-sm">
                {hero.statCountries}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 sm:h-12 sm:w-12">
                <Shield className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" aria-hidden />
              </div>
              <span className="text-lg font-semibold text-primary-foreground sm:text-2xl">100%</span>
              <span data-hero="statReviewed" className="text-xs text-primary-foreground/70 sm:text-sm">
                {hero.statReviewed}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 sm:h-12 sm:w-12">
                <MessageSquare className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" aria-hidden />
              </div>
              <span data-hero="statDirectPrefix" className="text-lg font-semibold text-primary-foreground sm:text-2xl">
                {hero.statDirectPrefix}
              </span>
              <span data-hero="statDirect" className="text-xs text-primary-foreground/70 sm:text-sm">
                {hero.statDirect}
              </span>
            </div>
          </div>
        </div>
      </div>

      <HeroLocaleSync initial={hero} />

      <div className="absolute bottom-0 left-0 right-0 leading-0" aria-hidden>
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-[60px] w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60V30C240 50 480 60 720 50C960 40 1200 10 1440 30V60H0Z"
            className="fill-[color-mix(in_oklch,var(--muted)_50%,var(--background))]"
          />
        </svg>
      </div>
    </section>
  )
}
