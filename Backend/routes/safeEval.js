// Evaluador matemático seguro (sin eval ni Function).
// Soporta: números, x, y, pi, e, + - * / ^ ( ), multiplicación implícita (2x, 3(x+1))
// y funciones sqrt, abs, exp, ln, log, sin, cos, tan.

const FUNCS = {
  sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
  ln: Math.log, log: Math.log10, sin: Math.sin, cos: Math.cos, tan: Math.tan,
}
const CONSTS = { pi: Math.PI, e: Math.E }
const MAX_LEN = 200

function tokenize(src) {
  const tokens = []
  const re = /\s*(?:(\d+\.?\d*|\.\d+)|([a-zA-Z]+)|(.))/y
  let m
  while (re.lastIndex < src.length && (m = re.exec(src))) {
    if (m[1] !== undefined) tokens.push({ t: 'num', v: parseFloat(m[1]) })
    else if (m[2] !== undefined) tokens.push({ t: 'id', v: m[2].toLowerCase() })
    else if ('+-*/^()'.includes(m[3])) tokens.push({ t: 'op', v: m[3] })
    else throw new Error('Carácter no permitido')
  }
  return tokens
}

function evaluateExpression(expression, x, y = null) {
  try {
    const src = String(expression).replace(/\*\*/g, '^')
    if (src.length > MAX_LEN) return NaN
    const vars = { x: Number(x) }
    if (y !== null) vars.y = Number(y)

    const tokens = tokenize(src)
    let pos = 0
    const peek = () => tokens[pos]
    const isOp = (v) => peek() && peek().t === 'op' && peek().v === v

    function expr() {
      let v = term()
      while (isOp('+') || isOp('-')) {
        const op = tokens[pos++].v
        const r = term()
        v = op === '+' ? v + r : v - r
      }
      return v
    }
    function term() {
      let v = unary()
      for (;;) {
        if (isOp('*') || isOp('/')) {
          const op = tokens[pos++].v
          const r = unary()
          v = op === '*' ? v * r : v / r
        } else if (peek() && (peek().t === 'num' || peek().t === 'id' || isOp('('))) {
          v *= power() // multiplicación implícita: 2x, 3(x+1)
        } else return v
      }
    }
    function unary() {
      if (isOp('-')) { pos++; return -unary() }
      if (isOp('+')) { pos++; return unary() }
      return power()
    }
    function power() {
      const base = atom()
      if (isOp('^')) { pos++; return Math.pow(base, unary()) }
      return base
    }
    function atom() {
      const tk = tokens[pos++]
      if (!tk) throw new Error('Expresión incompleta')
      if (tk.t === 'num') return tk.v
      if (tk.t === 'id') {
        if (Object.prototype.hasOwnProperty.call(FUNCS, tk.v)) {
          if (!isOp('(')) throw new Error('Falta paréntesis')
          pos++
          const a = expr()
          if (!isOp(')')) throw new Error('Falta )')
          pos++
          return FUNCS[tk.v](a)
        }
        if (Object.prototype.hasOwnProperty.call(vars, tk.v)) return vars[tk.v]
        if (Object.prototype.hasOwnProperty.call(CONSTS, tk.v)) return CONSTS[tk.v]
        throw new Error('Identificador desconocido')
      }
      if (tk.v === '(') {
        const v = expr()
        if (!isOp(')')) throw new Error('Falta )')
        pos++
        return v
      }
      throw new Error('Símbolo inesperado')
    }

    const result = expr()
    if (pos !== tokens.length) throw new Error('Sobran símbolos')
    return Number.isFinite(result) ? result : NaN
  } catch {
    return NaN
  }
}

module.exports = { evaluateExpression }
