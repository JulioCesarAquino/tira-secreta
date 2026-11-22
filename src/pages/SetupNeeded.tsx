export default function SetupNeeded() {
  return (
    <div className="card mx-auto mt-8 max-w-lg space-y-3">
      <h1 className="font-display text-2xl font-extrabold text-ocean-700">Falta configurar o banco 🛠️</h1>
      <p className="text-slate-600">
        Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> (arquivo <code>.env.local</code> em
        desenvolvimento, ou variáveis do repositório no GitHub). Veja o passo a passo no README.
      </p>
    </div>
  )
}
