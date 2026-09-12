const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
})
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const int = new Intl.NumberFormat('pt-BR')

/** Postgres devolve numeric como string — normaliza para number. */
export const n = (v: unknown): number => {
  const x = typeof v === 'string' ? Number(v) : (v as number)
  return Number.isFinite(x) ? x : 0
}

/** Distingue "zero" de "sem dado": null continua null. */
export const maybe = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

export const money = (v: unknown) => brl.format(n(v))
export const moneyShort = (v: unknown) => brlCompact.format(n(v))
export const num = (v: unknown) => int.format(n(v))

export const pct = (v: unknown, casas = 1) => {
  const x = maybe(v)
  if (x === null) return '—'
  return `${x.toFixed(casas).replace('.', ',')}%`
}

export const dias = (v: unknown) => {
  const x = maybe(v)
  if (x === null) return '—'
  return `${x.toFixed(1).replace('.', ',')} d`
}

/** Variação percentual contra o período anterior. null quando a base é zero. */
export const delta = (atual: unknown, anterior: unknown): number | null => {
  const a = n(atual)
  const b = n(anterior)
  if (b === 0) return null
  return ((a - b) / b) * 100
}

export const dataCurta = (iso: string) => {
  const p = iso.slice(0, 10).split('-')
  return `${p[2]}/${p[1]}`
}

export const dataLonga = (iso: string) => {
  const p = iso.slice(0, 10).split('-')
  return `${p[2]}/${p[1]}/${p[0]}`
}

/** Hoje no fuso de São Paulo, independente do fuso do navegador. */
export const hoje = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

/** Aritmética de datas em UTC puro, para não escorregar de dia. */
export const somaDias = (iso: string, qtd: number) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + qtd)).toISOString().slice(0, 10)
}

export const inicioDoMes = (iso: string) => `${iso.slice(0, 7)}-01`

export const fimDoMes = (iso: string) => {
  const [y, m] = iso.slice(0, 7).split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

/** Quantos dias o período cobre, inclusive nas duas pontas. */
export const duracaoDias = (inicio: string, fim: string) => {
  const a = Date.parse(`${inicio}T00:00:00Z`)
  const b = Date.parse(`${fim}T00:00:00Z`)
  return Math.round((b - a) / 86400000) + 1
}
