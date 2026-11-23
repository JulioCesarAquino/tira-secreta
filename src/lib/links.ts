import type { GeneratedLink } from './types'

/** Link longo (legado): o resultado vai inteiro dentro do link. */
export function revealUrl(token: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/r/${token}`
}

/** Link curto: só o código; o conteúdo cifrado fica no banco. */
export function shortRevealUrl(code: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/s/${code}`
}

export const isLongLink = (url: string) => url.includes('#/r/')

export function mailtoHref(link: GeneratedLink, eventName: string): string {
  const subject = `🩴 Seu amigo secreto${eventName ? ` – ${eventName}` : ''}`
  const body =
    `Olá, ${link.name}!\n\n` +
    `O sorteio do amigo secreto${eventName ? ` "${eventName}"` : ''} foi feito.\n` +
    `Abra o link abaixo para descobrir quem você tirou (não compartilhe!):\n\n` +
    `${link.url}\n`
  return `mailto:${encodeURIComponent(link.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function linksAsText(links: GeneratedLink[]): string {
  return links.map((l) => `${l.name}: ${l.url}`).join('\n')
}

/** CSV com ; e BOM — abre direto no Excel em português, útil para mala direta. */
export function downloadCsv(links: GeneratedLink[], filename: string) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const rows = [['nome', 'email', 'link'], ...links.map((l) => [l.name, l.email, l.url])]
  const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
