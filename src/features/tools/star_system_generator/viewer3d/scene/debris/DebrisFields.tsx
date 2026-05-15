'use client'

import { DebrisFieldRing } from './DebrisFieldRing'
import { DebrisFieldShell } from './DebrisFieldShell'
import { DebrisFieldStream } from './DebrisFieldStream'
import { DebrisFieldHalo } from './DebrisFieldHalo'
import { pickDebrisRenderer } from './pickDebris'
import { OverlayMarker } from '../overlay/OverlayMarker'
import type { DebrisFieldShape } from '../../../types'
import type { DebrisFieldVisual } from '../../types'

const COLOR_BY_SHAPE: Record<DebrisFieldShape, string> = {
  'polar-ring': '#a0b8d8',
  'mass-transfer-stream': '#ffcc66',
  'common-envelope-shell': '#b89898',
  'trojan-camp': '#88aaaa',
  'inner-pair-halo': '#a8a0c8',
  'kozai-scattered-halo': '#b88888',
  'hill-sphere-capture-cone': '#80a0a0',
  'exocomet-swarm': '#8090b0',
  'accretion-bridge': '#ffaa66',
  'gardener-cordon': '#d0606a',
}

interface DebrisFieldsProps {
  fields: DebrisFieldVisual[]
  layerVisibility: { physical: boolean; gu: boolean; human: boolean }
}

function glyphPositionFor(v: DebrisFieldVisual): [number, number, number] {
  const meanR = (v.innerRadius + v.outerRadius) / 2
  const angle = v.centerAngleDeg * Math.PI / 180
  const tilt = v.inclinationDeg * Math.PI / 180
  const baseY = meanR * 0.05
  const x = Math.cos(angle) * meanR
  const z = Math.sin(angle) * meanR
  // For non-equatorial rings (inclined), nudge slightly along the tilt axis.
  const y = baseY + Math.sin(tilt - Math.PI / 2) * 0
  return [x, y, z]
}

export function DebrisFields({ fields, layerVisibility }: DebrisFieldsProps) {
  return (
    <>
      {fields.map((v) => {
        const shape = v.field.shape.value
        const isHumanLayer = shape === 'gardener-cordon'
        if (isHumanLayer && !layerVisibility.human) return null
        if (!isHumanLayer && !layerVisibility.physical) return null

        const picked = pickDebrisRenderer({ shape, densityBand: v.field.densityBand.value })
        const color = COLOR_BY_SHAPE[shape]
        const baseProps = { opacity: picked.visualParams.opacity, color, fieldId: v.field.id }
        const glyphPos = glyphPositionFor(v)

        let renderer: React.ReactNode = null
        switch (picked.component) {
          case 'ring':
            renderer = (
              <DebrisFieldRing
                innerRadius={v.innerRadius}
                outerRadius={v.outerRadius}
                inclinationDeg={v.inclinationDeg}
                spanDeg={v.spanDeg}
                centerAngleDeg={v.centerAngleDeg}
                {...baseProps}
              />
            )
            break
          case 'shell':
            renderer = (
              <DebrisFieldShell
                innerRadius={v.innerRadius}
                outerRadius={v.outerRadius}
                particleCount={picked.visualParams.particleCount}
                {...baseProps}
              />
            )
            break
          case 'stream':
            renderer = (
              <DebrisFieldStream
                startRadius={v.innerRadius}
                endRadius={v.outerRadius}
                centerAngleDeg={v.centerAngleDeg}
                {...baseProps}
              />
            )
            break
          case 'halo':
            renderer = (
              <DebrisFieldHalo
                innerRadius={v.innerRadius}
                outerRadius={v.outerRadius}
                inclinationDeg={v.inclinationDeg}
                particleCount={picked.visualParams.particleCount}
                {...baseProps}
              />
            )
            break
        }

        return (
          <group key={v.field.id}>
            {renderer}
            <OverlayMarker
              position={glyphPos}
              glyphId="HZ"
              kind="debris"
              id={v.field.id}
              label={v.field.archetypeName.value}
            />
          </group>
        )
      })}
    </>
  )
}
