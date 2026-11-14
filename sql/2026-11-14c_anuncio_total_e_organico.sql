-- 2026-11-14 (c) — Cartão "Anúncio desde o início" + orgânico volta a ser atribuído.
--
-- 1) Métricas de mídia informadas pelo gestor (painel do Meta), ajustáveis sem migration.
insert into public.dash_config (chave, valor, descricao) values
  ('meta_custo_por_conversa', '2.20', 'Custo por conversa iniciada no Meta Ads (informado pelo gestor, campanha toda).'),
  ('meta_cpm', '12.00', 'Custo por mil impressões no Meta Ads (informado pelo gestor, campanha toda).')
on conflict (chave) do update set valor = excluded.valor, descricao = excluded.descricao, updated_at = now();

-- 2) Resultado do anúncio desde o início, independente do período filtrado.
--    Cliente de anúncio = veio_de_anuncio (dado do anúncio ou texto padrão do CTWA)
--    ou 1º pedido no canal whatsapp_anuncio.
create or replace function public.dash_anuncio_total()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
with inv as (
  select coalesce(sum(investido), 0) investido, min(periodo_inicio) ini, max(periodo_fim) fim
    from marketing_investimentos where canal = 'meta_ads'
), cfg as (
  select nullif(dash_cfg('meta_custo_por_conversa'), '')::numeric cpc,
         nullif(dash_cfg('meta_cpm'), '')::numeric cpm
), ad as (
  select * from vw_clientes_dash where veio_de_anuncio or canal_primeiro_pedido = 'whatsapp_anuncio'
), ped as (
  select count(*) n from vw_pedidos_dash where cliente_id in (select id from ad)
)
select jsonb_build_object(
  'investido',          (select investido from inv),
  'campanha_inicio',    (select ini from inv),
  'campanha_fim',       (select fim from inv),
  'custo_por_conversa', (select cpc from cfg),
  'cpm',                (select cpm from cfg),
  'conversas_estimadas',   (select round(investido / nullif(cpc, 0)) from inv, cfg),
  'impressoes_estimadas',  (select round(investido / nullif(cpm, 0) * 1000) from inv, cfg),
  'leads',              (select count(*) from ad),
  'clientes',           (select count(*) from ad where n_pedidos > 0),
  'recompraram',        (select count(*) from ad where n_pedidos >= 2),
  'pedidos',            (select n from ped),
  'receita',            (select coalesce(sum(receita_total), 0) from ad),
  'cac',                (select round(investido / nullif((select count(*) from ad where n_pedidos > 0), 0), 2) from inv),
  'custo_por_lead',     (select round(investido / nullif((select count(*) from ad), 0), 2) from inv),
  'ltv',                (select round(sum(receita_total) / nullif(count(*) filter (where n_pedidos > 0), 0), 2) from ad),
  'roas',               (select round((select coalesce(sum(receita_total), 0) from ad) / nullif(investido, 0), 2) from inv),
  'roi_pct',            (select round(100.0 * ((select coalesce(sum(receita_total), 0) from ad) - investido) / nullif(investido, 0), 1) from inv)
);
$$;
grant execute on function public.dash_anuncio_total() to anon, authenticated;

-- 3) Orgânico volta a ser atribuído: reaplicar a view de
--    2026-11-14_atribuicao_todo_cliente_novo.sql (todo cliente novo, menos a base antiga).
