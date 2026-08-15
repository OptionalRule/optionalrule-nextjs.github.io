import { SOUND_CONFIG, type SoundConfig, type SoundDefinition } from '../../config/sounds'

export class SoundSystem {
  private audioContext: AudioContext | null = null
  // Keyed by variantKey(soundKey, path) so a sound with variants keeps one pool per file
  private sounds: Map<string, HTMLAudioElement[]> = new Map()
  private loadedSounds: Set<string> = new Set()
  private pausedForResume: Set<HTMLAudioElement> = new Set()
  private config: SoundConfig
  private initialized = false
  private userInteracted = false

  private handleFirstInteraction = (): void => {
    this.userInteracted = true
    this.initializeAudioContext()
    this.removeUserInteractionHandler()
  }

  constructor(config: SoundConfig = SOUND_CONFIG) {
    this.config = config
    this.setupUserInteractionHandler()
  }

  private setupUserInteractionHandler(): void {
    document.addEventListener('click', this.handleFirstInteraction)
    document.addEventListener('keydown', this.handleFirstInteraction)
    document.addEventListener('touchstart', this.handleFirstInteraction)
  }

  private removeUserInteractionHandler(): void {
    document.removeEventListener('click', this.handleFirstInteraction)
    document.removeEventListener('keydown', this.handleFirstInteraction)
    document.removeEventListener('touchstart', this.handleFirstInteraction)
  }

  private variantKey(soundKey: string, path: string): string {
    return `${soundKey}:${path}`
  }

  private baseSoundKey(key: string): string {
    const separator = key.indexOf(':')
    return separator === -1 ? key : key.slice(0, separator)
  }

  private matchesSoundKey(key: string, soundKey: string): boolean {
    return key === soundKey || key.startsWith(soundKey + ':')
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
      if (!soundDef.preload) continue

      // Preload every file the sound can play, under the same key playSound() looks up
      const paths = new Set<string>([soundDef.path, ...(soundDef.variants ?? [])])
      for (const path of paths) {
        preloadPromises.push(this.loadSoundVariant(this.variantKey(soundKey, path), path, soundDef))
      }
    }

    try {
      await Promise.all(preloadPromises)
    } catch (error) {
      console.warn('Some sounds failed to preload:', error)
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

    // Determine which sound file to play (handle variants)
    const soundPath = this.selectSoundVariant(soundDef)
    const actualSoundKey = this.variantKey(soundKey, soundPath)

    // Load sound if not already loaded
    if (!this.loadedSounds.has(actualSoundKey)) {
      await this.loadSoundVariant(actualSoundKey, soundPath, soundDef)
    }

    const audioPool = this.sounds.get(actualSoundKey)
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

  private selectSoundVariant(soundDef: SoundDefinition): string {
    // If variants exist, randomly select one
    if (soundDef.variants && soundDef.variants.length > 0) {
      const randomIndex = Math.floor(Math.random() * soundDef.variants.length)
      return soundDef.variants[randomIndex]
    }
    
    // Otherwise use the main path
    return soundDef.path
  }

  private async loadSoundVariant(soundKey: string, soundPath: string, soundDef: SoundDefinition): Promise<void> {
    if (this.loadedSounds.has(soundKey)) return

    try {
      // Create audio pool (multiple instances for overlapping sounds)
      const poolSize = soundDef.loop ? 1 : 3
      const audioPool: HTMLAudioElement[] = []

      for (let i = 0; i < poolSize; i++) {
        const audio = new Audio(soundPath)
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
      console.warn(`Failed to load sound variant ${soundKey}:`, error)
    }
  }

  stopSound(soundKey: string): void {
    // Stop all variants of this sound
    for (const [key, audioPool] of this.sounds.entries()) {
      if (this.matchesSoundKey(key, soundKey)) {
        audioPool.forEach(audio => {
          audio.pause()
          audio.currentTime = 0
          this.pausedForResume.delete(audio)
        })
      }
    }
  }

  pauseCategory(category: keyof SoundConfig['categories']): void {
    for (const [soundKey, soundDef] of Object.entries(this.config.sounds)) {
      if (soundDef.category === category) {
        this.pauseSound(soundKey)
      }
    }
  }

  private pauseSound(soundKey: string): void {
    // Pause all variants of this sound without resetting currentTime
    for (const [key, audioPool] of this.sounds.entries()) {
      if (this.matchesSoundKey(key, soundKey)) {
        audioPool.forEach(audio => {
          if (audio.paused) return

          // Remember only what was actually playing, so resuming can't start a
          // sound that was stopped earlier (a saucer destroyed before the pause)
          this.pausedForResume.add(audio)
          audio.pause()
          // Don't reset currentTime to allow resuming from the same position
        })
      }
    }
  }

  resumeCategory(category: keyof SoundConfig['categories']): void {
    for (const [soundKey, soundDef] of Object.entries(this.config.sounds)) {
      if (soundDef.category === category && soundDef.loop) {
        // Only resume looping sounds automatically
        this.resumeSound(soundKey)
      }
    }
  }

  private resumeSound(soundKey: string): void {
    // Resume only the variants this system paused
    for (const [key, audioPool] of this.sounds.entries()) {
      if (this.matchesSoundKey(key, soundKey)) {
        audioPool.forEach(audio => {
          if (!this.pausedForResume.delete(audio)) return

          try {
            audio.play().catch(error => {
              console.debug(`Could not resume sound ${soundKey}:`, error)
            })
          } catch (error) {
            console.debug(`Could not resume sound ${soundKey}:`, error)
          }
        })
      }
    }
  }


  stopAllSounds(): void {
    this.sounds.forEach((audioPool) => {
      audioPool.forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
    })
    this.pausedForResume.clear()
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
    for (const [key, audioPool] of this.sounds) {
      const soundDef = this.config.sounds[this.baseSoundKey(key)]
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
    this.removeUserInteractionHandler()
    this.stopAllSounds()
    this.sounds.clear()
    this.loadedSounds.clear()

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}