const INSTAGRAM = 'https://www.instagram.com/juliucaezer/'

export default function Footer() {
  return (
    <footer className="mt-auto flex justify-center px-4 pb-5 pt-2">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl bg-white/75 px-5 py-2.5 text-center text-sm text-slate-600 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
      <span>© {new Date().getFullYear()} Tira Secreta</span>
      <span aria-hidden className="hidden text-slate-300 sm:inline">|</span>
      <span className="inline-flex items-center gap-2">
        Desenvolvido por Julio Cesar Aquino
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram de Julio Cesar Aquino (@juliucaezer)"
          title="@juliucaezer"
          className="text-slate-500 transition hover:text-coral-500"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
          </svg>
        </a>
      </span>
      </div>
    </footer>
  )
}
