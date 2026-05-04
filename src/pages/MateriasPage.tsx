import { useState } from 'react'
import { useStore } from '../store/app'
import { Card, Btn, FG, Select, Input, Toggle, Modal, ModalFooter, Notif, Empty, SectionHeader, StatusPill, PBar } from '../components/ui'
import { CATALOGO, TIPO_LABEL, TIPO_COLOR, monthPfx, MESES_PT } from '../lib/constants'
import type { TipoBloco, StatusConteudo, Materia, Conteudo } from '../types'

const PRIORIDADE_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const PRIORIDADE_COLOR = { alta: '#FF5A5A', media: '#F5A623', baixa: '#22C97A' }

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold border"
      style={{ background: `${color}18`, color, borderColor: `${color}40` }}>{label}</span>
  )
}

export default function MateriasPage() {
  const { materias, addMateria, updateMateria, deleteMateria, addConteudo, updateConteudo, deleteConteudo, cycleStatus, sessoes, cttDoneMin, cttQuestoes } = useStore()

  const [notif, setNotif] = useState('')
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [monthDate, setMonthDate] = useState(new Date())

  // Materia modal
  const [showMat, setShowMat] = useState(false)
  const [editMatId, setEditMatId] = useState<number | null>(null)
  const [matForm, setMatForm] = useState({ nome: '', tipo: 'base' as TipoBloco, prioridade: 'media' as 'alta' | 'media' | 'baixa' })

  // Conteudo modal
  const [showCtt, setShowCtt] = useState(false)
  const [editCttId, setEditCttId] = useState<number | null>(null)
  const [cttForm, setCttForm] = useState({ matId: '', catalogoSel: '', nome: '', metaH: 0, questoes: false, status: 0 as StatusConteudo })

  const pfx = monthPfx(monthDate)
  const currentPfx = monthPfx(new Date())
  const isCurrentMonth = pfx === currentPfx

  function prevMonth() { const d = new Date(monthDate); d.setMonth(d.getMonth() - 1); setMonthDate(d) }
  function nextMonth() { const d = new Date(monthDate); d.setMonth(d.getMonth() + 1); setMonthDate(d) }

  // Matérias do mês: month-specific + legacy (sem month) apenas no mês atual
  const monthMaterias = materias.filter(m => m.month === pfx || (isCurrentMonth && !m.month))

  // Matérias do mês anterior (para copiar)
  const prevDate = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
  const prevPfx = monthPfx(prevDate)
  const prevMonthMaterias = materias.filter(m => m.month === prevPfx)

  function copyFromPrevMonth() {
    if (prevMonthMaterias.length === 0) return
    prevMonthMaterias.forEach((mat, i) => {
      const newId = Date.now() + i
      addMateria({
        id: newId,
        nome: mat.nome,
        tipo: mat.tipo,
        prioridade: mat.prioridade,
        month: pfx,
        conteudos: mat.conteudos.map((c, j) => ({ ...c, id: newId * 100 + j, status: 0 as StatusConteudo })),
      })
    })
    setNotif(`${prevMonthMaterias.length} matéria(s) copiada(s) de ${MESES_PT[prevDate.getMonth()]}!`)
  }

  function openNewMat() { setEditMatId(null); setMatForm({ nome: '', tipo: 'base', prioridade: 'media' }); setShowMat(true) }
  function openEditMat(m: Materia) { setEditMatId(m.id); setMatForm({ nome: m.nome, tipo: m.tipo, prioridade: m.prioridade }); setShowMat(true) }
  function saveMat() {
    if (!matForm.nome.trim()) { setNotif('Informe o nome da matéria.'); return }
    if (editMatId) {
      updateMateria(editMatId, matForm)
      setNotif('Matéria atualizada!')
    } else {
      addMateria({ id: Date.now(), nome: matForm.nome.trim(), tipo: matForm.tipo, prioridade: matForm.prioridade, month: pfx, conteudos: [] })
      setNotif('Matéria adicionada!')
    }
    setShowMat(false)
  }
  function delMat(id: number) { if (confirm('Excluir matéria e todos os seus conteúdos?')) { deleteMateria(id); setNotif('Matéria excluída.') } }

  function openNewCtt(matId: number) {
    setEditCttId(null)
    setCttForm({ matId: String(matId), catalogoSel: '', nome: '', metaH: 0, questoes: false, status: 0 })
    setShowCtt(true)
  }
  function openEditCtt(matId: number, c: Conteudo) {
    setEditCttId(c.id)
    setCttForm({ matId: String(matId), catalogoSel: '', nome: c.nome, metaH: c.metaH, questoes: c.questoes, status: c.status })
    setShowCtt(true)
  }
  function saveCtt() {
    if (!cttForm.nome.trim()) { setNotif('Informe o nome do conteúdo.'); return }
    const matId = parseInt(cttForm.matId)
    const payload: Conteudo = { id: editCttId ?? Date.now(), nome: cttForm.nome.trim(), metaH: cttForm.metaH, questoes: cttForm.questoes, status: cttForm.status }
    if (editCttId) { updateConteudo(matId, editCttId, payload); setNotif('Conteúdo atualizado!') }
    else { addConteudo(matId, payload); setNotif('Conteúdo adicionado!') }
    setShowCtt(false)
  }
  function delCtt(matId: number, cttId: number) { if (confirm('Excluir conteúdo?')) { deleteConteudo(matId, cttId); setNotif('Conteúdo excluído.') } }

  function matDoneMin(mat: Materia) {
    return sessoes.filter(s => s.matId === mat.id && s.date.startsWith(pfx)).reduce((a, s) => a + s.durMin, 0)
  }
  function matMetaH(mat: Materia) { return mat.conteudos.reduce((a, c) => a + c.metaH, 0) }

  const cttCatOptions = (matNome: string) => CATALOGO[matNome] ?? []

  return (
    <div className="pt-6 flex flex-col gap-5">
      {notif && <Notif msg={notif} onDone={() => setNotif('')} />}

      <SectionHeader title="Matérias"
        sub={`Plano de estudos — ${MESES_PT[monthDate.getMonth()]} ${monthDate.getFullYear()}`}
        right={
          <>
            <div className="flex items-center gap-1">
              <Btn size="icon" variant="ghost" onClick={prevMonth}>‹</Btn>
              <span className="text-xs font-mono px-2" style={{ color: 'var(--text2)' }}>
                {MESES_PT[monthDate.getMonth()]} {monthDate.getFullYear()}
              </span>
              <Btn size="icon" variant="ghost" onClick={nextMonth}>›</Btn>
            </div>
            {prevMonthMaterias.length > 0 && (
              <Btn size="sm" variant="ghost" onClick={copyFromPrevMonth}>
                ⎘ Copiar de {MESES_PT[prevDate.getMonth()]}
              </Btn>
            )}
            <Btn variant="primary" size="sm" onClick={openNewMat}>+ Nova Matéria</Btn>
          </>
        }
      />

      {monthMaterias.length === 0 && (
        <Empty>
          Nenhuma matéria para {MESES_PT[monthDate.getMonth()]}.
          {prevMonthMaterias.length > 0
            ? ` Clique em "Copiar de ${MESES_PT[prevDate.getMonth()]}" para importar o plano anterior.`
            : ' Clique em "+ Nova Matéria" para começar.'}
        </Empty>
      )}

      {monthMaterias.map(mat => {
        const isOpen = expanded[mat.id]
        const doneMin = matDoneMin(mat)
        const metaH = matMetaH(mat)
        const pct = metaH > 0 ? Math.min(100, Math.round(doneMin / 60 / metaH * 100)) : 0
        const tipoColor = TIPO_COLOR[mat.tipo]

        return (
          <Card key={mat.id} className="overflow-hidden">
            <div className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => setExpanded(e => ({ ...e, [mat.id]: !e[mat.id] }))}>
              <span className="text-xs font-mono w-5 text-center" style={{ color: 'var(--text3)' }}>{isOpen ? '▾' : '▸'}</span>
              <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--text)' }}>{mat.nome}</span>
              <Badge label={TIPO_LABEL[mat.tipo]} color={tipoColor} />
              <Badge label={PRIORIDADE_LABEL[mat.prioridade]} color={PRIORIDADE_COLOR[mat.prioridade]} />
              <span className="text-xs font-mono" style={{ color: '#22C97A' }}>
                {(doneMin / 60).toFixed(1)}h{metaH > 0 ? ` / ${metaH}h` : ''}
              </span>
              <div style={{ width: 80 }}><PBar pct={pct} color={tipoColor} /></div>
              <Btn size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openEditMat(mat) }}>✏</Btn>
              <Btn size="icon" variant="ghost" onClick={e => { e.stopPropagation(); delMat(mat.id) }} style={{ color: '#FF5A5A' }}>✕</Btn>
              <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openNewCtt(mat.id) }}>+ Conteúdo</Btn>
            </div>

            {isOpen && (
              <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                {mat.conteudos.length === 0
                  ? <Empty>Nenhum conteúdo. Clique em "+ Conteúdo" para adicionar.</Empty>
                  : (
                    <table className="w-full text-sm border-separate" style={{ borderSpacing: '0 4px' }}>
                      <thead>
                        <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                          <th className="text-left pl-2 pb-1">Tópico</th>
                          <th className="text-right pb-1 pr-4">Horas ({MESES_PT[monthDate.getMonth()].slice(0, 3)})</th>
                          <th className="text-center pb-1">Questões</th>
                          <th className="text-center pb-1">Status</th>
                          <th className="text-right pb-1">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mat.conteudos.map(c => {
                          const cMin = cttDoneMin(mat.id, c.id, pfx)
                          const cQ = cttQuestoes(mat.id, c.id, pfx)
                          const cPct = c.metaH > 0 ? Math.min(100, Math.round(cMin / 60 / c.metaH * 100)) : 0
                          return (
                            <tr key={c.id} style={{ background: 'var(--surface2)', borderRadius: 8 }}>
                              <td className="pl-2 py-2 rounded-l-lg" style={{ color: 'var(--text)', maxWidth: 280 }}>
                                <div className="truncate">{c.nome}</div>
                                {c.metaH > 0 && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <div style={{ flex: 1, minWidth: 60 }}><PBar pct={cPct} height={3} color={tipoColor} /></div>
                                    <span className="text-xs font-mono" style={{ color: 'var(--text3)', whiteSpace: 'nowrap' }}>{c.metaH}h meta</span>
                                  </div>
                                )}
                              </td>
                              <td className="text-right pr-4 py-2 font-mono text-xs" style={{ color: '#22C97A', whiteSpace: 'nowrap' }}>
                                {(cMin / 60).toFixed(1)}h
                              </td>
                              <td className="text-center py-2">
                                {cQ > 0
                                  ? <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{cQ}Q</span>
                                  : <span style={{ color: 'var(--text3)' }}>—</span>}
                              </td>
                              <td className="text-center py-2">
                                <StatusPill status={c.status} onClick={() => cycleStatus(mat.id, c.id)} />
                              </td>
                              <td className="text-right py-2 pr-2 rounded-r-lg">
                                <div className="flex gap-1 justify-end">
                                  <Btn size="icon" variant="ghost" onClick={() => openEditCtt(mat.id, c)}>✏</Btn>
                                  <Btn size="icon" variant="ghost" onClick={() => delCtt(mat.id, c.id)} style={{ color: '#FF5A5A' }}>✕</Btn>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
              </div>
            )}
          </Card>
        )
      })}

      {/* Modal: Matéria */}
      <Modal open={showMat} onClose={() => setShowMat(false)} title={editMatId ? 'Editar Matéria' : 'Nova Matéria'} maxWidth={420}>
        <div className="flex flex-col gap-3">
          <FG label="Nome"><Input value={matForm.nome} onChange={e => setMatForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Direito Constitucional" /></FG>
          <FG label="Tipo">
            <Select value={matForm.tipo} onChange={e => setMatForm(f => ({ ...f, tipo: e.target.value as TipoBloco }))}>
              {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </FG>
          <FG label="Prioridade">
            <Select value={matForm.prioridade} onChange={e => setMatForm(f => ({ ...f, prioridade: e.target.value as any }))}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </Select>
          </FG>
        </div>
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setShowMat(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveMat}>✓ Salvar</Btn>
        </ModalFooter>
      </Modal>

      {/* Modal: Conteúdo */}
      <Modal open={showCtt} onClose={() => setShowCtt(false)} title={editCttId ? 'Editar Conteúdo' : 'Novo Conteúdo'} maxWidth={460}>
        <div className="flex flex-col gap-3">
          <FG label="Matéria">
            <Select value={cttForm.matId} onChange={e => setCttForm(f => ({ ...f, matId: e.target.value, catalogoSel: '' }))}>
              <option value="">— selecione —</option>
              {monthMaterias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </Select>
          </FG>
          {cttForm.matId && (() => {
            const mat = monthMaterias.find(m => String(m.id) === cttForm.matId)
            const opts = mat ? cttCatOptions(mat.nome) : []
            return opts.length > 0 ? (
              <FG label="Selecionar do catálogo">
                <Select value={cttForm.catalogoSel} onChange={e => setCttForm(f => ({ ...f, catalogoSel: e.target.value, nome: e.target.value || f.nome }))}>
                  <option value="">— escolha um tópico —</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </Select>
              </FG>
            ) : null
          })()}
          <FG label="Nome do conteúdo">
            <Input value={cttForm.nome} onChange={e => setCttForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Concordância verbal" />
          </FG>
          <div className="grid grid-cols-2 gap-3">
            <FG label="Meta em horas">
              <Input type="number" min={0} value={cttForm.metaH} onChange={e => setCttForm(f => ({ ...f, metaH: +e.target.value }))} />
            </FG>
            <FG label="Status">
              <Select value={cttForm.status} onChange={e => setCttForm(f => ({ ...f, status: +e.target.value as StatusConteudo }))}>
                <option value={0}>Não iniciado</option>
                <option value={1}>Em andamento</option>
                <option value={2}>Revisado</option>
                <option value={3}>Reforço</option>
              </Select>
            </FG>
          </div>
          <FG label="Inclui questões">
            <div className="flex items-center h-9"><Toggle checked={cttForm.questoes} onChange={v => setCttForm(f => ({ ...f, questoes: v }))} label="" /></div>
          </FG>
          {editCttId && cttForm.matId && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
              Horas estudadas: {(cttDoneMin(parseInt(cttForm.matId), editCttId) / 60).toFixed(1)}h
            </div>
          )}
        </div>
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setShowCtt(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveCtt}>✓ Salvar</Btn>
        </ModalFooter>
      </Modal>
    </div>
  )
}
