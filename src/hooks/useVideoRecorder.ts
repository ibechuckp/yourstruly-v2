'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseVideoRecorderOptions {
  /** Video quality: 'low' (360p), 'medium' (720p), 'high' (1080p) */
  quality?: 'low' | 'medium' | 'high'
  /** Max recording duration in seconds (default: 600 = 10 min) */
  maxDurationSeconds?: number
  /** Whether to include audio (default: false - audio handled by WebRTC) */
  includeAudio?: boolean
  /** Callback when recording stops */
  onRecordingComplete?: (blob: Blob) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

export interface UseVideoRecorderReturn {
  // State
  isSupported: boolean | null
  isActive: boolean
  isRecording: boolean
  isPaused: boolean
  duration: number
  error: Error | null
  
  // Video stream for preview
  videoStream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement>
  
  // Recording
  recordedBlob: Blob | null
  recordedUrl: string | null
  
  // Actions
  startCamera: () => Promise<void>
  stopCamera: () => void
  startRecording: () => void
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  reset: () => void
}

const QUALITY_SETTINGS = {
  low: { width: 640, height: 360, videoBitsPerSecond: 500000 },
  medium: { width: 1280, height: 720, videoBitsPerSecond: 1500000 },
  high: { width: 1920, height: 1080, videoBitsPerSecond: 4000000 },
}

/**
 * useVideoRecorder - Camera capture hook for video memory recording
 * 
 * Provides camera access and video recording with configurable quality.
 * Designed to work alongside the voice chat for combined audio/video memories.
 */
export function useVideoRecorder(options: UseVideoRecorderOptions = {}): UseVideoRecorderReturn {
  const {
    quality = 'medium',
    maxDurationSeconds = 600,
    includeAudio = false,
    onRecordingComplete,
    onError,
  } = options

  // Check browser support - delay until mount
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  
  // State
  const [isActive, setIsActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Check support on mount
  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      !!(navigator.mediaDevices?.getUserMedia) &&
      !!(window.MediaRecorder)
    )
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [])

  // Attach stream to video element when stream changes or element becomes available
  useEffect(() => {
    if (videoStream && videoRef.current && videoRef.current.srcObject !== videoStream) {
      videoRef.current.srcObject = videoStream
      videoRef.current.play().catch(console.error)
    }
  }, [videoStream, isActive])

  // Start camera preview
  const startCamera = useCallback(async () => {
    if (!isSupported) {
      const err = new Error('Video recording not supported in this browser')
      setError(err)
      onError?.(err)
      return
    }

    try {
      const settings = QUALITY_SETTINGS[quality]
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: settings.width },
          height: { ideal: settings.height },
          facingMode: 'user',
        },
        audio: includeAudio,
      })

      setVideoStream(stream)
      setIsActive(true)
      setError(null)

      // Attach to video element for preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(console.error)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    }
  }, [isSupported, quality, includeAudio, onError])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
      setVideoStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    setIsActive(false)
    setIsRecording(false)
    setIsPaused(false)
  }, [videoStream])

  // Start recording
  const startRecording = useCallback(() => {
    if (!videoStream || isRecording) return

    try {
      const settings = QUALITY_SETTINGS[quality]
      
      // Check supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : 'video/mp4'

      const recorder = new MediaRecorder(videoStream, {
        mimeType,
        videoBitsPerSecond: settings.videoBitsPerSecond,
      })

      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        
        // Create object URL for preview
        if (recordedUrl) {
          URL.revokeObjectURL(recordedUrl)
        }
        const url = URL.createObjectURL(blob)
        setRecordedUrl(url)
        
        onRecordingComplete?.(blob)
      }

      recorder.onerror = (event: Event) => {
        const err = new Error('Recording error')
        setError(err)
        onError?.(err)
      }

      // Start recording with 1-second chunks
      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setIsPaused(false)
      startTimeRef.current = Date.now()

      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setDuration(elapsed)

          // Auto-stop if max duration reached
          if (elapsed >= maxDurationSeconds) {
            stopRecording()
          }
        }
      }, 1000)

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    }
  }, [videoStream, isRecording, quality, maxDurationSeconds, recordedUrl, onRecordingComplete, onError])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    setIsRecording(false)
    setIsPaused(false)
  }, [])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
    }
  }, [])

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
    }
  }, [])

  // Reset state
  const reset = useCallback(() => {
    stopCamera()
    
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)
    setError(null)
    chunksRef.current = []
    startTimeRef.current = null
  }, [stopCamera, recordedUrl])

  return {
    isSupported,
    isActive,
    isRecording,
    isPaused,
    duration,
    error,
    videoStream,
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    recordedBlob,
    recordedUrl,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
  }
}
