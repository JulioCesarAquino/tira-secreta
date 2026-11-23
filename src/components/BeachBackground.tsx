import landscape1600 from '../assets/bg/beach-landscape-1600.webp'
import landscape2400 from '../assets/bg/beach-landscape-2400.webp'
import portrait800 from '../assets/bg/beach-portrait-800.webp'
import portrait1131 from '../assets/bg/beach-portrait-1131.webp'

/**
 * Fundo de praia fixo atrás do conteúdo.
 * Tela deitada (computador): ilustração girada, com o mar nas laterais.
 * Tela em pé (celular): ilustração original, com o mar em cima e embaixo.
 */
export default function BeachBackground() {
  return (
    <picture aria-hidden>
      <source
        media="(orientation: landscape)"
        type="image/webp"
        srcSet={`${landscape1600} 1600w, ${landscape2400} 2400w`}
        sizes="100vw"
      />
      <img
        src={portrait1131}
        srcSet={`${portrait800} 800w, ${portrait1131} 1131w`}
        sizes="100vw"
        alt=""
        decoding="async"
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full select-none object-cover"
      />
    </picture>
  )
}
