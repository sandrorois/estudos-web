import { useEffect, useRef } from 'react'
import { useTimer } from '../store/timer'
import { fmtSecs } from '../lib/constants'

const DEFAULT_TITLE = 'Plano de Aprovação'
const DEFAULT_FAVICON = '/favicon.svg'

function buildFavicon(bgColor: string, shape: 'play' | 'pause' | 'alert'): string {
  let inner: string
  if (shape === 'play') {
    inner = '<polygon points="12,10 24,16 12,22" fill="white"/>'
  } else if (shape === 'pause') {
    inner = '<rect x="10" y="10" width="4" height="12" rx="1.5" fill="white"/><rect x="18" y="10" width="4" height="12" rx="1.5" fill="white"/>'
  } else {
    inner = '<rect x="14" y="8" width="4" height="10" rx="2" fill="white"/><circle cx="16" cy="23" r="2.5" fill="white"/>'
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="${bgColor}"/>${inner}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const FAVICONS = {
  study: buildFavicon('#4F7CFF', 'play'),
  break: buildFavicon('#22C97A', 'play'),
  paused: buildFavicon('#F59E0B', 'pause'),
  done: buildFavicon('#EF4444', 'alert'),
}

function setFavicon(href: string) {
  const el = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (el) el.href = href
}

function setThemeColor(color: string) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = color
}

export function useTimerPageStatus() {
  const phase = useTimer(s => s.phase)
  const secsLeft = useTimer(s => s.secsLeft)
  const flashId = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopFlash() {
    if (flashId.current != null) {
      clearInterval(flashId.current)
      flashId.current = null
    }
  }

  useEffect(() => {
    stopFlash()

    switch (phase) {
      case 'study':
        document.title = `Estudando · ${fmtSecs(secsLeft)}`
        setFavicon(FAVICONS.study)
        setThemeColor('#4F7CFF')
        break

      case 'break':
        document.title = `Pausa · ${fmtSecs(secsLeft)}`
        setFavicon(FAVICONS.break)
        setThemeColor('#22C97A')
        break

      case 'paused':
        document.title = `Pausado · ${fmtSecs(secsLeft)}`
        setFavicon(FAVICONS.paused)
        setThemeColor('#F59E0B')
        break

      case 'break-idle':
      case 'done': {
        const label = 'Tempo esgotado'
        setFavicon(FAVICONS.done)
        setThemeColor('#EF4444')
        // Flash for ~20s (40 ticks × 500ms), then hold
        let ticks = 0
        flashId.current = setInterval(() => {
          document.title = ticks++ % 2 === 0 ? label : DEFAULT_TITLE
          if (ticks >= 40) {
            stopFlash()
            document.title = label
          }
        }, 500)
        break
      }

      default: // idle
        document.title = DEFAULT_TITLE
        setFavicon(DEFAULT_FAVICON)
        setThemeColor('#0C0F19')
    }

    return stopFlash
  }, [phase, secsLeft])

  // Restore on unmount
  useEffect(() => {
    return () => {
      stopFlash()
      document.title = DEFAULT_TITLE
      setFavicon(DEFAULT_FAVICON)
      setThemeColor('#0C0F19')
    }
  }, [])
}
