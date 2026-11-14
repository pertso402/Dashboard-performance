-- 2026-11-14 (d) — Crescimento mês a mês.
--
-- "Mês" = blocos de 30 dias contados para trás a partir da data de corte, para
-- comparar janelas do mesmo tamanho (mês calendário corrente ainda incompleto
-- distorce a comparação).
-- Data de corte = hoje, limitada ao último dia lançado do iFood: sem isso o bloco
-- atual ficaria sem o iFood dos últimos dias e o crescimento cairia artificialmente.
-- Só entram blocos com dados completos: a partir do 1º pedido do ERP E do 1º
-- lançamento do iFood.
create or replace function public.dash_crescimento(p_dias int default 30, p_max_blocos int default 12)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
with lim as (
  select
    least((now() at time zone 'America/Sao_Paulo')::date,
          coalesce((select max(periodo_fim) from receitas_externas where canal = 'ifood'),
                   (now() at time zone 'America/Sao_Paulo')::date)) as corte,
    greatest((select min(data_local) from vw_pedidos_dash),
             coalesce((select min(periodo_inicio) from receitas_externas where canal = 'ifood'),
                      (select min(data_local) from vw_pedidos_dash))) as inicio_dados
), blocos as (
  select k, (corte - k * p_dias - p_dias + 1) as ini, (corte - k * p_dias) as fim
    from lim, generate_series(0, p_max_blocos - 1) k
   where corte - k * p_dias - p_dias + 1 >= inicio_dados
), calc as (
  select b.k, b.ini, b.fim,
    (select coalesce(sum(total), 0) from vw_pedidos_dash where data_local between b.ini and b.fim) as sistema,
    (select count(*) from vw_pedidos_dash where data_local between b.ini and b.fim) as pedidos_sistema,
    (select coalesce(sum(valor), 0) from vendas_manuais_atribuidas where data_venda between b.ini and b.fim) as manual,
    (select coalesce(jsonb_object_agg(canal, v), '{}'::jsonb) from (
        select canal, round(sum(valor / (periodo_fim - periodo_inicio + 1)
               * greatest(0, least(periodo_fim, b.fim) - greatest(periodo_inicio, b.ini) + 1)), 2) v
          from receitas_externas
         where periodo_inicio <= b.fim and periodo_fim >= b.ini
         group by canal) e) as externos,
    (public.dash_atribuicao_bloco(b.ini, b.fim) ->> 'receita_atribuida')::numeric as atribuida
  from blocos b
)
select jsonb_build_object(
  'dias_bloco', p_dias,
  'corte', (select corte from lim),
  'blocos', coalesce((select jsonb_agg(jsonb_build_object(
      'inicio', ini, 'fim', fim,
      'sistema', sistema, 'pedidos_sistema', pedidos_sistema, 'manual', manual,
      'externos', externos, 'atribuida', atribuida,
      'total', sistema + manual + coalesce((select sum(value::numeric) from jsonb_each_text(externos)), 0)
    ) order by ini) from calc), '[]'::jsonb)
);
$$;
grant execute on function public.dash_crescimento(int, int) to anon, authenticated;
