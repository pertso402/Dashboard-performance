# Performance · Chapelão

Dashboard de atribuição, recompra e retorno de mídia do ERP Chapelão.
Lê direto do Supabase `ERP-CHAPELAO` (`qlswjefuinhbtlhauhgj`) através de funções de
agregação — o app nunca puxa linha crua de cliente ou pedido.

O painel existe para responder uma pergunta: **quanto do faturamento veio do trabalho de
marketing e quanto o restaurante faria sozinho.**

## Rodar local

```bash
npm install
npm run dev
```

Abre em <http://localhost:5180>. As variáveis ficam em `.env.local`
(copie de `.env.example`).

## Acesso

Não há login. As funções de métrica executam para o papel `anon`, e nenhuma delas devolve
nome ou telefone — só agregados. Quem tiver o link vê faturamento, ticket, CAC e contagem
de clientes, então trate a URL como informação sensível do cliente.

## As definições que importam

**Pedido válido** — tudo que não está `cancelado`. Datas agrupadas em `America/Sao_Paulo`.

### Atribuição: o que conta como trabalho do marketing

Uma venda é **atribuída** quando qualquer uma destas é verdadeira:

- o cliente veio de **anúncio** (`veio_de_anuncio` ou 1º pedido no canal `whatsapp_anuncio`);
- o cliente veio do **QR code do iFood** (tem registro em `roleta_resgates`);
- o pedido foi gerado pelo **agente de recompra** (`canal = 'recompra'`) — inclusive para
  clientes que o restaurante já tinha, porque aquela venda extra não aconteceria sozinha;

Receita de **iFood** e **Keeta** entra por `receitas_externas` (`atribuida = true`).

- o cliente é **novo** — 1º pedido no sistema por WhatsApp orgânico, balcão ou instagram.

Fica de fora só a base antiga comprando por conta própria (`base_legada` e `cliente_antigo`).

**Anúncio desde o início:** `dash_anuncio_total()` compara todo o investido em `meta_ads` com a
receita vitalícia dos clientes de anúncio (CAC, LTV, ROAS, ROI). Custo por conversa e CPM vêm de
`dash_config` (`meta_custo_por_conversa`, `meta_cpm`).

**Rastreio de anúncio:** além do `externalAdReplyInfo` que o agente lê, um trigger em
`n8n_chat_histories` e `cw_messages` marca `veio_de_anuncio` quando a 1ª mensagem do contato é o
texto padrão do Click-to-WhatsApp ("Olá! Posso ter mais informações sobre isso?") — ver
`sql/2026-11-14b_rastreio_anuncio_e_sem_organico.sql`.

### Origem do cliente

Definida uma única vez, na aquisição, e nesta ordem:

| Origem | Regra | Atribuída? |
|---|---|---|
| `qr_ifood` | Resgatou prêmio da roleta pelo QR do iFood. | Sim |
| `anuncio` | `clientes.veio_de_anuncio = true` **ou** 1º pedido no canal `whatsapp_anuncio`. | Sim |
| `reativacao_agente` | 1º pedido no canal `recompra` — estava parado na base e o agente acordou. | Sim |
| `base_legada` | Cadastrado no dia da carga inicial (`dash_config.base_legada_data`, hoje `2026-08-04`). | Não |
| `instagram` / `balcao` | Canal do 1º pedido. | Sim |
| `cliente_antigo` | 1º pedido no canal `whatsapp` genérico — já era cliente da casa. | Não |
| `organico` | Qualquer outro canal no 1º pedido (na prática, `whatsapp_organico`). | Sim |
| `lead_sem_compra` | Está no banco e nunca pediu. | Não |

Recompra de um cliente de anúncio continua contando como anúncio — a origem não muda a cada
pedido. Foi por isso que as duas fontes de atribuição do banco (`veio_de_anuncio` e
`pedidos.canal`) foram unificadas: elas divergiam em 9 clientes.

### Tipo de venda

Cada pedido recebe um tipo, que é o que o painel mostra em "De onde veio cada real":

| Tipo | Já tinha comprado antes? | Quem provocou |
|---|---|---|
| `aquisicao_anuncio` | Não | O anúncio |
| `aquisicao_qr_ifood` | Não | O QR do iFood |
| `reativacao_agente` | Não | O agente de recompra |
| `recompra_agente` | Sim | O agente de recompra |
| `recompra_espontanea` | Sim | Ninguém — voltou sozinho |
| `aquisicao_organica` | Não | Ninguém (não atribuída) |

**Reativação não é recompra.** Um primeiro pedido puxado pelo agente é venda nova de um
contato morto, não o retorno de um cliente.

### Recompra

**Taxa de recompra** — por coorte de aquisição: dos clientes cujo *primeiro* pedido caiu no
período, quantos já fizeram um segundo. É a única forma que não infla quando o volume cresce.

**Recompra na janela** — mesma conta, mas só para clientes que já têm pelo menos
`dash_config.janela_recompra_dias` (hoje 14) de vida, contando apenas recompras dentro dessa
janela. É o número comparável entre períodos.

### Vendas manuais

`vendas_manuais_atribuidas` guarda negociações fechadas pessoalmente pelo gestor, fora do
fluxo do ERP. Elas **entram na receita atribuída** e **ficam fora do ticket médio** — um
pedido avulso de valor alto distorceria a média do delivery.

### CAC / ROAS

O investimento de `marketing_investimentos` é rateado por dia, então só a fatia que cai
dentro do período filtrado entra na conta. O Meta está lançado fatura a fatura de 16/08 a
29/08; o consumo de 03/08 a 15/08 ainda é estimativa do saldo. O iFood não passa pelo ERP e
fica de fora do CAC/ROAS.

## Ajustar os parâmetros

Sem migration — dá pra editar direto na tabela:

```sql
update dash_config set valor = '30' where chave = 'janela_recompra_dias';
```

Chaves: `base_legada_data`, `janela_recompra_dias`, `timezone`.

## Camada no banco

Views:
- `vw_pedidos_dash` — pedidos válidos, data local, posição do pedido no histórico do cliente.
- `vw_clientes_dash` — origem classificada, flag `atribuido`, datas de 1º/2º pedido.
- `vw_pedidos_atrib` — por pedido: `atribuido` e `tipo_venda`.

Tabelas de apoio (fora do fluxo do ERP):
- `vendas_manuais_atribuidas` — vendas fechadas à mão.
- `depoimentos` — prints e falas de clientes elogiando atendimento e entrega.

Funções (`security definer`, `search_path` fixo, `execute` para `anon`):
`dash_atribuicao`, `dash_kpis`, `dash_origens`, `dash_serie`, `dash_coortes`, `dash_funil`,
`dash_campanha`, `dash_cac_roas`, `dash_limites`.

Todas recebem `p_inicio` / `p_fim` em data local e devolvem `jsonb` agregado.
`dash_kpis` e `dash_atribuicao` já trazem o período anterior de mesma duração.

## Limitações conhecidas

- **Histórico curto.** O banco só tem pedidos desde 07/08/2026. Comparações contra
  "período anterior" ficam sem base antes disso.
- **`clientes.anuncio_meta` está vazio** em 100% das linhas — não dá para quebrar
  por campanha ou criativo até que o agente comece a preencher.
- **Telemetria de WhatsApp incompleta.** Só uma fração de `ofertas_enviadas` tem
  `status_entrega` gravado, então entrega/leitura/resposta aparecem subestimadas.
  A conversão não sofre disso: vem do pedido de verdade.
