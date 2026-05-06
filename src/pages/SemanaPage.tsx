import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/app'
import { useTimer } from '../store/timer'
import { Card, Btn, FG, Select, Input, Toggle, Modal, ModalFooter, Notif, SectionHeader, StatusPill } from '../components/ui'
import { DIAS_SEMANA, TIPO_LABEL, TIPO_COLOR, TIPO_BG, TIPO_BORDER, TIPO_TEXT, getWeekDates, dateKey, MESES_PT_SHORT, fmtHShort } from '../lib/constants'
import type { TipoBloco, SlotSemana, DiaSemana } from '../types'

function dowIndex(d: Date) { return (d.getDay() + 6) % 7 } // Mon=0 … Sun=6

export default function SemanaPage() {
  const { materias, slots, addSlot, updateSlot, deleteSlot, cycleSlotStatus, resetSemana, sessoes } = useStore()
  const navigate = useNavigate()

  const [notif, setNotif] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)

  // slot modal
  const [showSlot, setShowSlot] = useState(false)
  const [editSlotId, setEditSlotId] = useState<number | null>(null)
  const [slotDay, setSlotDay] = useState<Date | null>(null)
  const [slotForm, setSlotForm] = useState({
    dia: 'Segunda' as DiaSemana, tipo: 'base' as TipoBloco,
    matId: '', cttId: '', horas: '2h', questoes: false, recorrente: false,
  })

  // recurring confirm dialog
  const [recurringConfirm, setRecurringConfirm] = useState<{
    action: 'edit' | 'delete'; slot: SlotSemana; date: Date
  } | null>(null)

  const weekDates = getWeekDates(weekOffset)
  const isCurrentWeek = weekOffset === 0

  function weekLabel() {
    const s = weekDates[0], e = weekDates[6]
    return `${s.getDate()} ${MESES_PT_SHORT[s.getMonth()]} – ${e.getDate()} ${MESES_PT_SHORT[e.getMonth()]}`
  }

  function isRecurring(sl: SlotSemana) {
    return sl.date == null || sl.recorrente === true
  }

  function slotsForDate(d: Date): SlotSemana[] {
    const dk = dateKey(d)
    const dow = DIAS_SEMANA[dowIndex(d)] as DiaSemana
    return slots.filter(sl => {
      const excs = sl.exceptions || []
      if (excs.includes(dk)) return false
      if (sl.date != null) {
        return sl.recorrente
          ? sl.dia === dow && dk >= sl.date
          : sl.date === dk
      }
      return sl.dia === dow // legacy DEF_SEMANA: recurring by day name
    })
  }

  function launchTimerFromSlot(slot: SlotSemana) {
    useTimer.getState().setConfig({
      tipo: slot.tipo, matId: slot.matId, cttId: slot.cttId,
      materia: slot.matTxt, conteudo: slot.cttTxt,
      questoes: slot.questoes, duracaoMin: 25,
    })
    navigate('/timer')
  }

  function openNew() {
    setEditSlotId(null); setSlotDay(null)
    setSlotForm({ dia: 'Segunda', tipo: 'base', matId: '', cttId: '', horas: '2h', questoes: false, recorrente: false })
    setShowSlot(true)
  }

  function openNewForDay(d: Date) {
    setEditSlotId(null); setSlotDay(d)
    setSlotForm({
      dia: DIAS_SEMANA[dowIndex(d)] as DiaSemana,
      tipo: 'base', matId: '', cttId: '', horas: '2h', questoes: false, recorrente: false,
    })
    setShowSlot(true)
  }

  function openEditDirect(sl: SlotSemana) {
    setEditSlotId(sl.id)
    const sd = (sl.date && !sl.recorrente) ? new Date(sl.date + 'T12:00:00') : null
    setSlotDay(sd)
    setSlotForm({
      dia: sl.dia, tipo: sl.tipo,
      matId: sl.matId ? String(sl.matId) : '',
      cttId: sl.cttId ? String(sl.cttId) : '',
      horas: sl.horas, questoes: sl.questoes, recorrente: sl.recorrente ?? false,
    })
    setShowSlot(true)
  }

  function handleEditClick(sl: SlotSemana, date: Date) {
    if (isRecurring(sl)) setRecurringConfirm({ action: 'edit', slot: sl, date })
    else openEditDirect(sl)
  }

  function handleDeleteClick(sl: SlotSemana, date: Date) {
    if (isRecurring(sl)) setRecurringConfirm({ action: 'delete', slot: sl, date })
    else { deleteSlot(sl.id); setNotif('Bloco removido.') }
  }

  function confirmOnlyThis() {
    if (!recurringConfirm) return
    const { action, slot, date } = recurringConfirm
    const dk = dateKey(date)
    updateSlot(slot.id, { exceptions: [...(slot.exceptions || []), dk] })
    if (action === 'edit') {
      setEditSlotId(null); setSlotDay(date)
      setSlotForm({
        dia: slot.dia, tipo: slot.tipo,
        matId: slot.matId ? String(slot.matId) : '',
        cttId: slot.cttId ? String(slot.cttId) : '',
        horas: slot.horas, questoes: slot.questoes, recorrente: false,
      })
      setShowSlot(true)
    } else {
      setNotif('Bloco removido para este dia.')
    }
    setRecurringConfirm(null)
  }

  function confirmAll() {
    if (!recurringConfirm) return
    const { action, slot } = recurringConfirm
    if (action === 'delete') { deleteSlot(slot.id); setNotif('Bloco removido de todas as semanas.') }
    else openEditDirect(slot)
    setRecurringConfirm(null)
  }

  function saveSlot() {
    const mat = materias.find(m => String(m.id) === slotForm.matId)
    const ctt = mat?.conteudos.find(c => String(c.id) === slotForm.cttId)
    const payload: Omit<SlotSemana, 'id'> = {
      dia: slotForm.dia, tipo: slotForm.tipo,
      matId: mat?.id ?? null, cttId: ctt?.id ?? null,
      matTxt: mat?.nome ?? '', cttTxt: ctt?.nome ?? '',
      horas: slotForm.horas, questoes: slotForm.questoes, status: 0,
    }
    if (slotDay != null) {
      payload.date = dateKey(slotDay)
      if (slotForm.recorrente) payload.recorrente = true
    }
    if (editSlotId) { updateSlot(editSlotId, payload); setNotif('Bloco atualizado!') }
    else { addSlot({ id: Date.now(), ...payload }); setNotif('Bloco adicionado!') }
    setShowSlot(false)
  }

  function dayStudiedMin(date: Date) {
    const dk = dateKey(date)
    return sessoes.filter(s => s.date === dk).reduce((a, s) => a + s.durMin, 0)
  }

  function slotStudiedMin(slot: SlotSemana, date: Date) {
    const dk = dateKey(date)
    return sessoes.filter(s =>
      s.date === dk && s.tipo === slot.tipo &&
      (slot.matId == null || s.matId === slot.matId) &&
      (slot.cttId == null || s.cttId === slot.cttId)
    ).reduce((a, s) => a + s.durMin, 0)
  }

  function slotQuestoes(slot: SlotSemana, date: Date) {
    const dk = dateKey(date)
    return sessoes.filter(s =>
      s.date === dk && s.tipo === slot.tipo &&
      (slot.matId == null || s.matId === slot.matId) &&
      (slot.cttId == null || s.cttId === slot.cttId)
    ).reduce((a, s) => a + (s.questoesCount || 0), 0)
  }

  const slotMatObj = materias.find(m => String(m.id) === slotForm.matId)

  return (
    <div className="pt-6 flex flex-col gap-4">
      {notif && <Notif msg={notif} onDone={() => setNotif('')} />}

      <SectionHeader title="Semana" sub="Planejamento semanal por dia"
        right={
          <>
            <div className="flex items-center gap-1">
              <Btn size="icon" variant="ghost" onClick={() => setWeekOffset(o => o - 1)}>‹</Btn>
              <div className="flex items-center gap-1.5 px-2">
                <span className="text-xs font-mono" style={{ color: 'var(--text2)' }}>{weekLabel()}</span>
                {isCurrentWeek && <span className="w-2 h-2 rounded-full bg-[#22C97A]" />}
              </div>
              <Btn size="icon" variant="ghost" onClick={() => setWeekOffset(o => o + 1)}>›</Btn>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => { if (confirm('Restaurar semana padrão?')) { resetSemana(); setNotif('Semana restaurada!') } }}>↺ Padrão</Btn>
            <Btn size="sm" variant="primary" onClick={openNew}>+ Bloco</Btn>
          </>
        }
      />

      <div className="flex flex-col gap-2">
        {DIAS_SEMANA.map((dia, i) => {
          const date = weekDates[i]
          const daySlotList = slotsForDate(date)
          const studiedMin = dayStudiedMin(date)
          const isToday = dateKey(date) === dateKey(new Date())

          return (
            <Card key={dia} className={isToday ? 'ring-1 ring-[#4F7CFF]' : ''}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-20 pt-1">
                  <div className="text-sm font-semibold" style={{ color: isToday ? '#4F7CFF' : 'var(--text)' }}>{dia}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
                    {date.getDate()}/{String(date.getMonth() + 1).padStart(2, '0')}
                  </div>
                </div>

                <div className="flex-1 flex flex-row gap-2 flex-wrap min-w-0">
                  {daySlotList.length === 0
                    ? <span className="text-xs self-center" style={{ color: 'var(--text3)' }}>Sem blocos planejados</span>
                    : daySlotList.map(slot => {
                      const studied = slotStudiedMin(slot, date)
                      const questCount = slotQuestoes(slot, date)
                      const tc = TIPO_COLOR[slot.tipo]
                      return (
                        <div key={slot.id}
                          className="group relative rounded-xl px-3 py-2 flex flex-col gap-1 min-w-[140px] max-w-[200px]"
                          style={{ background: TIPO_BG[slot.tipo], border: `1px solid ${TIPO_BORDER[slot.tipo]}` }}>
                          <button
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ background: tc, color: '#fff' }}
                            onClick={() => launchTimerFromSlot(slot)}
                            title="Iniciar no timer">▶</button>

                          <div className="text-xs font-bold truncate pr-5" style={{ color: TIPO_TEXT[slot.tipo] }}>{slot.matTxt || TIPO_LABEL[slot.tipo]}</div>
                          {slot.cttTxt && <div className="text-xs truncate" style={{ color: TIPO_TEXT[slot.tipo], opacity: 0.75 }}>{slot.cttTxt}</div>}

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{slot.horas}</span>
                            {slot.questoes && <span className="text-xs" style={{ color: 'var(--text3)' }}>✓Q</span>}
                            {isRecurring(slot) && <span className="text-xs" style={{ color: 'var(--text3)' }}>↻</span>}
                          </div>

                          {(studied > 0 || questCount > 0) && (
                            <div className="flex gap-2 items-center">
                              {studied > 0 && <span className="text-xs font-mono font-semibold" style={{ color: '#22C97A' }}>{fmtHShort(studied)}</span>}
                              {questCount > 0 && <span className="text-xs font-mono font-bold px-1 rounded" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{questCount}Q</span>}
                            </div>
                          )}

                          <div className="flex items-center gap-1 justify-between">
                            <StatusPill status={slot.status} onClick={() => cycleSlotStatus(slot.id)} />
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                              <button className="w-5 h-5 rounded text-xs flex items-center justify-center" style={{ color: 'var(--text2)' }} onClick={() => handleEditClick(slot, date)}>✏</button>
                              <button className="w-5 h-5 rounded text-xs flex items-center justify-center" style={{ color: '#FF5A5A' }} onClick={() => handleDeleteClick(slot, date)}>✕</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1 pt-1">
                  {studiedMin > 0 && (
                    <span className="text-sm font-mono font-semibold" style={{ color: '#22C97A' }}>{fmtHShort(studiedMin)}</span>
                  )}
                  <Btn size="icon" variant="ghost" onClick={() => openNewForDay(date)} title="Adicionar bloco para este dia">+</Btn>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap mt-1 px-1">
        {(Object.entries(TIPO_LABEL) as [TipoBloco, string][]).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: TIPO_COLOR[k] }} />
            <span style={{ color: 'var(--text3)' }}>{l}</span>
          </span>
        ))}
        <span className="text-xs" style={{ color: 'var(--text3)' }}>· ↻ repete semanalmente · hover no bloco para ▶</span>
      </div>

      {/* Modal: Bloco */}
      <Modal open={showSlot} onClose={() => setShowSlot(false)} title={editSlotId ? 'Editar Bloco' : 'Adicionar Bloco'} maxWidth={440}>
        <div className="flex flex-col gap-3">
          {slotDay != null ? (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
              Dia: <strong style={{ color: 'var(--text)' }}>{slotForm.dia}, {slotDay.getDate()}/{String(slotDay.getMonth() + 1).padStart(2, '0')}</strong>
            </div>
          ) : (
            <FG label="Dia da semana">
              <Select value={slotForm.dia} onChange={e => setSlotForm(f => ({ ...f, dia: e.target.value as DiaSemana }))}>
                {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FG>
          )}
          <FG label="Tipo">
            <Select value={slotForm.tipo} onChange={e => setSlotForm(f => ({ ...f, tipo: e.target.value as TipoBloco }))}>
              {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </FG>
          <FG label="Matéria">
            <Select value={slotForm.matId} onChange={e => setSlotForm(f => ({ ...f, matId: e.target.value, cttId: '' }))}>
              <option value="">— sem matéria —</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </Select>
          </FG>
          {slotMatObj && (
            <FG label="Conteúdo">
              <Select value={slotForm.cttId} onChange={e => setSlotForm(f => ({ ...f, cttId: e.target.value }))}>
                <option value="">— sem conteúdo —</option>
                {slotMatObj.conteudos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </FG>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FG label="Meta (ex: 2h30)">
              <Input value={slotForm.horas} onChange={e => setSlotForm(f => ({ ...f, horas: e.target.value }))} placeholder="2h30" />
            </FG>
            <FG label="Questões">
              <div className="flex items-center h-9"><Toggle checked={slotForm.questoes} onChange={v => setSlotForm(f => ({ ...f, questoes: v }))} label="" /></div>
            </FG>
          </div>
          {slotDay != null && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text2)' }}>Repetir semanalmente</span>
              <Toggle checked={slotForm.recorrente} onChange={v => setSlotForm(f => ({ ...f, recorrente: v }))} label="" />
            </div>
          )}
        </div>
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setShowSlot(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveSlot}>✓ Salvar</Btn>
        </ModalFooter>
      </Modal>

      {/* Modal: Confirmar ação em bloco recorrente */}
      <Modal open={recurringConfirm != null} onClose={() => setRecurringConfirm(null)}
        title={recurringConfirm?.action === 'delete' ? 'Remover bloco recorrente' : 'Editar bloco recorrente'}
        maxWidth={400}>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          Este bloco se repete semanalmente. O que deseja {recurringConfirm?.action === 'delete' ? 'remover' : 'alterar'}?
        </p>
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setRecurringConfirm(null)}>Cancelar</Btn>
          <Btn variant="ghost" onClick={confirmOnlyThis}>Apenas este dia</Btn>
          <Btn variant="primary" onClick={confirmAll}>Todas as semanas</Btn>
        </ModalFooter>
      </Modal>
    </div>
  )
}
