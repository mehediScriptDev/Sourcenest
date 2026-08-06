import LegalPageView from "@/components/legal/legal-page-view"

export const metadata = {
  title: "Terms of Service",
  description: "SourceNest terms of service and user agreement.",
}

export default function TermsPage() {
  return <LegalPageView slug="terms" fallbackTitle="Terms of Service" />
}
