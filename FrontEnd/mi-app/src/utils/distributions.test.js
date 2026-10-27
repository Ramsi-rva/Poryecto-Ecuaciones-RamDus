import { describe, it, expect } from 'vitest'
import * as d from './distributions.js'

const close = (a, b, tol = 1e-4) => expect(Math.abs(a - b)).toBeLessThan(tol)

describe('Normal', () => {
  it('CDF en valores conocidos', () => {
    close(d.normalCdf(0), 0.5, 1e-12)
    close(d.normalCdf(1.96), 0.975, 1e-4)
    close(d.normalCdf(-1), 0.158655, 1e-6)
    expect(d.normalCdf(Infinity)).toBe(1)
    expect(d.normalCdf(-Infinity)).toBe(0)
  })
  it('inversa', () => {
    close(d.normalInv(0.975), 1.959964, 1e-5)
    close(d.normalInv(0.5), 0, 1e-12)
    close(d.normalCdf(d.normalInv(0.123)), 0.123, 1e-10)
    expect(d.normalInv(0)).toBe(-Infinity)
    expect(d.normalInv(2)).toBeNaN()
  })
})

describe('t de Student', () => {
  it('valores críticos de tablas', () => {
    close(d.tInv(0.975, 10), 2.22814, 1e-4)
    close(d.tInv(0.975, 24), 2.0639, 1e-4)
    close(d.tInv(0.95, 5), 2.01505, 1e-4)
    close(d.tInv(0.025, 10), -2.22814, 1e-4)
  })
  it('CDF y simetría', () => {
    close(d.tCdf(0, 7), 0.5, 1e-12)
    close(d.tCdf(1.5, 9) + d.tCdf(-1.5, 9), 1, 1e-12)
    close(d.tCdf(d.tInv(0.9, 13), 13), 0.9, 1e-10)
  })
  it('tiende a la normal con muchos grados de libertad', () => {
    close(d.tInv(0.975, 100000), 1.959964, 1e-3)
  })
})

describe('Valores críticos y valor p', () => {
  it('dos colas, derecha e izquierda', () => {
    close(d.criticalValue(0.05, 'two', { type: 'z' }), 1.959964, 1e-5)
    close(d.criticalValue(0.05, 'right', { type: 'z' }), 1.644854, 1e-5)
    close(d.criticalValue(0.05, 'left', { type: 'z' }), -1.644854, 1e-5)
    close(d.pValue(1.96, 'two', { type: 'z' }), 0.05, 1e-3)
    close(d.pValue(2.228, 'two', { type: 't', df: 10 }), 0.05, 1e-3)
  })
  it('parseProb acepta 0.05 y 5', () => {
    expect(d.parseProb('0.05')).toBeCloseTo(0.05)
    expect(d.parseProb('5')).toBeCloseTo(0.05)
    expect(d.parseProb('abc')).toBeNaN()
    expect(d.parseProb('0')).toBeNaN()
  })
})

describe('Chi-cuadrada', () => {
  it('cuantiles de tablas', () => {
    close(d.chi2Inv(0.95, 1), 3.84146, 1e-4)
    close(d.chi2Inv(0.95, 10), 18.307, 1e-3)
    close(d.chi2Inv(0.05, 5), 1.1455, 1e-3)
    close(d.chi2Inv(0.99, 20), 37.5662, 1e-3)
  })
  it('CDF coherente con la densidad', () => {
    let s = 0
    const N = 20000
    for (let i = 0; i < N; i++) s += d.chi2Pdf(((i + 0.5) / N) * 12, 5) * (12 / N)
    close(s, d.chi2Cdf(12, 5), 1e-4)
  })
})

describe('F de Fisher', () => {
  it('cuantiles de tablas', () => {
    close(d.fInv(0.95, 5, 10), 3.3258, 1e-3)
    close(d.fInv(0.95, 3, 12), 3.4903, 1e-3)
    close(d.fInv(0.975, 3, 12), 4.4742, 1e-3)
  })
  it('CDF coherente con la densidad', () => {
    let s = 0
    const N = 40000
    for (let i = 0; i < N; i++) s += d.fPdf(((i + 0.5) / N) * 4, 3, 12) * (4 / N)
    close(s, d.fCdf(4, 3, 12), 1e-4)
  })
})

describe('Binomial y Poisson', () => {
  it('binomial', () => {
    close(d.binomPmf(5, 10, 0.5), 0.24609375, 1e-9)
    close(d.binomCdf(3, 10, 0.5), 0.171875, 1e-9)
    close(d.binomCdf(10, 10, 0.3), 1, 1e-12)
    expect(d.binomPmf(11, 10, 0.5)).toBe(0)
  })
  it('poisson', () => {
    close(d.poissonPmf(0, 2), Math.exp(-2), 1e-12)
    close(d.poissonCdf(2, 3), 0.42319, 1e-4)
    close(d.poissonCdf(50, 4), 1, 1e-12)
  })
})

describe('Inferencia para la media', () => {
  it('intervalo de confianza con t', () => {
    const ci = d.confidenceInterval({ mean: 50, sd: 10, n: 25, conf: 0.95, known: false })
    close(ci.crit, 2.0639, 1e-3)
    close(ci.margin, 4.1278, 1e-3)
    close(ci.lower, 45.8722, 1e-3)
    close(ci.upper, 54.1278, 1e-3)
  })
  it('prueba z de dos colas', () => {
    const t = d.meanTest({ mean: 52, mu0: 50, sd: 10, n: 25, alpha: 0.05, tail: 'two', known: true })
    close(t.stat, 1, 1e-9)
    close(t.p, 0.3173, 1e-3)
    expect(t.reject).toBe(false)
  })
  it('rechaza cuando el estadístico es extremo', () => {
    const t = d.meanTest({ mean: 60, mu0: 50, sd: 10, n: 25, alpha: 0.05, tail: 'right', known: false })
    expect(t.reject).toBe(true)
  })
})

describe('ANOVA de un factor y LSD de Fisher', () => {
  const tabletas = [[5.2, 4.7, 8.1, 6.2, 3.0], [9.1, 7.1, 8.2, 6.0, 9.1], [3.2, 5.8, 2.2, 3.1, 7.2]]
  const maquinas = [
    [6.4, 7.8, 5.3, 7.4, 8.4, 7.3], [8.7, 7.4, 9.4, 10.1, 9.2, 9.8],
    [11.1, 10.3, 9.7, 10.3, 9.2, 8.8], [9.9, 12.8, 12.1, 10.8, 11.3, 11.5],
  ]
  const tratamientos = [[32, 30, 30, 26, 32], [44, 43, 44, 46, 48], [33, 36, 35, 36, 40]]

  it('actividad 3.1 (tabletas)', () => {
    const r = d.anovaOneWay(tabletas, 0.05)
    close(r.sctr, 33.852, 1e-3)
    close(r.sce, 39.152, 1e-3)
    close(r.stc, 73.004, 1e-3)
    close(r.cmtr, 16.926, 1e-3)
    close(r.F, 5.1878, 1e-3)
    close(r.fCrit, 3.8853, 1e-3)
    expect(r.reject).toBe(true)
  })
  it('actividad 3.2 (tres tratamientos)', () => {
    const r = d.anovaOneWay(tratamientos, 0.05)
    close(r.sctr, 570, 1e-9)
    close(r.sce, 66, 1e-9)
    close(r.F, 51.8182, 1e-3)
    const l = d.lsdPairs(r, 0.05)
    close(l.t, 2.1788, 1e-3)
    close(l.pairs[0].lsd, 3.23, 5e-3)
    expect(l.pairs.every((p) => p.reject)).toBe(true)
  })
  it('cuatro máquinas y sus seis comparaciones LSD', () => {
    const r = d.anovaOneWay(maquinas, 0.05)
    close(r.sctr, 57.765, 1e-3)
    close(r.sce, 19.26, 1e-3)
    close(r.F, 19.9948, 1e-3)
    close(r.fCrit, 3.0984, 1e-3)
    const l = d.lsdPairs(r, 0.05)
    close(l.pairs[0].lsd, 1.181, 1e-3)
    // M2 vs M3 es la única que no se rechaza
    const noRech = l.pairs.filter((p) => !p.reject).map((p) => `${p.i + 1}-${p.j + 1}`)
    expect(noRech).toEqual(['2-3'])
  })
  it('valor p en la cola derecha coherente con la CDF', () => {
    close(d.fSf(3.3258, 5, 10), 0.05, 1e-4)
    close(d.fSf(4, 3, 12), 1 - d.fCdf(4, 3, 12), 1e-12)
  })
})
