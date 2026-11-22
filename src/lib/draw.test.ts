import { describe, expect, it } from 'vitest'
import { drawPairs, ImpossibleDrawError } from './draw'

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`)

function expectValid(ids: string[], result: Map<string, string>, forbidden: [string, string][] = []) {
  expect(result.size).toBe(ids.length)
  expect(new Set(result.values()).size).toBe(ids.length)
  for (const [giver, receiver] of result) {
    expect(giver).not.toBe(receiver)
    expect(ids).toContain(receiver)
  }
  for (const [a, b] of forbidden) expect(result.get(a)).not.toBe(b)
}

describe('drawPairs', () => {
  it('ninguém tira a si mesmo e todos recebem exatamente uma vez', () => {
    for (const n of [2, 3, 5, 20, 200]) {
      const ids = people(n)
      for (let i = 0; i < 50; i++) expectValid(ids, drawPairs(ids))
    }
  })

  it('sem restrições forma um único ciclo', () => {
    const ids = people(30)
    const result = drawPairs(ids)
    let cur = ids[0]
    const seen = new Set<string>()
    while (!seen.has(cur)) {
      seen.add(cur)
      cur = result.get(cur)!
    }
    expect(seen.size).toBe(30)
  })

  it('respeita restrições', () => {
    const ids = people(6)
    const forbidden: [string, string][] = [
      ['p0', 'p1'], ['p1', 'p0'],
      ['p2', 'p3'], ['p3', 'p2'],
      ['p4', 'p5'], ['p5', 'p4'],
    ]
    for (let i = 0; i < 200; i++) expectValid(ids, drawPairs(ids, forbidden), forbidden)
  })

  it('encontra solução mesmo quando um ciclo único é raro (cai no emparelhamento)', () => {
    const ids = people(8)
    // p0 só pode tirar p1; restrições pesadas
    const forbidden: [string, string][] = ids.filter((x) => x !== 'p1' && x !== 'p0').map((x) => ['p0', x])
    for (let i = 0; i < 100; i++) {
      const r = drawPairs(ids, forbidden)
      expectValid(ids, r, forbidden)
      expect(r.get('p0')).toBe('p1')
    }
  })

  it('lança erro quando é impossível', () => {
    const ids = people(3)
    const forbidden: [string, string][] = [['p0', 'p1'], ['p0', 'p2']]
    expect(() => drawPairs(ids, forbidden)).toThrow(ImpossibleDrawError)
  })

  it('exige ao menos 2 participantes', () => {
    expect(() => drawPairs(['a'])).toThrow(ImpossibleDrawError)
  })
})
