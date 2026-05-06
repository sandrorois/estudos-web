import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Input, Btn } from '../components/ui'

function PasswordInput({ value, onChange, placeholder = 'mínimo 6 caracteres', label, show, onToggle }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  label: string; show: boolean; onToggle: () => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>{label}</label>
      <div className="relative">
        <Input type={show ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} minLength={6} required
          style={{ paddingRight: 36 }} />
        <button type="button" onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'new-password'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Detecta recuperação de senha ou redireciona se já logado
  useEffect(() => {
    let recoveryDetected = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryDetected = true
        setMode('new-password')
      }
    })

    setTimeout(async () => {
      if (recoveryDetected) return
      const { data: { session } } = await supabase.auth.getSession()
      if (session) navigate('/timer', { replace: true })
    }, 200)

    return () => subscription.unsubscribe()
  }, [])

  function changeMode(m: typeof mode) {
    setMode(m); setError(''); setSuccess(''); setPassword(''); setConfirm('')
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess('')

    if ((mode === 'register' || mode === 'new-password') && password !== confirm) {
      setError('As senhas não coincidem.'); return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/timer', { replace: true })
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setSuccess('E-mail de redefinição enviado! Verifique sua caixa de entrada.')
      } else if (mode === 'new-password') {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setSuccess('Senha redefinida com sucesso!')
        setTimeout(() => navigate('/timer', { replace: true }), 1500)
      }
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
          <h2 className="font-semibold text-base mb-5" style={{ color: 'var(--text)' }}>
            {mode === 'login' ? 'Entrar na conta' : mode === 'register' ? 'Criar conta' : mode === 'reset' ? 'Redefinir senha' : 'Criar nova senha'}
          </h2>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode !== 'new-password' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>E-mail</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
            )}

            {mode === 'reset' && (
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
            )}

            {(mode === 'login' || mode === 'register') && (
              <>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>Senha</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => changeMode('reset')}
                        className="text-xs" style={{ color: '#4F7CFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Esqueci a senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input type={showPwd ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="mínimo 6 caracteres" minLength={6} required style={{ paddingRight: 36 }} />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {mode === 'register' && (
                  <PasswordInput label="Confirmar senha" value={confirm} onChange={setConfirm}
                    placeholder="repita a senha" show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                )}
              </>
            )}

            {mode === 'new-password' && (
              <>
                <PasswordInput label="Nova senha" value={password} onChange={setPassword}
                  show={showPwd} onToggle={() => setShowPwd(v => !v)} />
                <PasswordInput label="Confirmar nova senha" value={confirm} onChange={setConfirm}
                  placeholder="repita a nova senha" show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </>
            )}

            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,90,90,.1)', color: '#FF5A5A', border: '1px solid rgba(255,90,90,.2)' }}>{error}</p>}
            {success && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(34,201,122,.1)', color: '#22C97A', border: '1px solid rgba(34,201,122,.2)' }}>{success}</p>}
            <Btn type="submit" variant="primary" disabled={loading} className="w-full justify-center py-2.5">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : mode === 'reset' ? 'Enviar link' : 'Salvar nova senha'}
            </Btn>
          </form>
          <div className="mt-4 text-center flex flex-col gap-2">
            {(mode === 'login' || mode === 'register') && (
              <button onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
              </button>
            )}
            {mode === 'reset' && (
              <button onClick={() => changeMode('login')}
                className="text-xs" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
