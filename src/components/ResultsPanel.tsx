import CopyButton from './CopyButton'
import { downloadCsv, linksAsText, mailtoHref } from '../lib/links'
import type { GeneratedLink } from '../lib/types'

export default function ResultsPanel({ links, eventName, drawnAt, onEdit, onShorten, shortening, error }: {
  links: GeneratedLink[]
  eventName: string
  drawnAt: string
  onEdit: () => void
  /** Presente quando há links longos (sorteios antigos) que podem ser encurtados */
  onShorten?: () => void
  shortening?: boolean
  error?: string
}) {
  const withEmail = links.filter((l) => l.email).length
  return (
    <section className="card space-y-4 ring-2 ring-sun-400">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-ocean-700">🎉 {eventName || 'Sorteio feito!'}</h2>
        <p className="mb-2 text-xs text-slate-500">Sorteado em {new Date(drawnAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · salvo no seu histórico</p>
        <p className="text-sm text-slate-600">
          Ninguém viu o resultado — nem você. Envie a cada pessoa <b>o link dela</b>. Quem abrir um link verá o amigo secreto daquela pessoa, então não abra os links dos outros. 😉
        </p>
      </div>

      {onShorten && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sun-400/20 p-4">
          <p className="text-sm text-slate-700">
            <b>Links muito longos?</b> Gere versões curtas com o <b>mesmo resultado</b>, sem sortear de novo. Os links antigos continuam funcionando.
          </p>
          <button type="button" className="btn-sun" onClick={onShorten} disabled={shortening}>
            {shortening ? 'Gerando…' : '✂️ Gerar links curtos'}
          </button>
        </div>
      )}
      {error && <p className="rounded-lg bg-coral-500/10 px-4 py-2 text-sm text-coral-500" role="alert">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <CopyButton text={linksAsText(links)} label="📋 Copiar todos (nome: link)" className="btn-primary" />
        <button type="button" className="btn-ghost" onClick={() => downloadCsv(links, `tira-secreta-${(eventName || 'sorteio').replace(/\W+/g, '-').toLowerCase()}.csv`)}>
          ⬇️ Baixar planilha (CSV)
        </button>
      </div>
      {withEmail > 0 && (
        <p className="text-xs text-slate-500">
          Dica: com a planilha dá para fazer mala direta (Gmail + Google Planilhas, Outlook/Word) e enviar todos os e-mails de uma vez.
        </p>
      )}

      <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
        {links.map((l) => (
          <li key={l.participantId} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="font-semibold">{l.name}</p>
              {l.email && <p className="truncate text-xs text-slate-500">{l.email}</p>}
            </div>
            <div className="flex gap-2">
              <CopyButton text={l.url} label="Copiar link" />
              {l.email ? (
                <a className="btn-ghost" href={mailtoHref(l, eventName)}>✉️ E-mail</a>
              ) : (
                <span className="btn-ghost pointer-events-none opacity-40" title="Sem e-mail cadastrado">✉️ E-mail</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button type="button" className="btn-ghost" onClick={onEdit}>✏️ Editar e sortear de novo</button>
      </div>
    </section>
  )
}
