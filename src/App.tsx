import { useCallback, useEffect, useMemo, useState } from 'react'
import { carregarPainel, limitesDeData, type Granularidade } from './lib/api'
import type { Painel } from './lib/tipos'
import { presets, SeletorPeriodo, type Periodo } from './components/SeletorPeriodo'
import { Aviso } from './components/Ui'
import { MeuResultado } from './paineis/MeuResultado'
import { VisaoGeral } from './paineis/VisaoGeral'
import { Recompra } from './paineis/Recompra'
import { Aquisicao } from './paineis/Aquisicao'
import { FunilLeads } from './paineis/FunilLeads'
import { CampanhaAgente } from './paineis/CampanhaAgente'
import { Depoimentos } from './paineis/Depoimentos'

const ABAS = [
  { id: 'meu', rotulo: 'Meu resultado' },
  { id: 'recompra', rotulo: 'Recompra' },
  { id: 'aquisicao', rotulo: 'Aquisição e anúncios' },
  { id: 'campanha', rotulo: 'Campanha do agente' },
  { id: 'funil', rotulo: 'Funil de leads' },
  { id: 'geral', rotulo: 'Visão geral da casa' },
  { id: 'depoimentos', rotulo: 'Depoimentos' },
] as const

type AbaId = (typeof ABAS)[number]['id']

export default function App() {
  const [limites, setLimites] = useState<{ min: string; max: string } | null>(null)
  const [periodo, setPeriodo] = useState<Periodo>(() => presets(null)[2]) // últimos 30 dias
  const [granularidade, setGranularidade] = useState<Granularidade>('dia')
  const [aba, setAba] = useState<AbaId>('meu')
  const [dados, setDados] = useState<Painel | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)

  // Modo privado: borra os números para abrir o painel perto de quem não deve vê-los.
  const [privado, setPrivado] = useState(() => {
    try {
      return localStorage.getItem('dash-privado') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.body.classList.toggle('privado', privado)
    try {
      localStorage.setItem('dash-privado', privado ? '1' : '0')
    } catch {
      /* navegador sem storage: o modo continua valendo só nesta sessão */
    }
  }, [privado])

  useEffect(() => {
    limitesDeData().then(setLimites).catch(() => setLimites(null))
  }, [])

  const buscar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const p = await carregarPainel(periodo.inicio, periodo.fim, granularidade)
      setDados(p)
      setAtualizadoEm(new Date())
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar os dados.')
    } finally {
      setCarregando(false)
    }
  }, [periodo.inicio, periodo.fim, granularidade])

  useEffect(() => {
    void buscar()
  }, [buscar])

  // Período inteiro fora da janela em que existem pedidos: avisa em vez de mostrar zeros mudos.
  const foraDaJanela = useMemo(() => {
    if (!limites || !dados) return false
    return periodo.fim < limites.min || periodo.inicio > limites.max
  }, [limites, dados, periodo])

  const conteudo = () => {
    if (aba === 'depoimentos') return <Depoimentos />
    if (!dados) return null
    switch (aba) {
      case 'meu': return <MeuResultado dados={dados} />
      case 'geral': return <VisaoGeral dados={dados} />
      case 'recompra': return <Recompra dados={dados} />
      case 'aquisicao': return <Aquisicao dados={dados} />
      case 'funil': return <FunilLeads dados={dados} />
      case 'campanha': return <CampanhaAgente dados={dados} />
    }
  }

  // A aba de depoimentos não depende do período — esconde o seletor lá.
  const mostraPeriodo = aba !== 'depoimentos'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-borda bg-superficie/85 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-5 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h1 className="text-base font-semibold tracking-tight text-tinta">
                Performance · Chapelão
              </h1>
              <span className="hidden text-xs text-tinta-3 sm:inline">
                Resultado do marketing, mês a mês
              </span>
            </div>
            <div className="flex items-center gap-3 sem-print">
              {atualizadoEm && (
                <span className="hidden text-xs text-tinta-3 tnum sm:inline">
                  Atualizado {atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={() => setPrivado((v) => !v)}
                aria-pressed={privado}
                title={privado ? 'Mostrar os números' : 'Esconder os números'}
                className={`grid size-8 place-items-center rounded-lg border transition ${
                  privado
                    ? 'border-tinta bg-tinta text-white'
                    : 'border-borda text-tinta-2 hover:bg-fundo hover:text-tinta'
                }`}
              >
                <span className="sr-only">
                  {privado ? 'Mostrar os números' : 'Esconder os números'}
                </span>
                <OlhoIcone fechado={privado} />
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-lg border border-borda px-3 py-1.5 text-xs font-medium text-tinta-2 transition hover:bg-fundo hover:text-tinta"
              >
                Imprimir / PDF
              </button>
              <button
                onClick={() => void buscar()}
                disabled={carregando}
                className="rounded-lg border border-borda px-3 py-1.5 text-xs font-medium text-tinta-2 transition hover:bg-fundo hover:text-tinta disabled:opacity-50"
              >
                {carregando ? 'Carregando…' : 'Atualizar'}
              </button>
            </div>
          </div>

          {mostraPeriodo && (
            <div className="mt-3 sem-print">
              <SeletorPeriodo
                periodo={periodo}
                aoMudar={setPeriodo}
                limites={limites}
                granularidade={granularidade}
                aoMudarGranularidade={setGranularidade}
              />
            </div>
          )}

          <nav className="-mb-px mt-3 flex gap-1 overflow-x-auto sem-print">
            {ABAS.map((t) => (
              <button
                key={t.id}
                onClick={() => setAba(t.id)}
                className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${
                  aba === t.id
                    ? 'border-tinta text-tinta'
                    : 'border-transparent text-tinta-3 hover:text-tinta-2'
                }`}
              >
                {t.rotulo}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {erro && (
          <div className="mb-5">
            <Aviso titulo="Não consegui carregar os dados.">
              {erro}
              <button
                onClick={() => void buscar()}
                className="ml-2 underline underline-offset-2"
              >
                Tentar de novo
              </button>
            </Aviso>
          </div>
        )}

        {foraDaJanela && limites && mostraPeriodo && (
          <div className="mb-5">
            <Aviso titulo="Não há pedidos neste período.">
              O banco tem pedidos de {limites.min.split('-').reverse().join('/')} a{' '}
              {limites.max.split('-').reverse().join('/')}. Fora disso tudo aparece zerado.
            </Aviso>
          </div>
        )}

        {carregando && !dados && aba !== 'depoimentos' ? (
          <Esqueleto />
        ) : (
          <div className={carregando && aba !== 'depoimentos' ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {conteudo()}
          </div>
        )}

        <footer className="mt-10 border-t border-borda pt-5 text-xs leading-relaxed text-tinta-3">
          <p>
            <strong className="font-medium text-tinta-2">O que conta como meu.</strong>{' '}
            Uma venda entra na receita atribuída quando o cliente veio de <em>anúncio</em>, veio do{' '}
            <em>QR code do iFood</em>, ou quando o <em>agente de recompra</em> gerou aquele pedido —
            inclusive para clientes que o restaurante já tinha, porque a venda extra não teria
            acontecido sozinha. Fica de fora quem chegou pelo WhatsApp orgânico, pelo balcão ou já
            era da base antiga.
          </p>
          <p className="mt-2">
            <strong className="font-medium text-tinta-2">Como as contas são feitas.</strong>{' '}
            Pedidos cancelados nunca entram. Datas são agrupadas no fuso de São Paulo.{' '}
            <em>Taxa de recompra</em> é por coorte: dos clientes cujo <em>primeiro</em> pedido caiu
            no período, quantos já fizeram um segundo. A <em>origem</em> do cliente é definida uma
            vez, na aquisição — recompra de um cliente de anúncio continua contando como anúncio.
            Um primeiro pedido puxado pelo agente conta como <em>reativação</em>, não como recompra.
          </p>
        </footer>
      </main>
    </div>
  )
}

function OlhoIcone({ fechado }: { fechado: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[17px]"
      aria-hidden="true"
    >
      {fechado ? (
        <>
          <path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c5.5 0 9 6 9 6a15 15 0 0 1-3 3.6" />
          <path d="M6.6 6.6A15 15 0 0 0 3 11s3.5 6 9 6a9.6 9.6 0 0 0 4.3-1" />
          <path d="M9.9 8.9a3 3 0 1 0 4.2 4.2" />
          <path d="m3 3 18 18" />
        </>
      ) : (
        <>
          <path d="M3 11s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
          <circle cx="12" cy="11" r="2.8" />
        </>
      )}
    </svg>
  )
}

function Esqueleto() {
  return (
    <div className="space-y-5">
      <div className="h-[168px] animate-pulse rounded-xl border border-borda bg-superficie" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-xl border border-borda bg-superficie" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-[340px] animate-pulse rounded-xl border border-borda bg-superficie" />
        ))}
      </div>
    </div>
  )
}
