import { supabase } from './supabase'
import type { Materia, Conteudo, SlotSemana, Sessao, PlanoDia, ErroRegistrado, StatusConteudo } from '../types'

// ─── Matérias ────────────────────────────────────────────────────────────────
export const db = {
  materias: {
    async list(uid: string) {
      const { data, error } = await supabase
        .from('materias').select('*, conteudos(*)')
        .eq('user_id', uid).order('ordem')
      if (error) throw error
      return (data ?? []) as Materia[]
    },
    async upsert(uid: string, m: Omit<Materia,'conteudos'>) {
      const { error } = await supabase.from('materias')
        .upsert({ ...m, user_id: uid }, { onConflict: 'id' })
      if (error) throw error
    },
    async delete(id: number) {
      const { error } = await supabase.from('materias').delete().eq('id', id)
      if (error) throw error
    },
  },

  conteudos: {
    async upsert(ctt: Conteudo & { materia_id: number }) {
      const { error } = await supabase.from('conteudos')
        .upsert(ctt, { onConflict: 'id' })
      if (error) throw error
    },
    async updateStatus(id: number, status: StatusConteudo) {
      const { error } = await supabase.from('conteudos').update({ status }).eq('id', id)
      if (error) throw error
    },
    async delete(id: number) {
      const { error } = await supabase.from('conteudos').delete().eq('id', id)
      if (error) throw error
    },
  },

  slots: {
    async list(uid: string) {
      const { data, error } = await supabase
        .from('slots_semana').select('*').eq('user_id', uid).order('ordem')
      if (error) throw error
      return (data ?? []) as SlotSemana[]
    },
    async upsert(uid: string, slot: SlotSemana) {
      const { error } = await supabase.from('slots_semana')
        .upsert({ ...slot, user_id: uid }, { onConflict: 'id' })
      if (error) throw error
    },
    async delete(id: number) {
      const { error } = await supabase.from('slots_semana').delete().eq('id', id)
      if (error) throw error
    },
  },

  sessoes: {
    async listMonth(uid: string, pfx: string) {
      const { data, error } = await supabase
        .from('sessoes').select('*').eq('user_id', uid)
        .gte('data', pfx+'-01').lte('data', pfx+'-31')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Sessao[]
    },
    async insert(uid: string, s: Omit<Sessao,'id'> & { id?: number }) {
      const { data, error } = await supabase.from('sessoes')
        .insert({ ...s, user_id: uid }).select().single()
      if (error) throw error
      return data as Sessao
    },
    async update(id: number, payload: Partial<Sessao>) {
      const { error } = await supabase.from('sessoes').update(payload).eq('id', id)
      if (error) throw error
    },
    async delete(id: number) {
      const { error } = await supabase.from('sessoes').delete().eq('id', id)
      if (error) throw error
    },
  },

  planosDia: {
    async get(uid: string, data: string) {
      const { data: row, error } = await supabase
        .from('planos_dia').select('*').eq('user_id', uid).eq('data', data).single()
      if (error && error.code !== 'PGRST116') throw error
      return row as PlanoDia | null
    },
    async upsert(uid: string, data: string, plano: PlanoDia) {
      const { error } = await supabase.from('planos_dia')
        .upsert({ ...plano, user_id: uid, data }, { onConflict: 'user_id,data' })
      if (error) throw error
    },
  },

  erros: {
    async list(uid: string) {
      const { data, error } = await supabase
        .from('erros').select('*').eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ErroRegistrado[]
    },
    async insert(uid: string, e: Omit<ErroRegistrado,'id'>) {
      const { data, error } = await supabase.from('erros')
        .insert({ ...e, user_id: uid }).select().single()
      if (error) throw error
      return data as ErroRegistrado
    },
    async update(id: number, payload: Partial<ErroRegistrado>) {
      const { error } = await supabase.from('erros').update(payload).eq('id', id)
      if (error) throw error
    },
    async delete(id: number) {
      const { error } = await supabase.from('erros').delete().eq('id', id)
      if (error) throw error
    },
  },
}
