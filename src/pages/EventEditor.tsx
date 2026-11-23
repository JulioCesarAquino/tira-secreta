import { useEffect, useMemo, useState } from 'react'
import EventForm from '../components/EventForm'
import ParticipantsEditor, { emptyParticipant } from '../components/ParticipantsEditor'
import RestrictionsEditor from '../components/RestrictionsEditor'
import ResultsPanel from '../components/ResultsPanel'
import Section from '../components/Section'
import { getEvent, saveEvent, type RevealRow } from '../lib/api'
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS } from '../lib/config'
import { openPayload, sealShort } from '../lib/crypto'
import { drawPairs, ImpossibleDrawError } from '../lib/draw'
import { isLongLink, shortRevealUrl } from '../lib/links'
import type { EventDraft, GeneratedLink } from '../lib/types'

const newDraft = (): EventDraft => ({
  event: { name: '', date: '', budget: '', message: '' },
  participants: [emptyParticipant(), emptyParticipant(), emptyParticipant()],
  restrictions: [],
  drawnAt: null,
})

export default function EventEditor({ id }: { id?: string }) {
  const [draft, setDraft] = useState<EventDraft | null>(id ? null : newDraft())
  const [loadError, setLoadError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState<'' | 'save' | 'draw'>('')
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!id) return
    getEvent(id)
      .then((d) => setDraft(d.participants.length ? d : { ...d, participants: [emptyParticipant()] }))
      .catch((e) => { console.error(e); setLoadError('Evento não encontrado.') })
  }, [id])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const named = useMemo(() => draft?.participants.filter((p) => p.name.trim()) ?? [], [draft])
  const duplicates = useMemo(() => {
    const seen = new Set<string>()
    const dup = new Set<string>()
    for (const p of named) {
      const k = p.name.trim().toLowerCase()
      if (seen.has(k)) dup.add(k)
      seen.add(k)
    }
    return dup
  }, [named])

  if (loadError) return <div className="card text-center"><p>{loadError}</p><a href="#/" className="btn-ghost mt-3">← Meus eventos</a></div>
  if (!draft) return <p className="mt-16 text-center text-slate-500">Carregando…</p>

  const edit = <K extends keyof EventDraft>(k: K) => (v: EventDraft[K]) => {
    setDraft((d) => d && { ...d, [k]: v })
    setDirty(true)
  }

  const persist = async (next: EventDraft, reveals: RevealRow[] = []) => {
    const savedId = await saveEvent(next, reveals)
    if (!next.id) window.history.replaceState(null, '', `#/e/${savedId}`)
    setDraft({ ...next, id: savedId, participants: next.participants.filter((p) => p.name.trim()) })
    setDirty(false)
    setSavedAt(new Date())
  }

  const save = async () => {
    if (duplicates.size) return setError('Há nomes repetidos — diferencie com sobrenome ou apelido.')
    setBusy('save')
    setError('')
    try {
      await persist(draft)
    } catch (e) {
      console.error(e)
      setError('Não foi possível salvar. Verifique sua conexão e tente de novo.')
    } finally {
      setBusy('')
    }
  }

  const problem =
    named.length < MIN_PARTICIPANTS ? `Adicione pelo menos ${MIN_PARTICIPANTS} participantes com nome.`
    : named.length > MAX_PARTICIPANTS ? `Máximo de ${MAX_PARTICIPANTS} participantes.`
    : duplicates.size > 0 ? 'Há nomes repetidos — diferencie com sobrenome ou apelido.'
    : ''

  const runDraw = async () => {
    if (problem) return setError(problem)
    setError('')
    setBusy('draw')
    try {
      const ids = new Set(named.map((p) => p.id))
      const forbidden = draft.restrictions
        .filter((r) => ids.has(r.from) && ids.has(r.to))
        .map((r) => [r.from, r.to] as const)
      const pairs = drawPairs([...ids], forbidden)
      const byId = new Map(named.map((p) => [p.id, p]))
      const ev = draft.event
      const reveals: RevealRow[] = []
      const participants = await Promise.all(
        named.map(async (giver) => {
          const r = byId.get(pairs.get(giver.id)!)!
          const sealed = await sealShort({
            v: 1,
            ev: { n: ev.name.trim(), d: ev.date, b: ev.budget.trim(), m: ev.message.trim() },
            g: giver.name.trim(),
            r: { n: r.name.trim(), s: r.size.trim(), t: r.description.trim() },
          })
          reveals.push({ id: sealed.id, data: sealed.data })
          return { ...giver, revealUrl: shortRevealUrl(sealed.code) }
        }),
      )
      await persist({ ...draft, participants, drawnAt: new Date().toISOString() }, reveals)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      console.error(e)
      setError(e instanceof ImpossibleDrawError
        ? 'As restrições tornam o sorteio impossível. Remova algumas e tente de novo.'
        : 'Não foi possível concluir o sorteio. Verifique sua conexão e tente de novo.')
    } finally {
      setBusy('')
    }
  }

  const back = (
    <a
      href="#/"
      className="text-sm font-semibold text-ocean-600 hover:underline"
      onClick={(e) => { if (dirty && !confirm('Há alterações não salvas. Sair mesmo assim?')) e.preventDefault() }}
    >
      ← Meus eventos
    </a>
  )

  const links: GeneratedLink[] = draft.participants
    .filter((p) => p.revealUrl)
    .map((p) => ({ participantId: p.id, name: p.name, email: p.email, url: p.revealUrl! }))

  /** Converte links longos já enviados em curtos — mesmo resultado, sem novo sorteio. */
  const shorten = async () => {
    if (!confirm('Gerar links curtos com o MESMO resultado? Os links longos que você já enviou continuam funcionando.')) return
    setBusy('save')
    setError('')
    try {
      const reveals: RevealRow[] = []
      const participants = await Promise.all(
        draft.participants.map(async (p) => {
          if (!p.revealUrl || !isLongLink(p.revealUrl)) return p
          const sealed = await sealShort(await openPayload(p.revealUrl.split('#/r/')[1]))
          reveals.push({ id: sealed.id, data: sealed.data })
          return { ...p, revealUrl: shortRevealUrl(sealed.code) }
        }),
      )
      await persist({ ...draft, participants }, reveals)
    } catch (e) {
      console.error(e)
      setError('Não foi possível gerar os links curtos. Tente de novo.')
    } finally {
      setBusy('')
    }
  }

  if (draft.drawnAt && links.length === named.length && !dirty) {
    return (
      <div className="space-y-4">
        {back}
        <ResultsPanel
          links={links}
          eventName={draft.event.name}
          drawnAt={draft.drawnAt}
          onShorten={links.some((l) => isLongLink(l.url)) ? shorten : undefined}
          shortening={busy === 'save'}
          error={error}
          onEdit={() => {
            if (!confirm('Links que você já enviou continuam mostrando o resultado ANTIGO. Se já mandou algum, não sorteie de novo. Continuar?')) return
            setDraft({ ...draft, drawnAt: null, participants: draft.participants.map(({ revealUrl: _, ...p }) => p) })
            setDirty(true)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <span className="text-xs text-slate-500">
          {dirty ? '● Alterações não salvas' : savedAt ? `✓ Salvo às ${savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
      </div>

      <Section step={1} title="O evento">
        <EventForm value={draft.event} onChange={edit('event')} />
      </Section>

      <Section
        step={2}
        title="Participantes"
        subtitle="Nome, quanto calça e dicas de presente."
        aside={<span className="rounded-full bg-ocean-500/10 px-3 py-1 text-sm font-semibold text-ocean-700">{named.length} / {MAX_PARTICIPANTS}</span>}
      >
        <ParticipantsEditor value={draft.participants} onChange={edit('participants')} duplicates={duplicates} />
      </Section>

      <Section step={3} title="Restrições (opcional)" subtitle="Ex: casais ou pessoas da mesma casa não se tiram.">
        <RestrictionsEditor participants={draft.participants} value={draft.restrictions} onChange={edit('restrictions')} />
      </Section>

      <div className="card flex flex-col items-center gap-3 text-center">
        {error && <p className="rounded-lg bg-coral-500/10 px-4 py-2 text-sm font-medium text-coral-500" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={save} disabled={!!busy || !dirty} className="btn-ghost px-6 py-3">
            {busy === 'save' ? 'Salvando…' : '💾 Salvar rascunho'}
          </button>
          <button type="button" onClick={runDraw} disabled={!!busy} className="btn-sun px-8 py-3 font-display text-xl">
            {busy === 'draw' ? 'Sorteando…' : '🎲 Sortear!'}
          </button>
        </div>
        <p className="text-xs text-slate-500">O sorteio também salva o evento e os links no seu histórico.</p>
      </div>
    </div>
  )
}
