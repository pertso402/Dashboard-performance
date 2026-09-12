import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import { dataCurta, money, moneyShort, n, num } from '../lib/format'

const EIXO = {
  stroke: 'var(--color-tinta-3)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const

const GRADE = {
  stroke: 'var(--color-borda)',
  strokeDasharray: '3 3',
  vertical: false,
} as const

const umaCasa = (v: number) => v.toFixed(1).replace('.', ',')

function CaixaTooltip({ titulo, linhas }: { titulo: string; linhas: ReactNode }) {
  return (
    <div className="rounded-lg border border-borda bg-superficie px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold text-tinta">{titulo}</div>
      <div className="space-y-0.5 tnum">{linhas}</div>
    </div>
  )
}

function Linha({ cor, rotulo, valor }: { cor: string; rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-tinta-2">
        <span className="size-2 rounded-full" style={{ background: cor }} />
        {rotulo}
      </span>
      <span className="font-medium text-tinta">{valor}</span>
    </div>
  )
}

/** Receita por dia/semana. */
export function GraficoReceita({ dados }: { dados: Record<string, unknown>[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={dados} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-serie-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-serie-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRADE} />
        <XAxis dataKey="bucket" tickFormatter={dataCurta} {...EIXO} minTickGap={18} />
        <YAxis tickFormatter={(v) => moneyShort(v)} width={62} {...EIXO} />
        <Tooltip
          cursor={{ stroke: 'var(--color-borda-forte)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <CaixaTooltip
                titulo={dataCurta(String(label))}
                linhas={
                  <>
                    <Linha cor="var(--color-serie-1)" rotulo="Receita" valor={money(d.receita)} />
                    <Linha cor="var(--color-serie-6)" rotulo="Pedidos" valor={num(d.pedidos)} />
                    <Linha cor="var(--color-serie-3)" rotulo="Ticket medio" valor={money(d.ticket_medio)} />
                  </>
                }
              />
            )
          }}
        />
        <Area
          type="monotone"
          dataKey={(d: Record<string, unknown>) => n(d.receita)}
          name="Receita"
          stroke="var(--color-serie-1)"
          strokeWidth={2}
          fill="url(#gradReceita)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Pedidos de primeira compra vs. recompra, empilhados. */
export function GraficoNovosVsRecompra({ dados }: { dados: Record<string, unknown>[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid {...GRADE} />
        <XAxis dataKey="bucket" tickFormatter={dataCurta} {...EIXO} minTickGap={18} />
        <YAxis allowDecimals={false} width={34} {...EIXO} />
        <Tooltip
          cursor={{ fill: 'var(--color-fundo)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            const total = n(d.pedidos_novos) + n(d.pedidos_recompra)
            return (
              <CaixaTooltip
                titulo={dataCurta(String(label))}
                linhas={
                  <>
                    <Linha cor="var(--color-serie-1)" rotulo="1a compra" valor={num(d.pedidos_novos)} />
                    <Linha cor="var(--color-serie-2)" rotulo="Recompra" valor={num(d.pedidos_recompra)} />
                    <Linha cor="var(--color-tinta-3)" rotulo="Total" valor={num(total)} />
                  </>
                }
              />
            )
          }}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 11, color: 'var(--color-tinta-2)', paddingTop: 8 }}
        />
        <Bar dataKey="pedidos_novos" name="1a compra" stackId="p" fill="var(--color-serie-1)" />
        <Bar dataKey="pedidos_recompra" name="Recompra" stackId="p" fill="var(--color-serie-2)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function agrega(coortes: Record<string, unknown>[], campo: string) {
  const base = coortes.reduce((s, c) => s + n(c.clientes), 0)
  const recompraram = coortes.reduce((s, c) => s + n(c[campo]), 0)
  return { base, recompraram, pct: base > 0 ? (recompraram / base) * 100 : 0 }
}

/** Curva de retencao: % das coortes que recomprou em 7 / 14 / 30 dias. */
export function GraficoCurvaRecompra({ dados }: { dados: Record<string, unknown>[] }) {
  const pontos = [
    { janela: '7 dias', ...agrega(dados, 'recompra_7d') },
    { janela: '14 dias', ...agrega(dados, 'recompra_14d') },
    { janela: '30 dias', ...agrega(dados, 'recompra_30d') },
  ]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={pontos} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid {...GRADE} />
        <XAxis dataKey="janela" {...EIXO} />
        <YAxis tickFormatter={(v) => `${v}%`} width={40} {...EIXO} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <CaixaTooltip
                titulo={`Em ate ${label}`}
                linhas={
                  <>
                    <Linha cor="var(--color-serie-2)" rotulo="Recompraram" valor={`${umaCasa(n(d.pct))}%`} />
                    <Linha cor="var(--color-tinta-3)" rotulo="Clientes" valor={`${num(d.recompraram)} de ${num(d.base)}`} />
                  </>
                }
              />
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="pct"
          name="% recompra"
          stroke="var(--color-serie-2)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'var(--color-serie-2)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export type BarraOrigem = { origem: string; cor: string; valor: number; rotulo: string }

/** Barras horizontais comparando origens de aquisicao. */
export function GraficoBarrasOrigem({
  dados, campo, formato = 'pct',
}: {
  dados: BarraOrigem[]
  campo: string
  formato?: 'pct' | 'num' | 'money'
}) {
  const fmt = (v: number) =>
    formato === 'money' ? money(v) : formato === 'num' ? num(v) : `${umaCasa(v)}%`
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, dados.length * 42)}>
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 44, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--color-borda)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={fmt} {...EIXO} />
        <YAxis type="category" dataKey="rotulo" width={104} {...EIXO} />
        <Tooltip
          cursor={{ fill: 'var(--color-fundo)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as BarraOrigem
            return <CaixaTooltip titulo={d.rotulo} linhas={<Linha cor={d.cor} rotulo={campo} valor={fmt(d.valor)} />} />
          }}
        />
        <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20}>
          {dados.map((d) => (
            <Cell key={d.origem} fill={d.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Envios da campanha por dia + conversoes. */
export function GraficoCampanha({ dados }: { dados: Record<string, unknown>[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid {...GRADE} />
        <XAxis dataKey="bucket" tickFormatter={dataCurta} {...EIXO} minTickGap={14} />
        <YAxis allowDecimals={false} width={34} {...EIXO} />
        <Tooltip
          cursor={{ fill: 'var(--color-fundo)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            const taxa = n(d.enviadas) > 0 ? (n(d.converteram) / n(d.enviadas)) * 100 : 0
            return (
              <CaixaTooltip
                titulo={dataCurta(String(label))}
                linhas={
                  <>
                    <Linha cor="var(--color-serie-6)" rotulo="Enviadas" valor={num(d.enviadas)} />
                    <Linha cor="var(--color-serie-2)" rotulo="Converteram" valor={num(d.converteram)} />
                    <Linha cor="var(--color-tinta-3)" rotulo="Taxa" valor={`${umaCasa(taxa)}%`} />
                  </>
                }
              />
            )
          }}
        />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: 'var(--color-tinta-2)', paddingTop: 8 }} />
        <Bar dataKey="enviadas" name="Enviadas" fill="var(--color-borda-forte)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="converteram" name="Converteram" fill="var(--color-serie-2)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Receita do dia separada entre o que veio do marketing e o que é da casa.
 * Empilhado, com 2px de respiro entre as faixas para as bordas não colarem.
 */
export function GraficoAtribuicao({ dados }: { dados: Record<string, unknown>[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={dados} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gradAtrib" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-serie-1)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--color-serie-1)" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRADE} />
        <XAxis dataKey="dia" tickFormatter={dataCurta} {...EIXO} minTickGap={18} />
        <YAxis tickFormatter={(v) => moneyShort(v)} width={62} {...EIXO} />
        <Tooltip
          cursor={{ stroke: 'var(--color-borda-forte)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            const total = n(d.atribuida) + n(d.nao_atribuida)
            const share = total > 0 ? (n(d.atribuida) / total) * 100 : 0
            return (
              <CaixaTooltip
                titulo={dataCurta(String(label))}
                linhas={
                  <>
                    <Linha cor="var(--color-serie-1)" rotulo="Meu trabalho" valor={money(d.atribuida)} />
                    <Linha cor="var(--color-neutro-1)" rotulo="Da casa" valor={money(d.nao_atribuida)} />
                    <div className="mt-1 border-t border-borda pt-1">
                      <Linha cor="var(--color-tinta-3)" rotulo="Minha fatia" valor={`${umaCasa(share)}%`} />
                    </div>
                  </>
                }
              />
            )
          }}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 11, color: 'var(--color-tinta-2)', paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey={(d: Record<string, unknown>) => n(d.nao_atribuida)}
          name="Da casa"
          stackId="r"
          stroke="var(--color-neutro-1)"
          strokeWidth={2}
          fill="var(--color-neutro-2)"
          fillOpacity={0.35}
        />
        <Area
          type="monotone"
          dataKey={(d: Record<string, unknown>) => n(d.atribuida)}
          name="Meu trabalho"
          stackId="r"
          stroke="var(--color-serie-1)"
          strokeWidth={2}
          fill="url(#gradAtrib)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Clientes novos trazidos pelo marketing, por dia. O termômetro da aquisição. */
export function GraficoNovosClientes({ dados }: { dados: Record<string, unknown>[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid {...GRADE} />
        <XAxis dataKey="dia" tickFormatter={dataCurta} {...EIXO} minTickGap={18} />
        <YAxis allowDecimals={false} width={34} {...EIXO} />
        <Tooltip
          cursor={{ fill: 'var(--color-fundo)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <CaixaTooltip
                titulo={dataCurta(String(label))}
                linhas={
                  <>
                    <Linha cor="var(--color-serie-1)" rotulo="Clientes novos" valor={num(d.novos)} />
                    <Linha cor="var(--color-tinta-3)" rotulo="Pedidos seus" valor={num(d.pedidos)} />
                  </>
                }
              />
            )
          }}
        />
        <Bar dataKey="novos" name="Clientes novos" fill="var(--color-serie-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
