import LegalPageView from "@/components/legal/legal-page-view"

export const metadata = {
  title: "Cookie Policy",
  description: "SourceNest cookie policy and how we use cookies on our website.",
}

export default function CookiesPage() {
  return <LegalPageView slug="cookies" fallbackTitle="Cookie Policy" />
}
