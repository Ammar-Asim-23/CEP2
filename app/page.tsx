"use client"

import { useState } from "react"
import ObjectDetection from "@/components/object-detection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [isStarted, setIsStarted] = useState(false)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Real-time Object Detection</CardTitle>
          <CardDescription>Detects books (red boxes) and laptops (blue boxes) using your webcam</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {!isStarted ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-center text-muted-foreground mb-4">
                This app will access your webcam to detect books and laptops in real-time.
                <br />
                Your video stream is processed locally and is not sent to any server.
              </p>
              <Button size="lg" onClick={() => setIsStarted(true)}>
                Start Detection
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <ObjectDetection />
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={() => setIsStarted(false)}>
                  Stop Detection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
