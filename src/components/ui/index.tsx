import React, { useEffect, useRef } from 'react'
import { STATUS_LABEL, STATUS_COLOR } from '../../lib/constants'
import type { StatusConteudo } from '../../types'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', ...rest }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
         style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
         {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold tracking-wider uppercase mb-3" style={{ color: 'var(--text3)' }}>
      {children}
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'success' | 'danger' | 'ghost' | 'default'
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'icon'
}
const BTN_STYLES: Record<BtnVariant, string> = {
  primary: 'bg-[#4F7CFF] border-[#4F7CFF] text-white hover:bg-[#4472F5] font-semibold',
  success: 'bg-[#22C97A] border-[#22C97A] text-emerald-950 hover:brightness-105 font-semibold',
  danger:  'bg-[#FF5A5A] border-[#FF5A5A] text-white hover:brightness-105',
  ghost:   'border-transparent hover:bg-[var(--surface2)]',
  default: 'hover:border-[#4F7CFF]/50 hover:bg-[var(--surface2)]',
}
export function Btn({ variant = 'default', size = 'md', className = '', children, style, ...props }: BtnProps) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer border whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7CFF]/40 focus-visible:ring-offset-1'
  const sizes = { sm: 'px-3 h-8 text-xs', md: 'px-4 h-9 text-sm', icon: 'w-8 h-8 p-0 justify-center' }
  return (
    <button
      className={`${base} ${sizes[size]} ${BTN_STYLES[variant]} ${className}`}
      style={{
        fontFamily: 'inherit',
        borderColor: variant === 'default' || variant === 'ghost' ? 'var(--border2)' : undefined,
        background: variant === 'default' || variant === 'ghost' ? 'transparent' : undefined,
        color: variant === 'default' || variant === 'ghost' ? 'var(--text2)' : undefined,
        ...style,
      }}
      {...props}>{children}</button>
  )
}

// ─── Input / Select / Textarea ────────────────────────────────────────────────
const inputBase = 'w-full rounded-lg px-3 text-sm outline-none transition-all focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/15'
const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  height: '36px',
}
export function Input({ className = '', style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${inputBase} ${className}`}
      style={{ ...inputStyle, ...style }}
      {...props} />
  )
}
export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${inputBase} ${className}`}
      style={inputStyle}
      {...props}>{children}</select>
  )
}
export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/15 resize-y ${className}`}
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit' }}
      {...props} />
  )
}

// ─── FormGroup ────────────────────────────────────────────────────────────────
export function FG({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
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
        className="relative w-9 h-5 rounded-full transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7CFF]/40"
        style={{ background: checked ? '#22C97A' : 'var(--surface3)', border: `1px solid ${checked ? '#22C97A' : 'var(--border2)'}` }}>
        <span className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all"
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
export function Modal({ open, onClose, title, children, maxWidth = 480, closeOnBackdrop = true }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; maxWidth?: number; closeOnBackdrop?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open || !closeOnBackdrop) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose, closeOnBackdrop])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}
         onClick={(e) => { if (closeOnBackdrop && e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className="w-full rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
           style={{ maxWidth, background: 'var(--surface)', border: '1px solid var(--border2)', boxShadow: '0 24px 64px rgba(0,0,0,.55)', animation: 'fadeIn .18s ease' }}>
        {title && (
          <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text)' }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>{children}</div>
}

// ─── Notification ────────────────────────────────────────────────────────────
export function Notif({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="fixed bottom-5 right-5 px-4 py-3 rounded-xl text-sm font-medium z-[300] flex items-center gap-2.5"
         style={{
           background: 'var(--surface)',
           border: '1px solid rgba(34,201,122,.4)',
           color: 'var(--text)',
           boxShadow: '0 8px 24px rgba(0,0,0,.35), var(--shadow-sm)',
           animation: 'slideIn .2s ease',
         }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#22C97A' }} />
      {msg}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function Empty({ children }: { children?: React.ReactNode }) {
  return (
    <div className="text-center py-10 text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>
      {children ?? 'Nenhum item encontrado.'}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-2 gap-3 flex-wrap">
      <div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{title}</h1>
        {sub && <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</p>}
      </div>
      {right && <div className="flex gap-2 items-center flex-wrap">{right}</div>}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, sub, pct }: { label: string; value: string; color?: string; sub?: string; pct?: number }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
      <div className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className="text-3xl font-semibold leading-none tabular-nums" style={{ color: color ?? 'var(--text)' }}>{value}</div>
      {pct !== undefined && <PBar pct={pct} color={color} height={4} />}
      {sub && <div className="text-xs" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}
