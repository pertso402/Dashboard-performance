import { Cartao, Kpi, Variacao, Vazio } from '../components/Ui'
import { GraficoNovosVsRecompra, GraficoReceita } from '../components/Graficos'
import { money, num, pct } from '../lib/format'
import { cor, label } from '../lib/origens'
import type { Painel } from '../lib/tipos'

export function VisaoGeral({ dados }: { dados: Painel }) {
  const a = dados.kpis.atual
  const b = dados.kpis.anterior
  const temSerie = dados.serie.some((p) => p.pedidos > 0)

  const origensComReceita = [...dados.origens]
    .filter((o) => Number(o.receita_periodo) > 0)
    .sort((x, y) => Number(y.receita_periodo) - Number(x.receita_periodo))
  const receitaTotal = origensComReceita.reduce((s, o) => s + Number(o.receita_periodo), 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi
          rotulo="Receita"
          valor={money(a.receita)}
          rodape={<Variacao atual={a.receita} anterior={b.receita} />}
        />
        <Kpi
          rotulo="Pedidos"
          valor={num(a.pedidos)}
          detalhe={`${num(a.pedidos_primeira_compra)} de 1ª compra · ${num(a.pedidos_recompra)} de recompra`}
          rodape={<Variacao atual={a.pedidos} anterior={b.pedidos} />}
        />
        <Kpi
          rotulo="Ticket médio"
          valor={money(a.ticket_medio)}
          rodape={<Variacao atual={a.ticket_medio} anterior={b.ticket_medio} />}
        />
        <Kpi
          rotulo="Clientes ativos"
          valor={num(a.clientes_ativos)}
          detalhe={`${num(a.clientes_recorrentes_ativos)} recorrentes no período`}
          rodape={<Variacao atual={a.clientes_ativos} anterior={b.clientes_ativos} />}
        />
        <Kpi
          rotulo="Novos clientes"
          valor={num(a.novos_clientes)}
          ajuda="Clientes cujo primeiro pedido caiu dentro do período."
          rodape={<Variacao atual={a.novos_clientes} anterior={b.novos_clientes} />}
        />
        <Kpi
          rotulo="Taxa de recompra"
          valor={pct(a.taxa_recompra_coorte)}
          destaque
          ajuda="Dos clientes adquiridos no período, quantos já fizeram um 2º pedido."
          detalhe={`${num(a.coorte_recompraram)} de ${num(a.coorte_total)} clientes`}
          rodape={
            <Variacao atual={a.taxa_recompra_coorte} anterior={b.taxa_recompra_coorte} />
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo="Receita ao longo do período"
          subtitulo="Passe o mouse para ver pedidos e ticket médio de cada ponto."
        >
          {temSerie ? <GraficoReceita dados={dados.serie} /> : <Vazio>Sem pedidos neste período.</Vazio>}
        </Cartao>

        <Cartao
          titulo="Primeira compra vs. recompra"
          subtitulo="Quanto do volume vem de gente nova e quanto vem de quem já comprou."
        >
          {temSerie ? (
            <GraficoNovosVsRecompra dados={dados.serie} />
          ) : (
            <Vazio>Sem pedidos neste período.</Vazio>
          )}
        </Cartao>
      </div>

      <Cartao
        titulo="Receita do período por origem do cliente"
        subtitulo="A origem é a de aquisição do cliente, não a do pedido — recompra de um cliente de anúncio continua contando como anúncio."
      >
        {origensComReceita.length === 0 ? (
          <Vazio>Sem receita no período.</Vazio>
        ) : (
          <div className="space-y-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {origensComReceita.map((o) => (
                <div
                  key={o.origem}
                  title={`${label(o.origem)}: ${money(o.receita_periodo)}`}
                  style={{
                    width: `${(Number(o.receita_periodo) / receitaTotal) * 100}%`,
                    background: cor(o.origem),
                  }}
                />
              ))}
            </div>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {origensComReceita.map((o) => (
                <div key={o.origem} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-tinta-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: cor(o.origem) }} />
                    {label(o.origem)}
                  </span>
                  <span className="tnum text-tinta">
                    {money(o.receita_periodo)}
                    <span className="ml-1.5 text-xs text-tinta-3">
                      {((Number(o.receita_periodo) / receitaTotal) * 100).toFixed(0)}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Cartao>
    </div>
  )
}
