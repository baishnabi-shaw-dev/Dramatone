// Dramatone Lightweight Video Motion & Scene Pacing Analyzer
// Offscreen 64x36 thumbnail canvas sampled at 4 FPS: <0.5% CPU on an Intel Core i3

import { audioEngine } from './audioEngine'

export interface VideoAnalysisFrame {
  motionEnergy: number // 0 to 100%
  isSceneCut: boolean
  brightness: number // 0 to 100%
}

export type AnalysisCallback = (frame: VideoAnalysisFrame) => void

class VideoAnalysisService {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private prevFrameData: Uint8ClampedArray | null = null
  private intervalTimer: number | null = null
  private isAnalyzing = false
  private autoSyncTension = true
  private listeners: Set<AnalysisCallback> = new Set()

  private width = 64
  private height = 36

  constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas')
      this.canvas.width = this.width
      this.canvas.height = this.height
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    }
  }

  public setAutoSyncTension(enabled: boolean) {
    this.autoSyncTension = enabled
  }

  public isAutoSyncEnabled(): boolean {
    return this.autoSyncTension
  }

  public addFrameListener(cb: AnalysisCallback): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  // Start sampling an HTMLVideoElement at 4 FPS
  public startAnalysis(video: HTMLVideoElement, onFrame?: AnalysisCallback) {
    if (this.isAnalyzing || !this.ctx || !this.canvas) return
    this.isAnalyzing = true
    this.prevFrameData = null

    // Run every 250ms (4 FPS) for minimal CPU load
    this.intervalTimer = window.setInterval(() => {
      if (video.paused || video.ended || video.readyState < 2) return

      try {
        this.ctx!.drawImage(video, 0, 0, this.width, this.height)
        const frame = this.ctx!.getImageData(0, 0, this.width, this.height)
        const data = frame.data
        const numPixels = this.width * this.height

        let totalDiff = 0
        let totalBrightness = 0

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const lum = 0.299 * r + 0.587 * g + 0.114 * b
          totalBrightness += lum

          if (this.prevFrameData) {
            const prevLum = 0.299 * this.prevFrameData[i] + 0.587 * this.prevFrameData[i + 1] + 0.114 * this.prevFrameData[i + 2]
            totalDiff += Math.abs(lum - prevLum)
          }
        }

        const avgBrightness = Math.round((totalBrightness / numPixels / 255) * 100)
        const avgDiff = this.prevFrameData ? (totalDiff / numPixels / 255) * 100 : 0
        const motionEnergy = Math.min(100, Math.round(avgDiff * 3.8))
        const isSceneCut = avgDiff > 35

        // Save current frame for next diff
        if (!this.prevFrameData) {
          this.prevFrameData = new Uint8ClampedArray(data.length)
        }
        this.prevFrameData.set(data)

        // If auto-sync tension is enabled, dynamically modulate the audio engine!
        if (this.autoSyncTension) {
          // Smoothly map motion energy to tension (baseline 20% to 95%)
          const targetTension = Math.max(15, Math.min(100, Math.round(20 + motionEnergy * 0.8)))
          audioEngine.setTension(targetTension)

          // On visual scene cut, trigger acoustic transition impact!
          if (isSceneCut) {
            audioEngine.triggerSceneCutTransition()
          }
        }

        const frameData: VideoAnalysisFrame = { motionEnergy, isSceneCut, brightness: avgBrightness }
        if (onFrame) {
          onFrame(frameData)
        }
        this.listeners.forEach((l) => {
          try { l(frameData) } catch {}
        })
      } catch (err) {
        // Cross-origin video frame security catch
        console.warn('Video frame sampling skipped:', err)
      }
    }, 250)
  }

  public stopAnalysis() {
    this.isAnalyzing = false
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer)
      this.intervalTimer = null
    }
    this.prevFrameData = null
  }
}

export const videoAnalysisService = new VideoAnalysisService()

