import { describe, expect, it } from 'vitest'
import { phenomenonNote } from '../phenomenonProse'

describe('phenomenonNote', () => {
  it('formats a structured phenomenon as Transit/Question/Hook/Image', () => {
    const result = phenomenonNote({
      label: 'Dense debris disk',
      confidence: 'inferred',
      travelEffect: 'Approach vectors require slow burns.',
      surveyQuestion: 'Which fragments carry isotopes?',
      conflictHook: 'Insurers and salvagers dispute lanes.',
      sceneAnchor: 'A cutter drifts beside a glittering wall.',
    })
    expect(result).toBe(
      'Transit: Approach vectors require slow burns. Question: Which fragments carry isotopes? Hook: Insurers and salvagers dispute lanes. Image: A cutter drifts beside a glittering wall.'
    )
  })
})
