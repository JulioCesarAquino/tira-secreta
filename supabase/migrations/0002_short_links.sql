-- Tira Secreta — links curtos
-- Rode no Supabase: SQL Editor → New query → cole este arquivo → Run.
--
-- O link curto (#/s/<código>) carrega só um segredo de 16 caracteres.
-- Do segredo o navegador deriva: (1) o id da linha nesta tabela e (2) a chave
-- que decifra o conteúdo. O banco guarda apenas o conteúdo cifrado — sem o
-- link, nem quem tem acesso ao banco consegue ler quem tirou quem.

create table public.reveals (
  id          text primary key check (id ~ '^[A-Za-z0-9_-]{16}$'),
  event_id    uuid not null references public.events (id) on delete cascade,
  data        text not null check (char_length(data) <= 8000),
  created_at  timestamptz not null default now()
);
create index reveals_event_idx on public.reveals (event_id);

alter table public.reveals enable row level security;

create policy reveals_owner on public.reveals
  for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

revoke all on public.reveals from anon;
grant select, insert, delete on public.reveals to authenticated;

-- Leitura pública só por id exato (não dá para listar a tabela).
create or replace function public.get_reveal(p_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select data from public.reveals where id = p_id
$$;

revoke execute on function public.get_reveal(text) from public;
grant  execute on function public.get_reveal(text) to anon, authenticated;

-- save_event ganha o parâmetro p_reveals (links curtos gerados no sorteio).
drop function public.save_event(jsonb, jsonb, jsonb);

create function public.save_event(
  p_event jsonb,
  p_participants jsonb,
  p_restrictions jsonb,
  p_reveals jsonb default '[]'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid := nullif(p_event ->> 'id', '')::uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado' using errcode = '28000';
  end if;
  if jsonb_array_length(coalesce(p_participants, '[]')) > 200 then
    raise exception 'Máximo de 200 participantes' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(p_reveals, '[]')) > 200 then
    raise exception 'Máximo de 200 links por vez' using errcode = '22023';
  end if;

  if v_id is null then
    insert into events (name, event_date, budget, message, drawn_at)
    values (
      coalesce(p_event ->> 'name', ''),
      nullif(p_event ->> 'date', '')::date,
      coalesce(p_event ->> 'budget', ''),
      coalesce(p_event ->> 'message', ''),
      nullif(p_event ->> 'drawn_at', '')::timestamptz
    )
    returning id into v_id;
  else
    update events set
      name       = coalesce(p_event ->> 'name', ''),
      event_date = nullif(p_event ->> 'date', '')::date,
      budget     = coalesce(p_event ->> 'budget', ''),
      message    = coalesce(p_event ->> 'message', ''),
      drawn_at   = nullif(p_event ->> 'drawn_at', '')::timestamptz,
      updated_at = now()
    where id = v_id;
    if not found then
      raise exception 'Evento não encontrado' using errcode = 'P0002';
    end if;
  end if;

  delete from participants where event_id = v_id; -- restrições vão junto (cascade)

  insert into participants (id, event_id, position, name, email, shoe_size, description, reveal_url)
  select (p ->> 'id')::uuid, v_id, (ord - 1)::int,
         trim(p ->> 'name'),
         coalesce(trim(p ->> 'email'), ''),
         coalesce(trim(p ->> 'size'), ''),
         coalesce(trim(p ->> 'description'), ''),
         nullif(p ->> 'reveal_url', '')
  from jsonb_array_elements(coalesce(p_participants, '[]')) with ordinality as t (p, ord);

  insert into restrictions (event_id, from_participant, to_participant)
  select v_id, (r ->> 'from')::uuid, (r ->> 'to')::uuid
  from jsonb_array_elements(coalesce(p_restrictions, '[]')) as r
  where (r ->> 'from')::uuid in (select id from participants where event_id = v_id)
    and (r ->> 'to')::uuid   in (select id from participants where event_id = v_id)
  on conflict do nothing;

  -- Links curtos já enviados continuam valendo mesmo após novo sorteio
  -- (mesmo comportamento dos links longos). Só somem se o evento for excluído.
  insert into reveals (id, event_id, data)
  select r ->> 'id', v_id, r ->> 'data'
  from jsonb_array_elements(coalesce(p_reveals, '[]')) as r
  on conflict (id) do nothing;

  return v_id;
end;
$$;

revoke execute on function public.save_event(jsonb, jsonb, jsonb, jsonb) from public, anon;
grant  execute on function public.save_event(jsonb, jsonb, jsonb, jsonb) to authenticated;
