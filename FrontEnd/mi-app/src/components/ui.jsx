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

// ── Escenario de resultado: titular, gráfica y detalles ──────
export function Stage({ resultado, children }) {
  const hero = resultado && !resultado.error ? resultado.cards[0] : null
  const rest = hero ? resultado.cards.slice(1) : []

  return (
    <div className="stage-inner">
      <header className="hero-result" aria-live="polite">
        {resultado?.error ? (
          <p className="hero-error">{resultado.error}</p>
        ) : hero ? (
          <>
            <p className="hero-eyebrow">{resultado.label}</p>
            <p className="hero-value"><AnimatedNumber text={hero.value} /></p>
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
