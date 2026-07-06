import { useState, useEffect } from 'react'
import { Btn, FG, Input, Select, Toggle, Modal, ModalFooter } from './ui'
import { TIPO_LABEL, today, monthPfx, materiasDoMes } from '../lib/constants'
import type { Materia, TipoBloco } from '../types'

interface ManualForm {
  data: string; startTime: string; endTime: string
  h: number; m: number; tipo: TipoBloco
  matId: string; cttId: string; questoes: boolean; qCount: number; obs: string
}

export interface ManualSaveData extends ManualForm { durMin: number }

function defaultForm(): ManualForm {
  return { data: today(), startTime: '', endTime: '', h: 0, m: 30, tipo: 'base', matId: '', cttId: '', questoes: false, qCount: 0, obs: '' }
}

function addMinsToTime(time: string, mins: number) {
  const [h, m] = time.split(':').map(Number)
  const t = h * 60 + m + mins
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

function timeDiff(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ManualSaveData) => void
  materias: Materia[]
  notify: (msg: string) => void
}

export default function ManualSessionModal({ open, onClose, onSave, materias, notify }: Props) {
  const [f, setF] = useState<ManualForm>(defaultForm)

  useEffect(() => { if (open) setF(defaultForm()) }, [open])

  function onStartChange(val: string) {
    const next = { ...f, startTime: val }
    if (val && f.endTime) {
      const diff = timeDiff(val, f.endTime)
      if (diff > 0) { next.h = Math.floor(diff / 60); next.m = diff % 60 }
    } else if (val && (f.h > 0 || f.m > 0)) {
      next.endTime = addMinsToTime(val, f.h * 60 + f.m)
    }
    setF(next)
  }

  function onEndChange(val: string) {
    const next = { ...f, endTime: val }
    if (f.startTime && val) {
      const diff = timeDiff(f.startTime, val)
      if (diff > 0) { next.h = Math.floor(diff / 60); next.m = diff % 60 }
    }
    setF(next)
  }

  function onHChange(val: number) {
    const next = { ...f, h: val }
    if (f.startTime) {
      const total = val * 60 + f.m
      if (total > 0) next.endTime = addMinsToTime(f.startTime, total)
    }
    setF(next)
  }

  function onMChange(val: number) {
    const next = { ...f, m: val }
    if (f.startTime) {
      const total = f.h * 60 + val
      if (total > 0) next.endTime = addMinsToTime(f.startTime, total)
    }
    setF(next)
  }

  function handleSave() {
    if (!f.startTime) { notify('Informe o horário de início.'); return }
    const durMin = f.h * 60 + f.m
    if (durMin <= 0) { notify('Informe a duração ou hora fim.'); return }
    onSave({ ...f, durMin })
  }

  // Escopa a lista de matérias pelo mês da data escolhida (evita duplicatas de outros meses)
  const scopedMaterias = materiasDoMes(materias, monthPfx(new Date(`${f.data || today()}T12:00:00`)))
  const matObj = scopedMaterias.find(m => String(m.id) === f.matId)

  return (
    <Modal open={open} onClose={onClose} title="✏ Registrar sessão manualmente" maxWidth={480}>
      <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>Esqueceu de ligar o timer? Registre aqui o que foi estudado.</p>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <FG label="Data">
            <Input type="date" value={f.data} onChange={e => setF(x => ({ ...x, data: e.target.value }))} />
          </FG>
          <FG label="Hora início *">
            <Input type="time" value={f.startTime} onChange={e => onStartChange(e.target.value)} required />
          </FG>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FG label="Hora fim">
            <Input type="time" value={f.endTime} onChange={e => onEndChange(e.target.value)} />
          </FG>
          <FG label="Duração">
            <div className="flex gap-1.5 items-center">
              <Input type="number" min={0} max={12} value={f.h}
                onChange={e => onHChange(+e.target.value)}
                style={{ width: 56, color: 'var(--text)' }} />
              <span className="text-xs shrink-0" style={{ color: 'var(--text2)' }}>h</span>
              <Input type="number" min={0} max={59} step={5} value={f.m}
                onChange={e => onMChange(+e.target.value)}
                style={{ width: 56, color: 'var(--text)' }} />
              <span className="text-xs shrink-0" style={{ color: 'var(--text2)' }}>min</span>
            </div>
          </FG>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FG label="Tipo">
            <Select value={f.tipo} onChange={e => setF(x => ({ ...x, tipo: e.target.value as TipoBloco }))}>
              {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </FG>
          <FG label="Matéria">
            <Select value={f.matId} onChange={e => setF(x => ({ ...x, matId: e.target.value, cttId: '' }))}>
              <option value="">— sem matéria —</option>
              {scopedMaterias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </Select>
          </FG>
        </div>
        {matObj && (
          <FG label="Conteúdo">
            <Select value={f.cttId} onChange={e => setF(x => ({ ...x, cttId: e.target.value }))}>
              <option value="">— sem conteúdo —</option>
              {matObj.conteudos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FG>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FG label="Questões?">
            <div className="flex items-center h-9">
              <Toggle checked={f.questoes} onChange={v => setF(x => ({ ...x, questoes: v }))} label="" />
            </div>
          </FG>
          {f.questoes && (
            <FG label="Quantidade">
              <Input type="number" min={0} value={f.qCount}
                onChange={e => setF(x => ({ ...x, qCount: +e.target.value }))} />
            </FG>
          )}
        </div>
        <FG label="Observação (opcional)">
          <textarea value={f.obs} onChange={e => setF(x => ({ ...x, obs: e.target.value }))} rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit' }} />
        </FG>
      </div>
      <ModalFooter>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={handleSave}>✓ Registrar</Btn>
      </ModalFooter>
    </Modal>
  )
}
