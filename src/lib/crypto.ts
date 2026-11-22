import type { RevealPayload } from './types'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function importKey(raw: Uint8Array, usage: KeyUsage) {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage])
}

/**
 * Criptografa o resultado com uma chave aleatória exclusiva deste link.
 * O token fica no fragmento (#) da URL, que o navegador nunca envia ao
 * servidor — o GitHub não vê nada. Serve para o organizador não enxergar
 * o resultado só de olhar o link; quem abrir o link, vê.
 */
export async function sealPayload(payload: RevealPayload): Promise<string> {
  const keyBytes = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await importKey(keyBytes, 'encrypt')
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  )
  return [keyBytes, iv, new Uint8Array(cipher)].map(toBase64Url).join('.')
}

export async function openPayload(token: string): Promise<RevealPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Link inválido')
  const [keyBytes, iv, cipher] = parts.map(fromBase64Url)
  const key = await importKey(keyBytes, 'decrypt')
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  const data = JSON.parse(decoder.decode(plain)) as RevealPayload
  if (data?.v !== 1 || !data.r?.n) throw new Error('Link inválido')
  return data
}
