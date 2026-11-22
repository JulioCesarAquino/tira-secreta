import { webcrypto } from 'node:crypto'

// Node 18 não expõe WebCrypto em globalThis por padrão
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
}
