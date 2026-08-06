import LegalPageView from "@/components/legal/legal-page-view"

export const metadata = {
  title: "Privacy Policy",
  description: "SourceNest privacy policy and data protection information.",
}

export default function PrivacyPage() {
  return <LegalPageView slug="privacy" fallbackTitle="Privacy Policy" />
}
