import { useMemo } from 'react'
import { seededRandom, pick } from './seed'
import {
  TreeOak, TreePine, TreeBlossom, Bush, Flowers, Rock, Lantern, Cabin, House, Observatory, Bridge,
} from './elements'
import type { WorldObjectDef } from '../../types'

export type TimeOfDay = 'day' | 'evening' | 'night'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export function currentTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours()
  if (h >= 7 && h < 18) return 'day'
  if ((h >= 18 && h < 21) || (h >= 5 && h < 7)) return 'evening'
  return 'night'
}

export function currentSeason(date: Date = new Date()): Season {
  const m = date.getMonth() // 0=Jan
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'autumn'
  return 'winter'
}

const SKY: Record<TimeOfDay, { top: string; bottom: string }> = {
  day: { top: '#5f92c9', bottom: '#bcd8e6' },
  evening: { top: '#3a3560', bottom: '#e08a5f' },
  night: { top: '#0a0e1c', bottom: '#1c2740' },
}

const SEASON_FOLIAGE: Record<Season, string> = {
  spring: '#5e9670',
  summer: '#4a6b45',
  autumn: '#b3793d',
  winter: '#6b7d6f',
}

interface Props {
  unlockedIds: string[]
  unlockedDefs: WorldObjectDef[]
  width?: number
  height?: number
  timeOfDay?: TimeOfDay
  season?: Season
  animated?: boolean
  onObjectClick?: (id: string) => void
  className?: string
}

export function WorldScene({
  unlockedIds, width = 400, height = 220, timeOfDay, season, animated = true, className,
}: Props) {
  const tod = timeOfDay ?? currentTimeOfDay()
  const seas = season ?? currentSeason()
  const has = (id: string) => unlockedIds.includes(id)

  const sky = SKY[tod]
  const foliageTint = SEASON_FOLIAGE[seas]

  const rand = useMemo(() => seededRandom('grove-scene-v1'), [])

  // Count how "developed" each category is, to decide how many elements to draw
  const plantCount = ['first_sprout', 'wildflowers', 'first_tree', 'second_tree', 'small_grove', 'first_mastery', 'orchard', 'forest']
    .filter(has).length
  const treeSlots = Math.min(9, Math.max(0, plantCount))

  const treeVariants = [TreeOak, TreePine, TreeBlossom]

  const trees = useMemo(() => {
    if (!has('first_sprout')) return []
    const out: { X: typeof TreeOak; x: number; y: number; scale: number; key: string }[] = []
    for (let i = 0; i < treeSlots; i++) {
      const r1 = pick(rand, 0, 1)
      const x = 30 + pick(rand, 0, width - 60)
      const y = height - 34 - pick(rand, 0, 14)
      const scale = 0.7 + r1 * 0.5
      const Variant = treeVariants[Math.floor(pick(rand, 0, treeVariants.length - 0.01))]
      out.push({ X: Variant, x, y, scale, key: `t${i}` })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeSlots, width, height])

  const groundY = height - 28

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="A miniature world that grows as you study"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={has('first_grass') ? '#3a5232' : '#4a3f30'} />
          <stop offset="100%" stopColor={has('first_grass') ? '#26361f' : '#2e2619'} />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6fa3c4" />
          <stop offset="100%" stopColor="#3d6f8f" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width={width} height={height} fill="url(#sky)" />

      {/* Sun / moon */}
      {tod === 'day' && <circle cx={width - 50} cy="36" r="16" fill="#fff3d0" opacity="0.9" />}
      {tod === 'evening' && <circle cx={width - 50} cy="46" r="18" fill="#f7c98a" opacity="0.85" />}
      {tod === 'night' && (
        <>
          <circle cx={width - 50} cy="34" r="12" fill="#e9ecf5" opacity="0.9" />
          {Array.from({ length: 18 }).map((_, i) => {
            const sx = pick(rand, 10, width - 10)
            const sy = pick(rand, 6, height * 0.45)
            return (
              <circle
                key={`star${i}`}
                cx={sx}
                cy={sy}
                r={pick(rand, 0.4, 1.2)}
                fill="#f4f1e8"
                className={animated ? 'animate-twinkle' : undefined}
                style={{ animationDelay: `${(i % 5) * 0.6}s` }}
              />
            )
          })}
        </>
      )}

      {/* Distant hills */}
      <path d={`M0 ${groundY - 18} Q ${width * 0.25} ${groundY - 40} ${width * 0.5} ${groundY - 16} T ${width} ${groundY - 22} V ${height} H0 Z`}
        fill={tod === 'night' ? '#0f1a17' : '#254026'} opacity="0.55" />

      {/* Ground */}
      <path d={`M0 ${groundY} Q ${width * 0.5} ${groundY - 14} ${width} ${groundY} V ${height} H0 Z`} fill="url(#ground)" />

      {/* Water (stream/pond) */}
      {has('stream') && (
        <path d={`M0 ${groundY + 8} Q ${width * 0.3} ${groundY - 2} ${width * 0.55} ${groundY + 10} T ${width} ${groundY + 6}`}
          stroke="url(#water)" strokeWidth={has('pond') ? 10 : 6} fill="none" opacity="0.85" strokeLinecap="round" />
      )}
      {has('pond') && (
        <g>
          <ellipse cx={width * 0.68} cy={groundY + 14} rx="34" ry="11" fill="url(#water)" opacity="0.9" />
          <ellipse cx={width * 0.68} cy={groundY + 10} rx="20" ry="4" fill="#ffffff" opacity="0.15" className={animated ? 'animate-ripple' : undefined} />
        </g>
      )}
      {has('bridge') && has('pond') && <Bridge x={width * 0.68} y={groundY + 10} />}

      {/* Path */}
      {has('path') && (
        <path d={`M${width * 0.1} ${height} Q ${width * 0.3} ${groundY + 6} ${width * 0.5} ${groundY + 2} T ${width * 0.85} ${groundY - 6}`}
          stroke="#8a7256" strokeWidth="7" fill="none" opacity="0.6" strokeLinecap="round" strokeDasharray="1 10" />
      )}

      {/* Rocks */}
      {has('rocks') && (
        <>
          <Rock x={width * 0.15} y={groundY + 16} scale={1.2} />
          <Rock x={width * 0.22} y={groundY + 20} scale={0.8} />
        </>
      )}

      {/* Wildflowers */}
      {has('wildflowers') && (
        <>
          <Flowers x={width * 0.35} y={groundY + 6} color="#eec079" />
          <Flowers x={width * 0.58} y={groundY + 12} color="#d8a5c0" />
          <Flowers x={width * 0.15} y={groundY + 4} color="#9db4e8" />
        </>
      )}

      {/* First sprout (small, before real trees feel earned) */}
      {has('first_sprout') && !has('first_tree') && <Bush x={width * 0.5} y={groundY + 2} scale={0.8} />}

      {/* Trees */}
      {trees.map(({ X, x, y, scale, key }) => (
        <X key={key} x={x} y={y} scale={scale} sway={animated} />
      ))}

      {has('first_mastery') && <Flowers x={width * 0.78} y={groundY - 2} color="#d8a5c0" scale={1.3} />}

      {/* Buildings */}
      {has('study_cabin') && !has('village') && <Cabin x={width * 0.78} y={groundY + 4} litWindow={tod !== 'day'} />}
      {has('village') && (
        <>
          <Cabin x={width * 0.72} y={groundY + 4} litWindow={tod !== 'day'} />
          <House x={width * 0.84} y={groundY + 8} litWindow={tod !== 'day'} />
          <House x={width * 0.6} y={groundY + 10} color="#5a4534" litWindow={tod !== 'day'} />
        </>
      )}
      {has('observatory') && <Observatory x={width * 0.9} y={groundY - 6} />}

      {/* Lanterns */}
      {has('lanterns') && (
        <>
          <Lantern x={width * 0.42} y={groundY + 2} lit={tod !== 'day'} />
          <Lantern x={width * 0.62} y={groundY - 2} lit={tod !== 'day'} />
        </>
      )}

      {/* subtle seasonal tint overlay */}
      <rect x="0" y="0" width={width} height={height} fill={foliageTint} opacity={seas === 'autumn' ? 0.06 : 0} />
    </svg>
  )
}
