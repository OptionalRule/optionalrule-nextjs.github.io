const DEFAULT_ECCENTRICITY = 0.3

function massRatio(primaryMassSolar: number, companionMassSolar: number): number {
  const total = primaryMassSolar + companionMassSolar
  if (total <= 0) return 0
  return companionMassSolar / total
}

export function siblingOuterAuLimit(
  separationAu: number,
  primaryMassSolar: number,
  companionMassSolar: number,
  eccentricity: number = DEFAULT_ECCENTRICITY,
): number {
  if (separationAu <= 0) return 0
  const mu = massRatio(primaryMassSolar, companionMassSolar)
  const e = Math.max(0, Math.min(0.9, eccentricity))
  const ratio =
    0.464
    + -0.380 * mu
    + -0.631 * e
    + 0.586 * mu * e
    + 0.150 * e * e
    + -0.198 * mu * e * e
  return Math.max(0, separationAu * ratio)
}

export function circumbinaryInnerAuLimit(
  separationAu: number,
  primaryMassSolar: number,
  companionMassSolar: number,
  eccentricity: number = DEFAULT_ECCENTRICITY,
): number {
  if (separationAu <= 0) return 0
  const mu = massRatio(primaryMassSolar, companionMassSolar)
  const e = Math.max(0, Math.min(0.9, eccentricity))
  const ratio =
    1.60
    + 5.10 * e
    + -2.22 * e * e
    + 4.12 * mu
    + -4.27 * e * mu
    + -5.09 * mu * mu
    + 4.61 * e * e * mu * mu
  return Math.max(0, separationAu * ratio)
}
