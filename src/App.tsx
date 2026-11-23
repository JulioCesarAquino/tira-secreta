import Footer from './components/Footer'
import Header from './components/Header'
import { useHashRoute } from './hooks/useHashRoute'
import { useSession } from './hooks/useSession'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import EventEditor from './pages/EventEditor'
import Login from './pages/Login'
import Reveal from './pages/Reveal'
import SetupNeeded from './pages/SetupNeeded'

export default function App() {
  const route = useHashRoute()
  const session = useSession()
  const isReveal = route.name === 'reveal' || route.name === 'short'

  let content
  if (route.name === 'reveal') content = <Reveal key={route.token} token={route.token} />
  else if (route.name === 'short') content = <Reveal key={route.code} shortCode={route.code} />
  else if (!supabase) content = <SetupNeeded />
  else if (session === undefined) content = <p className="mt-16 text-center text-slate-500">Carregando…</p>
  else if (!session) content = <Login />
  else if (route.name === 'event') content = <EventEditor key={route.id ?? 'new'} id={route.id} />
  else content = <Dashboard />

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-100 via-sand-50 to-white text-slate-800">
      <Header email={!isReveal ? session?.user.email : undefined} />
      <main className="mx-auto w-full max-w-4xl px-4 pb-16">{content}</main>
      <Footer />
    </div>
  )
}
