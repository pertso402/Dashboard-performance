import type { Origem, TipoVenda } from './tipos'

/**
 * Origem do cliente. As três origens geradas pelo marketing recebem cor;
 * as que já eram do restaurante ficam em tom neutro — a diferença entre
 * "meu" e "da casa" precisa saltar antes de qualquer legenda ser lida.
 */
export const ORIGEM_LABEL: Record<Origem, string> = {
  anuncio: 'Anúncio',
  qr_ifood: 'QR do iFood',
  reativacao_agente: 'Reativado pelo agente',
  organico: 'Orgânico',
  balcao: 'Balcão',
  instagram: 'Instagram',
  cliente_antigo: 'Cliente antigo',
  base_legada: 'Base legada',
  lead_sem_compra: 'Lead sem compra',
}

export const ORIGEM_COR: Record<Origem, string> = {
  anuncio: 'var(--color-serie-1)',
  reativacao_agente: 'var(--color-serie-2)',
  qr_ifood: 'var(--color-serie-4)',
  organico: 'var(--color-neutro-1)',
  balcao: 'var(--color-neutro-1)',
  instagram: 'var(--color-serie-5)',
  cliente_antigo: 'var(--color-neutro-2)',
  base_legada: 'var(--color-neutro-2)',
  lead_sem_compra: 'var(--color-borda-forte)',
}

/** Quais origens contam como fruto do trabalho de marketing. */
export const ORIGEM_ATRIBUIDA: Record<Origem, boolean> = {
  anuncio: true,
  qr_ifood: true,
  reativacao_agente: true,
  organico: false,
  balcao: false,
  instagram: false,
  cliente_antigo: false,
  base_legada: false,
  lead_sem_compra: false,
}

export const ORIGEM_DESCRICAO: Record<Origem, string> = {
  anuncio:
    'Cliente marcado com veio_de_anuncio ou cujo 1º pedido entrou pelo canal whatsapp_anuncio.',
  qr_ifood:
    'Leu o QR code que vai junto do pedido do iFood, girou a roleta e deixou o contato.',
  reativacao_agente:
    'Já estava na base sem nunca ter pedido no sistema. O agente mandou oferta e ele comprou — é primeira venda, não recompra.',
  organico:
    'Chegou pelo WhatsApp sem passar por anúncio (canal whatsapp_organico no 1º pedido).',
  balcao: 'Primeiro pedido registrado no balcão.',
  instagram: 'Primeiro pedido veio pelo canal instagram.',
  cliente_antigo:
    'Primeiro pedido no canal whatsapp genérico — cliente que já era do restaurante.',
  base_legada:
    'Cadastrado na carga inicial da base antiga. Não é aquisição de marketing.',
  lead_sem_compra: 'Está no banco mas nunca fez um pedido.',
}

export const label = (o: string) => ORIGEM_LABEL[o as Origem] ?? o
export const cor = (o: string) => ORIGEM_COR[o as Origem] ?? 'var(--color-neutro-1)'
export const ehMinha = (o: string) => ORIGEM_ATRIBUIDA[o as Origem] ?? false

/** Tipo da venda — o que exatamente gerou aquele pedido. */
export const VENDA_LABEL: Record<TipoVenda, string> = {
  aquisicao_anuncio: 'Cliente novo do anúncio',
  aquisicao_qr_ifood: 'Cliente novo do QR do iFood',
  reativacao_agente: 'Reativação pelo agente',
  recompra_agente: 'Recompra puxada pelo agente',
  recompra_espontanea: 'Recompra espontânea',
  venda_manual: 'Venda fechada na mão',
  aquisicao_organica: 'Cliente novo orgânico',
}

export const VENDA_COR: Record<TipoVenda, string> = {
  aquisicao_anuncio: 'var(--color-serie-1)',
  reativacao_agente: 'var(--color-serie-2)',
  recompra_agente: 'var(--color-serie-3)',
  aquisicao_qr_ifood: 'var(--color-serie-4)',
  recompra_espontanea: 'var(--color-serie-5)',
  venda_manual: 'var(--color-serie-7)',
  aquisicao_organica: 'var(--color-neutro-1)',
}

export const VENDA_DESCRICAO: Record<TipoVenda, string> = {
  aquisicao_anuncio: 'Primeira compra de quem chegou pelo anúncio.',
  aquisicao_qr_ifood: 'Primeira compra de quem veio pelo QR code do iFood.',
  reativacao_agente:
    'Primeira compra de um contato que estava parado na base e o agente acordou.',
  recompra_agente: 'Cliente voltou depois de receber oferta do agente de recompra.',
  recompra_espontanea: 'Cliente que você trouxe voltou sozinho, sem precisar de oferta.',
  venda_manual:
    'Negociação fechada pessoalmente por você, fora do fluxo do sistema. Lançada à mão.',
  aquisicao_organica: 'Cliente novo que chegou sozinho ao restaurante. Não conta como seu.',
}

export const vendaLabel = (t: string) => VENDA_LABEL[t as TipoVenda] ?? t
export const vendaCor = (t: string) => VENDA_COR[t as TipoVenda] ?? 'var(--color-neutro-1)'
