// ─────────────────────────────────────────────────────────────
// NormalPanel.jsx  —  Panel 3: Distribución Normal Estándar
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { distApi } from '../utils/api'

export default function NormalPanel() {
  const canvasRef = useRef(null)
  const [mode, setMode] = useState('pdf')        // pdf | cdf | area
  const [zMin, setZMin] = useState(-5)
  const [zMax, setZMax] = useState(5)
  const [areaA, setAreaA] = useState(-1)
  const [areaB, setAreaB] = useState(1)
  const [curveData, setCurveData] = useState(null)
  const [areaResult, setAreaResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Cargar curva cada vez que cambien parámetros
  useEffect(() => {
    fetchCurve()
  }, [mode, zMin, zMax])

  useEffect(() => {
    if (mode === 'area') fetchArea()
  }, [areaA, areaB, mode])

  useEffect(() => {
    if (curveData) drawChart()
  }, [curveData, areaA, areaB, mode, areaResult])

  const fetchCurve = async () => {
    setLoading(true)
    try {
      const data = await distApi.normalCurve({ zMin, zMax, steps: 600, type: mode === 'cdf' ? 'cdf' : 'pdf' })
      setCurveData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchArea = async () => {
    try {
      const res = await distApi.normalArea(areaA, areaB)
      setAreaResult(res)
    } catch (e) { console.error(e) }
  }

  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas || !curveData) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const PAD = { top: 20, right: 20, bottom: 40, left: 50 }
    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom

    ctx.clearRect(0, 0, W, H)

    const xs = curveData.x
    const ys = curveData.y
    const yMax = Math.max(...ys) * 1.1 || 1

    const toCanvasX = (x) => PAD.left + ((x - xs[0]) / (xs[xs.length - 1] - xs[0])) * plotW
    const toCanvasY = (y) => PAD.top + plotH - (y / yMax) * plotH

    // Grid lines
    ctx.strokeStyle = 'rgba(128,128,128,0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (plotH / 4) * i
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + plotW, y); ctx.stroke()
    }

    // Area fill (modo area)
    if (mode === 'area') {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'
      ctx.beginPath()
      let started = false
      for (let i = 0; i < xs.length; i++) {
        if (xs[i] >= areaA && xs[i] <= areaB) {
          const cx = toCanvasX(xs[i]), cy = toCanvasY(ys[i])
          if (!started) { ctx.moveTo(cx, toCanvasY(0)); ctx.lineTo(cx, cy); started = true }
          else ctx.lineTo(cx, cy)
        }
      }
      ctx.lineTo(toCanvasX(Math.min(areaB, xs[xs.length - 1])), toCanvasY(0))
      ctx.closePath(); ctx.fill()
    }

    // Main curve
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    xs.forEach((x, i) => {
      const cx = toCanvasX(x), cy = toCanvasY(ys[i])
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
    })
    ctx.stroke()

    // X axis
    ctx.strokeStyle = 'rgba(128,128,128,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD.left, PAD.top + plotH)
    ctx.lineTo(PAD.left + plotW, PAD.top + plotH)
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = 'rgba(100,100,100,0.9)'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    const ticks = [-4, -3, -2, -1, 0, 1, 2, 3, 4].filter(t => t >= xs[0] && t <= xs[xs.length - 1])
    ticks.forEach(t => {
      const cx = toCanvasX(t)
      ctx.fillText(t, cx, PAD.top + plotH + 18)
    })
    ctx.textAlign = 'right'
    ;[0, yMax / 2, yMax].forEach(v => {
      const cy = toCanvasY(v)
      ctx.fillText(v.toFixed(2), PAD.left - 6, cy + 4)
    })
  }

  return (
    <div className="panel-content">
      <h2 className="panel-title">Distribución Normal Estándar</h2>

      <div className="tab-row">
        {[['pdf', 'PDF φ(z)'], ['cdf', 'CDF Φ(z)'], ['area', 'Área P(a≤Z≤b)']].map(([v, l]) => (
          <button key={v} className={`tab-btn ${mode === v ? 'active' : ''}`} onClick={() => setMode(v)}>{l}</button>
        ))}
      </div>

      <div className="controls-row">
        <div className="control-item">
          <label className="ctrl-label">Z mínimo: <strong>{zMin}</strong></label>
          <input type="range" min={-50} max={-1} value={zMin} step={1}
            onChange={(e) => setZMin(+e.target.value)} className="slider" />
        </div>
        <div className="control-item">
          <label className="ctrl-label">Z máximo: <strong>{zMax}</strong></label>
          <input type="range" min={1} max={50} value={zMax} step={1}
            onChange={(e) => setZMax(+e.target.value)} className="slider" />
        </div>
      </div>

      {mode === 'area' && (
        <div className="controls-row area-controls">
          <div className="control-item">
            <label className="ctrl-label">a = <strong>{areaA.toFixed(2)}</strong></label>
            <input type="range" min={-10} max={0} step={0.1} value={areaA}
              onChange={(e) => setAreaA(+e.target.value)} className="slider" />
          </div>
          <div className="control-item">
            <label className="ctrl-label">b = <strong>{areaB.toFixed(2)}</strong></label>
            <input type="range" min={0} max={10} step={0.1} value={areaB}
              onChange={(e) => setAreaB(+e.target.value)} className="slider" />
          </div>
          {areaResult && (
            <div className="metric-card accent" style={{ minWidth: 180 }}>
              <span className="metric-label">P({areaA.toFixed(2)} ≤ Z ≤ {areaB.toFixed(2)})</span>
              <span className="metric-value">{areaResult.area.toFixed(4)}</span>
            </div>
          )}
        </div>
      )}

      <div className="chart-container">
        {loading && <div className="chart-loading">Cargando…</div>}
        <canvas ref={canvasRef} width={680} height={280} style={{ width: '100%' }} />
      </div>

      <div className="formula-row">
        <span className="formula">φ(z) = (1/√2π) · e<sup>−z²/2</sup></span>
        <span className="formula">Φ(z) = ∫<sub>−∞</sub><sup>z</sup> φ(t) dt</span>
        <span className="formula">μ = 0, σ = 1</span>
      </div>
    </div>
  )
}