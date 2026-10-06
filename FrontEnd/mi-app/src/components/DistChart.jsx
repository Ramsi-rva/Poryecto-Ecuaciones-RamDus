// ─────────────────────────────────────────────────────────────
// DistChart.jsx — Gráfica SVG animada (Normal y t-Student)
//   pdfFn   : x → densidad
//   domain  : [min, max] base del eje X
//   regions : [[desde, hasta], ...] zonas sombreadas (admite ±Infinity), máx. 2
//   cuts    : [x, ...] líneas de corte, máx. 2
//   center  : posición de la línea central (μ o 0)
//   overlay : función opcional para una segunda curva punteada
// Animaciones: la curva se dibuja al aparecer, el sombreado y las líneas
// de corte se deslizan a su nueva posición, y al pasar el cursor aparece
// una lectura de x y f(x).
// ─────────────────────────────────────────────────────────────

import { useMemo, useId, useRef, useState, useEffect } from 'react'

const PAD = { top: 34, right: 26, bottom: 54, left: 26 }
const SLOTS = 2

const fmtTick = (x) => {
  if (Number.isInteger(x)) return String(x).replace('-', '−')
  return x.toFixed(2).replace(/\.?0+$/, '').replace('-', '−')
}

export default function DistChart({
  pdfFn, domain, regions = [], cuts = [], center = 0,
  centerLabel = 'μ', color = '#9be7ff', overlay = null,
  label = 'Gráfica de la distribución',
}) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef(null)
  const [W, setW] = useState(560)
  const [hover, setHover] = useState(null)

  // El lienzo mide lo que mide su contenedor: 1 unidad = 1 px, así el texto
  // conserva su tamaño real también en celular.
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width)
      if (w > 0) setW(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const H = Math.max(270, Math.round(W * 0.5))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const finiteCuts = cuts.filter(isFinite)
  const cutsKey = finiteCuts.join(',')
  const d0 = domain[0]
  const d1 = domain[1]

  const { pts, ovPts, xMin, xMax } = useMemo(() => {
    let lo = d0, hi = d1
    const margin = 0.15 * (hi - lo)
    finiteCuts.forEach((c) => {
      lo = Math.min(lo, c - margin)
      hi = Math.max(hi, c + margin)
    })
    const STEPS = 400
    const p = [], o = []
    for (let i = 0; i <= STEPS; i++) {
      const x = lo + (i / STEPS) * (hi - lo)
      p.push({ x, y: pdfFn(x) })
      if (overlay) o.push({ x, y: overlay(x) })
    }
    return { pts: p, ovPts: o, xMin: lo, xMax: hi }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfFn, overlay, d0, d1, cutsKey])

  const yMax = Math.max(...pts.map((p) => p.y)) * 1.18

  const toX = (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * plotW
  const toY = (y) => PAD.top + plotH - (y / yMax) * plotH
  const baseY = toY(0)

  const toPath = (arr) =>
    arr.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ')

  const linePath = toPath(pts)
  const areaPath = `${linePath} L${toX(pts[pts.length - 1].x).toFixed(1)},${baseY} L${toX(pts[0].x).toFixed(1)},${baseY} Z`

  // Rectángulos de recorte: x y ancho en px, animados con transform
  const clipRects = Array.from({ length: SLOTS }, (_, i) => {
    const r = regions[i]
    if (!r) return { x: PAD.left, w: 0 }
    const s = Math.max(r[0], xMin), e = Math.min(r[1], xMax)
    if (!(s < e)) return { x: PAD.left, w: 0 }
    return { x: toX(s), w: toX(e) - toX(s) }
  })

  // Marcas del eje: regulares (sin las cercanas a un corte) + los cortes
  const ticks = useMemo(() => {
    const range = xMax - xMin
    const target = Math.max(4, Math.floor(plotW / 70))
    const raw = range / target
    const mag = Math.pow(10, Math.floor(Math.log10(raw)))
    const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw
    const first = Math.ceil(xMin / step) * step
    const regular = []
    for (let x = first; x <= xMax + 1e-9; x += step) {
      const v = Number(x.toFixed(6))
      if (!finiteCuts.some((c) => Math.abs(v - c) < step * 0.45)) regular.push(v)
    }
    return [...regular, ...finiteCuts].sort((a, b) => a - b)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xMin, xMax, plotW, cutsKey])

  const isCut = (x) => finiteCuts.some((c) => Math.abs(x - c) < 1e-9)

  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    if (px < PAD.left || px > W - PAD.right) { setHover(null); return }
    const x = xMin + ((px - PAD.left) / plotW) * (xMax - xMin)
    setHover({ x, y: pdfFn(x) })
  }

  const slide = { transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s' }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="dn-chart"
      role="img"
      aria-label={label}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id={`f${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.10" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        {clipRects.map((c, i) => (
          <clipPath key={i} id={`c${uid}${i}`}>
            <rect
              x="0" y="0" width="1" height={H}
              style={{ ...slide, transformOrigin: '0 0', transform: `translateX(${c.x}px) scaleX(${c.w})` }}
            />
          </clipPath>
        ))}
      </defs>

      {/* Cuadrícula */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={PAD.left} x2={PAD.left + plotW}
          y1={PAD.top + plotH * (1 - f)} y2={PAD.top + plotH * (1 - f)}
          stroke="rgba(255,255,255,0.06)" />
      ))}
      {ticks.filter((x) => !isCut(x)).map((x) => (
        <line key={x} x1={toX(x)} x2={toX(x)} y1={PAD.top} y2={baseY} stroke="rgba(255,255,255,0.06)" />
      ))}

      {/* Relleno tenue bajo toda la curva y línea central */}
      <path d={areaPath} fill={`url(#f${uid})`} className="dn-fade" />
      <line x1={toX(center)} x2={toX(center)} y1={PAD.top} y2={baseY}
        stroke={color} strokeOpacity="0.4" strokeDasharray="3 5" />

      {/* Sombreado (deslizante) */}
      {clipRects.map((_, i) => (
        <path key={i} d={areaPath} fill={`url(#g${uid})`} clipPath={`url(#c${uid}${i})`} />
      ))}

      {/* Líneas de corte (deslizantes) */}
      {Array.from({ length: SLOTS }, (_, i) => {
        const c = finiteCuts[i]
        const x = c === undefined ? toX(center) : toX(c)
        return (
          <g key={i} style={{ ...slide, transform: `translateX(${x}px)`, opacity: c === undefined ? 0 : 1 }}>
            <line x1="0" x2="0" y1={PAD.top} y2={baseY} stroke={color} strokeWidth="1.5" strokeDasharray="5 4" />
            <circle cx="0" cy={baseY} r="4.5" fill={color} />
          </g>
        )
      })}

      {/* Segunda curva opcional */}
      {overlay && (
        <path d={toPath(ovPts)} fill="none" stroke="#a4a4c2" strokeWidth="1.6"
          strokeDasharray="6 5" strokeLinejoin="round" className="dn-fade" />
      )}

      {/* Curva principal: se dibuja al aparecer */}
      <path d={linePath} className="dn-curve" pathLength="1" fill="none"
        stroke={color} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />

      {/* Eje X */}
      <line x1={PAD.left} x2={PAD.left + plotW} y1={baseY} y2={baseY} stroke="#7878a0" />
      {ticks.map((x) => {
        const sp = isCut(x)
        return (
          <g key={x} className="dn-fade">
            <line x1={toX(x)} x2={toX(x)} y1={baseY} y2={baseY + (sp ? 8 : 5)}
              stroke={sp ? color : '#7878a0'} strokeWidth={sp ? 2 : 1} />
            <text x={toX(x)} y={baseY + 27} textAnchor="middle"
              fontSize={sp ? 14 : 13} fontWeight={sp ? 700 : 400}
              fill={sp ? color : '#a4a4c2'} fontFamily="Inter, system-ui, sans-serif">
              {fmtTick(x)}
            </text>
          </g>
        )
      })}

      <text x={toX(center)} y={PAD.top - 12} textAnchor="middle" fill={color} fontSize="15"
        fontWeight="600" fontFamily="Lora, Georgia, serif" fontStyle="italic">
        {centerLabel}
      </text>

      {/* Lectura bajo el cursor */}
      {hover && (
        <g pointerEvents="none">
          <line x1={toX(hover.x)} x2={toX(hover.x)} y1={PAD.top} y2={baseY} stroke="#fff" strokeOpacity="0.35" />
          <circle cx={toX(hover.x)} cy={toY(hover.y)} r="5.5" fill="#fff" stroke={color} strokeWidth="2.5" />
          {(() => {
            const tw = 142
            const tx = Math.min(Math.max(toX(hover.x) - tw / 2, 6), W - tw - 6)
            return (
              <g transform={`translate(${tx}, 4)`}>
                <rect width={tw} height="28" rx="14" fill="rgba(20,20,44,0.94)" stroke="rgba(255,255,255,0.22)" />
                <text x={tw / 2} y="18.5" textAnchor="middle" fill="#f6f6fc" fontSize="13"
                  fontFamily="Inter, system-ui, sans-serif">
                  x = {hover.x.toFixed(2).replace('-', '−')} · f = {hover.y.toFixed(3)}
                </text>
              </g>
            )
          })()}
        </g>
      )}
    </svg>
  )
}
