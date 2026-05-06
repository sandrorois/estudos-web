import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../store/app'
import { supabase } from '../lib/supabase'
import { useTimer } from '../store/timer'
import { Card, CardTitle, StatCard, Btn, FG, Select, Input, Toggle, Modal, ModalFooter, Notif, Empty } from '../components/ui'
import { TIPO_LABEL, TIPO_COLOR, today, monthPfx, fmtH, fmtHShort, playAlert } from '../lib/constants'
import type { Sessao, TipoBloco } from '../types'
import ManualSessionModal, { type ManualSaveData } from '../components/ManualSessionModal'

const CIRC = 502.7

export default function TimerPage() {
  const { materias, sessoes, addSessao, updateSessao, deleteSessao, todaySessoes, pendingSessId, setPendingSessId } = useStore()
  const timer = useTimer()

  const [notif, setNotif] = useState('')
  const [showQuestoes, setShowQuestoes] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [showEditSess, setShowEditSess] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [alertIsBreak, setAlertIsBreak] = useState(false)
  const [qCount, setQCount] = useState('')
  const [qObs, setQObs] = useState('')
  const [alertObs, setAlertObs] = useState('')
  const [editingSessId, setEditingSessId] = useState<number | null>(null)

  // Timer config local state — init from config so navigating from SemanaPage pre-fills
  const [matSel, setMatSel] = useState(() => {
    const cfg = useTimer.getState().config
    return cfg.matId ? String(cfg.matId) : ''
  })
  const [cttSel, setCttSel] = useState(() => {
    const cfg = useTimer.getState().config
    return cfg.cttId ? String(cfg.cttId) : ''
  })

  const notify = (msg: string) => setNotif(msg)

  // ── Wake Lock (desktop) + Push Notifications (mobile) ────────────────────
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const wakeLockRef = useRef<any>(null)
  const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

  function urlBase64ToUint8Array(b64: string) {
    const pad = '='.repeat((4 - b64.length % 4) % 4)
    const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/')
    return new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)))
  }

  async function setupPush(): Promise<boolean> {
    if (!isMobile || !VAPID_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return false
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      if (Notification.permission === 'default') await Notification.requestPermission()
      if (Notification.permission !== 'granted') return false
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      })
      const { keys } = sub.toJSON() as any
      await supabase.from('push_subscriptions').upsert(
        { user_id: useStore.getState().userId, endpoint: sub.endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'user_id,endpoint' }
      )
      return true
    } catch (e) { console.warn('[push]', e); return false }
  }

  async function scheduleTimerNotification(endAt: number, title: string, body: string) {
    await supabase.functions.invoke('schedule-notification', {
      body: { endAt: new Date(endAt).toISOString(), title, body },
    })
  }

  async function cancelTimerNotifications() {
    const uid = useStore.getState().userId
    if (uid) await supabase.from('timer_notifications').update({ sent: true }).eq('user_id', uid).eq('sent', false)
  }

  // Desktop: mantém tela acesa enquanto timer roda
  async function requestWakeLock() {
    if (isMobile || !('wakeLock' in navigator)) return
    try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen') } catch {}
  }
  function releaseWakeLock() {
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
  }
  useEffect(() => {
    if (timer.phase === 'study' || timer.phase === 'break') requestWakeLock()
    else releaseWakeLock()
  }, [timer.phase])

  // Ao desbloquear: re-adquire wake lock (desktop) e força tick (detecta fim de timer)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (!isMobile) requestWakeLock()
      useTimer.getState()._tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Callbacks when timer ends
  const onStudyEnd = useCallback(() => {
    const cfg = useTimer.getState().config
    const newSess: Sessao = {
      id: Date.now(), date: today(), tipo: cfg.tipo,
      matId: cfg.matId, cttId: cfg.cttId, materia: cfg.materia, conteudo: cfg.conteudo,
      questoes: cfg.questoes, questoesCount: 0,
      durMin: cfg.duracaoMin, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    addSessao(newSess)
    setPendingSessId(newSess.id)
    cancelTimerNotifications()
    useTimer.getState().reset()
    if (cfg.questoes) {
      setQCount(''); setQObs(''); setShowQuestoes(true)
    } else {
      setAlertObs(''); setAlertIsBreak(false); setShowAlert(true)
    }
  }, [])

  const onBreakEnd = useCallback(() => {
    setAlertIsBreak(true); setShowAlert(true)
  }, [])

  useEffect(() => {
    timer.setCallbacks(onStudyEnd, onBreakEnd)
  }, [])

  function saveQuestoes(count: number) {
    if (pendingSessId) {
      updateSessao(pendingSessId, { questoesCount: count, obs: qObs.trim() || undefined })
    }
    setShowQuestoes(false)
    setAlertObs(''); setAlertIsBreak(false); setShowAlert(true)
  }

  function dismissAlert() {
    if (alertObs.trim() && pendingSessId) {
      updateSessao(pendingSessId, { obs: alertObs.trim() })
    }
    setPendingSessId(null)
    setShowAlert(false)
  }

  function alertStartBreak() {
    if (alertObs.trim() && pendingSessId) {
      updateSessao(pendingSessId, { obs: alertObs.trim() })
    }
    setPendingSessId(null)
    setShowAlert(false)
    timer.startBreak()
  }

  function handleSaveEarly() {
    cancelTimerNotifications()
    const { config, elapsedMin } = timer.saveEarly()
    const newSess: Sessao = {
      id: Date.now(), date: today(), tipo: config.tipo,
      matId: config.matId, cttId: config.cttId, materia: config.materia, conteudo: config.conteudo,
      questoes: config.questoes, questoesCount: 0,
      durMin: elapsedMin, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      early: true,
    }
    addSessao(newSess)
    setPendingSessId(newSess.id)
    playAlert(false)
    if (config.questoes) {
      setQCount(''); setQObs(''); setShowQuestoes(true)
    } else {
      setAlertObs(''); setAlertIsBreak(false); setShowAlert(true)
    }
  }

  async function handleStart() {
    await setupPush()
    timer.start()
    if (isMobile) {
      const { endAt, config } = useTimer.getState()
      if (endAt) {
        const isBreak = timer.phase === 'break' || timer.phase === 'break-idle'
        scheduleTimerNotification(
          endAt,
          isBreak ? '☕ Pausa concluída!' : '🎉 Sessão concluída!',
          isBreak ? 'Hora de voltar aos estudos!' : (config.materia || 'Sua sessão terminou')
        )
      }
    }
  }

  // Sync materia/conteudo selects → timer config
  function onMatChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value; setMatSel(val); setCttSel('')
    const m = materias.find(x => String(x.id) === val)
    timer.setConfig({ matId: m?.id ?? null, materia: m?.nome ?? '', cttId: null, conteudo: '', tipo: m?.tipo ?? timer.config.tipo })
  }
  function onCttChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value; setCttSel(val)
    const m = materias.find(x => String(x.id) === matSel)
    const c = m?.conteudos.find(x => String(x.id) === val)
    timer.setConfig({ cttId: c?.id ?? null, conteudo: c?.nome ?? '', questoes: c?.questoes ?? timer.config.questoes })
  }

  // Metrics
  const ts = todaySessoes()
  const todayMin = ts.reduce((a,s) => a + s.durMin, 0)
  const weekStart = (() => { const d = new Date(); const wd = d.getDay(); const diff = d.getDate()-(wd===0?6:wd-1); const m = new Date(d); m.setDate(diff); return m.toISOString().slice(0,10) })()
  const weekMin = sessoes.filter(s => s.date >= weekStart).reduce((a,s) => a+s.durMin, 0)
  const mPfx = monthPfx()
  const monthMin = sessoes.filter(s => s.date.startsWith(mPfx)).reduce((a,s) => a+s.durMin, 0)
  const todayQ = ts.reduce((a,s) => a+(s.questoesCount||0), 0)

  const matObj = materias.find(m => String(m.id) === matSel)
  const tipoColor = TIPO_COLOR[timer.config.tipo]
  const phaseLabel = { idle: 'aguardando', study: 'estudando...', paused: 'pausado', 'break-idle': 'sessão concluída!', break: 'pausa ativa', done: 'concluído!' }[timer.phase]
  const canStart = timer.phase === 'idle' || timer.phase === 'paused' || timer.phase === 'break-idle' || timer.phase === 'done'
  const canSaveEarly = timer.phase === 'study' || timer.phase === 'paused'

  // Edit session form state
  const [editForm, setEditForm] = useState<Partial<Sessao>>({})
  function openEdit(s: Sessao) { setEditingSessId(s.id); setEditForm({...s}); setShowEditSess(true) }
  function saveEdit() {
    if (!editingSessId || !editForm.durMin) return
    updateSessao(editingSessId, editForm)
    setShowEditSess(false); notify('Sessão atualizada!')
  }

  function saveManual(form: ManualSaveData) {
    const m = materias.find(x => String(x.id) === form.matId)
    const c = m?.conteudos.find(x => String(x.id) === form.cttId)
    addSessao({
      id: Date.now(), date: form.data, tipo: form.tipo,
      matId: m?.id ?? null, cttId: c?.id ?? null,
      materia: m?.nome ?? '', conteudo: c?.nome ?? '',
      questoes: form.questoes, questoesCount: form.questoes ? form.qCount : 0,
      durMin: form.durMin, time: form.startTime,
      manual: true, obs: form.obs || undefined,
    })
    setShowManual(false); notify('Sessão registrada!')
  }

  // Export text
  const tot = ts.reduce((a,s)=>a+s.durMin,0)
  const totQ = ts.reduce((a,s)=>a+(s.questoesCount||0),0)
  const exportText = ts.length ? [
    `DATA: ${today().split('-').reverse().join('/')}   TOTAL: ${fmtH(tot)}${totQ>0?' · '+totQ+' questões':''}`,
    '─'.repeat(54),
    ...ts.map(s => {
      const t = s.tipo==='base'?'[BASE]    ':s.tipo==='rot'?'[ROTATIVO]':'[REVISÃO] '
      const q = s.questoesCount>0?' Q:'+s.questoesCount:(s.questoes?' ✓Q':'')
      const manual = s.manual?' ✏':''
      return `${t}${manual} ${(s.materia+(s.conteudo?' · '+s.conteudo:'')).slice(0,28).padEnd(28)} ${s.durMin}min${q} ${s.time}`
    }),
    '─'.repeat(54),
    `→ Horas = ${(tot/60).toFixed(1)}h${totQ>0?' · Questões = '+totQ:''}`
  ].join('\n') : 'Inicie uma sessão para gerar o registro.'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start pt-6">
      {notif && <Notif msg={notif} onDone={() => setNotif('')} />}

      {/* LEFT */}
      <div className="flex flex-col gap-4">
        {/* Config */}
        <Card>
          <CardTitle>configurar sessão</CardTitle>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <FG label="Tipo de bloco">
              <Select value={timer.config.tipo} onChange={e => timer.setConfig({ tipo: e.target.value as TipoBloco })}>
                {Object.entries(TIPO_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </FG>
            <FG label="Matéria">
              <Select value={matSel} onChange={onMatChange}>
                <option value="">— selecione —</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>
            </FG>
            <FG label="Conteúdo">
              <Select value={cttSel} onChange={onCttChange} disabled={!matObj}>
                <option value="">— selecione a matéria —</option>
                {matObj?.conteudos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </FG>
            <FG label="Questões?">
              <div className="flex items-center h-9"><Toggle checked={timer.config.questoes} onChange={v => timer.setConfig({ questoes: v })} label="" /></div>
            </FG>
            <FG label={`Duração: ${timer.config.duracaoMin}min`}>
              <input type="range" min={10} max={90} step={5} value={timer.config.duracaoMin}
                onChange={e => timer.setConfig({ duracaoMin: +e.target.value })}
                className="w-full accent-[#4F7CFF]" />
            </FG>
            <FG label={`Pausa: ${timer.config.pausaMin}min`}>
              <input type="range" min={0} max={30} step={5} value={timer.config.pausaMin}
                onChange={e => timer.setConfig({ pausaMin: +e.target.value })}
                className="w-full accent-[#4F7CFF]" />
            </FG>
          </div>
        </Card>

        {/* Ring */}
        <Card className="flex flex-col items-center gap-4 py-7">
          <div className="flex items-center gap-6">
            <div className="relative" style={{ width: 186, height: 186 }}>
              <svg viewBox="0 0 186 186" width={186} height={186}>
                <circle cx={93} cy={93} r={80} fill="none" stroke="var(--surface3)" strokeWidth={11} />
                <circle cx={93} cy={93} r={80} fill="none" strokeWidth={11} strokeLinecap="round"
                  stroke={tipoColor}
                  strokeDasharray={CIRC}
                  strokeDashoffset={timer.ringOffset()}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear, stroke .3s' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="font-mono text-4xl font-medium" style={{ color: 'var(--text)' }}>{timer.display()}</span>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>{phaseLabel}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Btn variant="primary" onClick={handleStart} disabled={!canStart}>▶ {timer.phase==='break-idle'?'Iniciar pausa':'Iniciar'}</Btn>
              <Btn onClick={timer.pause} disabled={timer.phase!=='study' && timer.phase!=='break'}>⏸ Pausar</Btn>
              <Btn variant="success" onClick={handleSaveEarly} disabled={!canSaveEarly}>✓ Finalizar</Btn>
              <Btn variant="ghost" onClick={() => { cancelTimerNotifications(); timer.reset() }}>↺ Reiniciar</Btn>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--text3)' }}>
            {timer.config.materia ? `${timer.config.materia}${timer.config.conteudo?' · '+timer.config.conteudo:''}` : 'Selecione matéria e conteúdo'}
          </p>
        </Card>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="horas hoje" value={fmtHShort(todayMin)} color="#4F7CFF" pct={Math.min(100,Math.round(todayMin/360*100))} sub="meta: 6h" />
          <StatCard label="semana" value={fmtHShort(weekMin)} color="#22C97A" pct={Math.min(100,Math.round(weekMin/1800*100))} sub="meta: 30–35h" />
          <StatCard label="sessões hoje" value={String(ts.length)} color="#A78BFA" sub={todayQ>0?`${todayQ} questões`:'—'} />
          <StatCard label="total mês" value={fmtHShort(monthMin)} color="#F5A623" sub="meta: 120–140h" />
        </div>

        <Card>
          <div className="flex justify-between items-center mb-3">
            <CardTitle>sessões de hoje</CardTitle>
            <div className="flex gap-2">
              <Btn size="sm" variant="ghost" onClick={() => setShowManual(true)}>✏ Registrar manualmente</Btn>
              <Btn size="sm" variant="ghost" onClick={() => { ts.forEach(s => deleteSessao(s.id)) }}>limpar</Btn>
            </div>
          </div>
          {ts.length === 0 ? <Empty>Nenhuma sessão ainda hoje.</Empty> : (
            <div className="flex flex-col">
              {ts.map((s, i) => (
                <div key={s.id} className="flex flex-col gap-1 py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs w-5 text-right shrink-0" style={{ color: 'var(--text3)' }}>{String(i+1).padStart(2,'0')}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold shrink-0"
                          style={{ background: `${TIPO_COLOR[s.tipo]}22`, color: TIPO_COLOR[s.tipo] }}>{TIPO_LABEL[s.tipo]}</span>
                    {s.manual && <span className="text-xs shrink-0" style={{ color: 'var(--text3)' }}>✏</span>}
                    <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
                      {s.materia || <span style={{ color: 'var(--text3)' }}>sem matéria</span>}
                      {s.conteudo && <span style={{ color: 'var(--text2)' }}> · {s.conteudo}</span>}
                    </span>
                    {s.questoesCount > 0 && (
                      <span className="font-mono text-xs font-bold shrink-0 px-1.5 py-0.5 rounded" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{s.questoesCount}Q</span>
                    )}
                    <span className="font-mono text-xs shrink-0" style={{ color: 'var(--text3)' }}>{s.durMin}min·{s.time}</span>
                    <Btn size="icon" variant="ghost" onClick={() => openEdit(s)}>✏</Btn>
                    <Btn size="icon" variant="ghost" onClick={() => deleteSessao(s.id)} style={{ color: '#FF5A5A' }}>✕</Btn>
                  </div>
                  {s.obs && (
                    <div className="ml-7 text-xs italic px-2 py-1 rounded" style={{ color: 'var(--text3)', background: 'var(--surface2)', borderLeft: '2px solid var(--border2)' }}>
                      💬 {s.obs}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>registro para a planilha</CardTitle>
            <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(exportText).then(() => notify('Copiado!'))}>Copiar</Btn>
          </div>
          <pre className="text-xs overflow-x-auto max-h-44 overflow-y-auto p-3 rounded-lg" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text2)', background: 'var(--surface2)', border: '1px solid var(--border)', lineHeight: 1.9 }}>{exportText}</pre>
        </Card>
      </div>

      {/* Modal: questões */}
      <Modal open={showQuestoes} onClose={() => setShowQuestoes(false)} maxWidth={400}>
        <div className="text-center mb-4"><span className="text-5xl">📝</span></div>
        <h2 className="font-serif text-xl text-center mb-2" style={{ color: 'var(--text)' }}>Sessão concluída!</h2>
        <p className="text-xs text-center mb-5 px-3 py-2 rounded-lg" style={{ color: 'var(--text2)', background: 'var(--surface2)' }}>
          {timer.config.materia}{timer.config.conteudo?' · '+timer.config.conteudo:''} — {timer.config.duracaoMin}min
        </p>
        <div className="flex flex-col gap-4">
          <FG label="Quantas questões foram feitas?">
            <Input type="number" min={0} max={999} value={qCount} onChange={e => setQCount(e.target.value)} placeholder="0" className="text-2xl text-center py-3" />
          </FG>
          <FG label="Observação da sessão (opcional)">
            <textarea value={qObs} onChange={e => setQObs(e.target.value)} placeholder="Como foi? O que ficou pendente?" rows={2}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit' }} />
          </FG>
        </div>
        <ModalFooter>
          <Btn variant="ghost" onClick={() => saveQuestoes(0)}>Pular</Btn>
          <Btn variant="primary" onClick={() => saveQuestoes(parseInt(qCount)||0)}>✓ Salvar e continuar</Btn>
        </ModalFooter>
      </Modal>

      {/* Timer Alert */}
      {showAlert && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-3xl p-9 text-center w-full max-w-sm relative"
               style={{ background: 'var(--surface)', border: `2px solid ${alertIsBreak?'#F5A623':'#22C97A'}`, boxShadow: `0 0 60px ${alertIsBreak?'rgba(245,166,35,.3)':'rgba(34,201,122,.3)'}`, animation: 'alertIn .3s cubic-bezier(.34,1.56,.64,1)' }}>
            <div className="text-5xl mb-4" style={{ animation: 'pulseScale 1s infinite' }}>{alertIsBreak?'☕':'🎉'}</div>
            <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--text)' }}>{alertIsBreak?'Pausa concluída!':'Sessão concluída!'}</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>{alertIsBreak?'Descansada e pronta? Bora estudar!':'Ótimo trabalho! O que deseja fazer?'}</p>
            {!alertIsBreak && (
              <div className="mb-5 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text2)' }}>Observação da sessão</label>
                <textarea value={alertObs} onChange={e => setAlertObs(e.target.value)} rows={2} placeholder="Como foi? O que ficou pendente?"
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit' }} />
              </div>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              {!alertIsBreak && <Btn variant="ghost" onClick={alertStartBreak}>☕ Iniciar Pausa</Btn>}
              <Btn variant="success" onClick={dismissAlert}>✓ Continuar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal: editar sessão */}
      <Modal open={showEditSess} onClose={() => setShowEditSess(false)} title="✏ Editar sessão" maxWidth={480}>
        {editForm && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <FG label="Data"><Input type="date" value={editForm.date||''} onChange={e => setEditForm(f=>({...f,date:e.target.value}))} /></FG>
              <FG label="Horário"><Input type="time" value={editForm.time||''} onChange={e => setEditForm(f=>({...f,time:e.target.value}))} /></FG>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FG label="Duração (minutos)"><Input type="number" min={1} max={720} value={editForm.durMin||0} onChange={e => setEditForm(f=>({...f,durMin:+e.target.value}))} /></FG>
              <FG label="Tipo"><Select value={editForm.tipo||'base'} onChange={e => setEditForm(f=>({...f,tipo:e.target.value as TipoBloco}))}>
                {Object.entries(TIPO_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </Select></FG>
            </div>
            <FG label="Matéria"><Select value={editForm.matId?String(editForm.matId):''} onChange={e => { const m=materias.find(x=>String(x.id)===e.target.value); setEditForm(f=>({...f,matId:m?.id??null,materia:m?.nome??'',cttId:null,conteudo:''})) }}>
              <option value="">— sem matéria —</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </Select></FG>
            <FG label="Questões feitas">
              <div className="flex items-center gap-4">
                <Toggle checked={editForm.questoes||false} onChange={v => setEditForm(f=>({...f,questoes:v}))} label="" />
                {editForm.questoes && <Input type="number" min={0} value={editForm.questoesCount||0} onChange={e => setEditForm(f=>({...f,questoesCount:+e.target.value}))} style={{width:80}} />}
              </div>
            </FG>
            <FG label="Observação"><textarea value={editForm.obs||''} onChange={e => setEditForm(f=>({...f,obs:e.target.value}))} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y" style={{ background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:'inherit' }} /></FG>
          </div>
        )}
        <ModalFooter>
          <Btn variant="ghost" onClick={() => setShowEditSess(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={saveEdit}>✓ Salvar</Btn>
        </ModalFooter>
      </Modal>

      <ManualSessionModal
        open={showManual}
        onClose={() => setShowManual(false)}
        onSave={saveManual}
        materias={materias}
        notify={notify}
      />
    </div>
  )
}
