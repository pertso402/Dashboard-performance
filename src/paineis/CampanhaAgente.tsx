import { Aviso, Cartao, Kpi, Vazio } from '../components/Ui'
import { GraficoCampanha } from '../components/Graficos'
import { money, n, num, pct } from '../lib/format'
import type { Painel } from '../lib/tipos'

export function CampanhaAgente({ dados }: { dados: Painel }) {
  const c = dados.campanha
  const custoPorConversao = null // sem custo por mensagem cadastrado

  // A telemetria de entrega/leitura só é gravada em parte dos envios.
  const telemetriaFraca = c.enviadas > 0 && n(c.taxa_entrega) < 50

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          rotulo="Ofertas enviadas"
          valor={num(c.enviadas)}
          detalhe={`${num(c.clientes_impactados)} clientes impactados`}
        />
        <Kpi
          rotulo="Converteram em pedido"
          valor={num(c.converteram)}
          destaque
          detalhe={`${pct(c.taxa_conversao)} das ofertas enviadas`}
        />
        <Kpi
          rotulo="Receita da campanha"
          valor={money(c.receita_gerada)}
          ajuda="Soma dos pedidos ligados a uma oferta convertida."
          detalhe={`Ticket médio ${money(c.ticket_medio)}`}
        />
        <Kpi
          rotulo="Receita por oferta enviada"
          valor={c.enviadas > 0 ? money(n(c.receita_gerada) / c.enviadas) : '—'}
          ajuda="Quanto cada disparo trouxe em média. Compare com o custo de enviar para saber se compensa."
          detalhe={custoPorConversao ?? 'Custo de envio não cadastrado'}
        />
      </div>

      {telemetriaFraca && (
        <Aviso titulo="A telemetria de entrega e leitura está incompleta.">
          Só {num(c.entregues)} dos {num(c.enviadas)} envios têm status de entrega gravado
          ({pct(c.taxa_entrega)}), e a leitura quase não é registrada. As taxas de entrega,
          leitura e resposta abaixo estão subestimadas — a de conversão, não, porque vem do
          pedido de verdade.
        </Aviso>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Cartao
          titulo="Envios e conversões por dia"
          subtitulo="Barra cinza é o disparo, verde é o que virou pedido."
        >
          {c.por_dia.length === 0 ? (
            <Vazio>Nenhuma oferta enviada neste período.</Vazio>
          ) : (
            <GraficoCampanha dados={c.por_dia} />
          )}
        </Cartao>

        <Cartao
          titulo="Escada da campanha"
          subtitulo="Onde os disparos se perdem no caminho até o pedido."
        >
          {c.enviadas === 0 ? (
            <Vazio>Nenhuma oferta enviada neste período.</Vazio>
          ) : (
            <div className="space-y-4">
              {[
                { rotulo: 'Enviadas', valor: c.enviadas, cor: 'var(--color-serie-6)', taxa: null },
                { rotulo: 'Entregues', valor: c.entregues, cor: 'var(--color-serie-3)', taxa: c.taxa_entrega },
                { rotulo: 'Lidas', valor: c.lidas, cor: 'var(--color-serie-4)', taxa: c.taxa_leitura },
                { rotulo: 'Responderam', valor: c.responderam, cor: 'var(--color-serie-5)', taxa: c.taxa_resposta },
                { rotulo: 'Viraram pedido', valor: c.converteram, cor: 'var(--color-serie-2)', taxa: c.taxa_conversao },
              ].map((e) => (
                <div key={e.rotulo}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-tinta">{e.rotulo}</span>
                    <span className="tnum text-tinta">
                      {num(e.valor)}
                      {e.taxa !== null && (
                        <span className="ml-1.5 text-xs text-tinta-3">{pct(e.taxa)}</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-fundo">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(1.5, (e.valor / Math.max(1, c.enviadas)) * 100)}%`,
                        background: e.cor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Cartao>
      </div>

      <Cartao
        titulo="Desempenho por tipo de oferta"
        subtitulo="Qual formato e qual faixa de cadência convertem melhor."
      >
        {c.por_tipo.length === 0 ? (
          <Vazio>Nenhuma oferta enviada neste período.</Vazio>
        ) : (
          <div className="scroll-fino -mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-xs text-tinta-3">
                  <th className="pb-2 font-medium">Tipo de oferta</th>
                  <th className="pb-2 text-right font-medium">Faixa de cadência</th>
                  <th className="pb-2 text-right font-medium">Enviadas</th>
                  <th className="pb-2 text-right font-medium">Converteram</th>
                  <th className="pb-2 text-right font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {c.por_tipo.map((t) => (
                  <tr key={`${t.tipo_oferta}-${t.faixa_cadencia}`}>
                    <td className="py-2.5 capitalize text-tinta">{t.tipo_oferta}</td>
                    <td className="py-2.5 text-right tnum text-tinta-2">{t.faixa_cadencia}</td>
                    <td className="py-2.5 text-right tnum text-tinta">{num(t.enviadas)}</td>
                    <td className="py-2.5 text-right tnum text-tinta-2">{num(t.converteram)}</td>
                    <td className="py-2.5 text-right tnum font-medium text-tinta">{pct(t.taxa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {c.por_tipo.length === 1 && (
          <p className="mt-4 text-xs leading-relaxed text-tinta-3">
            Hoje a campanha só dispara um formato (<span className="capitalize">{c.por_tipo[0].tipo_oferta}</span>,
            faixa {c.por_tipo[0].faixa_cadencia}). Quando houver mais de um, esta tabela passa a
            servir para comparar qual converte melhor.
          </p>
        )}
      </Cartao>
    </div>
  )
}
