import { useState } from 'react'
import { useStore } from '../store/app'
import { Btn, FG, Input, Textarea, Modal, ModalFooter, Notif, SectionHeader, PBar, StatusPill } from '../components/ui'
import { MESES_PT, DIAS_SEMANA, TIPO_COLOR, TIPO_LABEL, monthPfx, fmtHShort } from '../lib/constants'
import type { DiaSemana, TipoBloco } from '../types'

const DIAS_HEADER = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7 // 0=Mon
  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function MensalPage() {
  const { materias, slots, sessoes, dayPlans, setDayPlan } = useStore()

  const [notif, setNotif] = useState('')
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dayForm, setDayForm] = useState({ nota: '', metaH: 0 })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const pfx = monthPfx(viewDate)

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)) }

  const cells = getMonthDays(year, month)

  function dateKey(d: Date) { return d.toISOString().slice(0, 10) }
  function dowIndex(d: Date) { return (d.getDay() + 6) % 7 } // 0=Mon

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
  const metaMin = 7200 // 120h
  const metaMaxMin = 8400 // 140h
  const monthPct = Math.min(100, Math.round(monthMin / metaMin * 100))
  const avgMin = daysStudied > 0 ? Math.round(monthMin / daysStudied) : 0

  // Metas mensais por matéria
  function matMonthMin(matId: number) {
    return monthSessoes.filter(s => s.matId === matId).reduce((a, s) => a + s.durMin, 0)
  }

  // Slots do dia da semana (baseado no índice Mon=0)
  function slotsForDow(dow: number): typeof slots {
    const dia = DIAS_SEMANA[dow] as DiaSemana
    return slots.filter(s => s.dia === dia)
  }

  function openDay(d: Date) {
    setSelectedDate(d)
    const k = dateKey(d)
    const plan = dayPlans[k]
    setDayForm({ nota: plan?.nota ?? '', metaH: plan?.metaH ?? 0 })
  }

  function saveDayPlan() {
    if (!selectedDate) return
    setDayPlan(dateKey(selectedDate), dayForm)
    setSelectedDate(null)
    setNotif('Plano salvo!')
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

            {/* Metas por matéria */}
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
        {/* Header dias da semana */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
          {DIAS_HEADER.map(d => (
            <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--text3)' }}>{d}</div>
          ))}
        </div>

        {/* Células */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isCurrentMonth = cell !== null
            const isToday = cell ? dateKey(cell) === todayKey : false
            const dow = cell ? dowIndex(cell) : -1
            const daySlots = cell ? slotsForDow(dow) : []
            const studied = cell ? dayStudiedMin(cell) : 0
            const plan = cell ? dayPlans[dateKey(cell)] : undefined

            return (
              <div key={i}
                className="border-b border-r relative cursor-pointer transition-all"
                style={{
                  borderColor: 'var(--border)', minHeight: 88,
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

                  {/* Tags de blocos (máx 3) */}
                  {daySlots.slice(0, 3).map((sl, si) => (
                    <div key={si} className="text-[10px] px-1 rounded truncate"
                      style={{ background: `${TIPO_COLOR[sl.tipo]}20`, color: TIPO_COLOR[sl.tipo] }}>
                      {sl.matTxt || TIPO_LABEL[sl.tipo]}
                    </div>
                  ))}

                  {/* Nota do dia */}
                  {plan?.nota && (
                    <div className="text-[10px] truncate italic" style={{ color: 'var(--text3)' }}>
                      {plan.nota}
                    </div>
                  )}

                  {/* Horas estudadas e meta */}
                  <div className="mt-auto flex items-center justify-between">
                    {plan?.metaH ? (
                      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{plan.metaH}h</span>
                    ) : <span />}
                    {studied > 0 && (
                      <span className="text-[10px] font-mono font-semibold" style={{ color: '#22C97A' }}>
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
      <Modal open={selectedDate !== null} onClose={() => setSelectedDate(null)}
        title={selectedDate ? `Plano — ${selectedDate.getDate()}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}` : ''}
        maxWidth={460}>
        {selectedDate && (() => {
          const dk = dateKey(selectedDate)
          const dow = dowIndex(selectedDate)
          const daySlotList = slotsForDow(dow)
          const studied = dayStudiedMin(selectedDate)
          const qs = dayQuestoes(selectedDate)

          return (
            <div className="flex flex-col gap-4">
              {/* Blocos planejados */}
              {daySlotList.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Blocos planejados</div>
                  <div className="flex flex-col gap-1.5">
                    {daySlotList.map(sl => (
                      <div key={sl.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TIPO_COLOR[sl.tipo] }} />
                        <span className="text-xs flex-1 truncate" style={{ color: 'var(--text)' }}>{sl.matTxt || TIPO_LABEL[sl.tipo]}</span>
                        {sl.cttTxt && <span className="text-xs truncate" style={{ color: 'var(--text3)' }}>{sl.cttTxt}</span>}
                        <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text3)' }}>{sl.horas}</span>
                        <StatusPill status={sl.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Horas estudadas */}
              {studied > 0 && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(34,201,122,.08)', border: '1px solid rgba(34,201,122,.2)' }}>
                  <span style={{ color: '#22C97A' }}>✓</span>
                  <span style={{ color: 'var(--text2)' }}>Estudado: </span>
                  <span className="font-mono font-semibold" style={{ color: '#22C97A' }}>{fmtHShort(studied)}</span>
                  {qs > 0 && <span className="text-xs font-mono ml-auto" style={{ color: '#F5A623' }}>{qs}Q</span>}
                </div>
              )}

              <FG label="Nota do dia">
                <Textarea rows={3} value={dayForm.nota} onChange={e => setDayForm(f => ({ ...f, nota: e.target.value }))} placeholder="O que foi estudado, dificuldades, observações..." />
              </FG>
              <FG label="Meta de horas do dia">
                <Input type="number" min={0} max={24} value={dayForm.metaH || ''} onChange={e => setDayForm(f => ({ ...f, metaH: +e.target.value }))} placeholder="Ex: 6" />
              </FG>
            </div>
          )
        })()}
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setSelectedDate(null)}>Fechar</Btn>
          <Btn variant="primary" onClick={saveDayPlan}>✓ Salvar</Btn>
        </ModalFooter>
      </Modal>
    </div>
  )
}
