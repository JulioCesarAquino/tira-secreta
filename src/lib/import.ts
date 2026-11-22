import type { Participant } from './types'

/**
 * Converte texto colado (planilha, CSV) em participantes.
 * Formato por linha: nome; email; calçado; descrição
 * Separadores aceitos: tab, ponto e vírgula, ou vírgula (só se não houver os outros).
 */
export function parseParticipants(text: string, newId: () => string): Participant[] {
  const out: Participant[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ','
    const [name = '', email = '', size = '', ...rest] = line.split(sep).map((s) => s.trim())
    if (!name || /^nome$/i.test(name)) continue // ignora linha de cabeçalho
    out.push({ id: newId(), name, email, size, description: rest.join(sep === ',' ? ', ' : ' ').trim() })
  }
  return out
}
