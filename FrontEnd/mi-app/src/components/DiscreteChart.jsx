// ─────────────────────────────────────────────────────────────
// DiscreteChart.jsx — Gráfica de barras para distribuciones
// discretas (Binomial, Poisson). Las barras resaltadas son las
// que suman en la probabilidad pedida.
//   data : [{ k, p }, …]      isOn : k → ¿resaltada?
// ─────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from 'react'

const PAD = { top: 34, right: 22, bottom: 50, left: 22 }

export default function DiscreteChart({
  data, isOn, color = '#9be7ff', label = 'Distribución de probabilidad',
}) {
  const svgRef = useRef(null)
  const [W, setW] = useState(560)
  const [hover, setHover] = useState(null)

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

  const H = Math.max(260, Math.round(W * 0.48))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const N = data.length
  const slot = plotW / N
  const barW = Math.max(1.5, slot * (slot > 8 ? 0.74 : 0.86))
  const yMax = Math.max(...data.map((d) => d.p), 1e-9) * 1.18
  const baseY = PAD.top + plotH
  const toY = (p) => PAD.top + plotH - (p / yMax) * plotH
  const cx = (i) => PAD.left + slot * (i + 0.5)

  const maxLabels = Math.max(4, Math.floor(plotW / 44))
  const step = Math.max(1, Math.ceil(N / maxLabels))

  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.floor((px - PAD.left) / slot)
    setHover(i >= 0 && i < N ? i : null)
  }

  const hv = hover !== null ? data[hover] : null

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
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={PAD.left} x2={PAD.left + plotW}
          y1={PAD.top + plotH * (1 - f)} y2={PAD.top + plotH * (1 - f)} stroke="rgba(255,255,255,0.06)" />
      ))}

      {data.map((d, i) => {
        const on = isOn(d.k)
        const h = Math.max(0, baseY - toY(d.p))
        return (
          <rect
            key={d.k}
            className="dn-bar"
            style={{ '--i': i }}
            x={cx(i) - barW / 2}
            y={baseY - h}
            width={barW}
            height={h}
            rx={Math.min(4, barW / 3)}
            fill={color}
            fillOpacity={on ? 0.92 : 0.2}
            stroke={hover === i ? '#fff' : 'none'}
            strokeWidth="1.5"
          />
        )
      })}

      <line x1={PAD.left} x2={PAD.left + plotW} y1={baseY} y2={baseY} stroke="#7878a0" />
      {data.map((d, i) => (i % step === 0 || i === N - 1) && (
        <g key={d.k}>
          <line x1={cx(i)} x2={cx(i)} y1={baseY} y2={baseY + 5} stroke="#7878a0" />
          <text x={cx(i)} y={baseY + 25} textAnchor="middle" fontSize="13"
            fill={isOn(d.k) ? color : '#a4a4c2'} fontWeight={isOn(d.k) ? 700 : 400}
            fontFamily="Inter, system-ui, sans-serif">
            {d.k}
          </text>
        </g>
      ))}

      {hv && (
        <g pointerEvents="none">
          {(() => {
            const tw = 150
            const tx = Math.min(Math.max(cx(hover) - tw / 2, 6), W - tw - 6)
            return (
              <g transform={`translate(${tx}, 4)`}>
                <rect width={tw} height="28" rx="14" fill="rgba(20,20,44,0.94)" stroke="rgba(255,255,255,0.22)" />
                <text x={tw / 2} y="18.5" textAnchor="middle" fill="#f6f6fc" fontSize="13"
                  fontFamily="Inter, system-ui, sans-serif">
                  k = {hv.k} · P = {hv.p.toFixed(4)}
                </text>
              </g>
            )
          })()}
        </g>
      )}
    </svg>
  )
}
