"use client"

import { useRef, useEffect, useState } from "react"
import Webcam from "react-webcam"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface Prediction {
  bbox: [number, number, number, number]
  class: string
  score: number
}

export default function ObjectDetection() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isModelLoading, setIsModelLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [backendStatus, setBackendStatus] = useState<string>("connecting")
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [detectionCount, setDetectionCount] = useState({ book: 0, laptop: 0 })
  const [fps, setFps] = useState(0)
  const [lastFrameTime, setLastFrameTime] = useState(0)

  const API_URL = "http://localhost:8000/detect"

  const captureAndDetect = async () => {
    if (!webcamRef.current || !canvasRef.current || !isDetecting) return

    const video = webcamRef.current.video
    if (!video || video.readyState !== 4) {
      requestAnimationFrame(captureAndDetect)
      return
    }

    const now = performance.now()
    if (lastFrameTime > 0) {
      const delta = now - lastFrameTime
      setFps(Math.round(1000 / delta))
    }
    setLastFrameTime(now)

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) {
        requestAnimationFrame(captureAndDetect)
        return
      }

      const base64Data = imageSrc.split(",")[1]
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then((res) => res.blob())

      const formData = new FormData()
      formData.append("file", blob, "webcam.jpg")

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
        console.error("Backend error:", errorData)
        setConsecutiveErrors((prev) => prev + 1)

        if (consecutiveErrors > 5) {
          throw new Error(`Backend error: ${errorData.detail || response.statusText}`)
        }
      } else {
        setConsecutiveErrors(0)
        const data = await response.json()

        const bookCount = data.predictions.filter((p: Prediction) => p.class === "book").length
        const laptopCount = data.predictions.filter((p: Prediction) => p.class === "laptop").length

        setDetectionCount({
          book: bookCount,
          laptop: laptopCount,
        })

        drawDetections(data.predictions)
      }
    } catch (err) {
      console.error("Detection error:", err)
      if (consecutiveErrors > 5) {
        setError(`Detection error: ${err instanceof Error ? err.message : String(err)}`)
        setIsDetecting(false)
        return
      }
    }

    requestAnimationFrame(captureAndDetect)
  }

  const drawDetections = (predictions: Prediction[]) => {
    if (!canvasRef.current || !webcamRef.current?.video) return

    const video = webcamRef.current.video
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    canvasRef.current.width = videoWidth
    canvasRef.current.height = videoHeight

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, videoWidth, videoHeight)

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox

      if (prediction.class === "book") {
        ctx.strokeStyle = "red"
        ctx.fillStyle = "red"
      } else if (prediction.class === "laptop") {
        ctx.strokeStyle = "blue"
        ctx.fillStyle = "blue"
      }

      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.stroke()

      const label =
        prediction.class === "book"
          ? `Book ${Math.round(prediction.score * 100)}%`
          : `Laptop ${Math.round(prediction.score * 100)}%`
      const textWidth = ctx.measureText(label).width
      ctx.fillRect(x, y - 20, textWidth + 10, 20)

      ctx.fillStyle = "white"
      ctx.font = "16px Arial"
      ctx.fillText(label, x + 5, y - 5)
    })
  }

  const forceStartDetection = () => {
    setError(null)
    setIsModelLoading(false)
    setIsDetecting(true)
    setBackendStatus("ready")
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      setLoadingTimeout(null)
    }
  }

  const retryConnection = () => {
    setError(null)
    setIsModelLoading(true)
    setConsecutiveErrors(0)
    checkBackend()
  }

  const checkBackend = async () => {
    try {
      setBackendStatus("connecting")

      const timeout = setTimeout(() => {
        console.log("Loading timeout reached, forcing start")
        forceStartDetection()
      }, 30000)

      setLoadingTimeout(timeout)

      console.log("Checking backend status...")
      const response = await fetch("http://localhost:8000/")
      console.log("Backend response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Backend response data:", data)

        if (data.model_loaded) {
          if (loadingTimeout) {
            clearTimeout(loadingTimeout)
            setLoadingTimeout(null)
          }
          setBackendStatus("ready")
          setIsModelLoading(false)
          setIsDetecting(true)
        } else {
          setBackendStatus("model_loading")
          setTimeout(checkBackend, 2000)
        }
      } else {
        if (loadingTimeout) {
          clearTimeout(loadingTimeout)
          setLoadingTimeout(null)
        }
        setError("Backend service returned an error. Please check the Python server logs.")
        setBackendStatus("error")
        setIsModelLoading(false)
      }
    } catch (err) {
      console.error("Backend connection error:", err)
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
        setLoadingTimeout(null)
      }
      setError("Cannot connect to the backend. Please make sure the Python server is running.")
      setBackendStatus("error")
      setIsModelLoading(false)
    }
  }

  useEffect(() => {
    checkBackend()
    return () => {
      setIsDetecting(false)
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
    }
  }, [])

  useEffect(() => {
    if (!isModelLoading && isDetecting) {
      captureAndDetect()
    }

    return () => {
      setIsDetecting(false)
    }
  }, [isModelLoading, isDetecting])

  return (
    <div className="relative flex flex-col justify-center">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="flex gap-2 mt-2">
            <Button onClick={retryConnection} className="bg-blue-500 hover:bg-blue-600 text-white">
              Retry Connection
            </Button>
            <Button onClick={forceStartDetection} className="bg-gray-500 hover:bg-gray-600 text-white">
              Force Start Anyway
            </Button>
          </div>
        </Alert>
      )}

      {isModelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-lg shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>
              {backendStatus === "connecting" && "Connecting to Python backend..."}
              {backendStatus === "model_loading" && "Loading YOLOv8 model... (this may take a minute)"}
            </p>
            <Button onClick={forceStartDetection} className="mt-2 bg-gray-500 hover:bg-gray-600 text-white">
              Start Anyway
            </Button>
          </div>
        </div>
      )}

      <Webcam
        ref={webcamRef}
        muted={true}
        className="rounded-lg"
        style={{
          width: "100%",
          height: "auto",
        }}
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
        }}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.8}
      />

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-10"
        style={{
          width: "100%",
          height: "auto",
        }}
      />

      {!isModelLoading && (
        <div className="mt-2 text-sm text-gray-600 flex justify-between">
          <p>
            Detected: {detectionCount.book} books, {detectionCount.laptop} laptops
          </p>
          <p>FPS: {fps}</p>
        </div>
      )}
    </div>
  )
}
