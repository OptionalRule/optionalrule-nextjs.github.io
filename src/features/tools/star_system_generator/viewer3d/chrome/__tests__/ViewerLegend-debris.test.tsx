import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ViewerLegend } from '../ViewerLegend'
import { ViewerContextProvider } from '../ViewerContext'

function renderLegend(hasDebris?: Parameters<typeof ViewerLegend>[0]['hasDebris']) {
  return render(
    <ViewerContextProvider>
      <ViewerLegend scaleNote="test" onFrame={() => {}} hasDebris={hasDebris} />
    </ViewerContextProvider>,
  )
}

const allOff = { ring: false, shell: false, stream: false, halo: false, cordon: false }

describe('ViewerLegend debris chips', () => {
  it('renders no debris chips when hasDebris is not provided', () => {
    renderLegend()
    expect(screen.queryByText('polar ring / disk')).toBeNull()
    expect(screen.queryByText('ejecta shell')).toBeNull()
    expect(screen.queryByText('mass-transfer stream')).toBeNull()
    expect(screen.queryByText('scattered halo')).toBeNull()
    expect(screen.queryByText('gardener cordon')).toBeNull()
  })

  it('renders no debris chips when all hasDebris flags are false', () => {
    renderLegend(allOff)
    expect(screen.queryByText('polar ring / disk')).toBeNull()
    expect(screen.queryByText('ejecta shell')).toBeNull()
  })

  it('shows polar ring chip when ring is true', () => {
    renderLegend({ ...allOff, ring: true })
    expect(screen.getByText('polar ring / disk')).toBeTruthy()
  })

  it('shows ejecta shell chip when shell is true', () => {
    renderLegend({ ...allOff, shell: true })
    expect(screen.getByText('ejecta shell')).toBeTruthy()
  })

  it('shows mass-transfer stream chip when stream is true', () => {
    renderLegend({ ...allOff, stream: true })
    expect(screen.getByText('mass-transfer stream')).toBeTruthy()
  })

  it('shows scattered halo chip when halo is true', () => {
    renderLegend({ ...allOff, halo: true })
    expect(screen.getByText('scattered halo')).toBeTruthy()
  })

  it('shows gardener cordon chip when cordon is true', () => {
    renderLegend({ ...allOff, cordon: true })
    expect(screen.getByText('gardener cordon')).toBeTruthy()
  })

  it('shows all chips when all hasDebris flags are true', () => {
    renderLegend({ ring: true, shell: true, stream: true, halo: true, cordon: true })
    expect(screen.getByText('polar ring / disk')).toBeTruthy()
    expect(screen.getByText('ejecta shell')).toBeTruthy()
    expect(screen.getByText('mass-transfer stream')).toBeTruthy()
    expect(screen.getByText('scattered halo')).toBeTruthy()
    expect(screen.getByText('gardener cordon')).toBeTruthy()
  })
})
