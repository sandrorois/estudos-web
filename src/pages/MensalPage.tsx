import { useState } from 'react'
import { useStore } from '../store/app'
import { Btn, FG, Input, Select, Toggle, Textarea, Modal, ModalFooter, Notif, SectionHeader, PBar, StatusPill } from '../components/ui'
import { MESES_PT, DIAS_SEMANA, TIPO_COLOR, TIPO_LABEL, monthPfx, fmtHShort } from '../lib/constants'
import type { DiaSemana, TipoBloco, StatusConteudo } from '../types'

const DIAS_HEADER = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function parseSlotMin(h: string): number {
  const m = h.match(/(\d+)h(\d+)?/)
  if (!m) return 0
  return parseInt(m[1] || '0') * 60 + parseInt(m[2] || '0')
}

export default function MensalPage() {
  const { materias, slots, addSlot, updateSlot, deleteSlot, sessoes, dayPlans, setDayPlan } = useStore()

  const [notif, setNotif] = useState('')
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dayForm, setDayForm] = useState({ nota: '' })

  // Slot CRUD dentro do modal do dia
  const [slotFormOpen, setSlotFormOpen] = useState(false)
  const [slotEditId, setSlotEditId] = useState<number | null>(null)
  const [slotForm, setSlotForm] = useState({
    tipo: 'base' as TipoBloco, matId: '', cttId: '', horas: '2h', questoes: false,
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const pfx = monthPfx(viewDate)

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)) }

  const cells = getMonthDays(year, month)

  function dateKey(d: Date) { return d.toISOString().slice(0, 10) }
  function dowIndex(d: Date) { return (d.getDay() + 6) % 7 }

  function dayStudiedMin(d: Date) {
    const k = dateKey(d)
    return sessoes.filter(s => s.date === k).reduce((a, s) => a + s.durMin, 0)
  }

  function dayQuestoes(d: Date) {
    const k = dateKey(d)
    return sessoes.filter(s => s.date === k).reduce((a, s) => a + (s.questoesCount || 0), 0)
  }

  const monthSessoes = sessoes.filter(s => s.date.startsWith(pfx))
  const monthMin = monthSessoes.reduce((a, s) => a + s.durMin, 0)
  const monthQ = monthSessoes.reduce((a, s) => a + (s.questoesCount || 0), 0)
  const daysStudied = new Set(monthSessoes.map(s => s.date)).size
  const metaMin = 7200
  const monthPct = Math.min(100, Math.round(monthMin / metaMin * 100))
  const avgMin = daysStudied > 0 ? Math.round(monthMin / daysStudied) : 0

  function matMonthMin(matId: number) {
    return monthSessoes.filter(s => s.matId === matId).reduce((a, s) => a + s.durMin, 0)
  }

  function slotsForDow(dow: number) {
    const dia = DIAS_SEMANA[dow] as DiaSemana
    return slots.filter(s => s.dia === dia)
  }

  // Meta do dia = soma das metas dos blocos do dia da semana
  function slotMetaMin(dow: number): number {
    return slotsForDow(dow).reduce((a, sl) => a + parseSlotMin(sl.horas), 0)
  }

  function openDay(d: Date) {
    setSelectedDate(d)
    const k = dateKey(d)
    setDayForm({ nota: dayPlans[k]?.nota ?? '' })
    setSlotFormOpen(false)
    setSlotEditId(null)
  }

  function closeDay() {
    setSelectedDate(null)
    setSlotFormOpen(false)
    setSlotEditId(null)
  }

  function saveDayPlan() {
    if (!selectedDate) return
    setDayPlan(dateKey(selectedDate), { nota: dayForm.nota, metaH: 0 })
    closeDay()
    setNotif('Nota salva!')
  }

  function openSlotForm(sl?: typeof slots[0]) {
    setSlotEditId(sl?.id ?? null)
    setSlotForm({
      tipo: sl?.tipo ?? 'base',
      matId: sl?.matId ? String(sl.matId) : '',
      cttId: sl?.cttId ? String(sl.cttId) : '',
      horas: sl?.horas ?? '2h',
      questoes: sl?.questoes ?? false,
    })
    setSlotFormOpen(true)
  }

  function saveSlotForm() {
    if (!selectedDate) return
    const dow = dowIndex(selectedDate)
    const dia = DIAS_SEMANA[dow] as DiaSemana
    const mat = materias.find(m => String(m.id) === slotForm.matId)
    const ctt = mat?.conteudos.find(c => String(c.id) === slotForm.cttId)
    const payload = {
      dia, tipo: slotForm.tipo,
      matId: mat?.id ?? null, cttId: ctt?.id ?? null,
      matTxt: mat?.nome ?? '', cttTxt: ctt?.nome ?? '',
      horas: slotForm.horas, questoes: slotForm.questoes,
      status: 0 as StatusConteudo,
    }
    if (slotEditId) {
      updateSlot(slotEditId, payload)
      setNotif('Bloco atualizado!')
    } else {
      addSlot({ id: Date.now(), ...payload })
      setNotif('Bloco adicionado!')
    }
    setSlotFormOpen(false)
    setSlotEditId(null)
  }

  const todayKey = dateKey(today)

  return (
    <div className="pt-6 flex flex-col gap-4">
      {notif && <Notif msg={notif} onDone={() => setNotif('')} />}

      <SectionHeader title="Mensal"
        sub="Calendário e planejamento"
        right={
          <>
            <Btn size="icon" variant="ghost" onClick={prevMonth}>‹</Btn>
            <span className="text-sm font-semibold px-1" style={{ color: 'var(--text)' }}>
              {MESES_PT[month]} {year}
            </span>
            <Btn size="icon" variant="ghost" onClick={nextMonth}>›</Btn>
          </>
        }
      />

      {/* Resumo colapsável */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button className="w-full flex items-center justify-between px-5 py-3 text-left"
          onClick={() => setSummaryOpen(o => !o)}>
          <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Resumo de {MESES_PT[month]}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: '#22C97A' }}>{fmtHShort(monthMin)}</span>
            <span className="text-xs" style={{ color: 'var(--text3)' }}>{summaryOpen ? '▲' : '▼'}</span>
          </div>
        </button>

        {summaryOpen && (
          <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 text-sm">
              <div>
                <div className="text-xs" style={{ color: 'var(--text3)' }}>Horas estudadas</div>
                <div className="font-mono font-semibold" style={{ color: '#22C97A' }}>{fmtHShort(monthMin)}</div>
                <div className="mt-1"><PBar pct={monthPct} color="#22C97A" /></div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>meta 120–140h ({monthPct}%)</div>
              </div>
              <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--text2)' }}>
                <div>Dias estudados: <strong>{daysStudied}</strong></div>
                <div>Sessões: <strong>{monthSessoes.length}</strong></div>
                <div>Questões: <strong>{monthQ}</strong></div>
                <div>Média diária: <strong>{fmtHShort(avgMin)}</strong></div>
              </div>
            </div>

            <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>Progresso por matéria</div>
              <div className="flex flex-col gap-2">
                {materias.map(mat => {
                  const done = matMonthMin(mat.id)
                  const metaH = mat.conteudos.reduce((a, c) => a + c.metaH, 0)
                  const pct = metaH > 0 ? Math.min(100, Math.round(done / 60 / metaH * 100)) : 0
                  return (
                    <div key={mat.id} className="flex items-center gap-3">
                      <div className="text-xs w-32 truncate shrink-0" style={{ color: 'var(--text2)' }}>{mat.nome}</div>
                      <div className="flex-1"><PBar pct={pct} color={TIPO_COLOR[mat.tipo]} /></div>
                      <span className="text-xs font-mono w-16 text-right" style={{ color: 'var(--text3)' }}>
                        {(done / 60).toFixed(1)}h{metaH > 0 ? `/${metaH}h` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grade do calendário */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
          {DIAS_HEADER.map(d => (
            <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--text3)' }}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isCurrentMonth = cell !== null
            const isToday = cell ? dateKey(cell) === todayKey : false
            const dow = cell ? dowIndex(cell) : -1
            const daySlotList = cell ? slotsForDow(dow) : []
            const studied = cell ? dayStudiedMin(cell) : 0
            const plan = cell ? dayPlans[dateKey(cell)] : undefined
            const slotMeta = cell && dow >= 0 ? slotMetaMin(dow) : 0

            return (
              <div key={i}
                className="border-b border-r relative cursor-pointer transition-all"
                style={{
                  borderColor: 'var(--border)', minHeight: 100,
                  opacity: isCurrentMonth ? 1 : 0.3,
                  background: isToday ? 'rgba(79,124,255,.06)' : undefined,
                  outline: isToday ? '2px solid #4F7CFF' : undefined,
                  outlineOffset: -1,
                }}
                onClick={() => cell && openDay(cell)}>

                <div className="p-1.5 flex flex-col gap-0.5 h-full">
                  {/* Número do dia */}
                  <div className="text-xs font-semibold mb-0.5" style={{ color: isToday ? '#4F7CFF' : 'var(--text2)' }}>
                    {cell?.getDate()}
                  </div>

                  {/* Tags de blocos (máx 3) — fonte aumentada 2px: text-[10px] → text-xs */}
                  {daySlotList.slice(0, 3).map((sl, si) => (
                    <div key={si} className="text-xs px-1 rounded truncate"
                      style={{ background: `${TIPO_COLOR[sl.tipo]}20`, color: TIPO_COLOR[sl.tipo] }}>
                      {sl.matTxt || TIPO_LABEL[sl.tipo]}
                    </div>
                  ))}

                  {/* Nota do dia */}
                  {plan?.nota && (
                    <div className="text-xs truncate italic" style={{ color: 'var(--text3)' }}>
                      {plan.nota}
                    </div>
                  )}

                  {/* Meta (blocos) e horas estudadas */}
                  <div className="mt-auto flex items-center justify-between">
                    {slotMeta > 0
                      ? <span className="text-xs" style={{ color: 'var(--text3)' }}>{fmtHShort(slotMeta)}</span>
                      : <span />}
                    {studied > 0 && (
                      <span className="text-xs font-mono font-semibold" style={{ color: '#22C97A' }}>
                        {fmtHShort(studied)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal: Plano do dia */}
      <Modal open={selectedDate !== null} onClose={closeDay}
        title={selectedDate
          ? `${DIAS_SEMANA[dowIndex(selectedDate)]} · ${selectedDate.getDate()}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`
          : ''}
        maxWidth={520}>
        {selectedDate && (() => {
          const dow = dowIndex(selectedDate)
          const daySlotList = slotsForDow(dow)
          const studied = dayStudiedMin(selectedDate)
          const qs = dayQuestoes(selectedDate)
          const metaTotal = slotMetaMin(dow)
          const slotMatObj = materias.find(m => String(m.id) === slotForm.matId)

          return (
            <div className="flex flex-col gap-4">
              {/* Horas estudadas */}
              {studied > 0 && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(34,201,122,.08)', border: '1px solid rgba(34,201,122,.2)' }}>
                  <span style={{ color: '#22C97A' }}>✓</span>
                  <span style={{ color: 'var(--text2)' }}>Estudado:</span>
                  <span className="font-mono font-semibold" style={{ color: '#22C97A' }}>{fmtHShort(studied)}</span>
                  {metaTotal > 0 && (
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>/ {fmtHShort(metaTotal)} meta</span>
                  )}
                  {qs > 0 && <span className="text-xs font-mono ml-auto" style={{ color: '#F5A623' }}>{qs}Q</span>}
                </div>
              )}

              {/* Blocos do dia com CRUD */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                    Blocos — {DIAS_SEMANA[dow]}{metaTotal > 0 ? ` · meta ${fmtHShort(metaTotal)}` : ''}
                  </div>
                  {!slotFormOpen && (
                    <Btn size="sm" variant="ghost" onClick={() => openSlotForm()}>+ Adicionar</Btn>
                  )}
                </div>

                {daySlotList.length === 0 && !slotFormOpen && (
                  <div className="text-xs text-center py-3" style={{ color: 'var(--text3)' }}>
                    Nenhum bloco. Clique em "+ Adicionar".
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {daySlotList.map(sl => (
                    <div key={sl.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TIPO_COLOR[sl.tipo] }} />
                      <span className="text-xs flex-1 truncate" style={{ color: 'var(--text)' }}>
                        {sl.matTxt || TIPO_LABEL[sl.tipo]}
                      </span>
                      {sl.cttTxt && (
                        <span className="text-xs truncate max-w-[100px]" style={{ color: 'var(--text3)' }}>{sl.cttTxt}</span>
                      )}
                      <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text3)' }}>{sl.horas}</span>
                      {sl.questoes && <span className="text-xs shrink-0" style={{ color: '#F5A623' }}>✓Q</span>}
                      <StatusPill status={sl.status} />
                      <Btn size="icon" variant="ghost" onClick={() => openSlotForm(sl)}>✏</Btn>
                      <Btn size="icon" variant="ghost"
                        onClick={() => { if (confirm('Excluir este bloco da semana?')) { deleteSlot(sl.id); setNotif('Bloco excluído.') } }}
                        style={{ color: '#FF5A5A' }}>✕</Btn>
                    </div>
                  ))}
                </div>

                {/* Formulário inline de slot */}
                {slotFormOpen && (
                  <div className="mt-3 p-3 rounded-xl flex flex-col gap-3"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>
                      {slotEditId ? 'Editar bloco' : 'Novo bloco'}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FG label="Tipo">
                        <Select value={slotForm.tipo}
                          onChange={e => setSlotForm(f => ({ ...f, tipo: e.target.value as TipoBloco, matId: '', cttId: '' }))}>
                          {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                      </FG>
                      <FG label="Matéria">
                        <Select value={slotForm.matId}
                          onChange={e => setSlotForm(f => ({ ...f, matId: e.target.value, cttId: '' }))}>
                          <option value="">— sem matéria —</option>
                          {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </Select>
                      </FG>
                    </div>
                    {slotMatObj && (
                      <FG label="Conteúdo">
                        <Select value={slotForm.cttId}
                          onChange={e => setSlotForm(f => ({ ...f, cttId: e.target.value }))}>
                          <option value="">— sem conteúdo —</option>
                          {slotMatObj.conteudos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                      </FG>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <FG label="Meta (ex: 2h30)">
                        <Input value={slotForm.horas}
                          onChange={e => setSlotForm(f => ({ ...f, horas: e.target.value }))}
                          placeholder="2h" />
                      </FG>
                      <FG label="Questões">
                        <div className="flex items-center h-9">
                          <Toggle checked={slotForm.questoes} onChange={v => setSlotForm(f => ({ ...f, questoes: v }))} label="" />
                        </div>
                      </FG>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Btn size="sm" variant="ghost" onClick={() => { setSlotFormOpen(false); setSlotEditId(null) }}>Cancelar</Btn>
                      <Btn size="sm" variant="primary" onClick={saveSlotForm}>✓ Salvar</Btn>
                    </div>
                  </div>
                )}
              </div>

              {/* Nota do dia */}
              <FG label="Nota do dia">
                <Textarea rows={2} value={dayForm.nota}
                  onChange={e => setDayForm(f => ({ ...f, nota: e.target.value }))}
                  placeholder="O que foi estudado, dificuldades, observações..." />
              </FG>
            </div>
          )
        })()}
        <ModalFooter>
          <Btn variant="ghost" onClick={closeDay}>Fechar</Btn>
          <Btn variant="primary" onClick={saveDayPlan}>✓ Salvar nota</Btn>
        </ModalFooter>
      </Modal>
    </div>
  )
}
