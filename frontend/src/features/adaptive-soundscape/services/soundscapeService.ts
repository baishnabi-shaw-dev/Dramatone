// Soundscape Service: Coordinates Adaptive Tension and Video Motion Analysis
import { audioEngine } from '@/services/audioEngine'
import { videoAnalysisService, VideoAnalysisFrame } from '@/services/videoAnalysisService'

export interface SoundscapeState {
  tension: number
  emotion: 'Calm' | 'Suspense' | 'Heroic' | 'Melancholy'
  layers: {
    ambience: number
    strings: number
    subPulse: number
    foley: number
  }
  dialogueDucking: boolean
}

class SoundscapeService {
  public setTension(tension: number) {
    audioEngine.setTension(tension)
  }

  public getTension(): number {
    return audioEngine.getTension()
  }

  public setDialogueDucking(enabled: boolean) {
    audioEngine.setDialogueDuckingEnabled(enabled)
  }

  public isDialogueDucking(): boolean {
    return audioEngine.isDialogueDuckingEnabled()
  }

  public bindVideo(video: HTMLVideoElement, onFrameUpdate?: (frame: VideoAnalysisFrame) => void) {
    videoAnalysisService.startAnalysis(video, onFrameUpdate)
  }

  public unbindVideo() {
    videoAnalysisService.stopAnalysis()
  }

  public exportGameConfig(title = 'Adaptive Soundscape') {
    const jsonStr = audioEngine.exportGameSoundscapeJson(title)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_game_config.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  public async exportWav(title = 'Adaptive Soundscape', durationSeconds = 180) {
    const blob = await audioEngine.exportSoundscapeWav(durationSeconds)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.wav`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export const soundscapeService = new SoundscapeService()

