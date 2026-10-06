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
