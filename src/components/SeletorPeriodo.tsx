import { fimDoMes, hoje, inicioDoMes, somaDias, dataLonga, duracaoDias } from '../lib/format'

export type Periodo = { inicio: string; fim: string; rotulo: string }

export function presets(limites: { min: string; max: string } | null): Periodo[] {
  const h = hoje()
  const mesPassado = somaDias(inicioDoMes(h), -1)
  const lista: Periodo[] = [
    { rotulo: 'Últimos 7 dias', inicio: somaDias(h, -6), fim: h },
    { rotulo: 'Últimos 14 dias', inicio: somaDias(h, -13), fim: h },
    { rotulo: 'Últimos 30 dias', inicio: somaDias(h, -29), fim: h },
    { rotulo: 'Este mês', inicio: inicioDoMes(h), fim: h },
    {
      rotulo: 'Mês passado',
      inicio: inicioDoMes(mesPassado),
      fim: fimDoMes(mesPassado),
    },
  ]
  if (limites) {
    lista.push({ rotulo: 'Todo o período', inicio: limites.min, fim: limites.max })
  }
  return lista
}

export function SeletorPeriodo({
  periodo, aoMudar, limites, granularidade, aoMudarGranularidade,
}: {
  periodo: Periodo
  aoMudar: (p: Periodo) => void
  limites: { min: string; max: string } | null
  granularidade: 'dia' | 'semana'
  aoMudarGranularidade: (g: 'dia' | 'semana') => void
}) {
  const opcoes = presets(limites)
  const dias = duracaoDias(periodo.inicio, periodo.fim)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-lg border border-borda bg-superficie p-1">
        {opcoes.map((o) => {
          const ativo = o.inicio === periodo.inicio && o.fim === periodo.fim
          return (
            <button
              key={o.rotulo}
              onClick={() => aoMudar(o)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                ativo
                  ? 'bg-tinta text-white'
                  : 'text-tinta-2 hover:bg-fundo hover:text-tinta'
              }`}
            >
              {o.rotulo}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-borda bg-superficie px-2.5 py-1.5">
        <input
          type="date"
          value={periodo.inicio}
          max={periodo.fim}
          onChange={(e) =>
            aoMudar({ ...periodo, inicio: e.target.value, rotulo: 'Personalizado' })
          }
          className="bg-transparent text-xs text-tinta tnum outline-none"
        />
        <span className="text-tinta-3">→</span>
        <input
          type="date"
          value={periodo.fim}
          min={periodo.inicio}
          onChange={(e) =>
            aoMudar({ ...periodo, fim: e.target.value, rotulo: 'Personalizado' })
          }
          className="bg-transparent text-xs text-tinta tnum outline-none"
        />
      </div>

      <div className="flex rounded-lg border border-borda bg-superficie p-1">
        {(['dia', 'semana'] as const).map((g) => (
          <button
            key={g}
            onClick={() => aoMudarGranularidade(g)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              granularidade === g
                ? 'bg-tinta text-white'
                : 'text-tinta-2 hover:bg-fundo hover:text-tinta'
            }`}
          >
            {g === 'dia' ? 'Por dia' : 'Por semana'}
          </button>
        ))}
      </div>

      <span className="text-xs text-tinta-3 tnum">
        {dataLonga(periodo.inicio)} – {dataLonga(periodo.fim)} · {dias} dias
      </span>
    </div>
  )
}
