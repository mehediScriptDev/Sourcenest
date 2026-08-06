"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle } from "lucide-react"

interface SupportErrorDialogProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
  closeLabel?: string
}

export function SupportErrorDialog({
  open,
  title,
  message,
  onClose,
  closeLabel = "OK",
}: SupportErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-wrap text-left text-sm leading-relaxed text-muted-foreground">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>{closeLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
