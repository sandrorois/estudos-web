import React, { useEffect, useRef } from 'react'
import { STATUS_LABEL, STATUS_COLOR } from '../../lib/constants'
import type { StatusConteudo } from '../../types'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
         style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--text3)' }}>{children}</div>
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'success' | 'danger' | 'ghost' | 'default'
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'icon'
}
const BTN_STYLES: Record<BtnVariant, string> = {
  primary: 'bg-[#4F7CFF] border-[#4F7CFF] text-white hover:bg-blue-500',
  success: 'bg-[#22C97A] border-[#22C97A] text-emerald-950 hover:brightness-110',
  danger:  'bg-[#FF5A5A] border-[#FF5A5A] text-white hover:brightness-110',
  ghost:   'border-transparent hover:border-[var(--border)]',
  default: 'hover:border-[#4F7CFF] hover:bg-[var(--surface2)]',
}
export function Btn({ variant = 'default', size = 'md', className = '', children, style, ...props }: BtnProps) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer border whitespace-nowrap'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', icon: 'w-8 h-8 p-0 justify-center text-sm' }
  return (
    <button className={`${base} ${sizes[size]} ${BTN_STYLES[variant]} ${className}`}
      style={{ fontFamily: 'inherit', borderColor: variant === 'default' || variant === 'ghost' ? 'var(--border2)' : undefined, background: variant === 'default' || variant === 'ghost' ? 'transparent' : undefined, color: variant === 'default' || variant === 'ghost' ? 'var(--text2)' : undefined, ...style }}
      {...props}>{children}</button>
  )
}

// ─── Input / Select / Textarea ────────────────────────────────────────────────
const inputStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text)', fontFamily: 'inherit',
}
export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all focus:border-[#4F7CFF] ${className}`} style={inputStyle} {...props} />
}
export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all focus:border-[#4F7CFF] ${className}`} style={inputStyle} {...props}>{children}</select>
}
export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all focus:border-[#4F7CFF] resize-y ${className}`} style={inputStyle} {...props} />
}

// ─── FormGroup ────────────────────────────────────────────────────────────────
export function FG({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
        style={{ background: checked ? '#22C97A' : 'var(--surface3)', border: `1px solid ${checked ? '#22C97A' : 'var(--border2)'}` }}>
        <span className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all"
              style={{ left: checked ? '18px' : '2px' }} />
      </button>
      {label && <span className="text-sm" style={{ color: 'var(--text2)' }}>{checked ? 'Sim' : 'Não'}</span>}
    </div>
  )
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
export function StatusPill({ status, onClick }: { status: StatusConteudo; onClick?: () => void }) {
  const c = STATUS_COLOR[status]
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold border transition-all"
          style={{ background: c.bg, color: c.text, borderColor: c.border, cursor: onClick ? 'pointer' : 'default' }}
          onClick={onClick}>{STATUS_LABEL[status]}</span>
  )
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export function PBar({ pct, color = '#4F7CFF', height = 5 }: { pct: number; color?: string; height?: number }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: 'var(--surface3)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 480 }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; maxWidth?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className="w-full rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
           style={{ maxWidth, background: 'var(--surface)', border: '1px solid var(--border2)', boxShadow: '0 24px 64px rgba(0,0,0,.6)', animation: 'fadeIn .18s ease' }}>
        {title && <h2 className="font-serif text-xl mb-5" style={{ color: 'var(--text)' }}>{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 mt-5">{children}</div>
}

// ─── Notification ────────────────────────────────────────────────────────────
export function Notif({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-medium z-[300]"
         style={{ background: 'var(--surface2)', border: '1px solid #22C97A', color: '#22C97A', boxShadow: '0 8px 24px rgba(0,0,0,.4)', animation: 'slideIn .2s ease' }}>
      {msg}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function Empty({ children }: { children?: React.ReactNode }) {
  return <div className="text-center py-8 text-sm" style={{ color: 'var(--text3)' }}>{children ?? 'Nenhum item.'}</div>
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
      <div>
        <h1 className="font-serif text-2xl" style={{ color: 'var(--text)' }}>{title}</h1>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</p>}
      </div>
      {right && <div className="flex gap-2 items-center flex-wrap">{right}</div>}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, sub, pct }: { label: string; value: string; color?: string; sub?: string; pct?: number }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className="text-3xl font-semibold leading-none tabular-nums" style={{ color: color ?? 'var(--text)' }}>{value}</div>
      {pct !== undefined && <PBar pct={pct} color={color} />}
      {sub && <div className="text-xs" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}
