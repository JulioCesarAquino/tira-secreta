import { useState } from 'react'
import { requireSupabase } from '../lib/supabase'

const messages: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já tem conta. Entre com sua senha.',
  'Email not confirmed': 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
}

type IconName = 'wave' | 'users' | 'shuffle' | 'history' | 'link'

const features: { icon: IconName; title: string; text: string; tone: string }[] = [
  { icon: 'users', title: 'Até 200 pessoas', text: 'Da família inteira à empresa toda', tone: 'bg-ocean-500/15 text-ocean-700' },
  { icon: 'shuffle', title: 'Restrições', text: 'Casais e vizinhos não se tiram', tone: 'bg-coral-500/15 text-coral-500' },
  { icon: 'history', title: 'Histórico salvo', text: 'Todos os seus eventos num só lugar', tone: 'bg-sun-400/30 text-amber-700' },
  { icon: 'link', title: 'Sem cadastro', text: 'Participantes só abrem o link', tone: 'bg-teal-500/15 text-teal-700' },
]

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, JSX.Element> = {
    wave: <path d="M2 12c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0M2 17c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0M2 7c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.6.8 2.6 2.6 3 5.2" /></>,
    shuffle: <path d="M3 7h3.5c4 0 6 10 10 10H21m0 0-3-3m3 3-3 3M3 17h3.5c1.3 0 2.4-1 3.4-2.4M14 9.4c.9-1.4 1.9-2.4 3.5-2.4H21m0 0-3-3m3 3-3 3" />,
    history: <><path d="M3 12a9 9 0 1 0 2.7-6.4L3 8" /><path d="M3 3v5h5M12 7v5l3.5 2" /></>,
    link: <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  )
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
    <div className="mx-auto mt-2 grid max-w-4xl items-center gap-6 md:mt-6 md:grid-cols-[1.15fr_1fr] md:gap-8">
      <div className="space-y-5 rounded-3xl bg-white/60 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-md sm:p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-ocean-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ocean-700">
            <Icon name="wave" className="h-4 w-4" /> Amigo secreto
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-slate-800 sm:text-5xl">
            Troca de chinelos <span className="text-coral-500">sem spoiler</span>
          </h1>
          <p className="text-slate-600">
            Cadastre a turma, informe quanto cada um calça e sorteie. Cada pessoa recebe um link secreto — nem você fica sabendo quem tirou quem.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <li key={f.title} className="flex items-start gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-black/5">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${f.tone}`}>
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-800">{f.title}</span>
                <span className="block text-xs leading-snug text-slate-500">{f.text}</span>
              </span>
            </li>
          ))}
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
