import type { TipoBloco, StatusConteudo, Materia, SlotSemana } from '../types'

// ─── Design tokens ───────────────────────────────────────────────────────────
export const PALETTE = ['#4F7CFF','#22C97A','#A78BFA','#F5A623','#FF5A5A','#2DD4BF','#F472B6','#60A5FA','#34D399','#FB923C']

export const TIPO_LABEL: Record<TipoBloco, string> = {
  base: 'Bloco Base', rot: 'Bloco Rotativo', rev: 'Revisão Aula',
  revisao: 'Revisão', questoes: 'Questões',
}
export const TIPO_COLOR: Record<TipoBloco, string> = {
  base: '#4F7CFF', rot: '#22C97A', rev: '#A78BFA', revisao: '#2DD4BF', questoes: '#F5A623',
}
export const TIPO_BG: Record<TipoBloco, string> = {
  base: 'rgba(79,124,255,.1)', rot: 'rgba(34,201,122,.1)',
  rev: 'rgba(167,139,250,.1)', revisao: 'rgba(45,212,191,.1)', questoes: 'rgba(245,166,35,.1)',
}
export const TIPO_BORDER: Record<TipoBloco, string> = {
  base: 'rgba(79,124,255,.25)', rot: 'rgba(34,201,122,.25)',
  rev: 'rgba(167,139,250,.25)', revisao: 'rgba(45,212,191,.25)', questoes: 'rgba(245,166,35,.25)',
}
export const TIPO_TEXT: Record<TipoBloco, string> = {
  base: '#7da8ff', rot: '#4ade80', rev: '#c4b5fd', revisao: '#5eead4', questoes: '#fbbf24',
}

export const STATUS_LABEL: Record<StatusConteudo, string> = {
  0: 'Não iniciado', 1: 'Em andamento', 2: 'Revisado', 3: 'Reforço',
}
export const STATUS_COLOR: Record<StatusConteudo, { bg: string; text: string; border: string }> = {
  0: { bg: 'var(--surface3)', text: 'var(--text3)', border: 'var(--border)' },
  1: { bg: 'rgba(245,166,35,.15)', text: '#fbbf24', border: 'rgba(245,166,35,.3)' },
  2: { bg: 'rgba(34,201,122,.15)', text: '#22C97A', border: 'rgba(34,201,122,.3)' },
  3: { bg: 'rgba(255,90,90,.12)', text: '#FF5A5A', border: 'rgba(255,90,90,.25)' },
}

export const DIAS_SEMANA = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'] as const

export const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const MESES_PT_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ─── Catálogo de conteúdos por matéria ───────────────────────────────────────
export const CATALOGO: Record<string, string[]> = {
  'Português': ['Interpretação de textos','Tipologia, gêneros, coesão e coerência','Ortografia e acentuação','Classes de palavras','Pronomes e colocação pronominal','Verbos','Concordância verbal e nominal','Regência verbal e nominal','Crase','Pontuação','Sintaxe do período simples','Sintaxe do período composto','Orações coordenadas e subordinadas','Semântica e reescrita de frases','Redação oficial / correspondência oficial'],
  'Dir. Constitucional': ['Constituição: conceito, classificação e princípios fundamentais','Poder constituinte','Direitos e garantias fundamentais','Direitos sociais, nacionalidade e direitos políticos','Organização do Estado','Administração Pública na Constituição','Poder Legislativo','Processo legislativo','Fiscalização contábil, financeira e orçamentária','Poder Executivo','Poder Judiciário','Funções essenciais à Justiça','Defesa do Estado e das instituições democráticas','Controle de constitucionalidade','Remédios constitucionais'],
  'Redação': ['Estrutura da dissertação','Introdução','Desenvolvimento','Conclusão','Tese e delimitação do tema','Argumentação','Coesão, coerência e conectivos','Clareza, objetividade e impessoalidade','Paragrafação','Erros gramaticais frequentes','Treino de introdução','Treino de desenvolvimento','Treino de conclusão','Redação completa','Reescrita de redação corrigida'],
  'Lei 14.300': ['Disposições iniciais e conceitos','Microgeração e minigeração distribuída','Sistema de compensação de energia elétrica','Participantes e unidades consumidoras','Regras de acesso e conexão','Faturamento e compensação de créditos','Prazos e regras de transição','Direitos, deveres e disposições finais'],
  'Lei 8.112': ['Disposições preliminares','Provimento e vacância','Remoção, redistribuição e substituição','Direitos e vantagens','Vencimento, remuneração e gratificações','Férias, licenças e afastamentos','Concessões, tempo de serviço e direito de petição','Deveres, proibições e acumulação','Responsabilidades e penalidades','Processo administrativo disciplinar','Seguridade social do servidor','Disposições gerais e finais'],
  'Lei 9.784': ['Disposições gerais e princípios','Direitos e deveres do administrado','Início do processo administrativo','Competência, delegação e avocação','Impedimento e suspeição','Forma, tempo e lugar dos atos','Comunicação dos atos','Instrução e provas','Dever de decidir e motivação','Anulação, revogação e convalidação','Recurso administrativo e revisão','Prazos'],
  'Lei 8.429 / LIA': ['Disposições gerais','Sujeitos do ato de improbidade','Atos de improbidade: enriquecimento ilícito','Atos de improbidade: prejuízo ao erário','Atos de improbidade: violação a princípios','Elemento subjetivo e dolo','Sanções e dosimetria','Indisponibilidade de bens','Ação de improbidade administrativa','Legitimidade e procedimento','Prescrição','Alterações da Lei 14.230 e jurisprudência'],
  'Atualidades': ['Política nacional','Economia nacional','Administração pública e políticas públicas','Segurança pública','Tecnologia e inteligência artificial','Meio ambiente e mudanças climáticas','Saúde pública','Educação','Cenário internacional e geopolítica','Temas sociais relevantes','Revisão de temas quentes do mês'],
  'LODF': ['Fundamentos, princípios e objetivos do DF','Organização do Distrito Federal','Competências do Distrito Federal','Organização dos Poderes no DF','Poder Legislativo no DF','Processo legislativo','Fiscalização e controle','Administração Pública do DF','Servidores públicos do DF','Ordem econômica e financeira','Ordem social','Disposições gerais e temas mais cobrados'],
  'LC 840 DF': ['Disposições preliminares','Provimento e vacância','Movimentação funcional','Direitos e vantagens','Remuneração, gratificações e adicionais','Licenças e afastamentos','Deveres e proibições','Responsabilidades','Regime disciplinar e penalidades','Sindicância e processo disciplinar','Disposições gerais e finais'],
  'PDPM': ['Conceitos introdutórios','Princípios e fundamentos','Estrutura normativa','Competências','Procedimentos','Instrumentos e mecanismos','Direitos e garantias envolvidos','Responsabilidades','Sanções e medidas aplicáveis','Questões e casos práticos'],
}

// ─── Dados padrão ────────────────────────────────────────────────────────────
export const DEF_MATERIAS: Materia[] = [
  {id:1,nome:'Português',tipo:'base',prioridade:'alta',conteudos:[
    {id:101,nome:'Sintaxe — sujeito, predicado, complementos',metaH:10,questoes:true,status:0},
    {id:102,nome:'Pontuação e crase',metaH:8,questoes:true,status:0},
    {id:103,nome:'Concordância verbal e nominal',metaH:8,questoes:true,status:0},
    {id:104,nome:'Interpretação de texto',metaH:6,questoes:true,status:0},
    {id:105,nome:'Coesão e coerência',metaH:6,questoes:true,status:0},
  ]},
  {id:2,nome:'Dir. Constitucional',tipo:'base',prioridade:'alta',conteudos:[
    {id:201,nome:'Princípios fundamentais — Art. 1º ao 4º',metaH:8,questoes:true,status:0},
    {id:202,nome:'Direitos e garantias — Art. 5º',metaH:12,questoes:true,status:0},
    {id:203,nome:'Organização do Estado',metaH:8,questoes:true,status:0},
    {id:204,nome:'Poder Legislativo',metaH:6,questoes:true,status:0},
  ]},
  {id:3,nome:'Redação',tipo:'base',prioridade:'alta',conteudos:[
    {id:301,nome:'Estrutura da dissertação-argumentativa',metaH:6,questoes:false,status:0},
    {id:302,nome:'Repertório — temas atuais',metaH:4,questoes:false,status:0},
    {id:303,nome:'Argumentação e contra-argumentação',metaH:4,questoes:false,status:0},
  ]},
  {id:4,nome:'Lei 14.300',tipo:'rot',prioridade:'alta',conteudos:[
    {id:401,nome:'Dispositivos mais cobrados',metaH:8,questoes:true,status:0},
    {id:402,nome:'Princípios e regras gerais',metaH:6,questoes:true,status:0},
  ]},
  {id:5,nome:'Lei 8.112',tipo:'rot',prioridade:'media',conteudos:[
    {id:501,nome:'Provimento e vacância',metaH:6,questoes:true,status:0},
    {id:502,nome:'Direitos e vantagens do servidor',metaH:6,questoes:true,status:0},
    {id:503,nome:'Processo disciplinar',metaH:5,questoes:true,status:0},
  ]},
  {id:6,nome:'Lei 9.784',tipo:'rot',prioridade:'media',conteudos:[
    {id:601,nome:'Princípios do processo administrativo',metaH:5,questoes:true,status:0},
    {id:602,nome:'Prazos e fases do processo',metaH:4,questoes:true,status:0},
  ]},
  {id:7,nome:'Lei 8.429 / LIA',tipo:'rot',prioridade:'media',conteudos:[
    {id:701,nome:'Atos de improbidade — categorias',metaH:6,questoes:true,status:0},
    {id:702,nome:'Sanções e prescrição',metaH:4,questoes:true,status:0},
  ]},
  {id:8,nome:'LODF',tipo:'rot',prioridade:'media',conteudos:[
    {id:801,nome:'Princípios e organização do DF',metaH:5,questoes:true,status:0},
  ]},
  {id:9,nome:'LC 840 DF',tipo:'rot',prioridade:'media',conteudos:[
    {id:901,nome:'Deveres, proibições e penalidades',metaH:5,questoes:true,status:0},
  ]},
  {id:10,nome:'PDPM',tipo:'rot',prioridade:'baixa',conteudos:[
    {id:1001,nome:'Conteúdo previsto no edital',metaH:10,questoes:false,status:0},
  ]},
  {id:11,nome:'Atualidades',tipo:'rot',prioridade:'baixa',conteudos:[
    {id:1101,nome:'Temas do mês',metaH:4,questoes:false,status:0},
  ]},
]

export const DEF_SEMANA: SlotSemana[] = [
  {id:1,dia:'Segunda',tipo:'rev',matId:null,cttId:null,matTxt:'Revisão da aula do dia',cttTxt:'',horas:'1h',questoes:false,status:0},
  {id:2,dia:'Segunda',tipo:'base',matId:1,cttId:null,matTxt:'Português',cttTxt:'(a definir)',horas:'2h30',questoes:true,status:0},
  {id:3,dia:'Segunda',tipo:'rot',matId:5,cttId:501,matTxt:'Lei 8.112',cttTxt:'Provimento e vacância',horas:'2h30',questoes:true,status:0},
  {id:4,dia:'Terça',tipo:'rev',matId:null,cttId:null,matTxt:'Revisão da aula do dia',cttTxt:'',horas:'1h',questoes:false,status:0},
  {id:5,dia:'Terça',tipo:'base',matId:2,cttId:null,matTxt:'Dir. Constitucional',cttTxt:'(a definir)',horas:'2h30',questoes:true,status:0},
  {id:6,dia:'Terça',tipo:'rot',matId:6,cttId:601,matTxt:'Lei 9.784',cttTxt:'Princípios do processo administrativo',horas:'2h30',questoes:true,status:0},
  {id:7,dia:'Quarta',tipo:'rev',matId:null,cttId:null,matTxt:'Revisão da aula do dia',cttTxt:'',horas:'1h',questoes:false,status:0},
  {id:8,dia:'Quarta',tipo:'base',matId:1,cttId:null,matTxt:'Português',cttTxt:'(a definir)',horas:'2h30',questoes:true,status:0},
  {id:9,dia:'Quarta',tipo:'rot',matId:8,cttId:801,matTxt:'LODF',cttTxt:'Princípios e organização do DF',horas:'2h30',questoes:true,status:0},
  {id:10,dia:'Quinta',tipo:'rev',matId:null,cttId:null,matTxt:'Revisão da aula do dia',cttTxt:'',horas:'1h',questoes:false,status:0},
  {id:11,dia:'Quinta',tipo:'base',matId:2,cttId:null,matTxt:'Dir. Constitucional',cttTxt:'(a definir)',horas:'2h30',questoes:true,status:0},
  {id:12,dia:'Quinta',tipo:'rot',matId:9,cttId:901,matTxt:'LC 840 DF',cttTxt:'Deveres, proibições e penalidades',horas:'2h30',questoes:true,status:0},
  {id:13,dia:'Sexta',tipo:'rev',matId:null,cttId:null,matTxt:'Revisão da aula do dia',cttTxt:'',horas:'1h',questoes:false,status:0},
  {id:14,dia:'Sexta',tipo:'base',matId:3,cttId:null,matTxt:'Redação',cttTxt:'(a definir)',horas:'2h30',questoes:false,status:0},
  {id:15,dia:'Sexta',tipo:'rot',matId:7,cttId:701,matTxt:'Lei 8.429 / LIA',cttTxt:'Atos de improbidade — categorias',horas:'2h30',questoes:true,status:0},
  {id:16,dia:'Sábado',tipo:'rev',matId:null,cttId:null,matTxt:'Revisão semanal — pontos fracos',cttTxt:'',horas:'1h',questoes:false,status:0},
  {id:17,dia:'Sábado',tipo:'base',matId:1,cttId:null,matTxt:'Português ou Constitucional (alterna)',cttTxt:'',horas:'2h30',questoes:true,status:0},
  {id:18,dia:'Sábado',tipo:'rot',matId:4,cttId:401,matTxt:'Lei 14.300',cttTxt:'Dispositivos mais cobrados',horas:'2h30',questoes:true,status:0},
  {id:19,dia:'Domingo',tipo:'rev',matId:null,cttId:null,matTxt:'Revisão leve + Planejamento',cttTxt:'',horas:'1h',questoes:false,status:0},
  {id:20,dia:'Domingo',tipo:'base',matId:3,cttId:null,matTxt:'Redação ou Constitucional (leve)',cttTxt:'',horas:'2h',questoes:false,status:0},
  {id:21,dia:'Domingo',tipo:'rot',matId:11,cttId:1101,matTxt:'PDPM + Atualidades',cttTxt:'Temas do mês',horas:'1h30',questoes:false,status:0},
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Data local (YYYY-MM-DD) — NÃO usar toISOString() aqui: converte pra UTC e
// "pula" pro dia seguinte à noite em fusos atrás de UTC (ex: Brasil, UTC-3).
export const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
export const today = () => dateKey(new Date())
export const monthPfx = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`

// Matérias visíveis num mês: as marcadas com esse mês + legadas (sem month) quando o mês é o atual
export function materiasDoMes(materias: Materia[], pfx: string): Materia[] {
  const isCurrent = pfx === monthPfx()
  return materias.filter(m => m.month === pfx || (isCurrent && !m.month))
}

export function fmtSecs(s: number) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}
export function fmtH(totalMin: number) {
  return `${Math.floor(totalMin/60)}h ${String(totalMin%60).padStart(2,'0')}min`
}
export function fmtHShort(totalMin: number) {
  return `${Math.floor(totalMin/60)}h${String(totalMin%60).padStart(2,'0')}`
}

export function getWeekDates(offset = 0): Date[] {
  const d = new Date()
  const wd = d.getDay()
  const diff = d.getDate() - (wd === 0 ? 6 : wd - 1) + offset * 7
  const mon = new Date(d); mon.setDate(diff)
  return Array.from({length:7}, (_,i) => { const x = new Date(mon); x.setDate(mon.getDate()+i); return x })
}

export function playAlert(isBreak: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = isBreak ? [523,659,784] : [784,659,523,659,784,1047]
    const dur = isBreak ? 0.18 : 0.15
    let t = ctx.currentTime + 0.05
    notes.forEach(freq => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.3, t+0.02)
      gain.gain.linearRampToValueAtTime(0, t+dur)
      osc.start(t); osc.stop(t+dur+0.02); t += dur+0.04
    })
  } catch {}
}

// Visual feedback is handled by useTimerPageStatus hook in Layout
export function flashTitle() {}
