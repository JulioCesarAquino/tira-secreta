import type { ReactNode } from 'react'

export default function Section({ step, title, subtitle, children, aside }: {
  step: number
  title: string
  subtitle?: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sun-400 font-display text-lg font-extrabold">{step}</span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-ocean-700">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}
