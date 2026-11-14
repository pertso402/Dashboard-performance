import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Cartao, Kpi, Vazio } from '../components/Ui'
import { dataCurta, money, moneyShort, n, num } from '../lib/format'
import type { Crescimento as Dados } from '../lib/tipos'

/** Cor fixa por canal — a cor segue o canal, nunca a posição na pilha. */
const CANAIS: Record<string, { rotulo: string; cor: string }> = {
  sistema: { rotulo: 'Sistema (WhatsApp/balcão)', cor: 'var(--color-serie-1)' },
  ifood: { rotulo: 'iFood', cor: 'var(--color-serie-5)' },
  keeta: { rotulo: 'Keeta', cor: 'var(--color-serie-3)' },
  manual: { rotulo: 'Venda na mão', cor: 'var(--color-serie-7)' },
}
const CORES_EXTRA = ['var(--color-serie-2)', 'var(--color-serie-4)', 'var(--color-serie-6)']

const sinal = (v: number | null) =>
  v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}%`
const cresc = (atual: number, anterior: number) =>
  anterior > 0 ? ((atual - anterior) / anterior) * 100 : null
const periodo = (ini: string, fim: string) => `${dataCurta(ini)} a ${dataCurta(fim)}`

export function Crescimento({ c }: { c: Dados }) {
  const blocos = c.blocos ?? []
  if (blocos.length < 2) {
    return (
      <Cartao titulo="Crescimento mês a mês">
        <Vazio>Ainda não há dois meses completos de dados para comparar.</Vazio>
      </Cartao>
    )
  }

  // Canais externos na ordem em que aparecem, para a cor nunca mudar de dono.
  const externos: string[] = []
  for (const b of blocos) for (const k of Object.keys(b.externos ?? {})) if (!externos.includes(k)) externos.push(k)
  const temManual = blocos.some((b) => n(b.manual) > 0)
  const series = ['sistema', ...externos, ...(temManual ? ['manual'] : [])]
  const info = (k: string, i: number) =>
    CANAIS[k] ?? { rotulo: k, cor: CORES_EXTRA[i % CORES_EXTRA.length] }

  const linhas = blocos.map((b, i) => {
    const ant = blocos[i - 1]
    const valores: Record<string, number> = { sistema: n(b.sistema), manual: n(b.manual) }
    for (const k of externos) valores[k] = n(b.externos?.[k])
    const total = n(b.total)
    return {
      ...valores,
      chave: b.inicio,
      eixo: periodo(b.inicio, b.fim),
      total,
      atribuida: n(b.atribuida),
      pedidos: b.pedidos_sistema,
      cresc: ant ? cresc(total, n(ant.total)) : null,
      crescMeu: ant ? cresc(n(b.atribuida), n(ant.atribuida)) : null,
    }
  })

  const ultimo = linhas[linhas.length - 1]
  const penultimo = linhas[linhas.length - 2]
  const primeiro = linhas[0]
  const meses = linhas.length - 1
  const medio =
    n(primeiro.total) > 0 ? (Math.pow(ultimo.total / primeiro.total, 1 / meses) - 1) * 100 : null

  // Canal que só aparece no último mês: mostra quanto do crescimento vem dele.
  const novos = externos.filter(
    (k) => n(blocos[blocos.length - 1].externos?.[k]) > 0 && !n(blocos[blocos.length - 2].externos?.[k])
  )
  const valorNovos = novos.reduce((s, k) => s + n(blocos[blocos.length - 1].externos?.[k]), 0)
  const crescMesmos = cresc(ultimo.total - valorNovos, penultimo.total)

  return (
    <Cartao
      titulo="Crescimento mês a mês"
      subtitulo={`Faturamento total em blocos de ${c.dias_bloco} dias até ${dataCurta(
        c.corte
      )}, o último dia com iFood lançado. Blocos do mesmo tamanho para a comparação ser justa. Não muda com o filtro de período.`}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Kpi
            rotulo="Crescimento do último mês"
            valor={sinal(ultimo.cresc)}
            destaque
            detalhe={`${money(penultimo.total)} → ${money(ultimo.total)}`}
            ajuda="Faturamento dos últimos 30 dias comparado aos 30 dias anteriores."
          />
          <Kpi
            rotulo="Crescimento médio por mês"
            valor={sinal(medio)}
            detalhe={`Desde ${dataCurta(primeiro.chave)}: ${money(primeiro.total)} → ${money(ultimo.total)}`}
            ajuda="Taxa composta: o crescimento constante por mês que leva do primeiro ao último bloco."
          />
          {novos.length > 0 ? (
            <Kpi
              rotulo={`Sem ${novos.map((k) => info(k, 0).rotulo).join(' e ')}`}
              valor={sinal(crescMesmos)}
              detalhe={`Só nos canais que já existiam no mês anterior. ${novos
                .map((k) => info(k, 0).rotulo)
                .join(' e ')} entrou com ${money(valorNovos)}.`}
              ajuda="Crescimento do último mês tirando o canal que não tinha lançamento no mês anterior."
            />
          ) : (
            <Kpi
              rotulo="Meu trabalho no último mês"
              valor={sinal(ultimo.crescMeu)}
              detalhe={`${money(penultimo.atribuida)} → ${money(ultimo.atribuida)}`}
            />
          )}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={linhas} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid stroke="var(--color-borda)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="eixo"
              tickLine={false}
              axisLine={false}
              interval={0}
              height={56}
              tick={(p: { x: number; y: number; index: number }) => {
                const l = linhas[p.index]
                return (
                  <g transform={`translate(${p.x},${p.y})`}>
                    <text dy={12} textAnchor="middle" fontSize={11} fill="var(--color-tinta-3)">
                      {l.eixo}
                    </text>
                    <text dy={28} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--color-tinta)">
                      {moneyShort(l.total)}
                    </text>
                    <text
                      dy={44}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill={l.cresc === null ? 'var(--color-tinta-3)' : l.cresc >= 0 ? 'var(--color-alta)' : 'var(--color-baixa)'}
                    >
                      {l.cresc === null ? 'base' : sinal(l.cresc)}
                    </text>
                  </g>
                )
              }}
            />
            <YAxis tickFormatter={(v) => moneyShort(v)} width={62} stroke="var(--color-tinta-3)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--color-fundo)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as (typeof linhas)[number] & Record<string, number>
                return (
                  <div className="rounded-lg border border-borda bg-superficie px-3 py-2 text-xs shadow-lg">
                    <div className="mb-1 font-semibold text-tinta">{d.eixo}</div>
                    <div className="space-y-0.5 tnum">
                      {series.map((k, i) =>
                        n(d[k]) > 0 ? (
                          <div key={k} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-tinta-2">
                              <span className="size-2 rounded-full" style={{ background: info(k, i).cor }} />
                              {info(k, i).rotulo}
                            </span>
                            <span className="font-medium text-tinta">{money(d[k])}</span>
                          </div>
                        ) : null
                      )}
                      <div className="mt-1 flex justify-between gap-4 border-t border-borda pt-1">
                        <span className="text-tinta-2">Total</span>
                        <span className="font-semibold text-tinta">{money(d.total)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-tinta-2">vs. mês anterior</span>
                        <span className="font-medium text-tinta">{sinal(d.cresc)}</span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {series.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={info(k, i).rotulo}
                stackId="total"
                fill={info(k, i).cor}
                stroke="var(--color-superficie)"
                strokeWidth={2}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={88}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Tabela: a mesma informação sem depender de cor */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-xs text-tinta-3">
                <th className="py-2 pr-3 font-medium">Período</th>
                <th className="py-2 pr-3 text-right font-medium">Faturamento</th>
                <th className="py-2 pr-3 text-right font-medium">Crescimento</th>
                <th className="py-2 pr-3 text-right font-medium">Meu trabalho</th>
                <th className="py-2 pr-3 text-right font-medium">Crescimento</th>
                <th className="py-2 text-right font-medium">Pedidos no sistema</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {linhas.map((l) => (
                <tr key={l.chave} className="border-b border-borda last:border-0">
                  <td className="py-2.5 pr-3 text-tinta-2">{l.eixo}</td>
                  <td className="py-2.5 pr-3 text-right font-medium text-tinta">{money(l.total)}</td>
                  <td className="py-2.5 pr-3 text-right"><Delta v={l.cresc} /></td>
                  <td className="py-2.5 pr-3 text-right text-tinta">{money(l.atribuida)}</td>
                  <td className="py-2.5 pr-3 text-right"><Delta v={l.crescMeu} /></td>
                  <td className="py-2.5 text-right text-tinta">{num(l.pedidos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Cartao>
  )
}

function Delta({ v }: { v: number | null }) {
  if (v === null) return <span className="text-tinta-3">—</span>
  return (
    <span className={`font-medium ${v >= 0 ? 'text-alta' : 'text-baixa'}`}>
      {v >= 0 ? '▲' : '▼'} {sinal(v)}
    </span>
  )
}
