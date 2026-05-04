// ─── Tipos base ─────────────────────────────────────────────────────────────
export type StatusConteudo = 0 | 1 | 2 | 3
// 0=Não iniciado | 1=Em andamento | 2=Revisado | 3=Reforço

export type TipoBloco = 'base' | 'rot' | 'rev' | 'revisao' | 'questoes'
export type DiaSemana = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo'
export type FaseTimer = 'idle' | 'study' | 'paused' | 'break-idle' | 'break' | 'done'

// ─── Catálogo ────────────────────────────────────────────────────────────────
export interface Conteudo {
  id: number
  nome: string
  metaH: number
  questoes: boolean
  status: StatusConteudo
}

export interface Materia {
  id: number
  nome: string
  tipo: TipoBloco
  prioridade: 'alta' | 'media' | 'baixa'
  conteudos: Conteudo[]
}

// ─── Semana ──────────────────────────────────────────────────────────────────
export interface SlotSemana {
  id: number
  dia: DiaSemana
  date?: string         // YYYY-MM-DD — set for date-specific or recurring-from-date
  recorrente?: boolean  // true = repeats weekly (requires date)
  exceptions?: string[] // dates where a recurring slot is skipped
  tipo: TipoBloco
  matId: number | null
  cttId: number | null
  matTxt: string
  cttTxt: string
  horas: string
  questoes: boolean
  status: StatusConteudo
}

// ─── Sessões ─────────────────────────────────────────────────────────────────
export interface Sessao {
  id: number
  date: string          // YYYY-MM-DD
  tipo: TipoBloco
  matId: number | null
  cttId: number | null
  materia: string
  conteudo: string
  questoes: boolean
  questoesCount: number
  durMin: number
  time: string          // HH:MM
  obs?: string
  manual?: boolean
  early?: boolean
}

// ─── Plano do dia ────────────────────────────────────────────────────────────
export interface PlanoDia {
  nota: string
  metaH: number
}

// ─── Erros ───────────────────────────────────────────────────────────────────
export interface ErroRegistrado {
  id: number
  data: string
  materia: string
  conteudo: string
  questao: string
  porque: string
  revisado: boolean
}

// ─── Timer ───────────────────────────────────────────────────────────────────
export interface TimerConfig {
  tipo: TipoBloco
  matId: number | null
  cttId: number | null
  materia: string
  conteudo: string
  questoes: boolean
  duracaoMin: number
  pausaMin: number
}
