import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEF_SEMANA, today } from '../lib/constants'
import { supabase } from '../lib/supabase'
import {
  loadUserData,
  materiaToRow, conteudoToRow, slotToRow, sessaoToRow, erroToRow,
} from '../lib/db'
import type { Materia, SlotSemana, Sessao, ErroRegistrado, StatusConteudo, Conteudo } from '../types'

// Fire-and-forget Supabase write; logs errors to console
function dbw(fn: () => PromiseLike<any>) {
  Promise.resolve(fn()).then((res: any) => {
    if (res?.error) console.error('[db]', res.error.message)
  })
}

interface AppState {
  // Theme (persisted in localStorage)
  theme: 'dark' | 'light'
  toggleTheme: () => void

  // Auth
  userId: string | null

  // Loading
  loaded: boolean
  loadData: (userId: string) => Promise<void>
  clearData: () => void

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

  // Day plans
  dayPlans: Record<string, { nota: string; metaH: number }>
  setDayPlan: (date: string, plan: { nota: string; metaH: number }) => void

  // Timer pending
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
      // ── Theme ──────────────────────────────────────────────────────────────
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('light', next === 'light')
      },

      // ── Auth / Loading ─────────────────────────────────────────────────────
      userId: null,
      loaded: false,

      loadData: async (userId) => {
        try {
          const data = await loadUserData(userId)
          set({ ...data, userId, loaded: true })
        } catch (e) {
          console.error('[loadData]', e)
          set({ userId, loaded: true })
        }
      },

      clearData: () => set({
        materias: [], slots: [...DEF_SEMANA], sessoes: [],
        erros: [], dayPlans: {}, loaded: true, userId: null,
      }),

      // ── Matérias ───────────────────────────────────────────────────────────
      materias: [],
      setMaterias: (materias) => set({ materias }),

      addMateria: (m) => {
        set(s => ({ materias: [...s.materias, m] }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('materias').insert(materiaToRow(m, uid)))
      },

      updateMateria: (id, patch) => {
        set(s => ({ materias: s.materias.map(m => m.id === id ? { ...m, ...patch } : m) }))
        const uid = get().userId
        const mat = get().materias.find(m => m.id === id)
        if (uid && mat) dbw(() => supabase.from('materias').update(materiaToRow(mat, uid)).eq('id', id).eq('user_id', uid))
      },

      deleteMateria: (id) => {
        set(s => ({ materias: s.materias.filter(m => m.id !== id) }))
        const uid = get().userId
        if (uid) {
          dbw(() => supabase.from('conteudos').delete().eq('materia_id', id).eq('user_id', uid))
          dbw(() => supabase.from('materias').delete().eq('id', id).eq('user_id', uid))
        }
      },

      addConteudo: (matId, c) => {
        set(s => ({ materias: s.materias.map(m => m.id === matId ? { ...m, conteudos: [...m.conteudos, c] } : m) }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('conteudos').insert(conteudoToRow(c, matId, uid)))
      },

      updateConteudo: (matId, cId, patch) => {
        set(s => ({
          materias: s.materias.map(m => m.id === matId
            ? { ...m, conteudos: m.conteudos.map(c => c.id === cId ? { ...c, ...patch } : c) }
            : m)
        }))
        const uid = get().userId
        const ctt = get().materias.find(m => m.id === matId)?.conteudos.find(c => c.id === cId)
        if (uid && ctt) dbw(() => supabase.from('conteudos').update(conteudoToRow(ctt, matId, uid)).eq('id', cId).eq('user_id', uid))
      },

      deleteConteudo: (matId, cId) => {
        set(s => ({
          materias: s.materias.map(m => m.id === matId
            ? { ...m, conteudos: m.conteudos.filter(c => c.id !== cId) }
            : m)
        }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('conteudos').delete().eq('id', cId).eq('user_id', uid))
      },

      cycleStatus: (matId, cId) => {
        set(s => ({
          materias: s.materias.map(m => m.id === matId
            ? { ...m, conteudos: m.conteudos.map(c => c.id === cId ? { ...c, status: ((c.status + 1) % 4) as StatusConteudo } : c) }
            : m)
        }))
        const uid = get().userId
        const ctt = get().materias.find(m => m.id === matId)?.conteudos.find(c => c.id === cId)
        if (uid && ctt) dbw(() => supabase.from('conteudos').update({ status: ctt.status }).eq('id', cId).eq('user_id', uid))
      },

      // ── Semana ─────────────────────────────────────────────────────────────
      slots: [...DEF_SEMANA],
      setSlots: (slots) => set({ slots }),

      addSlot: (s) => {
        set(st => ({ slots: [...st.slots, s] }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('slots_semana').insert(slotToRow(s, uid)))
      },

      updateSlot: (id, patch) => {
        set(s => ({ slots: s.slots.map(sl => sl.id === id ? { ...sl, ...patch } : sl) }))
        const uid = get().userId
        const slot = get().slots.find(sl => sl.id === id)
        if (uid && slot) dbw(() => supabase.from('slots_semana').update(slotToRow(slot, uid)).eq('id', id).eq('user_id', uid))
      },

      deleteSlot: (id) => {
        set(s => ({ slots: s.slots.filter(sl => sl.id !== id) }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('slots_semana').delete().eq('id', id).eq('user_id', uid))
      },

      cycleSlotStatus: (id) => {
        set(s => ({
          slots: s.slots.map(sl => sl.id === id ? { ...sl, status: ((sl.status + 1) % 4) as StatusConteudo } : sl)
        }))
        const uid = get().userId
        const slot = get().slots.find(sl => sl.id === id)
        if (uid && slot) dbw(() => supabase.from('slots_semana').update({ status: slot.status }).eq('id', id).eq('user_id', uid))
      },

      resetSemana: () => {
        const uid = get().userId
        const fresh = DEF_SEMANA.map((s, i) => ({ ...s, id: Date.now() + i }))
        set({ slots: fresh })
        if (uid) {
          dbw(async () => {
            await supabase.from('slots_semana').delete().eq('user_id', uid)
            return supabase.from('slots_semana').insert(fresh.map(s => slotToRow(s, uid)))
          })
        }
      },

      // ── Sessões ────────────────────────────────────────────────────────────
      sessoes: [],
      setSessoes: (sessoes) => set({ sessoes }),

      addSessao: (s) => {
        set(st => ({ sessoes: [s, ...st.sessoes] }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('sessoes').insert(sessaoToRow(s, uid)))
      },

      updateSessao: (id, patch) => {
        set(s => ({ sessoes: s.sessoes.map(x => x.id === id ? { ...x, ...patch } : x) }))
        const uid = get().userId
        const sess = get().sessoes.find(x => x.id === id)
        if (uid && sess) dbw(() => supabase.from('sessoes').update(sessaoToRow(sess, uid)).eq('id', id).eq('user_id', uid))
      },

      deleteSessao: (id) => {
        set(s => ({ sessoes: s.sessoes.filter(x => x.id !== id) }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('sessoes').delete().eq('id', id).eq('user_id', uid))
      },

      // ── Erros ──────────────────────────────────────────────────────────────
      erros: [],
      setErros: (erros) => set({ erros }),

      addErro: (e) => {
        set(s => ({ erros: [e, ...s.erros] }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('erros').insert(erroToRow(e, uid)))
      },

      updateErro: (id, patch) => {
        set(s => ({ erros: s.erros.map(e => e.id === id ? { ...e, ...patch } : e) }))
        const uid = get().userId
        const erro = get().erros.find(e => e.id === id)
        if (uid && erro) dbw(() => supabase.from('erros').update(erroToRow(erro, uid)).eq('id', id).eq('user_id', uid))
      },

      deleteErro: (id) => {
        set(s => ({ erros: s.erros.filter(e => e.id !== id) }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('erros').delete().eq('id', id).eq('user_id', uid))
      },

      // ── Day plans ──────────────────────────────────────────────────────────
      dayPlans: {},
      setDayPlan: (date, plan) => {
        set(s => ({ dayPlans: { ...s.dayPlans, [date]: plan } }))
        const uid = get().userId
        if (uid) dbw(() => supabase.from('planos_dia').upsert({ user_id: uid, date, nota: plan.nota, meta_h: plan.metaH }))
      },

      // ── Timer pending ──────────────────────────────────────────────────────
      pendingSessId: null,
      setPendingSessId: (id) => set({ pendingSessId: id }),

      // ── Helpers ────────────────────────────────────────────────────────────
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
      name: 'estudos-camara-theme', // only theme persists in localStorage
      partialize: (s) => ({ theme: s.theme }),
    }
  )
)
