import { Cartao } from '../components/Ui'
import { dataLonga, money, n, num, pct } from '../lib/format'
import type { AnuncioTotal as Dados } from '../lib/tipos'

/**
 * Resultado do anúncio da Meta desde o início — não depende do período filtrado.
 * Investimento total vs. tudo que os clientes vindos de anúncio já gastaram.
 */
export function AnuncioTotal({ a }: { a: Dados }) {
  const investido = n(a.investido)
  if (investido <= 0) return null

  const roas = a.roas === null ? '—' : `${n(a.roas).toFixed(2).replace('.', ',')}x`
  const campanha =
    a.campanha_inicio && a.campanha_fim
      ? `${dataLonga(a.campanha_inicio)} a ${dataLonga(a.campanha_fim)}`
      : null

  return (
    <Cartao
      titulo="Anúncio (Meta) — desde o início"
      subtitulo={`Tudo o que foi investido em anúncio contra tudo o que os clientes que vieram dele já gastaram${
        campanha ? `. Investimento lançado de ${campanha}` : ''
      }. Não muda com o filtro de período.`}
    >
      <div className="grid gap-px overflow-hidden rounded-lg border border-borda bg-borda sm:grid-cols-2 xl:grid-cols-4">
        <Bloco
          rotulo="Retorno (ROI)"
          valor={a.roi_pct === null ? '—' : pct(a.roi_pct, 0)}
          detalhe={`${roas} o valor investido`}
          destaque
        />
        <Bloco
          rotulo="Clientes do anúncio gastaram"
          valor={money(a.receita)}
          detalhe={`${num(a.pedidos)} pedidos · investimento de ${money(investido)}`}
          destaque
        />
        <Bloco
          rotulo="CAC"
          valor={a.cac === null ? '—' : money(a.cac)}
          detalhe={`${num(a.clientes)} clientes compraram · ${num(a.recompraram)} voltaram`}
        />
        <Bloco
          rotulo="LTV do cliente de anúncio"
          valor={a.ltv === null ? '—' : money(a.ltv)}
          detalhe="Média gasta por cliente que comprou"
        />
        <Bloco
          rotulo="Custo por conversa"
          valor={a.custo_por_conversa === null ? '—' : money(a.custo_por_conversa)}
          detalhe={
            a.conversas_estimadas === null
              ? 'Informado pelo painel do Meta'
              : `≈ ${num(a.conversas_estimadas)} conversas iniciadas`
          }
        />
        <Bloco
          rotulo="CPM"
          valor={a.cpm === null ? '—' : money(a.cpm)}
          detalhe={
            a.impressoes_estimadas === null
              ? 'Custo por mil impressões'
              : `≈ ${num(a.impressoes_estimadas)} impressões`
          }
        />
        <Bloco
          rotulo="Leads do anúncio"
          valor={num(a.leads)}
          detalhe={`${a.leads > 0 ? pct((100 * a.clientes) / a.leads, 0) : '—'} viraram clientes`}
        />
        <Bloco
          rotulo="Custo por lead"
          valor={a.custo_por_lead === null ? '—' : money(a.custo_por_lead)}
          detalhe="Investimento ÷ contatos que chegaram pelo anúncio"
        />
      </div>
    </Cartao>
  )
}

function Bloco({
  rotulo, valor, detalhe, destaque = false,
}: {
  rotulo: string
  valor: string
  detalhe: string
  destaque?: boolean
}) {
  return (
    <div className={`p-4 ${destaque ? 'bg-serie-1/[0.05]' : 'bg-superficie'}`}>
      <p className="text-xs font-medium tracking-wide text-tinta-2 uppercase">{rotulo}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tnum text-tinta">{valor}</p>
      <p className="borrar mt-1 text-xs text-tinta-3">{detalhe}</p>
    </div>
  )
}
