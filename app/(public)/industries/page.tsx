import { Suspense } from "react"
import { Metadata } from "next"
import { SiteHeader } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { IndustriesPageContent } from "@/components/industries/industries-page-content"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Industries",
  description: "Explore reviewed suppliers and manufacturers across all major industries on SourceNest.",
}

export default function IndustriesPage() {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="flex flex-1 items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
        }
      >
        <IndustriesPageContent />
      </Suspense>
      <Footer />
    </div>
  )
}
