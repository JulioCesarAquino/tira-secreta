import type { EventInfo } from '../lib/types'

export default function EventForm({ value, onChange }: { value: EventInfo; onChange: (v: EventInfo) => void }) {
  const set = (k: keyof EventInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value })
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="sm:col-span-3">
        <label className="label" htmlFor="ev-name">Nome do evento</label>
        <input id="ev-name" className="input" placeholder="Ex: Amigo secreto da família 2026" value={value.name} onChange={set('name')} />
      </div>
      <div>
        <label className="label" htmlFor="ev-date">Data da troca</label>
        <input id="ev-date" type="date" className="input" value={value.date} onChange={set('date')} />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="ev-budget">Valor sugerido</label>
        <input id="ev-budget" className="input" placeholder="Ex: até R$ 80" value={value.budget} onChange={set('budget')} />
      </div>
      <div className="sm:col-span-3">
        <label className="label" htmlFor="ev-msg">Recado para todos (opcional)</label>
        <textarea id="ev-msg" rows={2} className="input" placeholder="Ex: Troca no salão às 19h. Não esqueça de embrulhar!" value={value.message} onChange={set('message')} />
      </div>
    </div>
  )
}
