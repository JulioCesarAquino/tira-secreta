import logo from '../assets/logo.svg'
import { supabase } from '../lib/supabase'

export default function Header({ email }: { email?: string }) {
  return (
    <header className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-6">
      <a href="#/" className="flex items-center gap-2 rounded-2xl bg-white/75 py-1.5 pl-2 pr-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
        <img src={logo} alt="" className="h-11 w-auto drop-shadow-sm" />
        <span className="font-display text-3xl font-extrabold leading-none text-ocean-700">
          Tira <span className="text-coral-500">Secreta</span>
        </span>
      </a>
      {email && (
        <div className="flex items-center gap-3 rounded-2xl bg-white/75 py-1.5 pl-4 pr-1.5 text-sm shadow-sm ring-1 ring-black/5 backdrop-blur-md">
          <span className="hidden text-slate-600 sm:inline">{email}</span>
          <button type="button" className="btn-ghost" onClick={() => supabase?.auth.signOut()}>Sair</button>
        </div>
      )}
    </header>
  )
}
