import { Aviso, BarraMini, Cartao, Kpi, Vazio } from '../components/Ui'
import { GraficoBarrasOrigem } from '../components/Graficos'
import { dataLonga, dias, money, num, pct } from '../lib/format'
import { cor, label, ORIGEM_DESCRICAO } from '../lib/origens'
import type { Origem, Painel } from '../lib/tipos'

export function Aquisicao({ dados }: { dados: Painel }) {
  const c = dados.cac
  const anuncio = dados.origens.find((o) => o.origem === 'anuncio')
  const organico = dados.origens.find((o) => o.origem === 'organico')

  const adquirentes = dados.origens
    .filter((o) => o.clientes_adquiridos > 0 && o.origem !== 'lead_sem_compra')
    .sort((x, y) => y.clientes_adquiridos - x.clientes_adquiridos)
  const maxAdq = Math.max(1, ...adquirentes.map((o) => o.clientes_adquiridos))

  const barrasLtv = adquirentes.map((o) => ({
    origem: o.origem,
    rotulo: label(o.origem),
    cor: cor(o.origem),
    valor: Number(o.ltv_medio ?? 0),
  }))

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          rotulo="Clientes vindos de anúncio"
          valor={num(c.clientes_adquiridos)}
          destaque
          ajuda="Clientes cujo primeiro pedido caiu no período e cuja origem é anúncio."
          detalhe={`${num(c.recompraram)} deles já recompraram`}
          rodape={
            <span className="text-xs tnum text-tinta-2">
              {pct(anuncio?.taxa_recompra)} de taxa de recompra
            </span>
          }
        />
        <Kpi
          rotulo="CAC (Meta Ads)"
          valor={c.cac === null ? '—' : money(c.cac)}
          ajuda="Investimento em Meta Ads rateado no período dividido pelos clientes de anúncio adquiridos."
          detalhe={`${money(c.investido_meta)} investidos no período`}
        />
        <Kpi
          rotulo="ROAS"
          valor={c.roas === null ? '—' : `${Number(c.roas).toFixed(2).replace('.', ',')}x`}
          ajuda="Receita total já gerada pelos clientes de anúncio dividida pelo investimento em Meta Ads no período."
          detalhe={`${money(c.receita_vitalicia)} de receita gerada`}
        />
        <Kpi
          rotulo="LTV do cliente de anúncio"
          valor={c.ltv_anuncio === null ? '—' : money(c.ltv_anuncio)}
          ajuda="Receita média acumulada por cliente adquirido via anúncio, somando todas as compras dele."
          detalhe={
            organico
              ? `Orgânico: ${money(organico.ltv_medio)}`
              : 'Sem base orgânica para comparar'
          }
        />
      </div>

      {c.cobertura_investimento !== 'completa' && (
        <Aviso
          titulo={
            c.cobertura_investimento === 'sem_dados'
              ? 'Não há investimento cadastrado neste período.'
              : 'O investimento cadastrado cobre só parte do período.'
          }
        >
          CAC e ROAS saem da tabela <code className="rounded bg-superficie px-1">marketing_investimentos</code>.
          O Meta está lançado dia a dia pelas faturas reais de 16/08 a 29/08, quando a verba
          acabou; o consumo de 03/08 a 15/08 ainda é uma estimativa do saldo. Em datas sem
          lançamento o custo entra como zero e o ROAS fica inflado — cadastre cada aporte
          para os números fecharem.
        </Aviso>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo="De onde vieram os clientes"
          subtitulo="Clientes que fizeram a primeira compra dentro do período, agrupados pela origem de aquisição."
        >
          {adquirentes.length === 0 ? (
            <Vazio>Nenhum cliente novo neste período.</Vazio>
          ) : (
            <div className="space-y-4">
              {adquirentes.map((o) => (
                <div key={o.origem}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="flex items-center gap-2 text-sm text-tinta"
                      title={ORIGEM_DESCRICAO[o.origem as Origem]}
                    >
                      <span className="size-2.5 rounded-full" style={{ background: cor(o.origem) }} />
                      {label(o.origem)}
                    </span>
                    <span className="tnum text-sm text-tinta">
                      {num(o.clientes_adquiridos)}
                      <span className="ml-1.5 text-xs text-tinta-3">
                        {pct(o.taxa_recompra)} voltam
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <BarraMini valor={o.clientes_adquiridos} max={maxAdq} cor={cor(o.origem)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Cartao>

        <Cartao
          titulo="Quanto cada origem vale"
          subtitulo="LTV médio: receita acumulada por cliente daquela origem. Compare com o CAC para saber se o canal se paga."
        >
          {barrasLtv.length === 0 ? (
            <Vazio>Sem clientes adquiridos no período.</Vazio>
          ) : (
            <GraficoBarrasOrigem dados={barrasLtv} campo="LTV médio" formato="money" />
          )}
        </Cartao>
      </div>

      {anuncio && organico && (
        <Cartao
          titulo="Anúncio vs. orgânico"
          subtitulo="O anúncio traz volume. A pergunta é se traz cliente que fica."
        >
          <div className="scroll-fino -mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-xs text-tinta-3">
                  <th className="pb-2 font-medium">Métrica</th>
                  <th className="pb-2 text-right font-medium">Anúncio</th>
                  <th className="pb-2 text-right font-medium">Orgânico</th>
                  <th className="pb-2 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                <LinhaComparacao rotulo="Clientes adquiridos" a={anuncio.clientes_adquiridos} o={organico.clientes_adquiridos} fmt={num} />
                <LinhaComparacao rotulo="Taxa de recompra" a={anuncio.taxa_recompra} o={organico.taxa_recompra} fmt={pct} />
                <LinhaComparacao rotulo="LTV médio" a={anuncio.ltv_medio} o={organico.ltv_medio} fmt={money} />
                <LinhaComparacao rotulo="Dias até recomprar" a={anuncio.dias_medio_recompra} o={organico.dias_medio_recompra} fmt={dias} inverso />
                <LinhaComparacao rotulo="Receita gerada" a={anuncio.receita_vitalicia} o={organico.receita_vitalicia} fmt={money} />
              </tbody>
            </table>
          </div>
        </Cartao>
      )}

      <Cartao
        titulo="Investimento cadastrado no período"
        subtitulo="Cada lançamento é rateado por dia, então só a parte que cai dentro do período filtrado entra na conta."
      >
        {c.canais.length === 0 ? (
          <Vazio>Nenhum investimento cadastrado que cruze com este período.</Vazio>
        ) : (
          <div className="scroll-fino -mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-xs text-tinta-3">
                  <th className="pb-2 font-medium">Canal</th>
                  <th className="pb-2 font-medium">Lançamento</th>
                  <th className="pb-2 text-right font-medium">Investido total</th>
                  <th className="pb-2 text-right font-medium">Dias no período</th>
                  <th className="pb-2 text-right font-medium">Rateado no período</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {c.canais.map((k) => (
                  <tr key={`${k.canal}-${k.periodo_inicio}`}>
                    <td className="py-2.5 font-medium text-tinta">{k.canal}</td>
                    <td className="py-2.5 tnum text-tinta-2">
                      {dataLonga(k.periodo_inicio)} – {dataLonga(k.periodo_fim)}
                    </td>
                    <td className="py-2.5 text-right tnum text-tinta-2">{money(k.investido_total)}</td>
                    <td className="py-2.5 text-right tnum text-tinta-2">
                      {num(k.dias_sobrepostos)} de {num(k.dias_registro)}
                    </td>
                    <td className="py-2.5 text-right tnum font-medium text-tinta">
                      {money(k.investido_periodo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs leading-relaxed text-tinta-3">
          iFood e Keeta não passam pelo ERP — o investimento aparece aqui, mas as vendas vêm do
          painel de cada app e não entram no CAC/ROAS acima, que é só de Meta Ads.
        </p>
      </Cartao>
    </div>
  )
}

function LinhaComparacao({
  rotulo, a, o, fmt, inverso = false,
}: {
  rotulo: string
  a: unknown
  o: unknown
  fmt: (v: unknown) => string
  inverso?: boolean
}) {
  const va = Number(a ?? 0)
  const vo = Number(o ?? 0)
  const diff = va - vo
  const zero = Math.abs(diff) < 0.05
  const bom = inverso ? diff < 0 : diff > 0
  const corTexto = zero ? 'text-tinta-3' : bom ? 'text-alta' : 'text-baixa'
  return (
    <tr>
      <td className="py-2.5 text-tinta-2">{rotulo}</td>
      <td className="py-2.5 text-right tnum font-medium text-tinta">{fmt(a)}</td>
      <td className="py-2.5 text-right tnum text-tinta-2">{fmt(o)}</td>
      <td className={`py-2.5 text-right tnum ${corTexto}`}>
        {zero ? '—' : `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))}`}
      </td>
    </tr>
  )
}
