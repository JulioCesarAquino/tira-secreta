import { useEffect, useState } from 'react'

export type Route =
  | { name: 'dashboard' }
  | { name: 'event'; id?: string }
  | { name: 'reveal'; token: string }

function parse(hash: string): Route {
  let m = hash.match(/^#\/r\/(.+)$/)
  if (m) return { name: 'reveal', token: m[1] }
  if (hash === '#/e/new') return { name: 'event' }
  m = hash.match(/^#\/e\/([0-9a-f-]{36})$/i)
  if (m) return { name: 'event', id: m[1] }
  return { name: 'dashboard' }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const navigate = (hash: string) => { window.location.hash = hash }
