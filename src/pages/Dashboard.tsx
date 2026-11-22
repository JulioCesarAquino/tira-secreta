import { useEffect, useState } from 'react'
import { deleteEvent, listEvents } from '../lib/api'
import type { EventSummary } from '../lib/types'

const fmtDate = (iso: string) => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

export default function Dashboard() {
  const [events, setEvents] = useState<EventSummary[] | null>(null)
  const [error, setError] = useState('')

  const load = () => listEvents().then(setEvents).catch((e) => { console.error(e); setError('Não foi possível carregar seus eventos.') })
  useEffect(() => { load() }, [])

  const remove = async (ev: EventSummary) => {
    if (!confirm(`Excluir "${ev.name || 'Sem nome'}" e todos os participantes? Os links já enviados continuam funcionando.`)) return
    try {
      await deleteEvent(ev.id)
      setEvents((list) => list?.filter((x) => x.id !== ev.id) ?? null)
    } catch (e) {
      console.error(e)
      alert('Não foi possível excluir.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Meus eventos</h1>
        <a href="#/e/new" className="btn-sun px-5 py-3">+ Novo evento</a>
      </div>

      {error && <p className="rounded-lg bg-coral-500/10 px-4 py-2 text-sm text-coral-500">{error}</p>}
      {events === null && !error && <p className="text-slate-500">Carregando…</p>}

      {events?.length === 0 && (
        <div className="card py-12 text-center">
          <p className="text-6xl">🩴</p>
          <p className="mt-3 text-slate-600">Você ainda não criou nenhum evento.</p>
          <a href="#/e/new" className="btn-primary mt-4">Criar o primeiro</a>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {events?.map((ev) => (
          <li key={ev.id} className="card flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <a href={`#/e/${ev.id}`} className="font-display text-xl font-extrabold text-ocean-700 hover:underline">
                {ev.name || 'Sem nome'}
              </a>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${ev.drawnAt ? 'bg-sun-400/30 text-slate-800' : 'bg-slate-100 text-slate-500'}`}>
                {ev.drawnAt ? 'Sorteado' : 'Rascunho'}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              👥 {ev.participantCount} participante{ev.participantCount === 1 ? '' : 's'}
              {ev.date && <> · 📅 {fmtDate(ev.date)}</>}
            </p>
            <div className="mt-auto flex gap-2">
              <a href={`#/e/${ev.id}`} className="btn-primary flex-1">Abrir</a>
              <button type="button" className="btn-danger" onClick={() => remove(ev)} aria-label="Excluir evento">🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
