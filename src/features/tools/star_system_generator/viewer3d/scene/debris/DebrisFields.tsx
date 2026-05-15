'use client'

import { DebrisFieldRing } from './DebrisFieldRing'
import { DebrisFieldShell } from './DebrisFieldShell'
import { DebrisFieldStream } from './DebrisFieldStream'
import { DebrisFieldHalo } from './DebrisFieldHalo'
import { pickDebrisRenderer } from './pickDebris'
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
        const baseProps = { opacity: picked.visualParams.opacity, color }

        switch (picked.component) {
          case 'ring':
            return (
              <DebrisFieldRing
                key={v.field.id}
                innerRadius={v.innerRadius}
                outerRadius={v.outerRadius}
                inclinationDeg={v.inclinationDeg}
                spanDeg={v.spanDeg}
                centerAngleDeg={v.centerAngleDeg}
                {...baseProps}
              />
            )
          case 'shell':
            return (
              <DebrisFieldShell
                key={v.field.id}
                innerRadius={v.innerRadius}
                outerRadius={v.outerRadius}
                particleCount={picked.visualParams.particleCount}
                {...baseProps}
              />
            )
          case 'stream':
            return (
              <DebrisFieldStream
                key={v.field.id}
                startRadius={v.innerRadius}
                endRadius={v.outerRadius}
                centerAngleDeg={v.centerAngleDeg}
                {...baseProps}
              />
            )
          case 'halo':
            return (
              <DebrisFieldHalo
                key={v.field.id}
                innerRadius={v.innerRadius}
                outerRadius={v.outerRadius}
                inclinationDeg={v.inclinationDeg}
                particleCount={picked.visualParams.particleCount}
                {...baseProps}
              />
            )
        }
      })}
    </>
  )
}
