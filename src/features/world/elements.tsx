import type { ReactNode } from 'react'

export function TreeOak({ x, y, scale = 1, sway = false }: { x: number; y: number; scale?: number; sway?: boolean }): ReactNode {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className={sway ? 'animate-sway' : undefined}>
      <rect x="-2.5" y="-18" width="5" height="20" rx="1.5" fill="#3a2a1e" />
      <circle cx="0" cy="-28" r="15" fill="#3f5c3a" />
      <circle cx="-9" cy="-22" r="10" fill="#4a6b45" />
      <circle cx="9" cy="-24" r="11" fill="#3a5535" />
    </g>
  )
}

export function TreePine({ x, y, scale = 1, sway = false }: { x: number; y: number; scale?: number; sway?: boolean }): ReactNode {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className={sway ? 'animate-sway' : undefined}>
      <rect x="-2" y="-6" width="4" height="8" fill="#3a2a1e" />
      <path d="M0 -38 L14 -14 H-14 Z" fill="#2f4d38" />
      <path d="M0 -30 L12 -8 H-12 Z" fill="#3a5c43" />
      <path d="M0 -22 L10 -2 H-10 Z" fill="#456b4d" />
    </g>
  )
}

export function TreeBlossom({ x, y, scale = 1, sway = false }: { x: number; y: number; scale?: number; sway?: boolean }): ReactNode {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className={sway ? 'animate-sway' : undefined}>
      <rect x="-2" y="-16" width="4" height="18" fill="#4a382c" />
      <circle cx="0" cy="-24" r="13" fill="#c98fae" />
      <circle cx="-8" cy="-18" r="8" fill="#d8a5c0" />
      <circle cx="8" cy="-20" r="9" fill="#d09bb8" />
    </g>
  )
}

export function Bush({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): ReactNode {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="9" ry="6" fill="#476b44" />
      <ellipse cx="-6" cy="1" rx="6" ry="4.5" fill="#3f5f3c" />
    </g>
  )
}

export function Flowers({ x, y, scale = 1, color = '#eec079' }: { x: number; y: number; scale?: number; color?: string }): ReactNode {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {[-6, 0, 6].map((dx, i) => (
        <g key={i} transform={`translate(${dx} ${i % 2 === 0 ? 0 : -2})`}>
          <line x1="0" y1="0" x2="0" y2="4" stroke="#4a6b45" strokeWidth="1" />
          <circle cx="0" cy="-1" r="2.2" fill={color} />
        </g>
      ))}
    </g>
  )
}

export function Rock({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): ReactNode {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-6 3 L-4 -3 L2 -4 L6 1 L4 3 Z" fill="#5b5a52" />
      <path d="M-6 3 L-2 0 L2 -4" stroke="#726f63" strokeWidth="0.6" fill="none" opacity="0.6" />
    </g>
  )
}

export function Lantern({ x, y, lit = true }: { x: number; y: number; lit?: boolean }): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="0" y1="-14" x2="0" y2="0" stroke="#4a382c" strokeWidth="1.5" />
      <rect x="-3" y="-14" width="6" height="7" rx="1" fill={lit ? '#eec079' : '#6b6455'} opacity={lit ? 0.95 : 0.6} />
      {lit && <circle cx="0" cy="-10" r="6" fill="#eec079" opacity="0.18" />}
    </g>
  )
}

export function Cabin({ x, y, litWindow = true }: { x: number; y: number; litWindow?: boolean }): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-16" y="-20" width="32" height="20" fill="#3a2c22" rx="1" />
      <path d="M-19 -20 L0 -34 L19 -20 Z" fill="#25201c" />
      <rect x="-4" y="-10" width="8" height="10" fill="#1c1611" />
      <rect x="6" y="-16" width="6" height="6" fill={litWindow ? '#eec079' : '#1c1611'} opacity={litWindow ? 0.9 : 1} />
      <rect x="-12" y="-16" width="6" height="6" fill={litWindow ? '#eec079' : '#1c1611'} opacity={litWindow ? 0.9 : 1} />
      <rect x="-3" y="-35" width="3" height="8" fill="#25201c" />
    </g>
  )
}

export function House({ x, y, color = '#4a382c', litWindow = true }: { x: number; y: number; color?: string; litWindow?: boolean }): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-11" y="-16" width="22" height="16" fill={color} rx="1" />
      <path d="M-13 -16 L0 -26 L13 -16 Z" fill="#25201c" />
      <rect x="-3" y="-8" width="6" height="8" fill="#1c1611" />
      <rect x="4" y="-13" width="4" height="4" fill={litWindow ? '#eec079' : '#1c1611'} />
    </g>
  )
}

export function Observatory({ x, y }: { x: number; y: number }): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-14" y="-18" width="28" height="18" fill="#2a2f38" rx="1" />
      <circle cx="0" cy="-24" r="13" fill="#3c4453" />
      <path d="M0 -37 L9 -22 L-9 -22 Z" fill="#eec079" opacity="0.75" />
      <rect x="-2" y="-16" width="4" height="16" fill="#1c1611" />
    </g>
  )
}

export function Bridge({ x, y, width = 26 }: { x: number; y: number; width?: number }): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-width / 2} 4 Q0 -8 ${width / 2} 4`} stroke="#5c4632" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d={`M${-width / 2} 6 Q0 -6 ${width / 2} 6`} stroke="#7a5f43" strokeWidth="1.5" fill="none" />
    </g>
  )
}
