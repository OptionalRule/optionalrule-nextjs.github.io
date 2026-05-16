import * as THREE from 'three'
import { hashToUnit } from '../../lib/motion'

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const target = { h: 0, s: 0, l: 0 }
  new THREE.Color(hex).getHSL(target)
  return target
}

export function jitteredTint(
  seed: string,
  baseHsl: { h: number; s: number; l: number },
  amounts = { h: 0.12, s: 0.4, l: 0.5 },
): [number, number, number] {
  const hShift = (hashToUnit(`${seed}-h`) - 0.5) * amounts.h
  const sShift = (hashToUnit(`${seed}-s`) - 0.5) * amounts.s
  const lShift = (hashToUnit(`${seed}-l`) - 0.5) * amounts.l
  const h = ((baseHsl.h + hShift) % 1 + 1) % 1
  const s = Math.min(1, Math.max(0, baseHsl.s + sShift))
  const l = Math.min(0.95, Math.max(0.15, baseHsl.l + lShift))
  const out = new THREE.Color().setHSL(h, s, l)
  const baseLum = baseHsl.l + 0.001
  return [out.r / baseLum * 0.8, out.g / baseLum * 0.8, out.b / baseLum * 0.8]
}
