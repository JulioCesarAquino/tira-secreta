import { useEffect, useState } from 'react'
import logo from '../assets/logo.svg'
import { fetchReveal } from '../lib/api'
import { openPayload, openShort, shortId, SHORT_CODE_RE } from '../lib/crypto'
import type { RevealPayload } from '../lib/types'

function formatDate(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return iso
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

async function load(token?: string, shortCode?: string): Promise<RevealPayload> {
  if (token) return openPayload(token)
  if (!shortCode || !SHORT_CODE_RE.test(shortCode)) throw new Error('Link inválido')
  const data = await fetchReveal(await shortId(shortCode))
  if (!data) throw new Error('Link não encontrado')
  return openShort(shortCode, data)
}

export default function Reveal({ token, shortCode }: { token?: string; shortCode?: string }) {
  const [data, setData] = useState<RevealPayload | null>(null)
  const [failed, setFailed] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    let alive = true
    setRevealed(false)
    load(token, shortCode)
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true))
    return () => { alive = false }
  }, [token, shortCode])

  if (failed) {
    return (
      <div className="card mx-auto mt-8 max-w-md text-center">
        <p className="text-5xl">🥲</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">Link inválido</h1>
        <p className="mt-1 text-slate-600">Confira se você copiou o link inteiro e tente de novo em alguns segundos. Se continuar, peça um novo ao organizador.</p>
      </div>
    )
  }
  if (!data) return <p className="mt-16 text-center text-slate-500">Abrindo…</p>

  const { ev, g, r } = data
  return (
    <div className="mx-auto mt-4 max-w-md space-y-5 text-center">
      <div>
        {ev.n && <p className="text-sm font-semibold uppercase tracking-wide text-ocean-600">{ev.n}</p>}
        <h1 className="font-display text-3xl font-extrabold">Olá, {g}! 👋</h1>
      </div>

      {!revealed ? (
        <div className="card space-y-4">
          <img src={logo} alt="" className="mx-auto h-28 w-auto animate-bounce" />
          <p className="text-slate-600">Certifique-se de que ninguém está olhando a sua tela…</p>
          <button type="button" onClick={() => setRevealed(true)} className="btn-sun w-full py-3 font-display text-xl">
            Revelar meu amigo secreto
          </button>
        </div>
      ) : (
        <div className="card animate-[pop_.4s_ease-out] space-y-4 ring-2 ring-sun-400">
          <p className="text-sm text-slate-500">Você tirou</p>
          <p className="font-display text-4xl font-extrabold text-coral-500">{r.n}</p>
          {r.s && (
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-ocean-500/10 px-4 py-2 font-semibold text-ocean-700">
              🩴 Calça <span className="text-2xl">{r.s}</span>
            </div>
          )}
          {r.t && (
            <div className="rounded-xl bg-sand-100 p-4 text-left">
              <p className="label">Dicas</p>
              <p className="whitespace-pre-line">{r.t}</p>
            </div>
          )}
          <button type="button" onClick={() => setRevealed(false)} className="btn-ghost w-full">🙈 Esconder</button>
        </div>
      )}

      {(ev.d || ev.b || ev.m) && (
        <div className="card space-y-2 text-left text-sm">
          {ev.d && <p>📅 <b>Troca:</b> {formatDate(ev.d)}</p>}
          {ev.b && <p>💰 <b>Valor sugerido:</b> {ev.b}</p>}
          {ev.m && <p className="whitespace-pre-line">📝 {ev.m}</p>}
        </div>
      )}
      <p className="text-xs text-slate-400">Guarde este link para consultar de novo quando quiser.</p>
    </div>
  )
}
