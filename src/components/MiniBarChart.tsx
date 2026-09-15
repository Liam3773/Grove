interface Bar {
  label: string
  value: number
  color?: string
}

export function MiniBarChart({ bars, height = 120, formatValue }: { bars: Bar[]; height?: number; formatValue?: (v: number) => string }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {bars.map((b, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] text-mist-600">{b.value > 0 ? (formatValue ? formatValue(b.value) : b.value) : ''}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max(3, (b.value / max) * (height - 34))}px`,
              background: b.color ?? 'var(--color-moss-500)',
              opacity: b.value > 0 ? 1 : 0.25,
            }}
          />
          <span className="text-[10px] text-mist-600">{b.label}</span>
        </div>
      ))}
    </div>
  )
}
