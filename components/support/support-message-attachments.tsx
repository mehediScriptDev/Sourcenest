import Link from "next/link"
import { Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

export const SUPPORT_ATTACHMENT_ACCEPT =
  ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"

export interface SupportAttachment {
  id: number
  originalName: string
  url: string
  fileMime?: string
}

interface SupportMessageAttachmentsProps {
  attachments: SupportAttachment[]
  className?: string
  linkClassName?: string
}

export function SupportMessageAttachments({
  attachments,
  className,
  linkClassName,
}: SupportMessageAttachmentsProps) {
  if (!attachments.length) return null

  return (
    <div className={cn("mt-2 space-y-1.5", className)}>
      {attachments.map((attachment) => {
        const isImage = attachment.fileMime?.startsWith("image/") && attachment.url
        return (
          <div key={attachment.id}>
            {isImage ? (
              <Link href={attachment.url} target="_blank" rel="noreferrer" className="block">
                <img
                  src={attachment.url}
                  alt={attachment.originalName}
                  className="max-h-40 max-w-full rounded-md border border-border/50 object-cover"
                />
              </Link>
            ) : (
              <Link
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs underline-offset-2 hover:underline",
                  linkClassName,
                )}
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{attachment.originalName}</span>
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface SupportComposerAttachmentsProps {
  files: File[]
  onRemove: (index: number) => void
}

export function SupportComposerAttachments({ files, onRemove }: SupportComposerAttachmentsProps) {
  if (!files.length) return null

  return (
    <div className="flex flex-wrap gap-2 border-b border-border px-2 py-2">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex max-w-[200px] items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs"
        >
          <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-foreground">{file.name}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="shrink-0 rounded-full px-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Remove ${file.name}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
