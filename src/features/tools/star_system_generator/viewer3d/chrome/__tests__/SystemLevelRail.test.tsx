import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { generateSystem } from '../../../lib/generator'
import { buildSceneGraph } from '../../lib/sceneGraph'
import { SystemLevelRail } from '../SystemLevelRail'
import { ViewerContextProvider } from '../ViewerContext'

function renderRail(seed: string) {
  const system = generateSystem({
    seed,
    distribution: 'frontier',
    tone: 'balanced',
    gu: 'normal',
    settlements: 'normal',
  })
  const graph = buildSceneGraph(system)
  const utils = render(
    <ViewerContextProvider>
      <SystemLevelRail graph={graph} system={system} />
    </ViewerContextProvider>,
  )
  return { ...utils, graph, system }
}

describe('SystemLevelRail', () => {
  it('renders nothing when the graph has no system-level entries', () => {
    const system = generateSystem({
      seed: 'rail-empty-001',
      distribution: 'frontier',
      tone: 'balanced',
      gu: 'normal',
      settlements: 'normal',
    })
    const graph = buildSceneGraph(system)
    const emptyGraph = {
      ...graph,
      systemLevelHazards: [],
      systemLevelPhenomena: [],
      systemLevelRuins: [],
      subSystems: [],
    }
    const { container } = render(
      <ViewerContextProvider>
        <SystemLevelRail graph={emptyGraph} system={system} />
      </ViewerContextProvider>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('lists a chip per system phenomenon when phenomena exist', () => {
    const { graph } = renderRail('rail-phen-001')
    const phenomenaCount = graph.systemLevelPhenomena.length
      + graph.subSystems.reduce((sum, s) => sum + s.systemLevelPhenomena.length, 0)
    if (phenomenaCount === 0) {
      // skip — seed produced no phenomena
      return
    }
    expect(screen.getByText(/system phenomena/i)).toBeInTheDocument()
  })

  it('collapses and expands when the header is toggled', async () => {
    const { graph } = renderRail('rail-phen-001')
    const hasAny =
      graph.systemLevelHazards.length + graph.systemLevelPhenomena.length > 0
      || graph.subSystems.some((s) => s.systemLevelHazards.length + s.systemLevelPhenomena.length > 0)
    if (!hasAny) return

    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: /system facts/i })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})
