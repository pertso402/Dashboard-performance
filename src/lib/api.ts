import { supabase } from './supabase'
import type {
  Atribuicao, CacRoas, Campanha, Coorte, Depoimento, Funil, Kpis, LinhaOrigem,
  Painel, PontoSerie,
} from './tipos'

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(`${fn}: ${error.message}`)
  return data as T
}

export type Granularidade = 'dia' | 'semana'

export async function carregarPainel(
  inicio: string,
  fim: string,
  granularidade: Granularidade
): Promise<Painel> {
  const p = { p_inicio: inicio, p_fim: fim }

  const [atribuicao, kpis, origens, serie, coortes, funil, campanha, cac] = await Promise.all([
    rpc<Atribuicao>('dash_atribuicao', p),
    rpc<Kpis>('dash_kpis', p),
    rpc<LinhaOrigem[]>('dash_origens', p),
    rpc<PontoSerie[]>('dash_serie', { ...p, p_gran: granularidade }),
    rpc<Coorte[]>('dash_coortes', { ...p, p_origem: null }),
    rpc<Funil>('dash_funil', p),
    rpc<Campanha>('dash_campanha', p),
    rpc<CacRoas>('dash_cac_roas', p),
  ])

  return { atribuicao, kpis, origens, serie, coortes, funil, campanha, cac }
}

/** Menor e maior data de pedido no banco — usado pelo preset "Todo o período". */
export async function limitesDeData(): Promise<{ min: string; max: string } | null> {
  const d = await rpc<{ min: string | null; max: string | null }>('dash_limites', {})
  if (!d?.min || !d?.max) return null
  return { min: d.min, max: d.max }
}

/** Prints e falas de clientes. Ordenados: destaque primeiro, depois campo `ordem`. */
export async function carregarDepoimentos(): Promise<Depoimento[]> {
  const { data, error } = await supabase
    .from('depoimentos')
    .select('*')
    .order('destaque', { ascending: false })
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw new Error(`depoimentos: ${error.message}`)
  return (data ?? []) as Depoimento[]
}
