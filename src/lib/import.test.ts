import { describe, expect, it } from 'vitest'
import { parseParticipants } from './import'

let n = 0
const id = () => `id${n++}`

describe('parseParticipants', () => {
  it('aceita ponto e vírgula, tab e vírgula; ignora cabeçalho e linhas vazias', () => {
    const text = [
      'nome;email;calçado;descrição',
      'Ana;ana@x.com;36;Gosta de rosa, tira fina',
      '',
      'Bruno\tbruno@x.com\t42\tQualquer cor',
      'Carla,,38,adora, praia',
    ].join('\n')
    const r = parseParticipants(text, id)
    expect(r.map((p) => p.name)).toEqual(['Ana', 'Bruno', 'Carla'])
    expect(r[0]).toMatchObject({ email: 'ana@x.com', size: '36', description: 'Gosta de rosa, tira fina' })
    expect(r[1]).toMatchObject({ size: '42', description: 'Qualquer cor' })
    expect(r[2]).toMatchObject({ email: '', size: '38', description: 'adora, praia' })
  })
})
