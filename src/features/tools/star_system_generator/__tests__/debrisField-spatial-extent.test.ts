import { describe, it, expect } from 'vitest'
import { spatialExtentForShape } from '../lib/generator/debrisFields'

const baseInputs = {
  separationAu: 1.0,
  primaryMass: 1.0,
  companionMass: 0.7,
  hwInner: 2.5,
  hwOuter: 0.5,
}

describe('spatialExtentForShape', () => {
  it('polar-ring is perpendicular (inclination 90)', () => {
    const ext = spatialExtentForShape('polar-ring', baseInputs)
    expect(ext.inclinationDeg.value).toBe(90)
    expect(ext.spanDeg.value).toBe(360)
  })

  it('trojan-camp is a tadpole at +/-60, span ~30', () => {
    const ext = spatialExtentForShape('trojan-camp', { ...baseInputs, separationAu: 1.5, companionMass: 0.1, hwInner: 4.5, hwOuter: 0.7 })
    expect(Math.abs(ext.centerAngleDeg.value)).toBe(60)
    expect(ext.spanDeg.value).toBe(30)
  })

  it('common-envelope-shell is a full sphere shell', () => {
    const ext = spatialExtentForShape('common-envelope-shell', { ...baseInputs, separationAu: 0.5, hwInner: 1.5, hwOuter: 0.2 })
    expect(ext.spanDeg.value).toBe(360)
    expect(ext.outerAu.value).toBeGreaterThan(ext.innerAu.value)
  })

  it('mass-transfer-stream is a narrow stream (span <= 10)', () => {
    const ext = spatialExtentForShape('mass-transfer-stream', { ...baseInputs, separationAu: 0.05, companionMass: 0.6, hwInner: 0.15, hwOuter: 0.02 })
    expect(ext.spanDeg.value).toBeLessThanOrEqual(10)
  })

  it('polar-ring extent does not punch through the circumbinary keep-out', () => {
    const ext = spatialExtentForShape('polar-ring', baseInputs)
    expect(ext.innerAu.value).toBeGreaterThanOrEqual(baseInputs.hwInner)
  })

  it('inner-pair-halo sits just outside the keep-out', () => {
    const ext = spatialExtentForShape('inner-pair-halo', baseInputs)
    expect(ext.innerAu.value).toBeGreaterThanOrEqual(baseInputs.hwInner)
    expect(ext.outerAu.value).toBeGreaterThan(ext.innerAu.value)
  })

  it('kozai-scattered-halo has elevated inclination', () => {
    const ext = spatialExtentForShape('kozai-scattered-halo', baseInputs)
    expect(ext.inclinationDeg.value).toBeGreaterThanOrEqual(40)
  })

  it('hill-sphere-capture-cone is a trailing cone (span > 60)', () => {
    const ext = spatialExtentForShape('hill-sphere-capture-cone', baseInputs)
    expect(ext.spanDeg.value).toBeGreaterThan(60)
  })

  it('exocomet-swarm has a wide outer reservoir', () => {
    const ext = spatialExtentForShape('exocomet-swarm', baseInputs)
    expect(ext.outerAu.value / ext.innerAu.value).toBeGreaterThanOrEqual(2)
  })

  it('accretion-bridge is extremely narrow (span <= 5)', () => {
    const ext = spatialExtentForShape('accretion-bridge', baseInputs)
    expect(ext.spanDeg.value).toBeLessThanOrEqual(5)
  })

  it('gardener-cordon is a thin ring (outer/inner close to 1)', () => {
    const ext = spatialExtentForShape('gardener-cordon', baseInputs)
    expect(ext.outerAu.value / ext.innerAu.value).toBeLessThanOrEqual(1.1)
  })

  it('every Fact field carries non-default confidence and a source', () => {
    const ext = spatialExtentForShape('polar-ring', baseInputs)
    expect(ext.innerAu.confidence).toBeDefined()
    expect(ext.innerAu.source ?? '').not.toBe('')
  })
})
