import { useState } from 'react'
import { useStore } from '../store/app'
import { Btn, FG, Input, Select, Toggle, Modal, ModalFooter, Notif, SectionHeader, Empty } from '../components/ui'
import { TIPO_LABEL, TIPO_COLOR, monthPfx, MESES_PT, fmtHShort, materiasDoMes } from '../lib/constants'
import type { TipoBloco, Sessao } from '../types'
import ManualSessionModal, { type ManualSaveData } from '../components/ManualSessionModal'

export default function RegistrosPage() {
  const { materias, sessoes, addSessao, updateSessao, deleteSessao, ensureSlotForSessao } = useStore()

  const [notif, setNotif] = useState('')
  const [showManual, setShowManual] = useState(false)

  function saveManual(form: ManualSaveData) {
    const m = materias.find(x => String(x.id) === form.matId)
    const c = m?.conteudos.find(x => String(x.id) === form.cttId)
    const newSess: Sessao = {
      id: Date.now(), date: form.data, tipo: form.tipo,
      matId: m?.id ?? null, cttId: c?.id ?? null,
      materia: m?.nome ?? '', conteudo: c?.nome ?? '',
      questoes: form.questoes, questoesCount: form.questoes ? form.qCount : 0,
      durMin: form.durMin, time: form.startTime,
      manual: true, obs: form.obs || undefined,
    }
    addSessao(newSess)
    ensureSlotForSessao(newSess)
    setShowManual(false); setNotif('Sessão registrada!')
  }
  const [monthDate, setMonthDate] = useState(new Date())
  const [filterMat, setFilterMat] = useState('')

  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Sessao>>({})
  const [editId, setEditId] = useState<number | null>(null)

  const pfx = monthPfx(monthDate)
  const monthMaterias = materiasDoMes(materias, pfx)

  function prevMonth() { const d = new Date(monthDate); d.setMonth(d.getMonth() - 1); setMonthDate(d) }
  function nextMonth() { const d = new Date(monthDate); d.setMonth(d.getMonth() + 1); setMonthDate(d) }

  const filtered = sessoes
    .filter(s => s.date.startsWith(pfx))
    .filter(s => !filterMat || String(s.matId) === filterMat)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  const totalMin = filtered.reduce((a, s) => a + s.durMin, 0)
  const totalQ = filtered.reduce((a, s) => a + (s.questoesCount || 0), 0)

  function openEdit(s: Sessao) {
    setEditId(s.id)
    setEditForm({ ...s })
    setShowEdit(true)
  }

  function saveEdit() {
    if (!editId || !editForm.durMin) return
    updateSessao(editId, editForm)
    setShowEdit(false)
    setNotif('Sessão atualizada!')
  }

  function handleDelete(id: number) {
    if (confirm('Excluir esta sessão?')) {
      deleteSessao(id)
      setNotif('Sessão excluída.')
    }
  }

  // Group by date for display
  const byDate: Record<string, Sessao[]> = {}
  filtered.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = []
    byDate[s.date].push(s)
  })
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  function fmtDate(d: string) {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  const editMaterias = materiasDoMes(materias, editForm.date ? monthPfx(new Date(`${editForm.date}T12:00:00`)) : pfx)
  const editMatObj = editMaterias.find(m => String(m.id) === String(editForm.matId))

  return (
    <div className="pt-6 flex flex-col gap-5">
      {notif && <Notif msg={notif} onDone={() => setNotif('')} />}

      <SectionHeader title="Registros"
        sub={`Sessões de ${MESES_PT[monthDate.getMonth()]} ${monthDate.getFullYear()}`}
        right={
          <>
            <Btn size="sm" variant="ghost" onClick={() => setShowManual(true)}>✏ Registrar manualmente</Btn>
            <div className="flex items-center gap-1">
              <Btn size="icon" variant="ghost" onClick={prevMonth}>‹</Btn>
              <span className="text-xs font-mono px-2" style={{ color: 'var(--text2)' }}>
                {MESES_PT[monthDate.getMonth()]} {monthDate.getFullYear()}
              </span>
              <Btn size="icon" variant="ghost" onClick={nextMonth}>›</Btn>
            </div>
            <select
              value={filterMat}
              onChange={e => setFilterMat(e.target.value)}
              className="text-xs rounded-lg px-2 py-1.5 outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              <option value="">Todas as matérias</option>
              {monthMaterias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </>
        }
      />

      {/* Totais */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-4 px-1">
          <span className="text-sm font-mono font-semibold" style={{ color: '#4F7CFF' }}>{filtered.length} sessões</span>
          <span className="text-sm font-mono font-semibold" style={{ color: '#22C97A' }}>{fmtHShort(totalMin)}</span>
          {totalQ > 0 && <span className="text-sm font-mono font-bold px-2 py-0.5 rounded" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{totalQ} questões</span>}
        </div>
      )}

      {dates.length === 0 && (
        <Empty>Nenhuma sessão registrada em {MESES_PT[monthDate.getMonth()]}.</Empty>
      )}

      {dates.map(date => {
        const daySessoes = byDate[date]
        const dayMin = daySessoes.reduce((a, s) => a + s.durMin, 0)
        const dayQ = daySessoes.reduce((a, s) => a + (s.questoesCount || 0), 0)

        return (
          <div key={date} className="flex flex-col gap-1">
            {/* Date header */}
            <div className="flex items-center gap-3 px-1 mb-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>{fmtDate(date)}</span>
              <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs font-mono" style={{ color: '#22C97A' }}>{fmtHShort(dayMin)}</span>
              {dayQ > 0 && <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{dayQ}Q</span>}
            </div>

            {/* Sessions */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {daySessoes.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < daySessoes.length - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold shrink-0"
                    style={{ background: `${TIPO_COLOR[s.tipo]}22`, color: TIPO_COLOR[s.tipo] }}>
                    {TIPO_LABEL[s.tipo]}
                  </span>
                  {s.manual && <span className="text-xs shrink-0" style={{ color: 'var(--text3)' }}>✏</span>}
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
                    {s.materia || <span style={{ color: 'var(--text3)' }}>sem matéria</span>}
                    {s.conteudo && <span style={{ color: 'var(--text2)' }}> · {s.conteudo}</span>}
                  </span>
                  {s.questoesCount > 0 && (
                    <span className="font-mono text-xs font-bold shrink-0 px-1.5 py-0.5 rounded"
                      style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{s.questoesCount}Q</span>
                  )}
                  <span className="font-mono text-xs shrink-0" style={{ color: '#22C97A' }}>{s.durMin}min</span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--text3)' }}>{s.time}</span>
                  {s.obs && (
                    <span className="text-xs shrink-0" title={s.obs} style={{ color: 'var(--text3)' }}>💬</span>
                  )}
                  <Btn size="icon" variant="ghost" onClick={() => openEdit(s)}>✏</Btn>
                  <Btn size="icon" variant="ghost" onClick={() => handleDelete(s.id)} style={{ color: '#FF5A5A' }}>✕</Btn>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <ManualSessionModal
        open={showManual}
        onClose={() => setShowManual(false)}
        onSave={saveManual}
        materias={materias}
        notify={setNotif}
      />

      {/* Modal: editar sessão */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar sessão" maxWidth={480}>
        {editForm && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <FG label="Data"><Input type="date" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></FG>
              <FG label="Horário"><Input type="time" value={editForm.time || ''} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} /></FG>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FG label="Duração (min)">
                <Input type="number" min={1} max={720} value={editForm.durMin || 0} onChange={e => setEditForm(f => ({ ...f, durMin: +e.target.value }))} />
              </FG>
              <FG label="Tipo">
                <Select value={editForm.tipo || 'base'} onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value as TipoBloco }))}>
                  {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </FG>
            </div>
            <FG label="Matéria">
              <Select value={editForm.matId ? String(editForm.matId) : ''} onChange={e => {
                const m = editMaterias.find(x => String(x.id) === e.target.value)
                setEditForm(f => ({ ...f, matId: m?.id ?? null, materia: m?.nome ?? '', cttId: null, conteudo: '' }))
              }}>
                <option value="">— sem matéria —</option>
                {editMaterias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>
            </FG>
            {editMatObj && (
              <FG label="Conteúdo">
                <Select value={editForm.cttId ? String(editForm.cttId) : ''} onChange={e => {
                  const c = editMatObj.conteudos.find(x => String(x.id) === e.target.value)
                  setEditForm(f => ({ ...f, cttId: c?.id ?? null, conteudo: c?.nome ?? '' }))
                }}>
                  <option value="">— sem conteúdo —</option>
                  {editMatObj.conteudos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              </FG>
            )}
            <FG label="Questões feitas">
              <div className="flex items-center gap-4">
                <Toggle checked={editForm.questoes || false} onChange={v => setEditForm(f => ({ ...f, questoes: v }))} label="" />
                {editForm.questoes && (
                  <Input type="number" min={0} value={editForm.questoesCount || 0}
                    onChange={e => setEditForm(f => ({ ...f, questoesCount: +e.target.value }))} style={{ width: 80 }} />
                )}
              </div>
            </FG>
            <FG label="Observação">
              <textarea value={editForm.obs || ''} onChange={e => setEditForm(f => ({ ...f, obs: e.target.value }))} rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit' }} />
            </FG>
          </div>
        )}
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveEdit}>✓ Salvar</Btn>
        </ModalFooter>
      </Modal>
    </div>
  )
}
