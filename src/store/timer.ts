import { create } from 'zustand'
import type { FaseTimer, TimerConfig } from '../types'
import { fmtSecs, playAlert, flashTitle } from '../lib/constants'

interface TimerState {
  phase: FaseTimer
  secsLeft: number
  secsMax: number
  secsElapsed: number
  endAt: number | null   // timestamp (ms) when current phase ends
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
  endAt: null,
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
    const { phase, config, intervalId, secsLeft } = get()
    if (intervalId) clearInterval(intervalId)

    if (phase === 'idle' || phase === 'done') {
      const secs = config.duracaoMin * 60
      const endAt = Date.now() + secs * 1000
      set({ phase: 'study', secsLeft: secs, secsMax: secs, secsElapsed: 0, endAt })
    } else if (phase === 'paused') {
      const endAt = Date.now() + secsLeft * 1000
      set({ phase: 'study', endAt })
    } else if (phase === 'break-idle') {
      const secs = config.pausaMin * 60
      const endAt = Date.now() + secs * 1000
      set({ phase: 'break', secsLeft: secs, secsMax: secs, endAt })
    } else return

    const id = setInterval(() => get()._tick(), 1000)
    set({ intervalId: id })
  },

  pause: () => {
    const { intervalId, endAt, secsMax } = get()
    if (intervalId) clearInterval(intervalId)
    const secsLeft = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : get().secsLeft
    set({ phase: 'paused', intervalId: null, endAt: null, secsLeft, secsElapsed: secsMax - secsLeft })
  },

  reset: () => {
    const { intervalId, config } = get()
    if (intervalId) clearInterval(intervalId)
    const secs = config.duracaoMin * 60
    set({ phase: 'idle', secsLeft: secs, secsMax: secs, secsElapsed: 0, intervalId: null, endAt: null })
  },

  saveEarly: () => {
    const { intervalId, config, endAt, secsMax, secsLeft: stored } = get()
    if (intervalId) clearInterval(intervalId)
    const secsLeft = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : stored
    const elapsedMin = Math.max(1, Math.round((secsMax - secsLeft) / 60))
    const secs = config.duracaoMin * 60
    set({ phase: 'idle', secsLeft: secs, secsMax: secs, secsElapsed: 0, intervalId: null, endAt: null })
    return { config, elapsedMin }
  },

  startBreak: () => {
    const { intervalId, config } = get()
    if (intervalId) clearInterval(intervalId)
    const secs = config.pausaMin * 60
    const endAt = Date.now() + secs * 1000
    const id = setInterval(() => get()._tick(), 1000)
    set({ phase: 'break', secsLeft: secs, secsMax: secs, endAt, intervalId: id })
  },

  _tick: () => {
    const { endAt, secsMax, phase, intervalId, onStudyEnd, onBreakEnd } = get()
    if (!endAt) return
    const newSecsLeft = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
    if (phase === 'study') {
      set({ secsLeft: newSecsLeft, secsElapsed: secsMax - newSecsLeft })
    } else {
      set({ secsLeft: newSecsLeft })
    }
    if (newSecsLeft <= 0) {
      if (intervalId) clearInterval(intervalId)
      set({ intervalId: null, endAt: null })
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
