import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SoundSystem } from '../engine/systems/SoundSystem'
import { SOUND_CONFIG } from '../config/sounds'

class FakeAudio {
  static instances: FakeAudio[] = []

  preload = ''
  loop = false
  volume = 1
  paused = true
  currentTime = 0
  playCount = 0

  constructor(readonly src: string) {
    FakeAudio.instances.push(this)
  }

  play(): Promise<void> {
    this.playCount++
    this.paused = false
    return Promise.resolve()
  }

  pause(): void {
    this.paused = true
  }
}

class FakeAudioContext {
  state = 'running'
  resume = vi.fn().mockResolvedValue(undefined)
  close = vi.fn()
}

function instancesFor(fragment: string): FakeAudio[] {
  return FakeAudio.instances.filter(audio => audio.src.includes(fragment))
}

/** Lets the fire-and-forget preload chain settle. */
async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

async function createInteractedSystem(): Promise<SoundSystem> {
  const system = new SoundSystem(structuredClone(SOUND_CONFIG))
  document.dispatchEvent(new Event('click'))
  await flush()
  return system
}

describe('SoundSystem', () => {
  let system: SoundSystem | undefined

  beforeEach(() => {
    FakeAudio.instances = []
    vi.stubGlobal('Audio', FakeAudio)
    vi.stubGlobal('AudioContext', FakeAudioContext)
  })

  afterEach(() => {
    system?.destroy()
    system = undefined
    vi.unstubAllGlobals()
  })

  it('plays out of the preloaded pool instead of building a second one', async () => {
    system = await createInteractedSystem()
    const preloaded = FakeAudio.instances.length
    expect(preloaded).toBeGreaterThan(0)

    await system.playSound('bulletFire')

    expect(FakeAudio.instances).toHaveLength(preloaded)
    expect(instancesFor('bullet_fire').some(audio => audio.playCount > 0)).toBe(true)
  })

  it('applies master volume changes to loaded sounds', async () => {
    system = await createInteractedSystem()

    system.setMasterVolume(0.5)

    const effectsVolume = SOUND_CONFIG.categories.effects.volume
    const bulletVolume = SOUND_CONFIG.sounds.bulletFire.volume ?? 1
    for (const audio of instancesFor('bullet_fire')) {
      expect(audio.volume).toBeCloseTo(0.5 * effectsVolume * bulletVolume, 10)
    }
  })

  it('resumes a looping sound that was playing when the category was paused', async () => {
    system = await createInteractedSystem()
    await system.playSound('shipThrust')

    system.pauseCategory('effects')
    system.resumeCategory('effects')

    const [thrust] = instancesFor('ship_thrust')
    expect(thrust.playCount).toBe(2)
    expect(thrust.paused).toBe(false)
  })

  it('does not restart a looping sound that was stopped before the pause', async () => {
    system = await createInteractedSystem()
    await system.playSound('shipThrust')
    system.stopSound('shipThrust')

    system.pauseCategory('effects')
    system.resumeCategory('effects')

    const [thrust] = instancesFor('ship_thrust')
    expect(thrust.playCount).toBe(1)
    expect(thrust.paused).toBe(true)
  })
})
