import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEF_MATERIAS, DEF_SEMANA, today, monthPfx } from '../lib/constants'
import type { Materia, SlotSemana, Sessao, ErroRegistrado, StatusConteudo, Conteudo } from '../types'

interface AppState {
  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void

  // Auth (user id — set by auth listener)
  userId: string | null
  setUserId: (id: string | null) => void

  // Matérias
  materias: Materia[]
  setMaterias: (m: Materia[]) => void
  addMateria: (m: Materia) => void
  updateMateria: (id: number, patch: Partial<Materia>) => void
  deleteMateria: (id: number) => void
  addConteudo: (matId: number, c: Conteudo) => void
  updateConteudo: (matId: number, cId: number, patch: Partial<Conteudo>) => void
  deleteConteudo: (matId: number, cId: number) => void
  cycleStatus: (matId: number, cId: number) => void

  // Semana
  slots: SlotSemana[]
  setSlots: (s: SlotSemana[]) => void
  addSlot: (s: SlotSemana) => void
  updateSlot: (id: number, patch: Partial<SlotSemana>) => void
  deleteSlot: (id: number) => void
  cycleSlotStatus: (id: number) => void
  resetSemana: () => void

  // Sessões
  sessoes: Sessao[]
  setSessoes: (s: Sessao[]) => void
  addSessao: (s: Sessao) => void
  updateSessao: (id: number, patch: Partial<Sessao>) => void
  deleteSessao: (id: number) => void

  // Erros
  erros: ErroRegistrado[]
  setErros: (e: ErroRegistrado[]) => void
  addErro: (e: ErroRegistrado) => void
  updateErro: (id: number, patch: Partial<ErroRegistrado>) => void
  deleteErro: (id: number) => void

  // Day plans (local only — key: date string)
  dayPlans: Record<string, { nota: string; metaH: number }>
  setDayPlan: (date: string, plan: { nota: string; metaH: number }) => void

  // Timer pending session (for obs/questoes flow)
  pendingSessId: number | null
  setPendingSessId: (id: number | null) => void

  // Helpers
  getMateria: (id: number | null) => Materia | undefined
  getConteudo: (matId: number | null, cttId: number | null) => Conteudo | undefined
  todaySessoes: () => Sessao[]
  cttDoneMin: (matId: number, cttId: number, pfx?: string) => number
  cttQuestoes: (matId: number, cttId: number, pfx?: string) => number
  matQuestoes: (matId: number, pfx?: string) => number
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('light', next === 'light')
      },

      // Auth
      userId: null,
      setUserId: (userId) => set({ userId }),

      // Matérias
      materias: DEF_MATERIAS,
      setMaterias: (materias) => set({ materias }),
      addMateria: (m) => set(s => ({ materias: [...s.materias, m] })),
      updateMateria: (id, patch) => set(s => ({
        materias: s.materias.map(m => m.id === id ? { ...m, ...patch } : m)
      })),
      deleteMateria: (id) => set(s => ({ materias: s.materias.filter(m => m.id !== id) })),
      addConteudo: (matId, c) => set(s => ({
        materias: s.materias.map(m => m.id === matId ? { ...m, conteudos: [...m.conteudos, c] } : m)
      })),
      updateConteudo: (matId, cId, patch) => set(s => ({
        materias: s.materias.map(m => m.id === matId
          ? { ...m, conteudos: m.conteudos.map(c => c.id === cId ? { ...c, ...patch } : c) }
          : m)
      })),
      deleteConteudo: (matId, cId) => set(s => ({
        materias: s.materias.map(m => m.id === matId
          ? { ...m, conteudos: m.conteudos.filter(c => c.id !== cId) }
          : m)
      })),
      cycleStatus: (matId, cId) => set(s => ({
        materias: s.materias.map(m => m.id === matId
          ? { ...m, conteudos: m.conteudos.map(c => c.id === cId ? { ...c, status: ((c.status + 1) % 4) as any } : c) }
          : m)
      })),

      // Semana
      slots: DEF_SEMANA,
      setSlots: (slots) => set({ slots }),
      addSlot: (s) => set(st => ({ slots: [...st.slots, s] })),
      updateSlot: (id, patch) => set(s => ({ slots: s.slots.map(sl => sl.id === id ? { ...sl, ...patch } : sl) })),
      deleteSlot: (id) => set(s => ({ slots: s.slots.filter(sl => sl.id !== id) })),
      cycleSlotStatus: (id) => set(s => ({
        slots: s.slots.map(sl => sl.id === id ? { ...sl, status: ((sl.status + 1) % 4) as any } : sl)
      })),
      resetSemana: () => set({ slots: JSON.parse(JSON.stringify(DEF_SEMANA)) }),

      // Sessões
      sessoes: [],
      setSessoes: (sessoes) => set({ sessoes }),
      addSessao: (s) => set(st => ({ sessoes: [s, ...st.sessoes] })),
      updateSessao: (id, patch) => set(s => ({ sessoes: s.sessoes.map(x => x.id === id ? { ...x, ...patch } : x) })),
      deleteSessao: (id) => set(s => ({ sessoes: s.sessoes.filter(x => x.id !== id) })),

      // Erros
      erros: [],
      setErros: (erros) => set({ erros }),
      addErro: (e) => set(s => ({ erros: [e, ...s.erros] })),
      updateErro: (id, patch) => set(s => ({ erros: s.erros.map(e => e.id === id ? { ...e, ...patch } : e) })),
      deleteErro: (id) => set(s => ({ erros: s.erros.filter(e => e.id !== id) })),

      // Day plans
      dayPlans: {},
      setDayPlan: (date, plan) => set(s => ({ dayPlans: { ...s.dayPlans, [date]: plan } })),

      // Timer pending
      pendingSessId: null,
      setPendingSessId: (id) => set({ pendingSessId: id }),

      // Helpers
      getMateria: (id) => id != null ? get().materias.find(m => m.id === id) : undefined,
      getConteudo: (matId, cttId) => {
        if (matId == null || cttId == null) return undefined
        return get().materias.find(m => m.id === matId)?.conteudos.find(c => c.id === cttId)
      },
      todaySessoes: () => {
        const t = today()
        return get().sessoes.filter(s => s.date === t)
      },
      cttDoneMin: (matId, cttId, pfx) =>
        get().sessoes
          .filter(s => s.matId === matId && s.cttId === cttId && (!pfx || s.date.startsWith(pfx)))
          .reduce((a, s) => a + s.durMin, 0),
      cttQuestoes: (matId, cttId, pfx) =>
        get().sessoes
          .filter(s => s.matId === matId && s.cttId === cttId && (!pfx || s.date.startsWith(pfx)))
          .reduce((a, s) => a + (s.questoesCount || 0), 0),
      matQuestoes: (matId, pfx) =>
        get().sessoes
          .filter(s => s.matId === matId && (!pfx || s.date.startsWith(pfx)))
          .reduce((a, s) => a + (s.questoesCount || 0), 0),
    }),
    {
      name: 'estudos-camara-v1',
      partialize: (s) => ({
        theme: s.theme,
        materias: s.materias,
        slots: s.slots,
        sessoes: s.sessoes,
        erros: s.erros,
        dayPlans: s.dayPlans,
      }),
    }
  )
)
