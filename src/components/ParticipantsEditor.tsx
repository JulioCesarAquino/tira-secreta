import { useState } from 'react'
import { MAX_PARTICIPANTS } from '../lib/config'
import { parseParticipants } from '../lib/import'
import type { Participant } from '../lib/types'

const newId = () => crypto.randomUUID()
export const emptyParticipant = (): Participant => ({ id: newId(), name: '', email: '', size: '', description: '' })

export default function ParticipantsEditor({ value, onChange, duplicates }: {
  value: Participant[]
  onChange: (v: Participant[]) => void
  duplicates: Set<string>
}) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const full = value.length >= MAX_PARTICIPANTS

  const update = (id: string, patch: Partial<Participant>) =>
    onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => onChange(value.filter((p) => p.id !== id))
  const add = () => !full && onChange([...value, emptyParticipant()])

  const doImport = () => {
    const parsed = parseParticipants(importText, newId)
    const keep = value.filter((p) => p.name.trim())
    onChange([...keep, ...parsed].slice(0, MAX_PARTICIPANTS))
    setImportText('')
    setImportOpen(false)
  }

  return (
    <div className="space-y-3">
      {value.map((p, i) => {
        const dup = duplicates.has(p.name.trim().toLowerCase())
        return (
          <div key={p.id} className="grid grid-cols-12 gap-2 rounded-xl bg-sand-50 p-3 ring-1 ring-sand-200">
            <span className="col-span-12 text-xs font-semibold text-slate-400 sm:hidden">#{i + 1}</span>
            <input
              aria-label="Nome"
              className={`input col-span-12 sm:col-span-3 ${dup ? 'border-coral-500 ring-2 ring-coral-500/20' : ''}`}
              placeholder="Nome *"
              value={p.name}
              onChange={(e) => update(p.id, { name: e.target.value })}
            />
            <input
              aria-label="E-mail"
              type="email"
              className="input col-span-8 sm:col-span-3"
              placeholder="E-mail (opcional)"
              value={p.email}
              onChange={(e) => update(p.id, { email: e.target.value })}
            />
            <input
              aria-label="Número que calça"
              className="input col-span-4 sm:col-span-1"
              placeholder="Nº"
              inputMode="numeric"
              value={p.size}
              onChange={(e) => update(p.id, { size: e.target.value })}
            />
            <input
              aria-label="Descrição"
              className="input col-span-10 sm:col-span-4"
              placeholder="Dicas: cor, estilo, o que gosta…"
              value={p.description}
              onChange={(e) => update(p.id, { description: e.target.value })}
            />
            <button type="button" onClick={() => remove(p.id)} className="btn-danger col-span-2 sm:col-span-1 !px-2" aria-label={`Remover ${p.name || 'participante'}`}>
              ✕
            </button>
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={add} disabled={full} className="btn-sun">+ Adicionar pessoa</button>
        <button type="button" onClick={() => setImportOpen((o) => !o)} className="btn-ghost">📋 Colar lista</button>
        {full && <span className="self-center text-sm text-coral-500">Limite de {MAX_PARTICIPANTS} participantes.</span>}
      </div>

      {importOpen && (
        <div className="space-y-2 rounded-xl border border-dashed border-ocean-500/40 p-3">
          <p className="text-sm text-slate-600">
            Cole uma linha por pessoa (pode copiar direto do Excel/Google Planilhas):<br />
            <code className="text-xs">nome ; email ; nº que calça ; descrição</code>
          </p>
          <textarea
            rows={6}
            className="input font-mono"
            placeholder={'Ana;ana@email.com;36;Gosta de rosa\nBruno;bruno@email.com;42;Qualquer cor'}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button type="button" onClick={doImport} disabled={!importText.trim()} className="btn-primary">Importar</button>
        </div>
      )}
    </div>
  )
}
