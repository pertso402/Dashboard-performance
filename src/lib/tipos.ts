export type Origem =
  | 'anuncio'
  | 'qr_ifood'
  | 'reativacao_agente'
  | 'organico'
  | 'balcao'
  | 'instagram'
  | 'cliente_antigo'
  | 'base_legada'
  | 'lead_sem_compra'

export type KpiBloco = {
  pedidos: number
  receita: number | string
  ticket_medio: number | string
  desconto_total: number | string
  clientes_ativos: number
  novos_clientes: number
  pedidos_primeira_compra: number
  pedidos_recompra: number
  pct_pedidos_recompra: number | string
  receita_recompra: number | string
  clientes_recorrentes_ativos: number
  coorte_total: number
  coorte_recompraram: number
  taxa_recompra_coorte: number | string | null
  coorte_madura_total: number
  coorte_madura_recompraram: number
  taxa_recompra_janela: number | string | null
  dias_medio_recompra: number | string | null
}

export type Kpis = {
  periodo: { inicio: string; fim: string; dias: number }
  atual: KpiBloco
  anterior: KpiBloco
  janela_recompra_dias: number
}

export type LinhaOrigem = {
  origem: Origem
  clientes_adquiridos: number
  recompraram: number
  taxa_recompra: number | string | null
  receita_vitalicia: number | string
  ltv_medio: number | string | null
  dias_medio_recompra: number | string | null
  coorte_madura: number
  taxa_recompra_janela: number | string | null
  pedidos_periodo: number
  receita_periodo: number | string
}

export type PontoSerie = {
  bucket: string
  pedidos: number
  receita: number | string
  ticket_medio: number | string | null
  pedidos_novos: number
  pedidos_recompra: number
  clientes_ativos: number
  novos_clientes: number
  novos_de_anuncio: number
}

export type Coorte = {
  semana: string
  clientes: number
  idade_min_dias: number
  recompra_7d: number
  recompra_14d: number
  recompra_30d: number
  recompra_total: number
  pct_7d: number | string | null
  pct_14d: number | string | null
  pct_30d: number | string | null
  pct_total: number | string | null
  ltv_medio: number | string | null
}

export type Funil = {
  leads_captados: number
  leads_com_interesse: number
  viraram_clientes: number
  viraram_recorrentes: number
  taxa_lead_para_cliente: number | string | null
  taxa_cliente_para_recorrente: number | string | null
  receita_gerada: number | string
  por_tag: { tag: string; n: number; compraram: number }[]
  por_origem: { origem: Origem; n: number; compraram: number }[]
  base_total: number
  base_legada: number
}

export type Campanha = {
  enviadas: number
  entregues: number
  lidas: number
  responderam: number
  converteram: number
  clientes_impactados: number
  taxa_entrega: number | string | null
  taxa_leitura: number | string | null
  taxa_resposta: number | string | null
  taxa_conversao: number | string | null
  receita_gerada: number | string
  ticket_medio: number | string | null
  por_tipo: {
    tipo_oferta: string
    faixa_cadencia: number
    enviadas: number
    converteram: number
    taxa: number | string | null
  }[]
  por_dia: { bucket: string; enviadas: number; converteram: number }[]
}

export type CacRoas = {
  investido_total: number | string
  investido_meta: number | string
  clientes_adquiridos: number
  recompraram: number
  receita_vitalicia: number | string
  receita_periodo_canal: number | string
  pedidos_periodo_canal: number
  cac: number | string | null
  roas: number | string | null
  roi_pct: number | string | null
  ltv_anuncio: number | string | null
  canais: {
    canal: string
    periodo_inicio: string
    periodo_fim: string
    investido_total: number | string
    investido_periodo: number | string
    dias_registro: number
    dias_sobrepostos: number
    vendas_atribuidas: number | string | null
    pedidos_atribuidos: number | null
    observacao: string | null
  }[]
  cobertura_investimento: 'sem_dados' | 'parcial' | 'completa'
}

export type Painel = {
  atribuicao: Atribuicao
  kpis: Kpis
  origens: LinhaOrigem[]
  serie: PontoSerie[]
  coortes: Coorte[]
  funil: Funil
  campanha: Campanha
  cac: CacRoas
}

// ---------------------------------------------------------------------------
// Atribuição de marketing — o recorte "o que veio do meu trabalho".
// ---------------------------------------------------------------------------

export type TipoVenda =
  | 'aquisicao_anuncio'
  | 'aquisicao_qr_ifood'
  | 'reativacao_agente'
  | 'aquisicao_organica'
  | 'recompra_agente'
  | 'recompra_espontanea'
  | 'venda_manual'
  | 'canal_externo'

export type BlocoAtribuicao = {
  receita_atribuida: number | string
  receita_erp_atribuida: number | string
  receita_manual: number | string
  vendas_manuais: number
  receita_externa: number | string
  pedidos_atribuidos: number
  pedidos_erp_atribuidos: number
  receita_nao_atribuida: number | string
  pedidos_nao_atribuidos: number
  receita_casa: number | string
  clientes_novos: number
  clientes_ativos: number
  ticket_medio: number | string | null
  desconto_dado: number | string
}

export type Atribuicao = {
  periodo: { inicio: string; fim: string; dias: number }
  atual: BlocoAtribuicao
  anterior: BlocoAtribuicao
  por_tipo: {
    tipo_venda: TipoVenda
    atribuido: boolean
    pedidos: number
    clientes: number
    receita: number | string
    ticket: number | string | null
  }[]
  serie: {
    dia: string
    atribuida: number | string
    nao_atribuida: number | string
    pedidos: number
    novos: number
  }[]
  manuais: {
    data: string
    descricao: string
    cliente: string | null
    valor: number | string
    itens: number | null
    observacao: string | null
  }[]
  /** Canais que não passam pelo ERP (iFood hoje). Rateados por dia no período. */
  externas: {
    canal: string
    atribuida: boolean
    valor_periodo: number | string
    valor_total: number | string
    dias_lancamento: number
    dias_no_periodo: number
    ticket_medio: number | string | null
    observacao: string | null
  }[]
}

export type Depoimento = {
  id: string
  cliente_nome: string | null
  texto: string | null
  imagem_url: string | null
  destaque: boolean
  categoria: string
  ordem: number
  data_depoimento: string | null
}
