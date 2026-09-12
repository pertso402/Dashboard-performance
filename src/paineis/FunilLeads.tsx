import { BarraMini, Cartao, Kpi, Vazio } from '../components/Ui'
import { money, num, pct } from '../lib/format'
import { cor, label, ORIGEM_DESCRICAO } from '../lib/origens'
import type { Origem, Painel } from '../lib/tipos'

const TAG_LABEL: Record<string, string> = {
  lead_frio: 'Lead frio',
  lead_quente: 'Lead quente',
  cliente: 'Cliente',
  cliente_recorrente: 'Cliente recorrente',
  sem_tag: 'Sem tag',
}

export function FunilLeads({ dados }: { dados: Painel }) {
  const f = dados.funil

  const etapas = [
    { rotulo: 'Leads captados', valor: f.leads_captados, cor: 'var(--color-serie-6)' },
    { rotulo: 'Demonstraram interesse', valor: f.leads_com_interesse, cor: 'var(--color-serie-3)' },
    { rotulo: 'Viraram clientes', valor: f.viraram_clientes, cor: 'var(--color-serie-1)' },
    { rotulo: 'Viraram recorrentes', valor: f.viraram_recorrentes, cor: 'var(--color-serie-2)' },
  ]
  const topo = Math.max(1, f.leads_captados)

  const tags = [...f.por_tag].sort((a, b) => b.n - a.n)
  const maxTag = Math.max(1, ...tags.map((t) => t.n))

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          rotulo="Leads captados"
          valor={num(f.leads_captados)}
          ajuda="Contatos cadastrados no período, já excluindo a base legada importada."
          detalhe="Novos contatos no período"
        />
        <Kpi
          rotulo="Viraram clientes"
          valor={num(f.viraram_clientes)}
          detalhe={`${pct(f.taxa_lead_para_cliente)} dos leads captados`}
        />
        <Kpi
          rotulo="Lead → cliente"
          valor={pct(f.taxa_lead_para_cliente)}
          destaque
          ajuda="Dos contatos que entraram no período, quantos chegaram a fazer um pedido."
        />
        <Kpi
          rotulo="Receita dos novos leads"
          valor={money(f.receita_gerada)}
          detalhe={`${num(f.viraram_recorrentes)} já são recorrentes`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo="Funil do período"
          subtitulo="Só contatos cadastrados dentro do período. A base legada importada fica de fora — ela distorceria a conversão."
        >
          {f.leads_captados === 0 ? (
            <Vazio>Nenhum lead novo neste período.</Vazio>
          ) : (
            <div className="space-y-5">
              {etapas.map((e, i) => {
                const larguraPct = (e.valor / topo) * 100
                const anterior = i === 0 ? null : etapas[i - 1].valor
                const conversao = anterior && anterior > 0 ? (e.valor / anterior) * 100 : null
                return (
                  <div key={e.rotulo}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-tinta">{e.rotulo}</span>
                      <span className="tnum text-sm font-medium text-tinta">
                        {num(e.valor)}
                        <span className="ml-2 text-xs font-normal text-tinta-3">
                          {larguraPct.toFixed(0)}% do topo
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-7 w-full overflow-hidden rounded-md bg-fundo">
                      <div
                        className="flex h-full items-center justify-end rounded-md px-2 text-[11px] font-medium text-white transition-all"
                        style={{ width: `${Math.max(3, larguraPct)}%`, background: e.cor }}
                      >
                        {larguraPct > 14 && num(e.valor)}
                      </div>
                    </div>
                    {conversao !== null && (
                      <div className="mt-1 text-xs text-tinta-3 tnum">
                        ↳ {conversao.toFixed(1).replace('.', ',')}% da etapa anterior
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Cartao>

        <div className="space-y-5">
          <Cartao
            titulo="Leads novos por tag"
            subtitulo="Como o agente classificou os contatos que entraram no período."
          >
            {tags.length === 0 ? (
              <Vazio>Sem leads no período.</Vazio>
            ) : (
              <div className="space-y-3.5">
                {tags.map((t) => (
                  <div key={t.tag}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-tinta">{TAG_LABEL[t.tag] ?? t.tag}</span>
                      <span className="tnum text-tinta">
                        {num(t.n)}
                        <span className="ml-1.5 text-xs text-tinta-3">
                          {num(t.compraram)} compraram
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <BarraMini valor={t.n} max={maxTag} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Cartao>

          <Cartao
            titulo="Tamanho da base"
            subtitulo="Foto do banco inteiro, sem filtro de período."
          >
            <div className="space-y-2.5 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-tinta-2">Contatos no banco</span>
                <span className="tnum font-medium text-tinta">{num(f.base_total)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-tinta-2">Da carga inicial (base legada)</span>
                <span className="tnum text-tinta">{num(f.base_legada)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-borda pt-2.5">
                <span className="text-tinta-2">Gerados depois da carga</span>
                <span className="tnum font-medium text-tinta">
                  {num(f.base_total - f.base_legada)}
                </span>
              </div>
            </div>
          </Cartao>
        </div>
      </div>

      <Cartao
        titulo="Conversão dos leads por origem"
        subtitulo="Dos contatos cadastrados no período, quantos de cada origem chegaram a comprar."
      >
        {f.por_origem.length === 0 ? (
          <Vazio>Sem leads no período.</Vazio>
        ) : (
          <div className="scroll-fino -mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-xs text-tinta-3">
                  <th className="pb-2 font-medium">Origem</th>
                  <th className="pb-2 text-right font-medium">Leads</th>
                  <th className="pb-2 text-right font-medium">Compraram</th>
                  <th className="pb-2 text-right font-medium">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {f.por_origem.map((o) => (
                  <tr key={o.origem}>
                    <td className="py-2.5">
                      <span
                        className="flex items-center gap-2 text-tinta"
                        title={ORIGEM_DESCRICAO[o.origem as Origem]}
                      >
                        <span className="size-2.5 rounded-full" style={{ background: cor(o.origem) }} />
                        {label(o.origem)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tnum text-tinta">{num(o.n)}</td>
                    <td className="py-2.5 text-right tnum text-tinta-2">{num(o.compraram)}</td>
                    <td className="py-2.5 text-right tnum font-medium text-tinta">
                      {o.n > 0 ? pct((o.compraram / o.n) * 100) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </div>
  )
}
