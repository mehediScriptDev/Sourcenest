import dynamic from "next/dynamic"
import { Header, HeaderSpacer } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import { IndustriesSection } from "@/components/home/industries-section"
import { WhatIsSection } from "@/components/home/what-is-section"

const FeaturedSuppliersSection = dynamic(
  () => import("@/components/home/featured-suppliers-section").then((m) => m.FeaturedSuppliersSection),
)
const HowItWorksSection = dynamic(
  () => import("@/components/home/how-it-works-section").then((m) => m.HowItWorksSection),
)
const FeaturedProductsSection = dynamic(
  () => import("@/components/home/featured-products-section").then((m) => m.FeaturedProductsSection),
)
const WhyUseSection = dynamic(
  () => import("@/components/home/why-use-section").then((m) => m.WhyUseSection),
)
const TrustSection = dynamic(
  () => import("@/components/home/trust-section").then((m) => m.TrustSection),
)
const TestimonialsSection = dynamic(
  () => import("@/components/home/testimonials-section").then((m) => m.TestimonialsSection),
)
const FaqSection = dynamic(
  () => import("@/components/home/faq-section").then((m) => m.FaqSection),
)
const CtaSection = dynamic(
  () => import("@/components/home/cta-section").then((m) => m.CtaSection),
)

export default function HomePage() {
  return (
    <>
      <HeaderSpacer />
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
        <main className="min-w-0 flex-1">
          <HeroSection />
          <IndustriesSection />
          <WhatIsSection />
          <FeaturedSuppliersSection />
          <HowItWorksSection />
          <FeaturedProductsSection />
          <WhyUseSection />
          <TrustSection />
          <TestimonialsSection />
          <FaqSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
      <Header />
    </>
  )
}
