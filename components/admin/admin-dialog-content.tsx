"use client"

import * as React from "react"
import { DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type AdminDialogMobileLayout = "inset" | "fullscreen"
export type AdminDialogSize = "sm" | "md" | "lg" | "xl" | "3xl" | "5xl"

const desktopSizeClasses: Record<AdminDialogSize, string> = {
  sm: "sm:max-w-lg",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
  "3xl": "sm:max-w-3xl",
  "5xl": "sm:max-w-5xl",
}

/** Equal viewport margin on all sides (px + py). */
const mobileInsetClasses =
  "max-sm:!h-auto max-sm:!w-[calc(100%-2rem)] max-sm:!max-w-[calc(100%-2rem)] max-sm:!max-h-[calc(100dvh-2rem)] sm:max-h-[min(92dvh,56rem)]"

/** Edge-to-edge on mobile — no viewport px/py. */
const mobileFullscreenClasses = [
  "max-sm:!inset-0 max-sm:!top-0 max-sm:!left-0 max-sm:!translate-x-0 max-sm:!translate-y-0",
  "max-sm:!h-[100dvh] max-sm:!max-h-[100dvh] max-sm:!w-full max-sm:!max-w-full",
  "max-sm:!rounded-none max-sm:border-0",
  "sm:max-h-[min(92dvh,56rem)]",
].join(" ")

const mobileLayoutClasses: Record<AdminDialogMobileLayout, string> = {
  inset: mobileInsetClasses,
  fullscreen: mobileFullscreenClasses,
}

interface AdminDialogContentProps extends React.ComponentProps<typeof DialogContent> {
  variant?: "simple" | "structured"
  mobile?: AdminDialogMobileLayout
  size?: AdminDialogSize
}

export function AdminDialogContent({
  className,
  variant = "simple",
  mobile = "inset",
  size = "lg",
  children,
  ...props
}: AdminDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        mobileLayoutClasses[mobile],
        desktopSizeClasses[size],
        variant === "structured"
          ? "flex flex-col gap-0 overflow-hidden p-0"
          : "overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </DialogContent>
  )
}
