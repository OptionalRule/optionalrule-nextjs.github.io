export function buildSeedHref(seed: string): string {
  if (typeof window === 'undefined') return `?seed=${encodeURIComponent(seed)}`
  const url = new URL(window.location.href)
  url.searchParams.set('seed', seed)
  return `${url.pathname}${url.search}`
}
