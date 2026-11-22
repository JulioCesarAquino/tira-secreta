-- Tira Secreta — esquema inicial
-- Rode no Supabase: Dashboard → SQL Editor → cole este arquivo → Run.

-- =========================================================================
-- Tabelas
-- =========================================================================

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null default '' check (char_length(name) <= 120),
  event_date  date,
  budget      text not null default '' check (char_length(budget) <= 60),
  message     text not null default '' check (char_length(message) <= 1000),
  drawn_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index events_owner_created_idx on public.events (owner_id, created_at desc);

create table public.participants (
  id           uuid primary key,
  event_id     uuid not null references public.events (id) on delete cascade,
  position     int  not null,
  name         text not null check (char_length(name) between 1 and 80),
  email        text not null default '' check (char_length(email) <= 254),
  shoe_size    text not null default '' check (char_length(shoe_size) <= 10),
  description  text not null default '' check (char_length(description) <= 500),
  -- Link de revelação. O resultado vai criptografado DENTRO do link;
  -- o banco nunca guarda "quem tirou quem" em texto aberto.
  reveal_url   text check (char_length(reveal_url) <= 4000)
);
create index participants_event_idx on public.participants (event_id, position);

create table public.restrictions (
  event_id          uuid not null references public.events (id) on delete cascade,
  from_participant  uuid not null references public.participants (id) on delete cascade,
  to_participant    uuid not null references public.participants (id) on delete cascade,
  primary key (event_id, from_participant, to_participant),
  check (from_participant <> to_participant)
);

-- =========================================================================
-- Segurança: cada organizador só enxerga os próprios eventos
-- =========================================================================

alter table public.events       enable row level security;
alter table public.participants enable row level security;
alter table public.restrictions enable row level security;

create policy events_owner on public.events
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy participants_owner on public.participants
  for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy restrictions_owner on public.restrictions
  for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

-- Permissões explícitas: funciona com ou sem "Grant API access to new tables
-- automatically". Visitante anônimo não acessa nada; o RLS filtra o resto.
revoke all on public.events, public.participants, public.restrictions from anon;
grant select, insert, update, delete on public.events, public.participants, public.restrictions to authenticated;

-- =========================================================================
-- save_event: grava evento + participantes + restrições numa transação só
-- (security invoker → as políticas acima continuam valendo)
-- =========================================================================

create or replace function public.save_event(p_event jsonb, p_participants jsonb, p_restrictions jsonb)
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

  return v_id;
end;
$$;

revoke execute on function public.save_event(jsonb, jsonb, jsonb) from public, anon;
grant  execute on function public.save_event(jsonb, jsonb, jsonb) to authenticated;
