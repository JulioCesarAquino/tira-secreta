import { useState } from 'react'
import { requireSupabase } from '../lib/supabase'

const messages: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já tem conta. Entre com sua senha.',
  'Email not confirmed': 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    const auth = requireSupabase().auth
    const { data, error } =
      mode === 'login'
        ? await auth.signInWithPassword({ email, password })
        : await auth.signUp({ email, password })
    setBusy(false)
    if (error) return setError(messages[error.message] ?? error.message)
    if (mode === 'signup' && !data.session) setInfo('Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.')
  }

  return (
    <div className="mx-auto mt-4 grid max-w-4xl items-center gap-8 md:grid-cols-2">
      <div className="space-y-3 text-center md:text-left">
        <h1 className="font-display text-4xl font-extrabold text-slate-800">Amigo secreto de chinelos 🌴</h1>
        <p className="text-slate-600">
          Cadastre a turma, informe quanto cada um calça e sorteie. Cada pessoa recebe um link secreto — nem você fica sabendo quem tirou quem.
        </p>
        <ul className="space-y-1 text-sm text-slate-600">
          <li>✅ Até 200 participantes por evento</li>
          <li>✅ Restrições (ex: casais não se tiram)</li>
          <li>✅ Histórico de todos os seus eventos</li>
          <li>✅ Participantes não precisam de conta</li>
        </ul>
      </div>

      <form onSubmit={submit} className="card space-y-4">
        <h2 className="font-display text-2xl font-extrabold text-ocean-700">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Senha</label>
          <input
            id="password" type="password" required minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="input" value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-sm text-coral-500" role="alert">{error}</p>}
        {info && <p className="rounded-lg bg-ocean-500/10 px-3 py-2 text-sm text-ocean-700">{info}</p>}
        <button type="submit" disabled={busy} className="btn-sun w-full py-3">
          {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
        <p className="text-center text-sm text-slate-500">
          {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <button type="button" className="font-semibold text-ocean-600 hover:underline" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}>
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </form>
    </div>
  )
}
