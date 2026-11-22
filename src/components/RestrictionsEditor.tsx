import { useState } from 'react'
import type { Participant, Restriction } from '../lib/types'

export default function RestrictionsEditor({ participants, value, onChange }: {
  participants: Participant[]
  value: Restriction[]
  onChange: (v: Restriction[]) => void
}) {
  const named = participants.filter((p) => p.name.trim())
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [mutual, setMutual] = useState(true)
  const nameOf = (id: string) => named.find((p) => p.id === id)?.name ?? '?'

  const exists = (a: string, b: string) => value.some((r) => r.from === a && r.to === b)
  const add = () => {
    if (!from || !to || from === to) return
    const next = [...value]
    if (!exists(from, to)) next.push({ id: crypto.randomUUID(), from, to })
    if (mutual && !exists(to, from)) next.push({ id: crypto.randomUUID(), from: to, to: from })
    onChange(next)
    setFrom('')
    setTo('')
  }

  const visible = value.filter((r) => named.some((p) => p.id === r.from) && named.some((p) => p.id === r.to))

  if (named.length < 2) return <p className="text-sm text-slate-500">Adicione participantes para criar restrições.</p>

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="r-from">Quem</label>
          <select id="r-from" className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Selecione…</option>
            {named.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <span className="pb-2 text-sm font-semibold text-slate-500">não pode tirar</span>
        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="r-to">Quem</label>
          <select id="r-to" className="input" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Selecione…</option>
            {named.filter((p) => p.id !== from).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={mutual} onChange={(e) => setMutual(e.target.checked)} />
          e vice-versa
        </label>
        <button type="button" onClick={add} disabled={!from || !to} className="btn-primary">Adicionar</button>
      </div>

      {visible.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {visible.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-full bg-coral-500/10 py-1 pl-3 pr-1 text-sm">
              <span><b>{nameOf(r.from)}</b> ✕ <b>{nameOf(r.to)}</b></span>
              <button type="button" onClick={() => onChange(value.filter((x) => x.id !== r.id))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-coral-500/20" aria-label="Remover restrição">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
