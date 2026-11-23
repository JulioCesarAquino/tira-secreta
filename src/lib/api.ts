import { requireSupabase } from './supabase'
import type { EventDraft, EventSummary } from './types'

export async function listEvents(): Promise<EventSummary[]> {
  const { data, error } = await requireSupabase()
    .from('events')
    .select('id, name, event_date, drawn_at, created_at, participants!participants_event_id_fkey(count)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    date: e.event_date ?? '',
    drawnAt: e.drawn_at,
    createdAt: e.created_at,
    participantCount: (e.participants as unknown as { count: number }[])[0]?.count ?? 0,
  }))
}

export async function getEvent(id: string): Promise<EventDraft> {
  const { data, error } = await requireSupabase()
    .from('events')
    .select(
      'id, name, event_date, budget, message, drawn_at,' +
        'participants!participants_event_id_fkey(id, position, name, email, shoe_size, description, reveal_url),' +
        'restrictions!restrictions_event_id_fkey(from_participant, to_participant)',
    )
    .eq('id', id)
    .single()
  if (error) throw error
  const e = data as unknown as {
    id: string; name: string; event_date: string | null; budget: string; message: string; drawn_at: string | null
    participants: { id: string; position: number; name: string; email: string; shoe_size: string; description: string; reveal_url: string | null }[]
    restrictions: { from_participant: string; to_participant: string }[]
  }
  return {
    id: e.id,
    event: { name: e.name, date: e.event_date ?? '', budget: e.budget, message: e.message },
    drawnAt: e.drawn_at,
    participants: [...e.participants]
      .sort((a, b) => a.position - b.position)
      .map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        size: p.shoe_size,
        description: p.description,
        revealUrl: p.reveal_url ?? undefined,
      })),
    restrictions: e.restrictions.map((r) => ({ id: crypto.randomUUID(), from: r.from_participant, to: r.to_participant })),
  }
}

/** Salva tudo numa transação (função save_event no banco). Retorna o id do evento. */
export interface RevealRow { id: string; data: string }

export async function saveEvent(draft: EventDraft, reveals: RevealRow[] = []): Promise<string> {
  const named = draft.participants.filter((p) => p.name.trim())
  const ids = new Set(named.map((p) => p.id))
  const { data, error } = await requireSupabase().rpc('save_event', {
    p_event: { id: draft.id ?? '', ...draft.event, drawn_at: draft.drawnAt ?? '' },
    p_participants: named.map((p) => ({
      id: p.id, name: p.name, email: p.email, size: p.size, description: p.description, reveal_url: p.revealUrl ?? '',
    })),
    p_restrictions: draft.restrictions
      .filter((r) => ids.has(r.from) && ids.has(r.to))
      .map((r) => ({ from: r.from, to: r.to })),
    p_reveals: reveals,
  })
  if (error) throw error
  return data as string
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await requireSupabase().from('events').delete().eq('id', id)
  if (error) throw error
}

/** Leitura pública (sem login) do conteúdo cifrado de um link curto. */
export async function fetchReveal(id: string): Promise<string | null> {
  const { data, error } = await requireSupabase().rpc('get_reveal', { p_id: id })
  if (error) throw error
  return (data as string | null) ?? null
}
