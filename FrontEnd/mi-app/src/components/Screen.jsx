// ─────────────────────────────────────────────────────────────
// Screen.jsx — Estructura común de cada pantalla:
// barra superior de cristal (volver + título) y contenido.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

export default function Screen({ title, onBack, wide = false, children }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="screen">
      <header className="topbar glass" data-scrolled={scrolled}>
        {onBack && (
          <button className="topbar-back" onClick={onBack} aria-label="Volver al menú">
            <span className="topbar-chevron" aria-hidden="true">‹</span> Menú
          </button>
        )}
        <h1 className="topbar-title">{title}</h1>
      </header>
      <main className={`screen-body${wide ? ' wide' : ''}`}>{children}</main>
    </div>
  )
}
