export interface EventInfo {
  name: string
  date: string
  budget: string
  message: string
}

export interface Participant {
  id: string
  name: string
  email: string
  /** Número que a pessoa calça, ex: "38" ou "37/38" */
  size: string
  /** Dicas de presente, cores preferidas etc. */
  description: string
  /** Preenchido após o sorteio */
  revealUrl?: string
}

/** `from` não pode tirar `to` */
export interface Restriction {
  id: string
  from: string
  to: string
}

/** Evento completo como é editado na tela e salvo no banco. */
export interface EventDraft {
  id?: string
  event: EventInfo
  participants: Participant[]
  restrictions: Restriction[]
  drawnAt: string | null
}

export interface EventSummary {
  id: string
  name: string
  date: string
  drawnAt: string | null
  createdAt: string
  participantCount: number
}

export interface GeneratedLink {
  participantId: string
  name: string
  email: string
  url: string
}

/** Conteúdo criptografado dentro de cada link. Chaves curtas = link menor. */
export interface RevealPayload {
  v: 1
  ev: { n: string; d: string; b: string; m: string }
  g: string
  r: { n: string; s: string; t: string }
}
