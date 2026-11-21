import { vi } from 'vitest'

function fakeGradient(): CanvasGradient {
  return { addColorStop: () => undefined }
}

function fakeTextMetrics(text: string): TextMetrics {
  return { width: text.length } as TextMetrics
}

export function createFakeCanvasContext(): CanvasRenderingContext2D {
  const store: Record<string | symbol, unknown> = {
    measureText: fakeTextMetrics,
    createLinearGradient: fakeGradient,
    createRadialGradient: fakeGradient,
  }
  const noOp = (): undefined => undefined
  return new Proxy(store, {
    get: (target, property) => (property in target ? target[property] : noOp),
  }) as unknown as CanvasRenderingContext2D
}

export function stubCanvasContext(): void {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => createFakeCanvasContext())
}
