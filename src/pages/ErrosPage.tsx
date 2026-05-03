import { useState } from 'react'
import { useStore } from '../store/app'
import { Card, Btn, FG, Select, Textarea, Input, Modal, ModalFooter, Notif, SectionHeader, Empty } from '../components/ui'
import { today } from '../lib/constants'
import type { ErroRegistrado } from '../types'

export default function ErrosPage() {
  const { materias, erros, addErro, updateErro, deleteErro } = useStore()

  const [notif, setNotif] = useState('')
  const [filterMat, setFilterMat] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'revisado'>('todos')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    data: today(), materia: '', conteudo: '', questao: '', porque: '',
  })

  function openNew() {
    setForm({ data: today(), materia: '', conteudo: '', questao: '', porque: '' })
    setShowModal(true)
  }

  function save() {
    if (!form.questao.trim()) { setNotif('Informe a questão/tema.'); return }
    const novo: ErroRegistrado = {
      id: Date.now(), data: form.data, materia: form.materia,
      conteudo: form.conteudo, questao: form.questao.trim(),
      porque: form.porque.trim(), revisado: false,
    }
    addErro(novo)
    setShowModal(false)
    setNotif('Erro registrado!')
  }

  const filtered = erros.filter(e => {
    if (filterMat && e.materia !== filterMat) return false
    if (filterStatus === 'pendente' && e.revisado) return false
    if (filterStatus === 'revisado' && !e.revisado) return false
    return true
  })

  const matOptions = [...new Set(erros.map(e => e.materia).filter(Boolean))]
  const selectedMatConteudos = materias.find(m => m.nome === form.materia)?.conteudos ?? []

  return (
    <div className="pt-6 flex flex-col gap-5">
      {notif && <Notif msg={notif} onDone={() => setNotif('')} />}

      <SectionHeader title="Caderno de Erros"
        sub={`${erros.filter(e => !e.revisado).length} pendentes de revisão`}
        right={<Btn variant="primary" size="sm" onClick={openNew}>+ Registrar erro</Btn>}
      />

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div style={{ width: 200 }}>
          <Select value={filterMat} onChange={e => setFilterMat(e.target.value)}>
            <option value="">Todas as matérias</option>
            {matOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div style={{ width: 160 }}>
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="revisado">Revisados</option>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <Card className="overflow-x-auto p-0">
        {filtered.length === 0
          ? <div className="p-5"><Empty>Nenhum erro registrado com esses filtros.</Empty></div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider border-b" style={{ color: 'var(--text3)', borderColor: 'var(--border)' }}>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Matéria</th>
                  <th className="text-left p-3">Conteúdo</th>
                  <th className="text-left p-3">Questão / tema</th>
                  <th className="text-left p-3">Por que errei</th>
                  <th className="text-center p-3">Revisado?</th>
                  <th className="text-right p-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-[var(--surface2)] transition-colors"
                    style={{ borderColor: 'var(--border)', opacity: e.revisado ? 0.55 : 1 }}>
                    <td className="p-3 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text3)' }}>
                      {e.data.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3 text-xs font-semibold" style={{ color: 'var(--text)' }}>{e.materia || '—'}</td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text2)', maxWidth: 140 }}>
                      <div className="truncate">{e.conteudo || '—'}</div>
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text)', maxWidth: 200 }}>
                      <div className="line-clamp-2">{e.questao}</div>
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text2)', maxWidth: 200 }}>
                      <div className="line-clamp-2">{e.porque || '—'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => updateErro(e.id, { revisado: !e.revisado })}
                        className="px-2 py-0.5 rounded-full text-xs font-semibold border transition-all"
                        style={e.revisado
                          ? { background: 'rgba(34,201,122,.15)', color: '#22C97A', borderColor: 'rgba(34,201,122,.3)' }
                          : { background: 'rgba(255,90,90,.1)', color: '#FF5A5A', borderColor: 'rgba(255,90,90,.25)' }}>
                        {e.revisado ? '✓ Sim' : 'Não'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <Btn size="icon" variant="ghost" onClick={() => { deleteErro(e.id); setNotif('Erro excluído.') }} style={{ color: '#FF5A5A' }}>✕</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Card>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Erro" maxWidth={460}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <FG label="Data">
              <Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
            </FG>
            <FG label="Matéria">
              <Select value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value, conteudo: '' }))}>
                <option value="">— selecione —</option>
                {materias.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
              </Select>
            </FG>
          </div>
          {form.materia && (
            <FG label="Conteúdo">
              <Select value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}>
                <option value="">— selecione —</option>
                {selectedMatConteudos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </Select>
            </FG>
          )}
          <FG label="Questão / tema">
            <Textarea rows={2} value={form.questao} onChange={e => setForm(f => ({ ...f, questao: e.target.value }))} placeholder="Descreva a questão ou o tema que você errou..." />
          </FG>
          <FG label="Por que errei">
            <Textarea rows={2} value={form.porque} onChange={e => setForm(f => ({ ...f, porque: e.target.value }))} placeholder="Qual foi o erro de raciocínio ou lacuna de conhecimento?" />
          </FG>
        </div>
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={save}>✓ Registrar</Btn>
        </ModalFooter>
      </Modal>
    </div>
  )
}
