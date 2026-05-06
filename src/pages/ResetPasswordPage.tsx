import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Input, Btn } from '../components/ui'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess('Senha redefinida com sucesso!')
      setTimeout(() => navigate('/timer', { replace: true }), 1500)
    } catch (err: any) {
      setError(err.message ?? 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-0.5 mb-3">
            <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text3)' }}>Plano de</span>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#4F7CFF' }}>Aprovação</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Organize seus estudos no seu ritmo.</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base mb-5" style={{ color: 'var(--text)' }}>Criar nova senha</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {(['Nova senha', 'Confirmar nova senha'] as const).map((label, i) => {
              const isFirst = i === 0
              const value = isFirst ? password : confirm
              const show = isFirst ? showPwd : showConfirm
              const setVal = isFirst ? setPassword : setConfirm
              const toggle = isFirst ? () => setShowPwd(v => !v) : () => setShowConfirm(v => !v)
              return (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>{label}</label>
                  <div className="relative">
                    <Input type={show ? 'text' : 'password'} value={value}
                      onChange={e => setVal(e.target.value)}
                      placeholder={isFirst ? 'mínimo 6 caracteres' : 'repita a senha'}
                      minLength={6} required style={{ paddingRight: 36 }} />
                    <button type="button" onClick={toggle}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )
            })}
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,90,90,.1)', color: '#FF5A5A', border: '1px solid rgba(255,90,90,.2)' }}>{error}</p>}
            {success && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(34,201,122,.1)', color: '#22C97A', border: '1px solid rgba(34,201,122,.2)' }}>{success}</p>}
            <Btn type="submit" variant="primary" disabled={loading} className="w-full justify-center py-2.5">
              {loading ? 'Aguarde...' : 'Salvar nova senha'}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  )
}
