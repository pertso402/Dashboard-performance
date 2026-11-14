import { AnuncioTotal } from './AnuncioTotal'
import { Crescimento } from './Crescimento'
import { GraficoAtribuicao, GraficoNovosClientes } from '../components/Graficos'
import { BarraMini, Cartao, Kpi, Variacao, Vazio } from '../components/Ui'
import { dataLonga, money, n, num, pct } from '../lib/format'
import { vendaCor, vendaLabel, VENDA_DESCRICAO } from '../lib/origens'
import type { Painel, TipoVenda } from '../lib/tipos'

/** Linha de "De onde veio cada real". Canais externos entram com rótulo próprio. */
type Linha = Painel['atribuicao']['por_tipo'][number] & {
  chave?: string
  rotulo?: string
}

const CANAL_LABEL: Record<string, string> = {
  ifood: 'iFood',
  keeta: 'Keeta',
  convenio: 'Convênio',
}

/** Junta lançamentos do mesmo canal (ex.: dois meses de iFood que cruzam o período) numa linha só. */
function somarPorCanal(externas: Painel['atribuicao']['externas'], atribuida: boolean): Linha[] {
  const porCanal = new Map<string, number>()
  for (const e of externas) {
    if (e.atribuida !== atribuida || n(e.valor_periodo) <= 0) continue
    porCanal.set(e.canal, (porCanal.get(e.canal) ?? 0) + n(e.valor_periodo))
  }
  return [...porCanal].map(([canal, receita]) => ({
    tipo_venda: 'canal_externo',
    atribuido: atribuida,
    pedidos: 0,
    clientes: 0,
    receita,
    ticket: 0,
    chave: `ext-${canal}`,
    rotulo: CANAL_LABEL[canal] ?? canal,
  }))
}

export function MeuResultado({ dados }: { dados: Painel }) {
  const a = dados.atribuicao
  const atual = a.atual
  const ant = a.anterior

  const receita = n(atual.receita_atribuida)
  const casa = n(atual.receita_casa)
  const fatia = casa > 0 ? (receita / casa) * 100 : 0
  const fatiaAnterior =
    n(ant.receita_casa) > 0 ? (n(ant.receita_atribuida) / n(ant.receita_casa)) * 100 : 0

  // Venda na mão e canais fora do ERP não existem como pedido, então entram aqui
  // como linhas sintéticas — sem elas os percentuais do grupo não fecham 100%.
  const minhas: Linha[] = a.por_tipo.filter((t) => t.atribuido)
  if (n(atual.receita_manual) > 0) {
    minhas.push({
      tipo_venda: 'venda_manual',
      atribuido: true,
      pedidos: atual.vendas_manuais,
      clientes: atual.vendas_manuais,
      receita: n(atual.receita_manual),
      ticket: n(atual.receita_manual) / Math.max(1, atual.vendas_manuais),
    })
  }
  minhas.push(...somarPorCanal(a.externas, true))
  minhas.sort((x, y) => n(y.receita) - n(x.receita))

  const daCasa: Linha[] = a.por_tipo.filter((t) => !t.atribuido)
  daCasa.push(...somarPorCanal(a.externas, false))

  const maxReceita = Math.max(...minhas.map((t) => n(t.receita)), 1)

  const novosNoPeriodo = a.serie.reduce((s, d) => s + n(d.novos), 0)

  return (
    <div className="space-y-5">
      {/* ---- Manchete: o número que responde "quanto eu gerei?" ---- */}
      <section className="overflow-hidden rounded-xl border border-serie-1/25 bg-gradient-to-br from-serie-1/[0.07] to-transparent">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide text-tinta-2 uppercase">
              Receita gerada pelo meu trabalho
            </p>
            <p className="mt-2 text-5xl font-semibold tracking-tight tnum text-tinta">
              {money(receita)}
            </p>
            <p className="borrar mt-2 text-sm text-tinta-2">
              <strong className="font-semibold tnum text-tinta">{pct(fatia)}</strong> de todo o
              faturamento do delivery no período ({money(casa)}).
            </p>
            <p className="borrar mt-1 text-xs text-tinta-3">
              {money(atual.receita_erp_atribuida)} pelo sistema
              {n(atual.receita_externa) > 0 && ` · ${money(atual.receita_externa)} de iFood/Keeta`}
              {n(atual.receita_manual) > 0 &&
                ` · ${money(atual.receita_manual)} de ${num(atual.vendas_manuais)} ${
                  atual.vendas_manuais === 1 ? 'venda fechada' : 'vendas fechadas'
                } na mão`}
              .
            </p>
            <div className="mt-3">
              <Variacao atual={receita} anterior={n(ant.receita_atribuida)} />
            </div>
          </div>

          {/* Barra de fatia — a leitura visual do mesmo número */}
          <div className="w-full lg:w-[280px]">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutro-2/50">
              <div
                className="h-full rounded-l-full bg-serie-1"
                style={{ width: `${Math.min(100, fatia)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-tinta-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-serie-1" />
                Meu trabalho
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-neutro-1" />
                <span className="borrar">Da casa {money(n(atual.receita_nao_atribuida))}</span>
              </span>
            </div>
            {fatiaAnterior > 0 && (
              <p className="mt-2 text-xs text-tinta-3 tnum">
                Período anterior: {pct(fatiaAnterior)} da receita
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---- KPIs de apoio ---- */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          rotulo="Clientes novos que eu trouxe"
          valor={num(atual.clientes_novos)}
          detalhe={`${num(atual.clientes_ativos)} clientes seus compraram no período`}
          rodape={<Variacao atual={atual.clientes_novos} anterior={ant.clientes_novos} />}
          destaque
          ajuda="Clientes cujo primeiro pedido caiu no período: anúncio, roleta, reativação pelo agente, WhatsApp, balcão ou instagram. Só a base antiga fica de fora."
        />
        <Kpi
          rotulo="Pedidos meus"
          valor={num(atual.pedidos_atribuidos)}
          detalhe={
            n(atual.vendas_manuais) > 0
              ? `${num(atual.pedidos_erp_atribuidos)} pelo sistema + ${num(atual.vendas_manuais)} na mão · ${num(atual.pedidos_nao_atribuidos)} foram da casa`
              : `${num(atual.pedidos_nao_atribuidos)} pedidos foram da casa`
          }
          rodape={<Variacao atual={atual.pedidos_atribuidos} anterior={ant.pedidos_atribuidos} />}
        />
        <Kpi
          rotulo="Ticket médio"
          valor={money(atual.ticket_medio)}
          detalhe={
            n(atual.receita_manual) > 0
              ? 'Pedidos do sistema. Venda avulsa fica de fora.'
              : 'Só nos pedidos atribuídos a você'
          }
          rodape={<Variacao atual={atual.ticket_medio} anterior={ant.ticket_medio} />}
          ajuda="Média dos pedidos atribuídos que passaram pelo ERP. Vendas fechadas na mão não entram, porque um pedido grande e avulso distorce a média do delivery."
        />
        <Kpi
          rotulo="Minha fatia do faturamento"
          valor={pct(fatia)}
          detalhe={`${money(receita)} de ${money(casa)}`}
          rodape={<Variacao atual={fatia} anterior={fatiaAnterior} sufixo="de fatia" />}
          ajuda="Quanto do faturamento total do delivery no período saiu do trabalho de marketing."
        />
      </div>

      {/* ---- Crescimento mês a mês ---- */}
      <Crescimento c={dados.crescimento} />

      {/* ---- Anúncio desde o início ---- */}
      <AnuncioTotal a={dados.anuncioTotal} />

      {/* ---- Evolução ---- */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Cartao
          titulo="Receita dia a dia"
          subtitulo="A faixa azul é o que saiu do seu trabalho. A cinza é o movimento que o restaurante já teria."
        >
          {a.serie.length ? (
            <GraficoAtribuicao dados={a.serie as unknown as Record<string, unknown>[]} />
          ) : (
            <Vazio>Nenhum pedido neste período.</Vazio>
          )}
        </Cartao>

        <Cartao
          titulo="Clientes novos por dia"
          subtitulo={`${num(novosNoPeriodo)} pessoas compraram pela primeira vez por causa do marketing.`}
        >
          {a.serie.length ? (
            <GraficoNovosClientes dados={a.serie as unknown as Record<string, unknown>[]} />
          ) : (
            <Vazio>Nenhum cliente novo neste período.</Vazio>
          )}
        </Cartao>
      </div>

      {/* ---- De onde veio cada real ---- */}
      <Cartao
        titulo="De onde veio cada real"
        subtitulo="Cada linha é um motivo diferente de venda. As de cima são suas; as de baixo são movimento próprio do restaurante."
      >
        {a.por_tipo.length === 0 ? (
          <Vazio>Nenhum pedido neste período.</Vazio>
        ) : (
          <div className="space-y-5">
            <LinhasVenda linhas={minhas} max={maxReceita} total={receita} />
            {daCasa.length > 0 && (
              <div className="border-t border-borda pt-4">
                <p className="mb-3 text-xs font-medium tracking-wide text-tinta-3 uppercase">
                  Não conta como seu
                </p>
                <LinhasVenda
                  linhas={daCasa}
                  max={maxReceita}
                  total={n(atual.receita_nao_atribuida)}
                />
              </div>
            )}
          </div>
        )}
      </Cartao>

      {/* ---- Vendas fechadas na mão ---- */}
      {a.manuais.length > 0 && (
        <Cartao
          titulo="Vendas que você fechou pessoalmente"
          subtitulo="Negociações fora do fluxo do sistema, lançadas à mão e somadas à receita atribuída."
        >
          <ul className="divide-y divide-borda">
            {a.manuais.map((m, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-tinta">{m.descricao}</p>
                  <p className="mt-0.5 text-xs text-tinta-3">
                    {dataLonga(m.data)}
                    {m.cliente ? ` · ${m.cliente}` : ''}
                    {m.itens ? ` · ${num(m.itens)} itens` : ''}
                  </p>
                  {m.observacao && (
                    <p className="mt-1 text-xs leading-relaxed text-tinta-2">{m.observacao}</p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold tnum text-tinta">
                  {money(m.valor)}
                </span>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  )
}

function LinhasVenda({
  linhas,
  max,
  total,
}: {
  linhas: Linha[]
  max: number
  total: number
}) {
  if (!linhas.length) return <Vazio>Nada aqui neste período.</Vazio>
  return (
    <div className="space-y-3.5">
      {linhas.map((t) => {
        const r = n(t.receita)
        const share = total > 0 ? (r / total) * 100 : 0
        return (
          <div key={t.chave ?? t.tipo_venda}>
            <div className="flex items-baseline justify-between gap-4">
              <span
                className="flex min-w-0 items-center gap-2 text-sm text-tinta"
                title={VENDA_DESCRICAO[t.tipo_venda as TipoVenda]}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: vendaCor(t.tipo_venda) }}
                />
                <span className="truncate">
                  {/* "Recompra espontânea" existe nos dois grupos: sem o complemento,
                      as duas linhas ficariam com o mesmo nome dentro do mesmo cartão. */}
                  {t.rotulo ??
                    (t.tipo_venda === 'recompra_espontanea' && !t.atribuido
                      ? 'Recompra de cliente da casa'
                      : t.tipo_venda === 'aquisicao_organica' && !t.atribuido
                        ? '1ª compra de cliente da base antiga'
                        : vendaLabel(t.tipo_venda))}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tnum text-tinta">{money(r)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <BarraMini valor={r} max={max} cor={vendaCor(t.tipo_venda)} />
              <span className="shrink-0 text-xs tnum text-tinta-3">
                {t.tipo_venda === 'canal_externo'
                  ? `fora do ERP · ${pct(share)}`
                  : t.tipo_venda === 'venda_manual'
                    ? `${num(t.pedidos)} ${t.pedidos === 1 ? 'venda' : 'vendas'} · ${pct(share)}`
                    : `${num(t.pedidos)} ped · ${num(t.clientes)} cli · ${pct(share)}`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
