"use client"

import { Suspense } from "react"
import ReviewCenter from "@/components/manufacturers/review-center"

export default function ManufacturerReviewCenterPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <ReviewCenter />
    </Suspense>
  )
}
