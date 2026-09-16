import type { ReactNode } from 'react'
import { delta as calcDelta, maybe } from '../lib/format'

export function Cartao({
  titulo, subtitulo, acao, children, className = '',
}: {
  titulo?: string
  subtitulo?: ReactNode
  acao?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-xl border border-borda bg-superficie shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
    >
      {(titulo || acao) && (
        <header className="flex items-start justify-between gap-4 border-b border-borda px-5 py-3.5">
          <div className="min-w-0">
            {titulo && <h2 className="text-sm font-semibold text-tinta">{titulo}</h2>}
            {subtitulo && (
              // `borrar`: subtítulos costumam citar números em texto corrido,
              // que o seletor .tnum do modo privado não alcança.
              <p className="borrar mt-0.5 text-xs leading-relaxed text-tinta-3">{subtitulo}</p>
            )}
          </div>
          {acao && <div className="shrink-0">{acao}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

/** Seta de variação vs. período anterior. Sobe/desce muda de cor conforme a métrica. */
export function Variacao({
  atual, anterior, inverso = false, sufixo = 'vs. período anterior',
}: {
  atual: unknown
  anterior: unknown
  inverso?: boolean
  sufixo?: string
}) {
  const d = calcDelta(atual, anterior)
  if (d === null) {
    return <span className="text-xs text-tinta-3">sem base de comparação</span>
  }
  const zero = Math.abs(d) < 0.05
  const bom = inverso ? d < 0 : d > 0
  const cor = zero ? 'text-tinta-3' : bom ? 'text-alta' : 'text-baixa'
  const seta = zero ? '→' : d > 0 ? '↑' : '↓'
  return (
    <span className={`text-xs tnum ${cor}`}>
      {seta} {Math.abs(d).toFixed(1).replace('.', ',')}%{' '}
      <span className="text-tinta-3">{sufixo}</span>
    </span>
  )
}

export function Kpi({
  rotulo, valor, detalhe, rodape, destaque = false, ajuda,
}: {
  rotulo: string
  valor: string
  detalhe?: ReactNode
  rodape?: ReactNode
  destaque?: boolean
  ajuda?: string
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        destaque
          ? 'border-serie-1/30 bg-serie-1/[0.04]'
          : 'border-borda bg-superficie'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium tracking-wide text-tinta-2 uppercase">
          {rotulo}
        </span>
        {ajuda && (
          <span
            title={ajuda}
            className="grid size-3.5 cursor-help place-items-center rounded-full border border-borda-forte text-[9px] font-bold text-tinta-3"
          >
            ?
          </span>
        )}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight tnum text-tinta">
        {valor}
      </div>
      {detalhe && <div className="mt-1 text-xs text-tinta-2 tnum">{detalhe}</div>}
      {rodape && <div className="mt-2">{rodape}</div>}
    </div>
  )
}

export function Aviso({
  tom = 'aviso', titulo, children,
}: {
  tom?: 'aviso' | 'neutro'
  titulo: string
  children?: ReactNode
}) {
  const estilo =
    tom === 'aviso'
      ? 'border-aviso-borda bg-aviso-fundo text-aviso'
      : 'border-borda bg-fundo text-tinta-2'
  return (
    <div className={`rounded-lg border px-4 py-3 text-xs leading-relaxed ${estilo}`}>
      <strong className="font-semibold">{titulo}</strong>
      {children && <div className="mt-1 text-tinta-2">{children}</div>}
    </div>
  )
}

/** Barra horizontal proporcional — usada nas tabelas para leitura rápida. */
export function BarraMini({
  valor, max, cor = 'var(--color-serie-1)',
}: {
  valor: number
  max: number
  cor?: string
}) {
  const p = max > 0 ? Math.max(2, (valor / max) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-borda">
      <div className="h-full rounded-full" style={{ width: `${p}%`, background: cor }} />
    </div>
  )
}

/** Célula de heatmap para a tabela de coortes. */
export function CelulaHeat({ pct: valor }: { pct: unknown }) {
  const v = maybe(valor)
  if (v === null) return <span className="text-tinta-3">—</span>
  const intensidade = Math.min(1, v / 50)
  return (
    <span
      className="inline-block min-w-[3.25rem] rounded-md px-2 py-1 text-center text-xs font-medium tnum"
      style={{
        background: `color-mix(in srgb, var(--color-serie-2) ${intensidade * 22}%, transparent)`,
        color: intensidade > 0.55 ? 'var(--color-serie-2)' : 'var(--color-tinta)',
      }}
    >
      {v.toFixed(1).replace('.', ',')}%
    </span>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-borda py-10 text-center text-xs text-tinta-3">
      {children}
    </div>
  )
}
