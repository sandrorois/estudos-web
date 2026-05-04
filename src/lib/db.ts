import { supabase } from './supabase'
import { DEF_SEMANA } from './constants'
import type { Materia, Conteudo, SlotSemana, Sessao, ErroRegistrado } from '../types'

// ─── Row → Type ──────────────────────────────────────────────────────────────
const rowToConteudo = (r: any): Conteudo =>
  ({ id: r.id, nome: r.nome, metaH: r.meta_h, questoes: r.questoes, status: r.status })

const rowToSessao = (r: any): Sessao => ({
  id: r.id, date: r.date, tipo: r.tipo,
  matId: r.mat_id, cttId: r.ctt_id,
  materia: r.materia, conteudo: r.conteudo,
  questoes: r.questoes, questoesCount: r.questoes_count,
  durMin: r.dur_min, time: r.time,
  obs: r.obs ?? undefined, manual: r.manual ?? undefined, early: r.early ?? undefined,
})

const rowToSlot = (r: any): SlotSemana => ({
  id: r.id, dia: r.dia, date: r.date ?? undefined,
  recorrente: r.recorrente ?? undefined, exceptions: r.exceptions ?? undefined,
  tipo: r.tipo, matId: r.mat_id, cttId: r.ctt_id,
  matTxt: r.mat_txt, cttTxt: r.ctt_txt,
  horas: r.horas, questoes: r.questoes, status: r.status,
})

const rowToErro = (r: any): ErroRegistrado => ({
  id: r.id, data: r.data, materia: r.materia,
  conteudo: r.conteudo, questao: r.questao,
  porque: r.porque, revisado: r.revisado,
})

// ─── Type → Row ──────────────────────────────────────────────────────────────
export const materiaToRow = (m: Materia, uid: string) =>
  ({ id: m.id, user_id: uid, nome: m.nome, tipo: m.tipo, prioridade: m.prioridade, month: m.month ?? null })

export const conteudoToRow = (c: Conteudo, matId: number, uid: string) =>
  ({ id: c.id, user_id: uid, materia_id: matId, nome: c.nome, meta_h: c.metaH, questoes: c.questoes, status: c.status })

export const slotToRow = (s: SlotSemana, uid: string) => ({
  id: s.id, user_id: uid, dia: s.dia, date: s.date ?? null,
  recorrente: s.recorrente ?? false, exceptions: s.exceptions ?? [],
  tipo: s.tipo, mat_id: s.matId, ctt_id: s.cttId,
  mat_txt: s.matTxt, ctt_txt: s.cttTxt,
  horas: s.horas, questoes: s.questoes, status: s.status,
})

export const sessaoToRow = (s: Sessao, uid: string) => ({
  id: s.id, user_id: uid, date: s.date, tipo: s.tipo,
  mat_id: s.matId, ctt_id: s.cttId,
  materia: s.materia, conteudo: s.conteudo,
  questoes: s.questoes, questoes_count: s.questoesCount,
  dur_min: s.durMin, time: s.time,
  obs: s.obs ?? null, manual: s.manual ?? false, early: s.early ?? false,
})

export const erroToRow = (e: ErroRegistrado, uid: string) => ({
  id: e.id, user_id: uid, data: e.data,
  materia: e.materia, conteudo: e.conteudo,
  questao: e.questao, porque: e.porque, revisado: e.revisado,
})

// ─── Migrate localStorage → Supabase (runs once on first login) ──────────────
async function tryMigrate(userId: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem('estudos-camara-v1')
    if (!raw) return false
    const state = JSON.parse(raw)?.state
    if (!state) return false
    const { materias = [], slots = [], sessoes = [], erros = [], dayPlans = {} } = state
    if (!materias.length && !sessoes.length) return false

    if (materias.length) {
      await supabase.from('materias').insert(materias.map((m: any) => materiaToRow(m, userId)))
      const ctts = materias.flatMap((m: any) =>
        (m.conteudos ?? []).map((c: any) => conteudoToRow(c, m.id, userId))
      )
      if (ctts.length) await supabase.from('conteudos').insert(ctts)
    }
    if (slots.length) await supabase.from('slots_semana').insert(slots.map((s: any) => slotToRow(s, userId)))
    if (sessoes.length) await supabase.from('sessoes').insert(sessoes.map((s: any) => sessaoToRow(s, userId)))
    if (erros.length) await supabase.from('erros').insert(erros.map((e: any) => erroToRow(e, userId)))

    const planEntries = Object.entries(dayPlans)
    if (planEntries.length) {
      await supabase.from('planos_dia').insert(
        planEntries.map(([date, p]: any) => ({ user_id: userId, date, nota: p.nota ?? '', meta_h: p.metaH ?? 0 }))
      )
    }
    localStorage.removeItem('estudos-camara-v1')
    return true
  } catch (e) {
    console.warn('[migrate]', e)
    return false
  }
}

// ─── Load all data for a user ─────────────────────────────────────────────────
export async function loadUserData(userId: string) {
  const fetchAll = () => Promise.all([
    supabase.from('materias').select('*').eq('user_id', userId),
    supabase.from('conteudos').select('*').eq('user_id', userId),
    supabase.from('sessoes').select('*').eq('user_id', userId),
    supabase.from('slots_semana').select('*').eq('user_id', userId),
    supabase.from('planos_dia').select('*').eq('user_id', userId),
    supabase.from('erros').select('*').eq('user_id', userId),
  ])

  let [
    { data: matsData }, { data: cttsData }, { data: sessoesData },
    { data: slotsData }, { data: planosData }, { data: errosData },
  ] = await fetchAll()

  // First login: migrate localStorage data if available
  if (!matsData?.length && !sessoesData?.length) {
    const migrated = await tryMigrate(userId)
    if (migrated) {
      ;[
        { data: matsData }, { data: cttsData }, { data: sessoesData },
        { data: slotsData }, { data: planosData }, { data: errosData },
      ] = await fetchAll()
    }
  }

  const materias: Materia[] = (matsData ?? []).map(m => ({
    id: m.id, nome: m.nome, tipo: m.tipo, prioridade: m.prioridade,
    month: m.month ?? undefined,
    conteudos: (cttsData ?? []).filter(c => c.materia_id === m.id).map(rowToConteudo),
  }))

  let slots: SlotSemana[]
  if (!slotsData?.length) {
    // First time user: seed default schedule with fresh IDs
    slots = DEF_SEMANA.map((s, i) => ({ ...s, id: Date.now() + i }))
    supabase.from('slots_semana').insert(slots.map(s => slotToRow(s, userId))).then(() => {})
  } else {
    slots = slotsData.map(rowToSlot)
  }

  const dayPlans: Record<string, { nota: string; metaH: number }> = {}
  ;(planosData ?? []).forEach((p: any) => { dayPlans[p.date] = { nota: p.nota, metaH: p.meta_h } })

  return {
    materias,
    slots,
    sessoes: (sessoesData ?? []).map(rowToSessao),
    dayPlans,
    erros: (errosData ?? []).map(rowToErro),
  }
}
