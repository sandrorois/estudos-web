import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Input, Btn } from '../components/ui'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
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
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--text)' }}>
            Estud<span style={{ color: '#4F7CFF' }}>os</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Câmara dos Deputados — controle de estudos</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base mb-5" style={{ color: 'var(--text)' }}>Criar nova senha</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>Nova senha</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres" minLength={6} required />
            </div>
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
