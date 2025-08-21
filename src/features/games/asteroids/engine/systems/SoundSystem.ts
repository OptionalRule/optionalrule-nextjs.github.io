import { SOUND_CONFIG, type SoundConfig, type SoundDefinition } from '../../config/sounds'

export class SoundSystem {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, HTMLAudioElement[]> = new Map()
  private loadedSounds: Set<string> = new Set()
  private config: SoundConfig
  private initialized = false
  private userInteracted = false

  constructor(config: SoundConfig = SOUND_CONFIG) {
    this.config = config
    this.setupUserInteractionHandler()
  }

  private setupUserInteractionHandler(): void {
    const handleFirstInteraction = () => {
      this.userInteracted = true
      this.initializeAudioContext()
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }

    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction)
    document.addEventListener('touchstart', handleFirstInteraction)
  }

  private initializeAudioContext(): void {
    if (this.initialized || !this.userInteracted) return

    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass()
        this.initialized = true
        this.preloadSounds()
      }
    } catch (error) {
      console.warn('Audio context initialization failed:', error)
      this.initialized = false
    }
  }

  private async preloadSounds(): Promise<void> {
    if (!this.config.enabled) return

    const preloadPromises: Promise<void>[] = []

    for (const [soundKey, soundDef] of Object.entries(this.config.sounds)) {
      if (soundDef.preload) {
        preloadPromises.push(this.loadSound(soundKey, soundDef))
      }
    }

    try {
      await Promise.all(preloadPromises)
    } catch (error) {
      console.warn('Some sounds failed to preload:', error)
    }
  }

  private async loadSound(soundKey: string, soundDef: SoundDefinition): Promise<void> {
    if (this.loadedSounds.has(soundKey)) return

    try {
      // Create audio pool (multiple instances for overlapping sounds)
      const poolSize = soundDef.loop ? 1 : 3
      const audioPool: HTMLAudioElement[] = []

      for (let i = 0; i < poolSize; i++) {
        const audio = new Audio(soundDef.path)
        audio.preload = 'auto'
        audio.loop = soundDef.loop || false
        
        // Set volume based on category and individual settings
        const categoryVolume = this.config.categories[soundDef.category].volume
        const soundVolume = soundDef.volume || 1.0
        audio.volume = this.config.masterVolume * categoryVolume * soundVolume

        audioPool.push(audio)
      }

      this.sounds.set(soundKey, audioPool)
      this.loadedSounds.add(soundKey)
    } catch (error) {
      console.warn(`Failed to load sound ${soundKey}:`, error)
    }
  }

  async playSound(soundKey: string): Promise<void> {
    if (!this.config.enabled || !this.userInteracted) return

    const soundDef = this.config.sounds[soundKey]
    if (!soundDef) {
      console.warn(`Sound not found: ${soundKey}`)
      return
    }

    const category = this.config.categories[soundDef.category]
    if (!category.enabled) return

    // Load sound if not already loaded
    if (!this.loadedSounds.has(soundKey)) {
      await this.loadSound(soundKey, soundDef)
    }

    const audioPool = this.sounds.get(soundKey)
    if (!audioPool || audioPool.length === 0) return

    try {
      // Find available audio instance (not currently playing)
      let audio = audioPool.find(a => a.paused || a.ended)
      
      // If all instances are playing, use the first one (restart it)
      if (!audio) {
        audio = audioPool[0]
        audio.currentTime = 0
      }

      // Resume audio context if suspended (mobile browsers)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      await audio.play()
    } catch (error) {
      // Silently handle play failures (common on mobile/autoplay restrictions)
      console.debug(`Could not play sound ${soundKey}:`, error)
    }
  }

  stopSound(soundKey: string): void {
    const audioPool = this.sounds.get(soundKey)
    if (!audioPool) return

    audioPool.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  stopAllSounds(): void {
    this.sounds.forEach((audioPool) => {
      audioPool.forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
    })
  }

  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  setCategoryVolume(category: keyof SoundConfig['categories'], volume: number): void {
    this.config.categories[category].volume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  toggleCategory(category: keyof SoundConfig['categories']): void {
    this.config.categories[category].enabled = !this.config.categories[category].enabled
  }

  toggleEnabled(): void {
    this.config.enabled = !this.config.enabled
    if (!this.config.enabled) {
      this.stopAllSounds()
    }
  }

  private updateAllVolumes(): void {
    for (const [soundKey, audioPool] of this.sounds) {
      const soundDef = this.config.sounds[soundKey]
      if (!soundDef) continue

      const categoryVolume = this.config.categories[soundDef.category].volume
      const soundVolume = soundDef.volume || 1.0
      const finalVolume = this.config.masterVolume * categoryVolume * soundVolume

      audioPool.forEach(audio => {
        audio.volume = finalVolume
      })
    }
  }

  getConfig(): SoundConfig {
    return { ...this.config }
  }

  isInitialized(): boolean {
    return this.initialized && this.userInteracted
  }

  destroy(): void {
    this.stopAllSounds()
    this.sounds.clear()
    this.loadedSounds.clear()
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}