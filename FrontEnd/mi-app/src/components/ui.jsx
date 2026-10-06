// ─────────────────────────────────────────────────────────────
// ui.jsx — Piezas reutilizables del sistema de diseño
// ─────────────────────────────────────────────────────────────

import { cloneElement, useEffect, useId, useRef, useState } from 'react'

// ── Número animado ───────────────────────────────────────────
// Interpola todos los números de un texto ("97.5002%", "−1.5 · 1.5")
// conservando prefijos, sufijos y decimales.
const NUM = /(-?\d+(?:\.\d+)?)/

const ease = (t) => 1 - Math.pow(1 - t, 4)

export function AnimatedNumber({ text, duration = 900 }) {
  const parts = String(text ?? '').split(NUM)
  const nums = parts.filter((_, i) => i % 2 === 1).map(parseFloat)
  const key = nums.join('|')
  const [shown, setShown] = useState(null)
  const shownRef = useRef(null)

  useEffect(() => {
    if (nums.length === 0) return undefined
    const from = shownRef.current && shownRef.current.length === nums.length
      ? shownRef.current
      : nums.map(() => 0)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let start = null
    let raf
    const tick = (now) => {
      if (start === null) start = now
      const p = reduce ? 1 : Math.min(1, (now - start) / duration)
      const e = ease(p)
      const vals = nums.map((to, i) => from[i] + (to - from[i]) * e)
      shownRef.current = vals
      setShown(vals)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration])

  if (nums.length === 0) return <>{text}</>
  const vals = shown && shown.length === nums.length ? shown : nums.map(() => 0)
  return (
    <>
      {parts
        .map((p, i) => (i % 2 === 0 ? p : vals[(i - 1) / 2].toFixed((p.split('.')[1] || '').length)))
        .join('')}
    </>
  )
}

// ── Campo de formulario grande ───────────────────────────────
// children: un <input> o <select>. `adorn` va al final del campo,
// `extra` admite un control (p. ej. interruptor ±∞).
export function Field({ label, adorn, hint, extra, children, className = '' }) {
  const id = useId()
  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="field-control">
        {cloneElement(children, { id })}
        {adorn && <span className="field-adorn" aria-hidden="true">{adorn}</span>}
        {extra}
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

// ── Interruptor de infinito ──────────────────────────────────
export function InfToggle({ pressed, onChange, children }) {
  return (
    <button
      type="button"
      className="chip-toggle"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
    >
      {children}
    </button>
  )
}

// ── Interruptor (switch) ─────────────────────────────────────
export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="switch"
      onClick={() => onChange(!checked)}
    >
      <span className="switch-track"><span className="switch-thumb" /></span>
      <span className="switch-label">{label}</span>
    </button>
  )
}

// ── Mosaicos de selección (radio) ────────────────────────────
export function Tiles({ label, value, onChange, options }) {
  return (
    <div className="tiles" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`tile${o.wide ? ' wide' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.sym && <span className="tile-sym">{o.sym}</span>}
          <span className="tile-title">{o.title}</span>
          {o.desc && <span className="tile-desc">{o.desc}</span>}
        </button>
      ))}
    </div>
  )
}

// ── Sección numerada de un formulario ────────────────────────
export function Step({ n, title, children }) {
  return (
    <section className="step">
      <h2 className="step-head">
        <span className="step-n" aria-hidden="true">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

// ── Barra de exportación: copiar el resultado y bajar la gráfica ──
function resultadoATexto(resultado) {
  const [hero, ...rest] = resultado.cards
  return [
    resultado.label,
    `${hero.label}: ${hero.value}`,
    ...rest.map((c) => `${c.label}: ${c.value}`),
  ].join('\n')
}

function descargarPng(svg, resultado) {
  const rect = svg.getBoundingClientRect()
  const w = Math.round(rect.width)
  const h = Math.round(rect.height)
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', w)
  clone.setAttribute('height', h)
  const xml = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  const img = new Image()
  img.onload = () => {
    const scale = 2
    const head = 150
    const canvas = document.createElement('canvas')
    canvas.width = w * scale
    canvas.height = (h + head) * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)
    ctx.fillStyle = '#0d0d22'
    ctx.fillRect(0, 0, w, h + head)
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#b9b9d3'
    ctx.font = 'italic 17px Lora, Georgia, serif'
    ctx.fillText(resultado.label, 24, 38, w - 48)
    ctx.fillStyle = '#ecdcaa'
    ctx.font = '600 56px Lora, Georgia, serif'
    ctx.fillText(resultado.cards[0].value, 24, 100, w - 48)
    ctx.fillStyle = '#a4a4c2'
    ctx.font = '15px Inter, system-ui, sans-serif'
    ctx.fillText(resultado.cards[0].label, 24, 126, w - 48)
    ctx.drawImage(img, 0, head, w, h)
    URL.revokeObjectURL(url)
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'grafica-estadistica.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    }, 'image/png')
  }
  img.src = url
}

function ExportBar({ resultado, rootRef }) {
  const [msg, setMsg] = useState('')
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const flash = (t) => {
    setMsg(t)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(''), 2200)
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(resultadoATexto(resultado))
      flash('Copiado al portapapeles')
    } catch {
      flash('No se pudo copiar')
    }
  }

  const bajar = () => {
    const svg = rootRef.current?.querySelector('svg.dn-chart')
    if (!svg) { flash('Sin gráfica que descargar'); return }
    descargarPng(svg, resultado)
    flash('Descargando imagen…')
  }

  return (
    <div className="export-bar">
      <button type="button" className="btn-mini" onClick={copiar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" />
        </svg>
        Copiar resultado
      </button>
      <button type="button" className="btn-mini" onClick={bajar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" />
        </svg>
        Descargar gráfica
      </button>
      <span className="export-msg" role="status">{msg}</span>
    </div>
  )
}

// ── Escenario de resultado: titular, gráfica y detalles ──────
export function Stage({ resultado, children }) {
  const hero = resultado && !resultado.error ? resultado.cards[0] : null
  const rest = hero ? resultado.cards.slice(1) : []
  const rootRef = useRef(null)

  return (
    <div className="stage-inner" ref={rootRef}>
      <header className="hero-result" aria-live="polite">
        {resultado?.error ? (
          <p className="hero-error">{resultado.error}</p>
        ) : hero ? (
          <>
            <p className="hero-eyebrow">{resultado.label}</p>
            <p className={`hero-value${hero.value.length > 11 ? ' hero-long' : ''}`}><AnimatedNumber text={hero.value} /></p>
            <p className="hero-caption">{hero.label}</p>
          </>
        ) : (
          <>
            <p className="hero-eyebrow">Resultado</p>
            <p className="hero-value hero-empty">—</p>
            <p className="hero-caption">Completa los datos y aparecerá aquí al instante.</p>
          </>
        )}
      </header>

      {children}

      {hero && <ExportBar resultado={resultado} rootRef={rootRef} />}

      {rest.length > 0 && (
        <div className="stat-grid" key={resultado.label}>
          {rest.map((c, i) => (
            <div key={c.label} className="stat stagger" style={{ '--i': i }}>
              <span className="stat-label">{c.label}</span>
              <span className="stat-value"><AnimatedNumber text={c.value} /></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
