-- 2026-11-14 — Regra de atribuição: todo cliente novo passa a contar como do marketing.
--
-- Antes: atribuido = QR do iFood (roleta) OU anúncio OU 1º pedido no canal recompra.
-- Agora: além disso, todo cliente que fez o 1º pedido no sistema (WhatsApp orgânico,
-- balcão, instagram...) é atribuído. Continuam de fora só a base legada
-- (dash_config.base_legada_data) e o canal 'whatsapp' genérico (cliente_antigo).
--
-- Só a expressão da coluna `atribuido` mudou. Para voltar à regra antiga, troque o
-- último CASE/expressão de `atribuido` por:
--   ((q.cliente_id IS NOT NULL) OR c.veio_de_anuncio
--     OR (pr.canal = ANY (ARRAY['whatsapp_anuncio'::text, 'recompra'::text]))) AS atribuido

CREATE OR REPLACE VIEW public.vw_clientes_dash AS
 WITH prim AS (
         SELECT vw_pedidos_dash.cliente_id, vw_pedidos_dash.canal, vw_pedidos_dash.created_at, vw_pedidos_dash.data_local
           FROM vw_pedidos_dash
          WHERE (vw_pedidos_dash.seq_cliente = 1)
        ), seg AS (
         SELECT vw_pedidos_dash.cliente_id, vw_pedidos_dash.created_at AS dt_segundo
           FROM vw_pedidos_dash
          WHERE (vw_pedidos_dash.seq_cliente = 2)
        ), agg AS (
         SELECT vw_pedidos_dash.cliente_id, count(*) AS n_pedidos, sum(vw_pedidos_dash.total) AS receita_total,
            max(vw_pedidos_dash.created_at) AS dt_ultimo
           FROM vw_pedidos_dash
          GROUP BY vw_pedidos_dash.cliente_id
        ), anuncio_ped AS (
         SELECT DISTINCT vw_pedidos_dash.cliente_id
           FROM vw_pedidos_dash
          WHERE (vw_pedidos_dash.canal = 'whatsapp_anuncio'::text)
        ), qr AS (
         SELECT DISTINCT roleta_resgates.cliente_id
           FROM roleta_resgates
          WHERE (roleta_resgates.cliente_id IS NOT NULL)
        )
 SELECT c.id, c.nome, c.telefone, c.tag, c.tags, c.veio_de_anuncio, c.status_cadencia,
    c.created_at AS cadastrado_em,
    ((c.created_at AT TIME ZONE 'America/Sao_Paulo'::text))::date AS data_cadastro,
    COALESCE(a.n_pedidos, (0)::bigint) AS n_pedidos,
    COALESCE(a.receita_total, (0)::numeric) AS receita_total,
    pr.created_at AS dt_primeiro_pedido,
    pr.data_local AS data_primeiro_pedido,
    s.dt_segundo AS dt_segundo_pedido,
    ((s.dt_segundo AT TIME ZONE 'America/Sao_Paulo'::text))::date AS data_segundo_pedido,
    a.dt_ultimo AS dt_ultimo_pedido,
    pr.canal AS canal_primeiro_pedido,
        CASE
            WHEN (s.dt_segundo IS NOT NULL) THEN round((EXTRACT(epoch FROM (s.dt_segundo - pr.created_at)) / 86400.0), 1)
            ELSE NULL::numeric
        END AS dias_ate_recompra,
        CASE
            WHEN (pr.created_at IS NOT NULL) THEN (floor((EXTRACT(epoch FROM (now() - pr.created_at)) / 86400.0)))::integer
            ELSE NULL::integer
        END AS dias_desde_primeiro,
    (c.veio_de_anuncio OR (ap.cliente_id IS NOT NULL)) AS tocado_por_anuncio,
        CASE
            WHEN (q.cliente_id IS NOT NULL) THEN 'qr_ifood'::text
            WHEN (c.veio_de_anuncio OR (pr.canal = 'whatsapp_anuncio'::text)) THEN 'anuncio'::text
            WHEN (pr.canal = 'recompra'::text) THEN 'reativacao_agente'::text
            WHEN (((c.created_at AT TIME ZONE 'America/Sao_Paulo'::text))::date = (dash_cfg('base_legada_data'::text))::date) THEN 'base_legada'::text
            WHEN (pr.canal = 'instagram'::text) THEN 'instagram'::text
            WHEN (pr.canal = 'balcao'::text) THEN 'balcao'::text
            WHEN (pr.canal = 'whatsapp'::text) THEN 'cliente_antigo'::text
            WHEN (pr.canal IS NOT NULL) THEN 'organico'::text
            ELSE 'lead_sem_compra'::text
        END AS origem,
    (
      (q.cliente_id IS NOT NULL)
      OR c.veio_de_anuncio
      OR (pr.canal = ANY (ARRAY['whatsapp_anuncio'::text, 'recompra'::text]))
      -- todo cliente novo: fez o 1º pedido no sistema e não é da base antiga
      OR (
        pr.canal IS NOT NULL
        AND pr.canal <> 'whatsapp'::text
        AND ((c.created_at AT TIME ZONE 'America/Sao_Paulo'::text))::date <> (dash_cfg('base_legada_data'::text))::date
      )
    ) AS atribuido
   FROM (((((clientes c
     LEFT JOIN prim pr ON ((pr.cliente_id = c.id)))
     LEFT JOIN seg s ON ((s.cliente_id = c.id)))
     LEFT JOIN agg a ON ((a.cliente_id = c.id)))
     LEFT JOIN anuncio_ped ap ON ((ap.cliente_id = c.id)))
     LEFT JOIN qr q ON ((q.cliente_id = c.id)));
