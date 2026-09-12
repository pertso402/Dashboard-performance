import { Aviso, Cartao, CelulaHeat, Kpi, Variacao, Vazio } from '../components/Ui'
import { GraficoBarrasOrigem, GraficoCurvaRecompra } from '../components/Graficos'
import { dataLonga, dias, maybe, money, num, pct } from '../lib/format'
import { cor, label } from '../lib/origens'
import type { Painel } from '../lib/tipos'

export function Recompra({ dados }: { dados: Painel }) {
  const a = dados.kpis.atual
  const b = dados.kpis.anterior
  const janela = dados.kpis.janela_recompra_dias

  // Só compara origens que de fato adquiriram clientes no período.
  const origens = dados.origens
    .filter((o) => o.clientes_adquiridos > 0 && o.origem !== 'lead_sem_compra')
    .sort((x, y) => Number(y.taxa_recompra ?? 0) - Number(x.taxa_recompra ?? 0))

  const barras = origens.map((o) => ({
    origem: o.origem,
    rotulo: label(o.origem),
    cor: cor(o.origem),
    valor: Number(o.taxa_recompra ?? 0),
  }))

  const imaturas = dados.coortes.filter((c) => c.idade_min_dias < janela)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          rotulo="Taxa de recompra"
          valor={pct(a.taxa_recompra_coorte)}
          destaque
          ajuda="Dos clientes adquiridos no período, quantos já voltaram a comprar pelo menos uma vez."
          detalhe={`${num(a.coorte_recompraram)} de ${num(a.coorte_total)} clientes adquiridos`}
          rodape={<Variacao atual={a.taxa_recompra_coorte} anterior={b.taxa_recompra_coorte} />}
        />
        <Kpi
          rotulo={`Recompra em ${janela} dias`}
          valor={pct(a.taxa_recompra_janela)}
          ajuda={`Só conta clientes que já têm ao menos ${janela} dias de vida. Comparação justa entre coortes.`}
          detalhe={`${num(a.coorte_madura_recompraram)} de ${num(a.coorte_madura_total)} clientes maduros`}
          rodape={<Variacao atual={a.taxa_recompra_janela} anterior={b.taxa_recompra_janela} />}
        />
        <Kpi
          rotulo="Tempo até recomprar"
          valor={dias(a.dias_medio_recompra)}
          ajuda="Média de dias entre o 1º e o 2º pedido de quem recomprou."
          detalhe="Média entre 1º e 2º pedido"
          rodape={<Variacao atual={a.dias_medio_recompra} anterior={b.dias_medio_recompra} inverso />}
        />
        <Kpi
          rotulo="% do volume que é recompra"
          valor={pct(a.pct_pedidos_recompra)}
          ajuda="Fatia dos pedidos do período que veio de quem já tinha comprado antes."
          detalhe={`${num(a.pedidos_recompra)} pedidos · ${money(a.receita_recompra)}`}
          rodape={<Variacao atual={a.pct_pedidos_recompra} anterior={b.pct_pedidos_recompra} />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Cartao
          titulo="Coortes semanais de aquisição"
          subtitulo="Cada linha é a turma de clientes que fez a 1ª compra naquela semana. As colunas mostram quantos voltaram dentro de cada janela."
        >
          {dados.coortes.length === 0 ? (
            <Vazio>Nenhum cliente novo neste período.</Vazio>
          ) : (
            <div className="scroll-fino -mx-1 overflow-x-auto px-1">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-borda text-left text-xs text-tinta-3">
                    <th className="pb-2 font-medium">Semana do 1º pedido</th>
                    <th className="pb-2 text-right font-medium">Clientes</th>
                    <th className="pb-2 text-center font-medium">7 dias</th>
                    <th className="pb-2 text-center font-medium">14 dias</th>
                    <th className="pb-2 text-center font-medium">30 dias</th>
                    <th className="pb-2 text-right font-medium">LTV médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {dados.coortes.map((c) => {
                    const imatura = c.idade_min_dias < janela
                    return (
                      <tr key={c.semana} className={imatura ? 'opacity-55' : ''}>
                        <td className="py-2.5 text-tinta">
                          {dataLonga(c.semana)}
                          {imatura && (
                            <span
                              className="ml-2 rounded bg-fundo px-1.5 py-0.5 text-[10px] text-tinta-3"
                              title={`Esta turma tem só ${c.idade_min_dias} dias — ainda não deu tempo de recomprar.`}
                            >
                              recente
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right tnum text-tinta">{num(c.clientes)}</td>
                        <td className="py-2.5 text-center"><CelulaHeat pct={c.pct_7d} /></td>
                        <td className="py-2.5 text-center"><CelulaHeat pct={c.pct_14d} /></td>
                        <td className="py-2.5 text-center"><CelulaHeat pct={c.pct_30d} /></td>
                        <td className="py-2.5 text-right tnum text-tinta-2">{money(c.ltv_medio)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {imaturas.length > 0 && (
            <div className="mt-4">
              <Aviso titulo="Linhas marcadas como “recente” estão incompletas.">
                Essas turmas ainda não completaram {janela} dias de vida, então a taxa delas só
                pode cair para cima. Não compare com as semanas mais antigas.
              </Aviso>
            </div>
          )}
        </Cartao>

        <div className="space-y-5">
          <Cartao
            titulo="Curva de recompra"
            subtitulo="Quanto da base volta conforme o tempo passa, somando todas as coortes do período."
          >
            {dados.coortes.length === 0 ? (
              <Vazio>Sem coortes no período.</Vazio>
            ) : (
              <GraficoCurvaRecompra dados={dados.coortes} />
            )}
          </Cartao>

          <Cartao
            titulo="Taxa de recompra por origem"
            subtitulo="Qual canal traz cliente que volta — não só cliente que compra uma vez."
          >
            {barras.length === 0 ? (
              <Vazio>Sem clientes adquiridos no período.</Vazio>
            ) : (
              <GraficoBarrasOrigem dados={barras} campo="Taxa de recompra" />
            )}
          </Cartao>
        </div>
      </div>

      <Cartao
        titulo="Detalhe por origem"
        subtitulo="Clientes adquiridos no período, o que já voltaram a gastar e quanto tempo levaram."
      >
        {origens.length === 0 ? (
          <Vazio>Sem clientes adquiridos no período.</Vazio>
        ) : (
          <div className="scroll-fino -mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-xs text-tinta-3">
                  <th className="pb-2 font-medium">Origem</th>
                  <th className="pb-2 text-right font-medium">Adquiridos</th>
                  <th className="pb-2 text-right font-medium">Recompraram</th>
                  <th className="pb-2 text-right font-medium">Taxa</th>
                  <th className="pb-2 text-right font-medium">Dias até voltar</th>
                  <th className="pb-2 text-right font-medium">LTV médio</th>
                  <th className="pb-2 text-right font-medium">Receita gerada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {origens.map((o) => (
                  <tr key={o.origem}>
                    <td className="py-2.5">
                      <span className="flex items-center gap-2 text-tinta">
                        <span className="size-2.5 rounded-full" style={{ background: cor(o.origem) }} />
                        {label(o.origem)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tnum text-tinta">{num(o.clientes_adquiridos)}</td>
                    <td className="py-2.5 text-right tnum text-tinta-2">{num(o.recompraram)}</td>
                    <td className="py-2.5 text-right tnum font-medium text-tinta">{pct(o.taxa_recompra)}</td>
                    <td className="py-2.5 text-right tnum text-tinta-2">{dias(o.dias_medio_recompra)}</td>
                    <td className="py-2.5 text-right tnum text-tinta-2">{money(o.ltv_medio)}</td>
                    <td className="py-2.5 text-right tnum text-tinta">{money(o.receita_vitalicia)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-borda-forte text-sm font-medium">
                  <td className="pt-2.5 text-tinta">Total</td>
                  <td className="pt-2.5 text-right tnum text-tinta">{num(a.coorte_total)}</td>
                  <td className="pt-2.5 text-right tnum text-tinta">{num(a.coorte_recompraram)}</td>
                  <td className="pt-2.5 text-right tnum text-tinta">{pct(a.taxa_recompra_coorte)}</td>
                  <td className="pt-2.5 text-right tnum text-tinta">{dias(a.dias_medio_recompra)}</td>
                  <td className="pt-2.5 text-right tnum text-tinta-3">—</td>
                  <td className="pt-2.5 text-right tnum text-tinta">
                    {money(origens.reduce((s, o) => s + (maybe(o.receita_vitalicia) ?? 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Cartao>
    </div>
  )
}
