import { useState } from 'react'

export default function CopyButton({ text, label = 'Copiar', className = 'btn-ghost' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      window.prompt('Copie o texto:', text)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? '✓ Copiado' : label}
    </button>
  )
}
