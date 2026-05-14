import { useState } from 'react'
import { useStore } from '../store/app'
import { Card, Btn, FG, Select, Input, Toggle, Modal, ModalFooter, Notif, Empty, SectionHeader, StatusPill, PBar } from '../components/ui'
import { CATALOGO, TIPO_LABEL, TIPO_COLOR, monthPfx, MESES_PT } from '../lib/constants'
import { EDITAIS_PREDEFINIDOS } from '../lib/editalCatalog'
import type { TipoBloco, StatusConteudo, Materia, Conteudo } from '../types'

function normalizeName(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ').toLowerCase()
}

const PRIORIDADE_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const PRIORIDADE_COLOR = { alta: '#FF5A5A', media: '#F5A623', baixa: '#22C97A' }

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold border"
      style={{ background: `${color}18`, color, borderColor: `${color}40` }}>{label}</span>
  )
}

export default function MateriasPage() {
  const { materias, addMateria, updateMateria, deleteMateria, addConteudo, updateConteudo, deleteConteudo, cycleStatus, sessoes, cttDoneMin, cttQuestoes, matOrder, reorderMaterias } = useStore()

  const [notif, setNotif] = useState('')
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [monthDate, setMonthDate] = useState(new Date())

  // Materia modal
  const [showMat, setShowMat] = useState(false)
  const [editMatId, setEditMatId] = useState<number | null>(null)
  const [matForm, setMatForm] = useState({ nome: '', tipo: 'base' as TipoBloco, prioridade: 'media' as 'alta' | 'media' | 'baixa' })
  const [matCatalogSel, setMatCatalogSel] = useState('')

  // Import modals
  const [showModeModal, setShowModeModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importEditalId, setImportEditalId] = useState<string | null>(null)
  const [importStep, setImportStep] = useState<'editais' | 'materias'>('editais')
  const [importSelectedMats, setImportSelectedMats] = useState<Set<string>>(new Set())

  // Conteudo modal
  const [showCtt, setShowCtt] = useState(false)
  const [editCttId, setEditCttId] = useState<number | null>(null)
  const [cttForm, setCttForm] = useState({ matId: '', catalogoSel: '', nome: '', metaH: 0, questoes: false, status: 0 as StatusConteudo })

  // Drag state for materia reordering
  const [dragMatId, setDragMatId] = useState<number | null>(null)
  const [dragOverMatId, setDragOverMatId] = useState<number | null>(null)

  const pfx = monthPfx(monthDate)
  const currentPfx = monthPfx(new Date())
  const isCurrentMonth = pfx === currentPfx

  function prevMonth() { const d = new Date(monthDate); d.setMonth(d.getMonth() - 1); setMonthDate(d) }
  function nextMonth() { const d = new Date(monthDate); d.setMonth(d.getMonth() + 1); setMonthDate(d) }

  function handleMatDrop(targetId: number) {
    if (dragMatId === null || dragMatId === targetId) { setDragOverMatId(null); return }
    const from = monthMaterias.findIndex(m => m.id === dragMatId)
    const to   = monthMaterias.findIndex(m => m.id === targetId)
    if (from === -1 || to === -1) return
    const reordered = [...monthMaterias]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    reorderMaterias(reordered.map(m => m.id))
    setDragMatId(null)
    setDragOverMatId(null)
  }

  // Matérias do mês: month-specific + legacy, sorted by saved matOrder
  const monthMaterias = (() => {
    const filtered = materias.filter(m => m.month === pfx || (isCurrentMonth && !m.month))
    if (matOrder.length === 0) return filtered
    return [...filtered].sort((a, b) => {
      const ia = matOrder.indexOf(a.id)
      const ib = matOrder.indexOf(b.id)
      if (ia === -1 && ib === -1) return 0
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
  })()

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

  function openNewMat() { setEditMatId(null); setMatForm({ nome: '', tipo: 'base', prioridade: 'media' }); setMatCatalogSel(''); setShowMat(true) }

  function openImportModal() {
    setImportEditalId(null)
    setImportStep('editais')
    setImportSelectedMats(new Set())
    setShowImportModal(true)
  }

  function selectImportEdital(editalId: string) {
    const edital = EDITAIS_PREDEFINIDOS.find(e => e.id === editalId)!
    const novaMats = edital.materias
      .filter(m => !monthMaterias.some(em => normalizeName(em.nome) === normalizeName(m.nome)))
      .map(m => m.nome)
    setImportEditalId(editalId)
    setImportSelectedMats(new Set(novaMats))
    setImportStep('materias')
  }

  function toggleImportMat(nome: string) {
    setImportSelectedMats(prev => {
      const next = new Set(prev)
      if (next.has(nome)) next.delete(nome)
      else next.add(nome)
      return next
    })
  }
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

  function runImport(editalId: string, selectedMats: Set<string>) {
    const edital = EDITAIS_PREDEFINIDOS.find(e => e.id === editalId)
    if (!edital) return

    const baseId = Date.now()
    let offset = 0
    const makeId = () => baseId + (offset++)

    let addedMats = 0
    let addedCtts = 0
    const batchMatNorms = new Set<string>()

    for (const edMat of edital.materias) {
      if (!selectedMats.has(edMat.nome)) continue
      const normEdMat = normalizeName(edMat.nome)
      if (batchMatNorms.has(normEdMat)) continue

      const existingMat = monthMaterias.find(m => normalizeName(m.nome) === normEdMat)

      let targetMatId: number
      let existingCttNorms: string[]

      if (existingMat) {
        targetMatId = existingMat.id
        existingCttNorms = existingMat.conteudos.map(c => normalizeName(c.nome))
      } else {
        targetMatId = makeId()
        addMateria({ id: targetMatId, nome: edMat.nome, tipo: edMat.tipo, prioridade: edMat.prioridade, month: pfx, conteudos: [] })
        batchMatNorms.add(normEdMat)
        addedMats++
        existingCttNorms = []
      }

      const batchCttNorms = new Set<string>(existingCttNorms)
      for (const cttNome of edMat.conteudos) {
        const normCtt = normalizeName(cttNome)
        if (batchCttNorms.has(normCtt)) continue
        addConteudo(targetMatId, { id: makeId(), nome: cttNome, metaH: 0, questoes: false, status: 0 })
        batchCttNorms.add(normCtt)
        addedCtts++
      }
    }

    const msg = addedMats === 0 && addedCtts === 0
      ? 'Todas as matérias já estavam importadas.'
      : `Importado: ${addedMats} matéria(s) e ${addedCtts} conteúdo(s) adicionados.`
    setNotif(msg)
    setShowImportModal(false)
  }

  function matDoneMin(mat: Materia) {
    return sessoes.filter(s => s.matId === mat.id && s.date.startsWith(pfx)).reduce((a, s) => a + s.durMin, 0)
  }
  function matMetaH(mat: Materia) { return mat.conteudos.reduce((a, c) => a + c.metaH, 0) }

  function cttCatOptions(matNome: string): string[] {
    const fromEdital = EDITAIS_PREDEFINIDOS.flatMap(e => e.materias)
      .find(m => normalizeName(m.nome) === normalizeName(matNome))?.conteudos ?? []
    const fromCatalog = CATALOGO[matNome] ?? []
    const seen = new Set<string>()
    return [...fromEdital, ...fromCatalog].filter(c => {
      const k = normalizeName(c)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }

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
            <Btn size="sm" variant="ghost" onClick={openImportModal}>⬇ Importar edital</Btn>
            <Btn variant="primary" size="sm" onClick={() => setShowModeModal(true)}>+ Nova Matéria</Btn>
          </>
        }
      />

      {monthMaterias.length === 0 && (
        <Empty>
          {prevMonthMaterias.length > 0
            ? `Nenhuma matéria configurada para ${MESES_PT[monthDate.getMonth()]}. Use "Copiar de ${MESES_PT[prevDate.getMonth()]}" para importar o plano do mês anterior.`
            : 'Adicione suas matérias para montar seu Plano de Aprovação. Comece com as principais disciplinas do edital.'}
        </Empty>
      )}

      {monthMaterias.map(mat => {
        const isOpen = expanded[mat.id]
        const doneMin = matDoneMin(mat)
        const metaH = matMetaH(mat)
        const pct = metaH > 0 ? Math.min(100, Math.round(doneMin / 60 / metaH * 100)) : 0
        const tipoColor = TIPO_COLOR[mat.tipo]

        return (
          <Card key={mat.id}
            className={`overflow-hidden transition-opacity ${dragMatId === mat.id ? 'opacity-40' : ''} ${dragOverMatId === mat.id && dragMatId !== mat.id ? 'ring-2 ring-[#4F7CFF]' : ''}`}
            onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOverMatId(mat.id) }}
            onDragLeave={() => setDragOverMatId(null)}
            onDrop={(e: React.DragEvent) => { e.preventDefault(); handleMatDrop(mat.id) }}
            onDragEnd={() => { setDragMatId(null); setDragOverMatId(null) }}
          >
            <div className="cursor-pointer select-none"
              onClick={() => setExpanded(e => ({ ...e, [mat.id]: !e[mat.id] }))}>

              {/* ── Desktop: linha única ── */}
              <div className="hidden md:flex items-center gap-3">
                <span
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); setDragMatId(mat.id) }}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-grab active:cursor-grabbing text-base shrink-0 px-0.5 select-none"
                  style={{ color: 'var(--text3)' }}
                  title="Arrastar para reordenar"
                >⠿</span>
                <span className="text-xs font-mono w-5 text-center shrink-0" style={{ color: 'var(--text3)' }}>{isOpen ? '▾' : '▸'}</span>
                <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--text)' }}>{mat.nome}</span>
                <Badge label={TIPO_LABEL[mat.tipo]} color={tipoColor} />
                <Badge label={PRIORIDADE_LABEL[mat.prioridade]} color={PRIORIDADE_COLOR[mat.prioridade]} />
                <span className="text-xs font-mono" style={{ color: '#22C97A' }}>
                  {(doneMin / 60).toFixed(1)}h{metaH > 0 ? ` / ${metaH}h` : ''}
                </span>
                <div style={{ width: 80 }}><PBar pct={pct} color={tipoColor} /></div>
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <Btn size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openEditMat(mat) }}>✏</Btn>
                  <Btn size="icon" variant="ghost" onClick={e => { e.stopPropagation(); delMat(mat.id) }} style={{ color: '#FF5A5A' }}>✕</Btn>
                  <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openNewCtt(mat.id) }}>+ Conteúdo</Btn>
                </div>
              </div>

              {/* ── Mobile: multi-linha ── */}
              <div className="flex flex-col gap-2 md:hidden">
                {/* Linha 1: grip + seta + nome + ações ícone */}
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); setDragMatId(mat.id) }}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-grab active:cursor-grabbing text-base shrink-0 select-none"
                    style={{ color: 'var(--text3)' }}
                    title="Arrastar para reordenar"
                  >⠿</span>
                  <span className="text-xs font-mono w-5 text-center shrink-0" style={{ color: 'var(--text3)' }}>{isOpen ? '▾' : '▸'}</span>
                  <span className="flex-1 font-semibold text-sm min-w-0 truncate" style={{ color: 'var(--text)' }}>{mat.nome}</span>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <Btn size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openEditMat(mat) }}>✏</Btn>
                    <Btn size="icon" variant="ghost" onClick={e => { e.stopPropagation(); delMat(mat.id) }} style={{ color: '#FF5A5A' }}>✕</Btn>
                  </div>
                </div>
                {/* Linha 2: badges + horas */}
                <div className="flex items-center gap-2 flex-wrap pl-7">
                  <Badge label={TIPO_LABEL[mat.tipo]} color={tipoColor} />
                  <Badge label={PRIORIDADE_LABEL[mat.prioridade]} color={PRIORIDADE_COLOR[mat.prioridade]} />
                  <span className="text-xs font-mono ml-auto" style={{ color: '#22C97A' }}>
                    {(doneMin / 60).toFixed(1)}h{metaH > 0 ? ` / ${metaH}h` : ''}
                  </span>
                </div>
                {/* Linha 3: barra de progresso */}
                <div className="pl-7 pr-1">
                  <PBar pct={pct} color={tipoColor} />
                </div>
                {/* Linha 4: botão + Conteúdo */}
                <div className="pl-7" onClick={e => e.stopPropagation()}>
                  <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openNewCtt(mat.id) }}>+ Conteúdo</Btn>
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                {mat.conteudos.length === 0
                  ? <Empty>Nenhum conteúdo. Clique em "+ Conteúdo" para adicionar.</Empty>
                  : (
                    <>
                      {/* ── Desktop table ── */}
                      <div className="hidden md:block">
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
                      </div>

                      {/* ── Mobile card list ── */}
                      <div className="flex flex-col gap-2 md:hidden">
                        {mat.conteudos.map(c => {
                          const cMin = cttDoneMin(mat.id, c.id, pfx)
                          const cQ = cttQuestoes(mat.id, c.id, pfx)
                          const cPct = c.metaH > 0 ? Math.min(100, Math.round(cMin / 60 / c.metaH * 100)) : 0
                          return (
                            <div key={c.id} className="rounded-lg px-3 py-2.5 flex flex-col gap-1.5" style={{ background: 'var(--surface2)' }}>
                              {/* Row 1: name + actions */}
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="flex-1 text-sm font-medium min-w-0" style={{ color: 'var(--text)' }}>{c.nome}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Btn size="icon" variant="ghost" onClick={() => openEditCtt(mat.id, c)}>✏</Btn>
                                  <Btn size="icon" variant="ghost" onClick={() => delCtt(mat.id, c.id)} style={{ color: '#FF5A5A' }}>✕</Btn>
                                </div>
                              </div>
                              {/* Row 2: hours + questoes + status */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono" style={{ color: '#22C97A' }}>
                                  {(cMin / 60).toFixed(1)}h{c.metaH > 0 ? ` / ${c.metaH}h` : ''}
                                </span>
                                {cQ > 0 && (
                                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{cQ}Q</span>
                                )}
                                <div className="ml-auto">
                                  <StatusPill status={c.status} onClick={() => cycleStatus(mat.id, c.id)} />
                                </div>
                              </div>
                              {/* Row 3: progress bar (if meta set) */}
                              {c.metaH > 0 && (
                                <PBar pct={cPct} height={3} color={tipoColor} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
              </div>
            )}
          </Card>
        )
      })}

      {/* Modal: Modo de adição */}
      <Modal open={showModeModal} onClose={() => setShowModeModal(false)} title="Adicionar Matéria" maxWidth={400}>
        <div className="flex flex-col gap-3">
          <button
            className="rounded-xl p-4 text-left border transition-all"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#4F7CFF')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            onClick={() => { setShowModeModal(false); openNewMat() }}>
            <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>✏ Criar manualmente</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Preencha nome, tipo e prioridade</div>
          </button>
          <button
            className="rounded-xl p-4 text-left border transition-all"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#4F7CFF')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            onClick={() => { setShowModeModal(false); openImportModal() }}>
            <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>📋 Importar do edital</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Adicione matérias do catálogo PCDF com todos os conteúdos</div>
          </button>
        </div>
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setShowModeModal(false)}>Cancelar</Btn>
        </ModalFooter>
      </Modal>

      {/* Modal: Importar edital — etapa 1: escolha do edital */}
      <Modal open={showImportModal && importStep === 'editais'} onClose={() => setShowImportModal(false)} title="Importar Edital" maxWidth={460}>
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Selecione o edital para importar as matérias:</p>
          {EDITAIS_PREDEFINIDOS.map(e => (
            <button key={e.id}
              className="rounded-xl p-4 text-left border transition-all"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
              onMouseOver={ev => (ev.currentTarget.style.borderColor = '#4F7CFF')}
              onMouseOut={ev => (ev.currentTarget.style.borderColor = 'var(--border)')}
              onClick={() => selectImportEdital(e.id)}>
              <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{e.nome}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                {e.materias.length} matérias · {e.materias.reduce((a, m) => a + m.conteudos.length, 0)} conteúdos
              </div>
            </button>
          ))}
        </div>
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setShowImportModal(false)}>Cancelar</Btn>
        </ModalFooter>
      </Modal>

      {/* Modal: Importar edital — etapa 2: seleção de matérias */}
      {importEditalId && (() => {
        const edital = EDITAIS_PREDEFINIDOS.find(e => e.id === importEditalId)!
        const allSelected = edital.materias.every(m => importSelectedMats.has(m.nome))
        return (
          <Modal open={showImportModal && importStep === 'materias'} onClose={() => setShowImportModal(false)} title="Importar Edital" maxWidth={480}>
            <div className="flex flex-col gap-4">
              <button className="flex items-center gap-1 text-xs w-fit" style={{ color: 'var(--text3)' }}
                onClick={() => setImportStep('editais')}>
                ← {edital.nome}
              </button>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                  Matérias ({importSelectedMats.size} selecionada{importSelectedMats.size !== 1 ? 's' : ''})
                </span>
                <button className="text-xs" style={{ color: '#4F7CFF' }}
                  onClick={() => setImportSelectedMats(
                    allSelected ? new Set() : new Set(edital.materias.map(m => m.nome))
                  )}>
                  {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                {edital.materias.map(m => {
                  const exists = monthMaterias.some(em => normalizeName(em.nome) === normalizeName(m.nome))
                  const checked = importSelectedMats.has(m.nome)
                  return (
                    <label key={m.nome}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer select-none"
                      style={{ background: 'var(--surface2)' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleImportMat(m.nome)}
                        className="accent-[#4F7CFF]" />
                      <span className="flex-1 text-sm" style={{ color: checked ? 'var(--text)' : 'var(--text3)' }}>
                        {m.nome}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: exists ? 'var(--text3)' : '#22C97A' }}>
                        {exists ? 'já existe' : 'nova'}
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(79,124,255,.08)', color: 'var(--text3)', border: '1px solid rgba(79,124,255,.2)' }}>
                Dados existentes são preservados. Apenas itens faltantes serão adicionados.
              </div>
            </div>
            <ModalFooter>
              <Btn variant="ghost" onClick={() => setShowImportModal(false)}>Cancelar</Btn>
              <Btn variant="primary" disabled={importSelectedMats.size === 0}
                onClick={() => runImport(edital.id, importSelectedMats)}>
                ⬇ Importar {importSelectedMats.size > 0 ? `(${importSelectedMats.size})` : ''}
              </Btn>
            </ModalFooter>
          </Modal>
        )
      })()}

      {/* Modal: Matéria */}
      <Modal open={showMat} onClose={() => setShowMat(false)} title={editMatId ? 'Editar Matéria' : 'Nova Matéria'} maxWidth={420}>
        <div className="flex flex-col gap-3">
          {!editMatId && (
            <FG label="Escolher do catálogo (opcional)">
              <Select value={matCatalogSel} onChange={e => {
                const sel = e.target.value
                setMatCatalogSel(sel)
                if (sel) {
                  const found = EDITAIS_PREDEFINIDOS.flatMap(ed => ed.materias).find(m => m.nome === sel)
                  if (found) setMatForm({ nome: found.nome, tipo: found.tipo, prioridade: found.prioridade })
                }
              }}>
                <option value="">— selecione uma matéria —</option>
                {EDITAIS_PREDEFINIDOS.flatMap(ed => ed.materias).map(m => (
                  <option key={m.nome} value={m.nome}>{m.nome}</option>
                ))}
              </Select>
            </FG>
          )}
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
