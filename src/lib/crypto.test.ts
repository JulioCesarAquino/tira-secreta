import { describe, expect, it } from 'vitest'
import { fromBase64Url, openPayload, sealPayload, toBase64Url } from './crypto'
import type { RevealPayload } from './types'

const payload: RevealPayload = {
  v: 1,
  ev: { n: 'Natal da firma', d: '2026-12-20', b: 'R$ 50', m: 'Traga seu presente embrulhado!' },
  g: 'João',
  r: { n: 'Maria Ção', s: '37/38', t: 'Gosta de azul e de chinelo com tira fina 🩴' },
}

describe('crypto', () => {
  it('base64url ida e volta', () => {
    for (let len = 0; len < 40; len++) {
      const bytes = crypto.getRandomValues(new Uint8Array(len))
      expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes)
    }
  })

  it('selar e abrir preserva os dados (inclusive acentos e emoji)', async () => {
    const token = await sealPayload(payload)
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    expect(token).not.toContain('Maria')
    expect(await openPayload(token)).toEqual(payload)
  })

  it('cada link usa uma chave diferente', async () => {
    expect(await sealPayload(payload)).not.toBe(await sealPayload(payload))
  })

  it('rejeita token adulterado', async () => {
    const token = await sealPayload(payload)
    const [k, iv, c] = token.split('.')
    const tampered = `${k}.${iv}.${c.slice(0, -2)}${c.endsWith('A') ? 'B' : 'A'}${c.slice(-1)}`
    await expect(openPayload(tampered)).rejects.toThrow()
    await expect(openPayload('lixo')).rejects.toThrow()
  })
})
