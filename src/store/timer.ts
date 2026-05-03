import { create } from 'zustand'
import type { FaseTimer, TimerConfig } from '../types'
import { fmtSecs, playAlert, flashTitle } from '../lib/constants'

interface TimerState {
  phase: FaseTimer
  secsLeft: number
  secsMax: number
  secsElapsed: number
  config: TimerConfig
  intervalId: ReturnType<typeof setInterval> | null
  // callbacks set by TimerPage
  onStudyEnd: (() => void) | null
  onBreakEnd: (() => void) | null

  setConfig: (patch: Partial<TimerConfig>) => void
  setCallbacks: (onStudy: () => void, onBreak: () => void) => void
  start: () => void
  pause: () => void
  reset: () => void
  saveEarly: () => { config: TimerConfig; elapsedMin: number }
  startBreak: () => void
  _tick: () => void
  display: () => string
  ringOffset: () => number  // 0–502.7 (SVG circumference)
}

const CIRC = 502.7

const DEF: TimerConfig = {
  tipo: 'base', matId: null, cttId: null,
  materia: '', conteudo: '', questoes: false,
  duracaoMin: 25, pausaMin: 5,
}

export const useTimer = create<TimerState>((set, get) => ({
  phase: 'idle',
  secsLeft: DEF.duracaoMin * 60,
  secsMax: DEF.duracaoMin * 60,
  secsElapsed: 0,
  config: DEF,
  intervalId: null,
  onStudyEnd: null,
  onBreakEnd: null,

  setConfig: (patch) => {
    set(s => {
      const next = { ...s.config, ...patch }
      const idle = s.phase === 'idle' || s.phase === 'done'
      return {
        config: next,
        secsLeft: idle ? next.duracaoMin * 60 : s.secsLeft,
        secsMax: idle ? next.duracaoMin * 60 : s.secsMax,
      }
    })
  },

  setCallbacks: (onStudyEnd, onBreakEnd) => set({ onStudyEnd, onBreakEnd }),

  start: () => {
    const { phase, config, intervalId } = get()
    if (intervalId) clearInterval(intervalId)

    if (phase === 'idle' || phase === 'done') {
      const secs = config.duracaoMin * 60
      set({ phase: 'study', secsLeft: secs, secsMax: secs, secsElapsed: 0 })
    } else if (phase === 'paused') {
      set({ phase: 'study' })
    } else if (phase === 'break-idle') {
      const secs = config.pausaMin * 60
      set({ phase: 'break', secsLeft: secs, secsMax: secs })
    } else return

    const id = setInterval(() => get()._tick(), 1000)
    set({ intervalId: id })
  },

  pause: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ phase: 'paused', intervalId: null })
  },

  reset: () => {
    const { intervalId, config } = get()
    if (intervalId) clearInterval(intervalId)
    const secs = config.duracaoMin * 60
    set({ phase: 'idle', secsLeft: secs, secsMax: secs, secsElapsed: 0, intervalId: null })
  },

  saveEarly: () => {
    const { intervalId, config, secsElapsed } = get()
    if (intervalId) clearInterval(intervalId)
    const elapsedMin = Math.max(1, Math.round(secsElapsed / 60))
    const secs = config.duracaoMin * 60
    set({ phase: 'idle', secsLeft: secs, secsMax: secs, secsElapsed: 0, intervalId: null })
    return { config, elapsedMin }
  },

  startBreak: () => {
    const { intervalId, config } = get()
    if (intervalId) clearInterval(intervalId)
    const secs = config.pausaMin * 60
    const id = setInterval(() => get()._tick(), 1000)
    set({ phase: 'break', secsLeft: secs, secsMax: secs, intervalId: id })
  },

  _tick: () => {
    const { secsLeft, phase, intervalId, onStudyEnd, onBreakEnd } = get()
    const next = secsLeft - 1
    if (phase === 'study') {
      set(s => ({ secsLeft: next, secsElapsed: s.secsElapsed + 1 }))
    } else {
      set({ secsLeft: next })
    }
    if (next <= 0) {
      if (intervalId) clearInterval(intervalId)
      set({ intervalId: null })
      playAlert(phase === 'break')
      flashTitle()
      if (phase === 'study') {
        set({ phase: 'break-idle' })
        onStudyEnd?.()
      } else if (phase === 'break') {
        set({ phase: 'done' })
        onBreakEnd?.()
      }
    }
  },

  display: () => fmtSecs(get().secsLeft),
  ringOffset: () => {
    const { secsLeft, secsMax } = get()
    return CIRC * (1 - secsLeft / Math.max(1, secsMax))
  },
}))
