export class ImpossibleDrawError extends Error {
  constructor(message = 'Não é possível sortear com essas restrições.') {
    super(message)
    this.name = 'ImpossibleDrawError'
  }
}

type Rng = () => number

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Sorteia quem tira quem.
 *
 * 1. Tenta formar um único ciclo aleatório (A→B→C→…→A), o formato mais
 *    "bonito" para amigo secreto. Sem restrições, funciona de primeira.
 * 2. Se as restrições impedirem, cai para um emparelhamento bipartido
 *    (algoritmo de Kuhn) com ordem aleatória — polinomial e garante achar
 *    uma solução sempre que ela existir.
 *
 * @param ids        participantes
 * @param forbidden  pares [quem, quemNãoPodeTirar]
 * @returns          Map de quem tira → quem é tirado
 */
export function drawPairs(
  ids: readonly string[],
  forbidden: Iterable<readonly [string, string]> = [],
  rng: Rng = Math.random,
): Map<string, string> {
  const n = ids.length
  if (n < 2) throw new ImpossibleDrawError('São necessários pelo menos 2 participantes.')
  if (new Set(ids).size !== n) throw new Error('Participantes duplicados.')

  const blocked = new Set<string>()
  for (const [a, b] of forbidden) blocked.add(`${a}\u0000${b}`)
  const allowed = (a: string, b: string) => a !== b && !blocked.has(`${a}\u0000${b}`)

  for (let attempt = 0; attempt < 500; attempt++) {
    const order = shuffle(ids, rng)
    let ok = true
    for (let i = 0; i < n && ok; i++) ok = allowed(order[i], order[(i + 1) % n])
    if (ok) {
      const result = new Map<string, string>()
      for (let i = 0; i < n; i++) result.set(order[i], order[(i + 1) % n])
      return result
    }
  }

  // Emparelhamento bipartido: givers (índice) → receivers (índice)
  const adj = ids.map((a) =>
    shuffle(
      ids.map((_, j) => j).filter((j) => allowed(a, ids[j])),
      rng,
    ),
  )
  const receiverOwner = new Array<number>(n).fill(-1)

  const tryAssign = (giver: number, seen: boolean[]): boolean => {
    for (const r of adj[giver]) {
      if (seen[r]) continue
      seen[r] = true
      if (receiverOwner[r] === -1 || tryAssign(receiverOwner[r], seen)) {
        receiverOwner[r] = giver
        return true
      }
    }
    return false
  }

  for (const giver of shuffle(ids.map((_, i) => i), rng)) {
    if (!tryAssign(giver, new Array<boolean>(n).fill(false))) throw new ImpossibleDrawError()
  }

  const result = new Map<string, string>()
  receiverOwner.forEach((giver, receiver) => result.set(ids[giver], ids[receiver]))
  return result
}
