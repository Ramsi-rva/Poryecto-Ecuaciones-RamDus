// ─────────────────────────────────────────────────────────────
// DistChart.jsx — Gráfica SVG compartida (Normal y t-Student)
//   pdfFn   : x → densidad
//   domain  : [min, max] base del eje X
//   regions : [[desde, hasta], ...] zonas sombreadas (admite ±Infinity)
//   cuts    : [x, ...] líneas de corte
//   center  : posición de la línea punteada central (μ o 0)
//   overlay : función opcional para una segunda curva punteada
// ─────────────────────────────────────────────────────────────

import { useMemo, useId } from 'react'

const W = 520
const H = 240
const PAD = { top: 22, right: 25, bottom: 52, left: 35 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const fmtTick = (x) => {
  if (Number.isInteger(x)) return String(x)
  return x.toFixed(2).replace(/\.?0+$/, '')
}

export default function DistChart({
  pdfFn, domain, regions = [], cuts = [], center = 0,
  centerLabel = 'μ', color = '#22c55e', overlay = null, label = 'Gráfica de la distribución',
}) {
  const gradId = useId()
  const finiteCuts = cuts.filter(isFinite)
  const cutsKey = finiteCuts.join(',')
  const d0 = domain[0]
  const d1 = domain[1]

  const { pts, ovPts, xMin, xMax } = useMemo(() => {
    let lo = d0, hi = d1
    const margin = 0.15 * (hi - lo)
    finiteCuts.forEach(c => {
      lo = Math.min(lo, c - margin)
      hi = Math.max(hi, c + margin)
    })
    const STEPS = 500
    const p = [], o = []
    for (let i = 0; i <= STEPS; i++) {
      const x = lo + (i / STEPS) * (hi - lo)
      p.push({ x, y: pdfFn(x) })
      if (overlay) o.push({ x, y: overlay(x) })
    }
    return { pts: p, ovPts: o, xMin: lo, xMax: hi }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfFn, overlay, d0, d1, cutsKey])

  const yMax = Math.max(...pts.map(p => p.y)) * 1.15

  const toX = (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * plotW
  const toY = (y) => PAD.top + plotH - (y / yMax) * plotH
  const baseY = toY(0)

  const toPath = (arr) =>
    arr.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(2)},${toY(p.y).toFixed(2)}`).join(' ')

  const shadePaths = regions.map(([from, to]) => {
    const s = Math.max(from, xMin), e = Math.min(to, xMax)
    if (!(s < e)) return ''
    const sel = pts.filter(p => p.x >= s && p.x <= e)
    if (sel.length < 2) return ''
    return `${toPath(sel)} L${toX(sel[sel.length - 1].x).toFixed(2)} ${baseY} L${toX(sel[0].x).toFixed(2)} ${baseY} Z`
  })

  const ticks = useMemo(() => {
    const range = xMax - xMin
    let step
    if (range <= 1) step = 0.1
    else if (range <= 5) step = 0.5
    else if (range <= 12) step = 1
    else if (range <= 25) step = 2
    else if (range <= 50) step = 5
    else step = 10
    const first = Math.ceil(xMin / step) * step
    const arr = []
    for (let x = first; x <= xMax + 0.0001; x += step) arr.push(Number(x.toFixed(4)))
    const extra = finiteCuts.filter(c => !arr.some(t => Math.abs(t - c) < step * 0.3))
    return [...arr, ...extra].sort((x, y) => x - y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xMin, xMax, cutsKey])

  const isCut = (x) => finiteCuts.some(c => Math.abs(x - c) < 0.0001)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dn-chart" role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.40" />
          <stop offset="100%" stopColor={color} stopOpacity="0.10" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="#1a1a2e" rx="8" />

      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={PAD.left} y1={PAD.top + plotH * (1 - f)}
          x2={PAD.left + plotW} y2={PAD.top + plotH * (1 - f)}
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
      ))}

      {ticks.filter(x => !isCut(x)).map((x, i) => (
        <line key={i} x1={toX(x)} y1={PAD.top} x2={toX(x)} y2={baseY}
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
      ))}

      <line x1={PAD.left} y1={baseY} x2={PAD.left + plotW} y2={baseY}
        stroke="#6b7280" strokeWidth="1" />

      <line x1={toX(center)} y1={PAD.top} x2={toX(center)} y2={baseY}
        stroke={color} strokeDasharray="4 3" strokeWidth="1" opacity="0.5" />

      {shadePaths.map((d, i) => d && <path key={i} d={d} fill={`url(#${gradId})`} />)}

      {finiteCuts.map((c, i) => (
        <line key={i} x1={toX(c)} y1={PAD.top} x2={toX(c)} y2={baseY}
          stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
      ))}

      {overlay && (
        <path d={toPath(ovPts)} fill="none" stroke="#9ca3af" strokeWidth="1.5"
          strokeDasharray="5 4" strokeLinejoin="round" />
      )}
      <path d={toPath(pts)} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />

      {ticks.map((x, i) => {
        const cx = toX(x)
        const sp = isCut(x)
        return (
          <g key={i}>
            <line x1={cx} y1={baseY} x2={cx} y2={baseY + 5}
              stroke={sp ? color : '#6b7280'} strokeWidth={sp ? 1.5 : 1} />
            <text x={cx} y={baseY + 20} textAnchor="middle"
              fontSize={sp ? '13' : '12'} fontWeight={sp ? '600' : '400'}
              fill={sp ? color : '#9ca3af'} fontFamily="'Inter', sans-serif">
              {fmtTick(x)}
            </text>
          </g>
        )
      })}

      <text x={toX(center)} y={PAD.top - 5} textAnchor="middle" fill={color}
        fontSize="13" fontFamily="'Inter', sans-serif">
        {centerLabel}
      </text>
    </svg>
  )
}
