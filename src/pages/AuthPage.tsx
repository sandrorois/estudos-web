import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Input, Btn } from '../components/ui'

export default function AuthPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    // Aguarda todos os eventos de auth dispararem antes de decidir o redirect
    setTimeout(async () => {
      if (recoveryDetected) return
      const { data: { session } } = await supabase.auth.getSession()
      if (session) navigate('/timer', { replace: true })
    }, 200)

    return () => subscription.unsubscribe()
  }, [])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
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
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--text)' }}>
            Estud<span style={{ color: '#4F7CFF' }}>os</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Câmara dos Deputados — controle de estudos</p>
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
            {mode !== 'reset' && mode !== 'new-password' && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>Senha</label>
                  {mode === 'login' && (
                    <button type="button"
                      onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                      className="text-xs transition-all" style={{ color: '#4F7CFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" minLength={6} required />
              </div>
            )}
            {mode === 'reset' && (
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
            )}
            {mode === 'new-password' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>Nova senha</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" minLength={6} required />
              </div>
            )}
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,90,90,.1)', color: '#FF5A5A', border: '1px solid rgba(255,90,90,.2)' }}>{error}</p>}
            {success && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(34,201,122,.1)', color: '#22C97A', border: '1px solid rgba(34,201,122,.2)' }}>{success}</p>}
            <Btn type="submit" variant="primary" disabled={loading} className="w-full justify-center py-2.5">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : mode === 'reset' ? 'Enviar link' : 'Salvar nova senha'}
            </Btn>
          </form>
          <div className="mt-4 text-center flex flex-col gap-2">
            {mode !== 'reset' && (
              <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
                className="text-xs transition-all" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
              </button>
            )}
            {mode === 'reset' && (
              <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="text-xs transition-all" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
