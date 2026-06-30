"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  submitAdditionalInformation,
  type AdditionalInformationRequest,
  type AdditionalInformationResponseItem,
  type AdditionalInformationResponseType,
} from "@/lib/api/manufacturer-additional-information"
import { clearAdditionalInfoStorage } from "@/lib/additional-information-storage"
import { getApiErrorMessage } from "@/lib/api/errors"
import LiveMediaCapture, { type LiveMediaCaptureMode } from "./live-media-capture"
import {
  Camera,
  FileText,
  Loader2,
  Mic,
  Paperclip,
  Send,
  Trash2,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DraftResponse {
  id: string
  item: AdditionalInformationResponseItem
  previewUrl?: string
  label: string
}

interface AdditionalInformationSubmitProps {
  request: AdditionalInformationRequest
  embedded?: boolean
  submitDisabled?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

const TYPE_ICONS: Record<AdditionalInformationResponseType, typeof FileText> = {
  text: FileText,
  image: Camera,
  video: Video,
  audio: Mic,
  document: Paperclip,
}

function typeLabel(
  type: AdditionalInformationResponseType,
  request: AdditionalInformationRequest
) {
  const index = request.allowed_types.indexOf(type)
  return request.allowed_type_labels[index] || type
}

export default function AdditionalInformationSubmit({
  request,
  embedded = false,
  submitDisabled = false,
  onSuccess,
  onCancel,
}: AdditionalInformationSubmitProps) {
  const { toast } = useToast()
  const documentInputRef = useRef<HTMLInputElement>(null)

  const [draftText, setDraftText] = useState("")
  const [responses, setResponses] = useState<DraftResponse[]>([])
  const [activeCapture, setActiveCapture] = useState<LiveMediaCaptureMode | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const allowedTypes = useMemo(
    () => request.allowed_types.filter((type) => TYPE_ICONS[type]),
    [request.allowed_types]
  )

  const addTextResponse = () => {
    const message = draftText.trim()
    if (!message) {
      toast({
        title: "Message required",
        description: "Enter a text message before adding it.",
        variant: "destructive",
      })
      return
    }

    setResponses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        item: { type: "text", message },
        label: message.slice(0, 80),
      },
    ])
    setDraftText("")
  }

  const handleLiveCapture = (file: File, previewUrl?: string) => {
    if (!activeCapture) {
      return
    }

    setResponses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        item: { type: activeCapture, file },
        previewUrl,
        label: file.name,
      },
    ])
    setActiveCapture(null)
  }

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setResponses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        item: { type: "document", file, message: file.name },
        label: file.name,
      },
    ])

    event.target.value = ""
  }

  const removeResponse = (id: string) => {
    setResponses((prev) => {
      const target = prev.find((entry) => entry.id === id)
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((entry) => entry.id !== id)
    })
  }

  const handleSubmit = async () => {
    if (submitDisabled) {
      toast({
        title: "Cannot submit",
        description:
          "This request is no longer pending. Ask the admin team to reopen it or send a new request.",
        variant: "destructive",
      })
      return
    }

    if (responses.length === 0) {
      toast({
        title: "Nothing to submit",
        description: "Add at least one response before submitting.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const result = await submitAdditionalInformation(
        request.token,
        responses.map((entry) => entry.item)
      )

      if (result.success === false) {
        throw new Error(result.message || "Submission failed")
      }

      responses.forEach((entry) => {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl)
        }
      })

      clearAdditionalInfoStorage()

      toast({
        title: "Submitted",
        description: result.message || "Your additional information was sent to the admin team.",
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: "Submission failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (activeCapture) {
    return (
      <LiveMediaCapture
        mode={activeCapture}
        onCapture={handleLiveCapture}
        onCancel={() => setActiveCapture(null)}
      />
    )
  }

  const formBody = (
    <>
      {!embedded && (
        <CardHeader>
          <CardTitle className="text-lg">Submit Additional Information</CardTitle>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Admin message
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{request.message}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary">{request.status_label}</Badge>
            {request.expires_at && (
              <Badge variant="outline">
                Expires {new Date(request.expires_at).toLocaleString()}
              </Badge>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className={cn("space-y-6", embedded && "p-0")}>
        {embedded && (
          <div className="rounded-lg border-2 border-dashed border-amber-300/80 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Submit your response here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add text, documents, or use the live camera buttons below. Photos and videos must be captured live — no gallery uploads.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Choose how to respond</Label>
          <div className="flex flex-wrap gap-2">
            {allowedTypes.map((type) => {
              const Icon = TYPE_ICONS[type]
              const isLiveCapture = type === "image" || type === "video" || type === "audio"

              return (
                <Button
                  key={type}
                  type="button"
                  variant={isLiveCapture ? "default" : "outline"}
                  size={isLiveCapture ? "lg" : "sm"}
                  className={cn("gap-2", isLiveCapture && "min-w-[140px]")}
                  onClick={() => {
                    if (type === "text") {
                      return
                    }
                    if (type === "document") {
                      documentInputRef.current?.click()
                      return
                    }
                    setActiveCapture(type as LiveMediaCaptureMode)
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {isLiveCapture ? `Open ${typeLabel(type, request)}` : typeLabel(type, request)}
                </Button>
              )
            })}
          </div>
          <input
            ref={documentInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,application/pdf"
            onChange={handleDocumentSelect}
          />
        </div>

        {allowedTypes.includes("text") && (
          <div className="space-y-2">
            <Label htmlFor="additional-info-text">Text message</Label>
            <Textarea
              id="additional-info-text"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              placeholder="Type your message..."
              className="min-h-24"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTextResponse}>
              Add Text Response
            </Button>
          </div>
        )}

        {responses.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Responses to submit</Label>
            <div className="space-y-2">
              {responses.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {entry.item.type}
                      </Badge>
                      <span className="truncate text-sm">{entry.label}</span>
                    </div>
                    {entry.previewUrl && entry.item.type === "image" && (
                      <img
                        src={entry.previewUrl}
                        alt={entry.label}
                        className="mt-2 h-20 w-20 rounded-md object-cover"
                      />
                    )}
                    {entry.previewUrl && entry.item.type === "video" && (
                      <video
                        src={entry.previewUrl}
                        controls
                        className="mt-2 max-h-32 rounded-md"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResponse(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || responses.length === 0}
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit to Admin
              </>
            )}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </>
  )

  if (embedded) {
    return formBody
  }

  return (
    <Card className="overflow-hidden border-l-4 border-l-amber-500">
      {formBody}
    </Card>
  )
}
