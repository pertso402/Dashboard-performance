-- 2026-11-14 (b) — Rastreio de anúncio pelo texto padrão do Click-to-WhatsApp
-- e volta da regra: cliente orgânico/balcão NÃO é atribuído.
--
-- Por quê: o agente só marca veio_de_anuncio quando o WhatsApp manda
-- externalAdReplyInfo, e na prática isso quase nunca chega. 115 pessoas abriram
-- a conversa com o texto padrão do anúncio da Meta e só ~30 estavam marcadas.
--
-- Regra da marcação: a 1ª mensagem do contato é o texto padrão do anúncio e o
-- cliente ainda não tinha pedido válido. Nunca desmarca nada.

-- 1) Função que marca um telefone como vindo de anúncio a partir do texto
create or replace function public.marcar_anuncio_por_texto(p_tel text, p_txt text)
returns void language plpgsql security definer set search_path = public as $$
declare v_t8 text := right(regexp_replace(coalesce(p_tel,''), '\D', '', 'g'), 8);
begin
  if p_txt is null or length(v_t8) < 8 then return; end if;
  if p_txt !~* '^\s*ol[aá]!?\s*posso ter mais informa[cç][oõ]es sobre isso' then return; end if;
  update clientes c
     set veio_de_anuncio = true,
         anuncio_meta = coalesce(c.anuncio_meta,
           jsonb_build_object('fonte', 'texto_padrao_ctwa', 'marcado_em', now()))
   where right(regexp_replace(c.telefone, '\D', '', 'g'), 8) = v_t8
     and not coalesce(c.veio_de_anuncio, false)
     and not exists (select 1 from pedidos p where p.cliente_id = c.id and p.status <> 'cancelado');
end $$;

-- 2) Triggers nas duas tabelas de conversa (n8n antigo e cw atual)
create or replace function public.trg_anuncio_n8n() returns trigger
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  begin v := (new.message #>> '{}')::jsonb; exception when others then v := new.message; end;
  if v->>'role' = 'user' or v->>'type' = 'human' then
    perform public.marcar_anuncio_por_texto(new.session_id, v->>'content');
  end if;
  return new;
exception when others then return new;  -- nunca bloqueia o agente
end $$;

drop trigger if exists trg_anuncio_n8n on public.n8n_chat_histories;
create trigger trg_anuncio_n8n after insert on public.n8n_chat_histories
  for each row execute function public.trg_anuncio_n8n();

create or replace function public.trg_anuncio_cw() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.direction = 'in' then
    perform public.marcar_anuncio_por_texto(
      (select phone from cw_conversations where id = new.conversation_id), new.text);
  end if;
  return new;
exception when others then return new;
end $$;

drop trigger if exists trg_anuncio_cw on public.cw_messages;
create trigger trg_anuncio_cw after insert on public.cw_messages
  for each row execute function public.trg_anuncio_cw();

-- 3) Marcação retroativa: 1ª mensagem do contato = texto do anúncio
with msgs as (
  select session_id tel, created_at,
         ((message #>> '{}')::jsonb ->> 'content') txt,
         ((message #>> '{}')::jsonb ->> 'role') role
    from n8n_chat_histories
  union all
  select cv.phone, m.created_at, m.text, 'user'
    from cw_messages m join cw_conversations cv on cv.id = m.conversation_id
   where m.direction = 'in'
), prim as (
  select distinct on (right(tel, 8)) right(tel, 8) t8, txt, created_at
    from msgs where role = 'user' and txt is not null
   order by right(tel, 8), created_at
)
update clientes c
   set veio_de_anuncio = true,
       anuncio_meta = coalesce(c.anuncio_meta,
         jsonb_build_object('fonte', 'texto_padrao_ctwa_retroativo', 'primeira_msg_em', p.created_at, 'marcado_em', now()))
  from prim p
 where p.t8 = right(regexp_replace(c.telefone, '\D', '', 'g'), 8)
   and p.txt ~* '^\s*ol[aá]!?\s*posso ter mais informa[cç][oõ]es sobre isso'
   and not coalesce(c.veio_de_anuncio, false)
   and not exists (select 1 from pedidos pe where pe.cliente_id = c.id and pe.status <> 'cancelado'
                    and pe.created_at < p.created_at);

-- 4) vw_clientes_dash volta a atribuir só: roleta (QR ou link do agente), anúncio
--    e 1º pedido pelo agente. Orgânico/balcão/instagram ficam como da casa.
--    iFood/Keeta seguem atribuídos via receitas_externas.atribuida.
--    (Recriada a partir de 2026-11-14_atribuicao_todo_cliente_novo.sql, só o
--    bloco "todo cliente novo" sai da coluna atribuido.)
--    Aplicado com o mesmo CREATE OR REPLACE VIEW do arquivo 2026-11-14_atribuicao_todo_cliente_novo.sql,
--    trocando a coluna atribuido por:
--      ((q.cliente_id IS NOT NULL) OR c.veio_de_anuncio
--        OR (pr.canal = ANY (ARRAY['whatsapp_anuncio'::text, 'recompra'::text]))) AS atribuido
