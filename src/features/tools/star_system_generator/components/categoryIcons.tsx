import { useId, type SVGProps } from 'react'

const baseProps: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function RockyPlanetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="9" cy="10" r="1.4" />
      <circle cx="15" cy="14" r="1.1" />
      <circle cx="10.5" cy="16" r="0.6" />
    </svg>
  )
}

export function SubNeptuneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="10" strokeDasharray="1.5 2.5" />
    </svg>
  )
}

export function GasGiantIcon(props: SVGProps<SVGSVGElement>) {
  const clipId = useId()
  return (
    <svg {...baseProps} {...props}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9.5" />
      <g clipPath={`url(#${clipId})`}>
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="2" y1="13" x2="22" y2="13" />
        <line x1="2" y1="16" x2="22" y2="16" />
      </g>
    </svg>
  )
}

export function IceGiantIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="6" />
      <ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-72 12 12)" />
    </svg>
  )
}

export function RogueCapturedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="14" cy="12" r="7" />
      <circle cx="12" cy="10" r="0.9" />
      <circle cx="16" cy="14" r="0.7" />
      <path d="M2 18 L5 16" />
      <path d="M3.5 14 L6 12.5" />
    </svg>
  )
}
