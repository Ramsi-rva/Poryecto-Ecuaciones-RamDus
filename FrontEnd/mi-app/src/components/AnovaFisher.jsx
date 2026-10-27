// ─────────────────────────────────────────────────────────────
// AnovaFisher.jsx — ANOVA de un factor + prueba LSD de Fisher
// Sigue el procedimiento de clase: hipótesis, tabla ANOVA,
// F crítico, decisión, conclusión y comparaciones por pares (LSD).
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './Calculadora.css'
import Screen from './Screen'
import DistChart from './DistChart'
import { Field, Step, Stage } from './ui'
import { anovaOneWay, lsdPairs, fPdf, fInv, parseProb } from '../utils/distributions'

const fmt = (v, d = 4) => Number(v).toFixed(d)
const fmtP = (p) => (p < 0.0001 ? '< 0.0001' : fmt(p, 4))

const MAX_GRUPOS = 10

let nextId = 1
const nuevo = (name = '', text = '') => ({ id: nextId++, name, text })

// Acepta comas, espacios, punto y coma o saltos de línea. Decimales con punto.
const parseValores = (text) => {
  const partes = text.split(/[\s,;]+/).filter(Boolean)
  const nums = partes.map(Number)
  return { nums, malos: partes.filter((_, i) => !Number.isFinite(nums[i])) }
}

// La densidad F puede ser infinita en 0 (d₁ < 2): se acota para dibujarla
function makeF(d1, d2, hi) {
  let peak = 0
  for (let i = 1; i <= 80; i++) peak = Math.max(peak, fPdf((i / 80) * hi * 0.98, d1, d2))
  const cap = peak * 1.25
  return (x) => Math.min(fPdf(x, d1, d2), cap)
}

// Desglose del cálculo de SCTR, SCE y STC, grupo por grupo
function desglose(datos, res) {
  const grupos = datos.map((d, i) => {
    const mean = res.means[i]
    const obs = d.nums.map((y) => ({ y, dI: y - mean, dG: y - res.grand }))
    return {
      nombre: d.nombre,
      n: d.nums.length,
      mean,
      sum: res.sums[i],
      sctr: d.nums.length * (mean - res.grand) ** 2,
      sce: obs.reduce((a, o) => a + o.dI ** 2, 0),
      stc: obs.reduce((a, o) => a + o.dG ** 2, 0),
      obs,
    }
  })
  return {
    grupos,
    sumaTotal: grupos.reduce((a, g) => a + g.sum, 0),
    stcDirecto: grupos.reduce((a, g) => a + g.stc, 0),
  }
}

// Calcula todo a partir del texto de los grupos (función pura)
function calcular(grupos, alphaP) {
  if (isNaN(alphaP)) return { error: 'Ingresa un nivel de significancia α válido (0.05 o 5).' }
  const datos = []
  for (let i = 0; i < grupos.length; i++) {
    const g = grupos[i]
    const nombre = g.name.trim() || `Grupo ${i + 1}`
    const { nums, malos } = parseValores(g.text)
    if (malos.length) return { error: `${nombre}: "${malos[0]}" no es un número. Usa punto decimal y separa con comas o espacios.` }
    if (nums.length === 0) {
      if (g.text.trim() === '' && grupos.length > 2 && !g.name.trim()) continue // fila vacía: se ignora
      return { error: `${nombre} no tiene datos.` }
    }
    datos.push({ nombre, nums })
  }
  if (datos.length < 2) return { error: 'Necesitas al menos 2 grupos con datos.' }
  const N = datos.reduce((a, d) => a + d.nums.length, 0)
  if (N <= datos.length) return { error: 'Necesitas más observaciones que grupos (al menos un grupo con 2 datos).' }
  const res = anovaOneWay(datos.map((d) => d.nums), alphaP)
  if (!(res.cme > 0)) return { error: 'Dentro de cada grupo todos los datos son iguales (CME = 0): no se puede calcular F.' }
  return { datos, res, lsd: lsdPairs(res, alphaP) }
}

export default function AnovaFisher({ onBack }) {
  const [grupos, setGrupos] = useState(() => [nuevo(), nuevo()])
  const [alpha, setAlpha] = useState('0.05')
  const [tocado, setTocado] = useState(false)

  const alphaP = parseProb(alpha)

  const cambiar = (id, campo, valor) =>
    setGrupos((gs) => gs.map((g) => (g.id === id ? { ...g, [campo]: valor } : g)))
  const quitar = (id) => setGrupos((gs) => gs.filter((g) => g.id !== id))
  const agregar = () =>
    setGrupos((gs) => (gs.length >= MAX_GRUPOS ? gs : [...gs, nuevo('', '')]))
  const limpiar = () => { setGrupos([nuevo('', ''), nuevo('', '')]); setAlpha('0.05'); setTocado(false) }

  const calc = useMemo(() => calcular(grupos, alphaP), [grupos, alphaP])

  const res = calc.res
  const hi = res ? Math.min(12, Math.max(4, fInv(0.985, res.dfTr, res.dfE))) : 6
  const pdfFn = useMemo(
    () => (res ? makeF(res.dfTr, res.dfE, hi) : makeF(3, 12, 6)),
    [res, hi],
  )
  const domain = useMemo(() => [0, hi], [hi])

  let resultado = null
  if (res) {
    const a = fmt(alphaP, 4)
    resultado = {
      label: `ANOVA de un factor  ·  K = ${res.K} grupos  ·  N = ${res.N}  ·  α = ${a}  ·  gl = (${res.dfTr}, ${res.dfE})`,
      cards: [
        { label: 'Estadístico F = CMTR / CME', value: fmt(res.F) },
        { label: 'F crítico (Fα)', value: fmt(res.fCrit) },
        { label: 'Valor p', value: fmtP(res.p) },
        { label: 'Decisión', value: res.reject ? 'Rechazar H₀' : 'No rechazar H₀' },
        { label: 'Media global', value: fmt(res.grand) },
      ],
    }
  } else if (tocado) {
    resultado = { error: calc.error }
  }

  const geo = res
    ? { regions: [[res.fCrit, Infinity]], cuts: [res.fCrit], marker: { x: res.F, label: `F = ${fmt(res.F, 2)}` } }
    : { regions: [], cuts: [], marker: null }

  const desg = res ? desglose(calc.datos, res) : null
  const nombreLista = calc.datos ? calc.datos.map((d) => d.nombre) : []
  const mismosN = res ? res.ns.every((n) => n === res.ns[0]) : true

  return (
    <Screen title="ANOVA y LSD de Fisher" onBack={onBack} wide>
      <div className="calc-grid">
        {/* ── Formulario ── */}
        <form className="panel" onSubmit={(e) => { e.preventDefault(); setTocado(true) }} noValidate>
          <Step n="1" title="Datos por grupo">
            <p className="step-note">Un grupo por tratamiento o columna. Separa los datos con comas o espacios y usa punto decimal.</p>
            <div className="group-list">
              {grupos.map((g, i) => (
                <div className="group-card" key={g.id}>
                  <div className="group-head">
                    <Field label={`Nombre del grupo ${i + 1}`} className="group-name">
                      <input className="field-input" type="text" value={g.name}
                        onChange={(e) => cambiar(g.id, 'name', e.target.value)} placeholder={`Grupo ${i + 1}`} />
                    </Field>
                    {grupos.length > 2 && (
                      <button type="button" className="icon-btn" aria-label={`Quitar el grupo ${i + 1}`}
                        onClick={() => quitar(g.id)}>×</button>
                    )}
                  </div>
                  <Field label="Datos" adorn={null}>
                    <textarea className="field-input field-textarea" rows={2} value={g.text}
                      onChange={(e) => cambiar(g.id, 'text', e.target.value)} placeholder="Ej. 32, 30, 30, 26, 32" />
                  </Field>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-glass btn-add" onClick={agregar} disabled={grupos.length >= MAX_GRUPOS}>
              + Agregar grupo
            </button>
          </Step>

          <Step n="2" title="Significancia">
            <Field label="Nivel de significancia" adorn="α"
              hint={!isNaN(alphaP) ? `Se interpreta como ${(alphaP * 100).toFixed(2)} %` : 'Acepta 0.05 o 5 (porcentaje)'}>
              <input className="field-input" type="number" step="any" inputMode="decimal"
                value={alpha} onChange={(e) => setAlpha(e.target.value)} placeholder="0.05" />
            </Field>
          </Step>

          <div className="actions">
            <button type="submit" className="btn btn-primary">Calcular</button>
            <button type="button" className="btn btn-glass" onClick={limpiar}>Limpiar</button>
          </div>
        </form>

        {/* ── Escenario ── */}
        <div className="stage">
          <Stage resultado={resultado}>
            <DistChart
              pdfFn={pdfFn}
              domain={domain}
              regions={geo.regions}
              cuts={geo.cuts}
              marker={geo.marker}
              center={null}
              lowerBound={0}
              label={`Curva F con ${res ? res.dfTr : '—'} y ${res ? res.dfE : '—'} grados de libertad. ${resultado && !resultado.error ? resultado.label : ''}`}
            />
          </Stage>

          {res && (
            <div className="stage-inner stage-extra" key={`${res.F}-${alphaP}-${res.K}`}>
              {/* Hipótesis, decisión y conclusión */}
              <section className="block stagger" style={{ '--i': 0 }}>
                <h3 className="block-title">Hipótesis, decisión y conclusión</h3>
                <dl className="facts">
                  <div><dt>H₀</dt><dd>μ₁ = μ₂ = … = μ<sub>{res.K}</sub> (todas las medias poblacionales son iguales)</dd></div>
                  <div><dt>Hₐ</dt><dd>No todas las medias poblacionales son iguales</dd></div>
                  <div><dt>Estadístico</dt><dd>F = {fmt(res.cmtr)} / {fmt(res.cme)} = <b>{fmt(res.F)}</b></dd></div>
                  <div><dt>Crítico</dt><dd>F<sub>α</sub> = F({fmt(alphaP, 4)}; {res.dfTr}, {res.dfE}) = <b>{fmt(res.fCrit)}</b></dd></div>
                  <div>
                    <dt>Decisión</dt>
                    <dd>
                      Como {fmt(res.F)} {res.reject ? '≥' : '<'} {fmt(res.fCrit)}{' '}
                      <b className={res.reject ? 'tag-reject' : 'tag-keep'}>{res.reject ? 'se rechaza H₀' : 'no se rechaza H₀'}</b>
                    </dd>
                  </div>
                  <div>
                    <dt>Conclusión</dt>
                    <dd>
                      {res.reject
                        ? `Con α = ${fmt(alphaP, 4)} hay evidencia de que al menos una de las medias poblacionales es distinta.`
                        : `Con α = ${fmt(alphaP, 4)} no hay evidencia suficiente para afirmar que las medias poblacionales sean distintas.`}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Tabla ANOVA */}
              <section className="stagger" style={{ '--i': 1 }}>
                <h3 className="block-title">Tabla ANOVA</h3>
                <div className="table-wrap">
                  <table className="table table-compact">
                    <thead>
                      <tr><th>Fuente</th><th>Suma de cuadrados</th><th>gl</th><th>Cuadrado medio</th><th>F</th><th>Valor p</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Tratamientos</td><td>{fmt(res.sctr)}</td><td>{res.dfTr}</td><td>{fmt(res.cmtr)}</td>
                        <td>{fmt(res.F)}</td><td>{fmtP(res.p)}</td>
                      </tr>
                      <tr><td>Error</td><td>{fmt(res.sce)}</td><td>{res.dfE}</td><td>{fmt(res.cme)}</td><td /><td /></tr>
                      <tr><td>Total</td><td>{fmt(res.stc)}</td><td>{res.dfTotal}</td><td /><td /><td /></tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Cálculo de SCTR, SCE y STC */}
              <section className="block stagger" style={{ '--i': 2 }}>
                <h3 className="block-title">Cálculo de SCTR, SCE y STC</h3>
                <p className="block-note">
                  Media global: ȳ = ΣΣyᵢⱼ / N = {fmt(desg.sumaTotal, 2)} / {res.N} = <b>{fmt(res.grand)}</b>
                </p>
                <div className="formula-list">
                  <p className="formula">SCTR = Σ nᵢ (x̄ᵢ − ȳ)²</p>
                  <p className="formula">SCE = ΣΣ (yᵢⱼ − x̄ᵢ)²</p>
                  <p className="formula">STC = ΣΣ (yᵢⱼ − ȳ)² = SCTR + SCE</p>
                </div>
                <div className="table-wrap">
                  <table className="table table-compact">
                    <thead>
                      <tr>
                        <th>Grupo</th><th>nᵢ</th><th>x̄ᵢ</th>
                        <th>nᵢ(x̄ᵢ − ȳ)²</th><th>Σ(yᵢⱼ − x̄ᵢ)²</th><th>Σ(yᵢⱼ − ȳ)²</th>
                      </tr>
                    </thead>
                    <tbody>
                      {desg.grupos.map((g, i) => (
                        <tr key={g.nombre + i}>
                          <td>{g.nombre}</td><td>{g.n}</td><td>{fmt(g.mean)}</td>
                          <td>{fmt(g.sctr)}</td><td>{fmt(g.sce)}</td><td>{fmt(g.stc)}</td>
                        </tr>
                      ))}
                      <tr className="row-total">
                        <td>Suma / media general</td><td>{res.N}</td><td><b>ȳ = {fmt(res.grand)}</b></td>
                        <td><b>SCTR = {fmt(res.sctr)}</b></td>
                        <td><b>SCE = {fmt(res.sce)}</b></td>
                        <td><b>STC = {fmt(desg.stcDirecto)}</b></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="block-note" style={{ margin: '14px 0 0' }}>
                  Media de cada grupo: {desg.grupos.map((g) => `${g.nombre} = ${fmt(g.mean)}`).join(' · ')} · Media general ȳ = {fmt(res.grand)}
                </p>
                <p className="block-note" style={{ margin: '8px 0 0' }}>
                  Comprobación: SCTR + SCE = {fmt(res.sctr)} + {fmt(res.sce)} = <b>{fmt(res.sctr + res.sce)}</b>
                  {Math.abs(res.sctr + res.sce - desg.stcDirecto) < 1e-6 * Math.max(1, res.stc) ? ' = STC ✓' : ''}
                </p>

                <details className="block-details">
                  <summary>Ver las desviaciones dato por dato</summary>
                  {desg.grupos.map((g, gi) => (
                    <div key={g.nombre + gi} className="detail-group">
                      <h4>{g.nombre} · x̄ = {fmt(g.mean)}</h4>
                      <div className="table-wrap">
                        <table className="table table-compact">
                          <thead>
                            <tr><th>yᵢⱼ</th><th>yᵢⱼ − x̄ᵢ</th><th>(yᵢⱼ − x̄ᵢ)²</th><th>yᵢⱼ − ȳ</th><th>(yᵢⱼ − ȳ)²</th></tr>
                          </thead>
                          <tbody>
                            {g.obs.map((o, oi) => (
                              <tr key={oi}>
                                <td>{fmt(o.y, 2)}</td><td>{fmt(o.dI)}</td><td>{fmt(o.dI ** 2)}</td>
                                <td>{fmt(o.dG)}</td><td>{fmt(o.dG ** 2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </details>
              </section>

              {/* Resumen por grupo */}
              <section className="stagger" style={{ '--i': 1 }}>
                <h3 className="block-title">Resumen por grupo</h3>
                <div className="table-wrap">
                  <table className="table table-compact">
                    <thead>
                      <tr><th>Grupo</th><th>n</th><th>Suma</th><th>Media</th><th>Varianza</th></tr>
                    </thead>
                    <tbody>
                      {nombreLista.map((nombre, i) => (
                        <tr key={nombre + i}>
                          <td>{nombre}</td><td>{res.ns[i]}</td><td>{fmt(res.sums[i], 2)}</td>
                          <td>{fmt(res.means[i])}</td><td>{fmt(res.vars[i])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* LSD de Fisher */}
              <section className="block stagger" style={{ '--i': 3 }}>
                <h3 className="block-title">Prueba LSD de Fisher</h3>
                {!res.reject && (
                  <p className="block-note">El ANOVA no rechazó H₀, por lo que normalmente no se hacen comparaciones por pares. Se muestran solo como referencia.</p>
                )}
                <p className="formula">
                  LSD = t<sub>α/2, n−K</sub> · √( CME · (1/nᵢ + 1/nⱼ) )
                </p>
                <p className="block-note">
                  t<sub>{fmt(alphaP / 2, 4)}, {res.dfE}</sub> = <b>{fmt(lsdPairs(res, alphaP).t)}</b>{'  ·  '}CME = <b>{fmt(res.cme)}</b>
                  {mismosN && <>{'  ·  '}LSD = <b>{fmt(calc.lsd.pairs[0].lsd)}</b></>}
                </p>
                <div className="table-wrap">
                  <table className="table table-compact">
                    <thead>
                      <tr><th>Comparación</th><th>|x̄ᵢ − x̄ⱼ|</th><th>LSD</th><th>Decisión</th></tr>
                    </thead>
                    <tbody>
                      {calc.lsd.pairs.map((p) => (
                        <tr key={`${p.i}-${p.j}`}>
                          <td>{nombreLista[p.i]} vs {nombreLista[p.j]}</td>
                          <td>{fmt(p.diff)}</td>
                          <td>{fmt(p.lsd)}</td>
                          <td>
                            <b className={p.reject ? 'tag-reject' : 'tag-keep'}>
                              {p.reject ? 'Rechazar H₀ · medias distintas' : 'No rechazar H₀ · iguales'}
                            </b>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </Screen>
  )
}
