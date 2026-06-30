"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Camera,
  X,
  Loader2,
  Mic,
  RotateCcw,
  Square,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type LiveMediaCaptureMode = "image" | "video" | "audio"

interface LiveMediaCaptureProps {
  mode: LiveMediaCaptureMode
  onCapture: (file: File, previewUrl?: string) => void
  onCancel: () => void
}

function buildFileName(mode: LiveMediaCaptureMode, extension: string) {
  return `live-${mode}-${Date.now()}.${extension}`
}

export default function LiveMediaCapture({
  mode,
  onCapture,
  onCancel,
}: LiveMediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)

  const stopCamera = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    recorderRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraReady(false)
    setRecording(false)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setCameraReady(false)

      const constraints: MediaStreamConstraints =
        mode === "audio"
          ? { audio: true, video: false }
          : {
              audio: mode === "video",
              video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
            }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (mode !== "audio" && videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraReady(true)
    } catch (err) {
      const label =
        mode === "audio"
          ? "microphone"
          : mode === "video"
            ? "camera and microphone"
            : "camera"

      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setCameraError(
          `${label.charAt(0).toUpperCase() + label.slice(1)} access was denied. Live capture is required for this response.`
        )
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setCameraError(`No ${label} found on this device.`)
      } else {
        setCameraError(`Failed to access ${label}. Please try again.`)
      }
    }
  }, [mode])

  useEffect(() => {
    void startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    if (!recording) {
      return
    }

    const timer = window.setInterval(() => {
      setRecordSeconds((prev) => prev + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [recording])

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      return
    }

    setCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92)
      })

      if (!blob) {
        throw new Error("Failed to capture image")
      }

      const file = new File([blob], buildFileName("image", "jpg"), {
        type: "image/jpeg",
      })
      const previewUrl = URL.createObjectURL(blob)
      stopCamera()
      onCapture(file, previewUrl)
    } finally {
      setCapturing(false)
    }
  }

  const startRecording = () => {
    if (!streamRef.current || recording) {
      return
    }

    const mimeType =
      mode === "video"
        ? MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4"

    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const extension = "webm"
      const file = new File([blob], buildFileName(mode, extension), { type: mimeType })
      const previewUrl = mode === "video" ? URL.createObjectURL(blob) : undefined
      stopCamera()
      onCapture(file, previewUrl)
    }

    recorder.start()
    setRecording(true)
    setRecordSeconds(0)
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    setRecording(false)
  }

  const title =
    mode === "image" ? "Live Photo" : mode === "video" ? "Live Video" : "Live Audio"

  if (cameraError) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Camera Unavailable</h3>
          <p className="mt-2 text-sm text-white/70">{cameraError}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => void startCamera()} variant="secondary">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={onCancel} variant="ghost" className="text-white/60 hover:text-white">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-linear-to-b from-black/80 to-transparent px-4 pb-10 pt-4">
        <Button
          size="sm"
          variant="ghost"
          className="h-9 text-white hover:bg-white/10"
          onClick={() => {
            stopCamera()
            onCancel()
          }}
        >
          <X className="mr-1.5 h-4 w-4" />
          Cancel
        </Button>

        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">
            {title}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            Live capture only — no file uploads
          </p>
        </div>

        <div className="w-16" />
      </div>

      {mode !== "audio" ? (
        <div className="relative flex-1 overflow-hidden">
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
          )}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={cn(
              "h-full w-full object-cover transition-opacity",
              cameraReady ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      ) : (
        <div className="relative flex flex-1 items-center justify-center">
          <div className="text-center">
            <Mic
              className={cn(
                "mx-auto h-16 w-16",
                recording ? "text-red-400" : "text-white/60"
              )}
            />
            <p className="mt-4 text-lg font-medium text-white">
              {recording
                ? `Recording ${recordSeconds}s`
                : cameraReady
                  ? "Ready to record"
                  : "Starting microphone..."}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black/90 to-transparent px-4 pb-8 pt-16">
        <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-3">
          {mode === "image" && (
            <Button
              size="lg"
              className="h-14 min-w-40 rounded-full"
              onClick={() => void takePhoto()}
              disabled={!cameraReady || capturing}
            >
              {capturing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Capture Photo
                </>
              )}
            </Button>
          )}

          {(mode === "video" || mode === "audio") && (
            <>
              {!recording ? (
                <Button
                  size="lg"
                  className="h-14 min-w-40 rounded-full"
                  onClick={startRecording}
                  disabled={!cameraReady}
                >
                  {mode === "video" ? (
                    <>
                      <Video className="mr-2 h-5 w-5" />
                      Start Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Recording
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-14 min-w-40 rounded-full"
                  onClick={stopRecording}
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop Recording
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
