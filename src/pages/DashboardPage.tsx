import { useState } from 'react'
import { useStore } from '../store/app'
import { StatCard, SectionHeader, PBar, StatusPill } from '../components/ui'
import { TIPO_COLOR, TIPO_LABEL, MESES_PT, monthPfx, fmtHShort, dateKey } from '../lib/constants'
import type { TipoBloco, StatusConteudo } from '../types'

function last14Days(): string[] {
  const days: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(dateKey(d))
  }
  return days
}

export default function DashboardPage() {
  const { materias, sessoes, erros, cycleStatus } = useStore()
  const [detailMode, setDetailMode] = useState<'barras' | 'detalhado'>('detalhado')
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const today = new Date()
  const pfx = monthPfx(today)
  const monthSessoes = sessoes.filter(s => s.date.startsWith(pfx))
  const monthMin = monthSessoes.reduce((a, s) => a + s.durMin, 0)
  const monthQ = monthSessoes.reduce((a, s) => a + (s.questoesCount || 0), 0)
  const monthPct = Math.min(100, Math.round(monthMin / 7200 * 100))

  const totalConteudos = materias.reduce((a, m) => a + m.conteudos.length, 0)
  const revisados = materias.reduce((a, m) => a + m.conteudos.filter(c => c.status === 2).length, 0)
  const errosPendentes = erros.filter(e => !e.revisado).length

  // Gráfico: horas por dia (últimos 14 dias)
  const days14 = last14Days()
  const byDay = days14.map(d => ({
    date: d,
    min: sessoes.filter(s => s.date === d).reduce((a, s) => a + s.durMin, 0),
  }))
  const maxDayMin = Math.max(...byDay.map(d => d.min), 1)

  // Gráfico: por tipo
  const byTipo = (['base', 'rot', 'rev', 'revisao', 'questoes'] as TipoBloco[]).map(t => ({
    tipo: t,
    min: monthSessoes.filter(s => s.tipo === t).reduce((a, s) => a + s.durMin, 0),
  })).filter(x => x.min > 0)
  const maxTipoMin = Math.max(...byTipo.map(x => x.min), 1)

  // Gráfico: erros por matéria
  const errosByMat = materias.map(m => ({
    nome: m.nome, count: erros.filter(e => e.materia === m.nome).length,
  })).filter(x => x.count > 0)
  const maxErros = Math.max(...errosByMat.map(x => x.count), 1)

  // Progresso por matéria
  function matProgress(mat: typeof materias[0]) {
    const done = sessoes.filter(s => s.matId === mat.id && s.date.startsWith(pfx)).reduce((a, s) => a + s.durMin, 0)
    const totalMetaH = mat.conteudos.reduce((a, c) => a + c.metaH, 0)
    const tot = mat.conteudos.length
    const doneStatus = mat.conteudos.filter(c => c.status === 2).length
    const pct = totalMetaH > 0
      ? Math.min(100, Math.round(done / 60 / totalMetaH * 100))
      : (tot ? Math.round(doneStatus / tot * 100) : 0)
    const q = sessoes.filter(s => s.matId === mat.id && s.date.startsWith(pfx)).reduce((a, s) => a + (s.questoesCount || 0), 0)
    return { done, totalMetaH, pct, q, tot, doneStatus }
  }

  function statusCount(mat: typeof materias[0], st: StatusConteudo) {
    return mat.conteudos.filter(c => c.status === st).length
  }

  const monthName = MESES_PT[today.getMonth()]

  return (
    <div className="pt-6 flex flex-col gap-6">
      <SectionHeader title="Dashboard" sub={`Visão geral — ${monthName} ${today.getFullYear()}`} />

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Horas este mês" value={fmtHShort(monthMin)} color="#4F7CFF" pct={monthPct} sub={`meta 120–140h (${monthPct}%)`} />
        <StatCard label="Sessões no mês" value={String(monthSessoes.length)} color="#A78BFA" sub={`${monthQ} questões · ${monthName}`} />
        <StatCard label="Conteúdos revisados" value={`${revisados}/${totalConteudos}`} color="#22C97A" pct={totalConteudos ? Math.round(revisados / totalConteudos * 100) : 0} sub={`${totalConteudos ? Math.round(revisados / totalConteudos * 100) : 0}% do catálogo`} />
        <StatCard label="Erros pendentes" value={String(errosPendentes)} color="#FF5A5A" sub={`${erros.length} total registrado`} />
      </div>

      {/* Horas por dia — últimos 14 dias */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text3)' }}>Horas por dia — últimos 14 dias</div>
        <div className="flex items-end gap-1" style={{ height: 80 }}>
          {byDay.map(({ date, min }) => {
            const pct = min / maxDayMin
            const color = min >= 360 ? '#22C97A' : min >= 180 ? '#4F7CFF' : 'var(--surface3)'
            const label = date.slice(8)
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1" title={`${date}: ${fmtHShort(min)}`}>
                <span className="text-[9px] font-mono" style={{ color: 'var(--text3)' }}>
                  {min > 0 ? fmtHShort(min) : ''}
                </span>
                <div className="w-full rounded-t-sm transition-all" style={{ height: Math.max(3, pct * 60), background: color }} />
                <span className="text-[9px] font-mono" style={{ color: 'var(--text3)' }}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Distribuição por tipo */}
      {byTipo.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text3)' }}>Distribuição por tipo — {monthName}</div>
          <div className="flex flex-col gap-2.5">
            {byTipo.map(({ tipo, min }) => (
              <div key={tipo} className="flex items-center gap-3">
                <span className="text-xs w-24 shrink-0" style={{ color: 'var(--text2)' }}>{TIPO_LABEL[tipo]}</span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 10, background: 'var(--surface3)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(min / maxTipoMin * 100)}%`, background: TIPO_COLOR[tipo] }} />
                </div>
                <span className="text-xs font-mono w-12 text-right shrink-0" style={{ color: 'var(--text3)' }}>{fmtHShort(min)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progresso por matéria */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Progresso por matéria</div>
          <div className="flex gap-1">
            {(['barras', 'detalhado'] as const).map(m => (
              <button key={m} onClick={() => setDetailMode(m)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all border"
                style={{
                  background: detailMode === m ? '#4F7CFF' : 'transparent',
                  color: detailMode === m ? '#fff' : 'var(--text2)',
                  borderColor: detailMode === m ? '#4F7CFF' : 'var(--border2)',
                }}>
                {m === 'barras' ? 'Barras' : 'Detalhado'}
              </button>
            ))}
          </div>
        </div>

        {detailMode === 'barras' ? (
          <div className="flex flex-col gap-3">
            {materias.map(mat => {
              const { done, totalMetaH, pct, q } = matProgress(mat)
              return (
                <div key={mat.id} className="flex items-center gap-3">
                  <span className="text-xs w-32 shrink-0 truncate" style={{ color: 'var(--text2)' }}>{mat.nome}</span>
                  <div className="flex-1"><PBar pct={pct} color={TIPO_COLOR[mat.tipo]} height={8} /></div>
                  <span className="text-xs font-mono shrink-0 w-20 text-right" style={{ color: 'var(--text3)' }}>
                    {(done / 60).toFixed(1)}h{totalMetaH > 0 ? `/${totalMetaH}h` : ''}
                  </span>
                  {q > 0 && <span className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{q}Q</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {materias.map(mat => {
              const { done, totalMetaH, pct, q, tot, doneStatus } = matProgress(mat)
              const isOpen = expanded[mat.id]
              const andamento = statusCount(mat, 1)
              const reforco = statusCount(mat, 3)

              return (
                <div key={mat.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                    style={{ background: 'var(--surface2)' }}
                    onClick={() => setExpanded(e => ({ ...e, [mat.id]: !e[mat.id] }))}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TIPO_COLOR[mat.tipo] }} />
                    <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text)' }}>{mat.nome}</span>
                    <div className="flex items-center gap-2 text-xs">
                      {doneStatus > 0 && <span style={{ color: '#22C97A' }}>✓ {doneStatus}</span>}
                      {andamento > 0 && <span style={{ color: '#F5A623' }}>▶ {andamento}</span>}
                      {reforco > 0 && <span style={{ color: '#FF5A5A' }}>⚠ {reforco}</span>}
                    </div>
                    <span className="font-mono text-xs" style={{ color: '#22C97A' }}>{fmtHShort(done)}</span>
                    {q > 0 && <span className="text-xs font-mono px-1.5 rounded" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{q}Q</span>}
                    <div style={{ width: 60 }}><PBar pct={pct} color={TIPO_COLOR[mat.tipo]} /></div>
                    <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--text3)' }}>{pct}%</span>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {isOpen && (
                    <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                      {mat.conteudos.length === 0
                        ? <div className="px-4 py-3 text-xs" style={{ color: 'var(--text3)' }}>Nenhum conteúdo.</div>
                        : mat.conteudos.map(c => {
                          const cMin = sessoes.filter(s => s.matId === mat.id && s.cttId === c.id && s.date.startsWith(pfx)).reduce((a, s) => a + s.durMin, 0)
                          const cQ = sessoes.filter(s => s.matId === mat.id && s.cttId === c.id && s.date.startsWith(pfx)).reduce((a, s) => a + (s.questoesCount || 0), 0)
                          const cPct = c.metaH > 0 ? Math.min(100, Math.round(cMin / 60 / c.metaH * 100)) : 0
                          return (
                            <div key={c.id} className="flex items-center gap-3 px-4 py-2 border-b last:border-0"
                              style={{ borderColor: 'var(--border)' }}>
                              <div className="flex-1 text-xs truncate" style={{ color: 'var(--text)' }}>{c.nome}</div>
                              {c.metaH > 0 && (
                                <div style={{ width: 60 }}><PBar pct={cPct} color={TIPO_COLOR[mat.tipo]} height={4} /></div>
                              )}
                              {cMin > 0 && <span className="text-xs font-mono shrink-0" style={{ color: '#22C97A' }}>{fmtHShort(cMin)}</span>}
                              {cQ > 0 && <span className="text-xs font-mono px-1 rounded shrink-0" style={{ color: '#F5A623', background: 'rgba(245,166,35,.12)' }}>{cQ}Q</span>}
                              <StatusPill status={c.status} onClick={() => cycleStatus(mat.id, c.id)} />
                            </div>
                          )
                        })
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Erros por matéria */}
      {errosByMat.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text3)' }}>Erros por matéria</div>
          <div className="flex flex-col gap-2.5">
            {errosByMat.sort((a, b) => b.count - a.count).map(({ nome, count }) => {
              const color = count >= 5 ? '#FF5A5A' : count >= 3 ? '#F5A623' : 'var(--text3)'
              return (
                <div key={nome} className="flex items-center gap-3">
                  <span className="text-xs w-32 shrink-0 truncate" style={{ color: 'var(--text2)' }}>{nome}</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: 'var(--surface3)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round(count / maxErros * 100)}%`, background: color }} />
                  </div>
                  <span className="text-xs font-mono w-6 text-right shrink-0" style={{ color }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
