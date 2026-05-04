import { NavLink, Outlet } from 'react-router-dom'
import { Sun, Moon, LogOut } from 'lucide-react'
import { useStore } from '../store/app'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const TABS = [
  { to: '/timer',     label: '⏱ Timer' },
  { to: '/materias',  label: '📚 Matérias' },
  { to: '/mensal',    label: '📆 Mensal' },
  { to: '/semana',    label: '📅 Semana' },
  { to: '/erros',      label: '❌ Erros' },
  { to: '/registros',  label: '📋 Registros' },
  { to: '/dashboard',  label: '📊 Dashboard' },
]

export default function Layout() {
  const { theme, toggleTheme } = useStore()
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? '')
    })
    return () => subscription.unsubscribe()
  }, [])

  const date = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

  async function logout() {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-5 gap-0"
           style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>

        <span className="font-serif text-lg mr-5 shrink-0" style={{ color: 'var(--text)' }}>
          Estud<span style={{ color: '#4F7CFF' }}>os</span>
        </span>

        <div className="flex gap-0.5 flex-1 overflow-x-auto">
          {TABS.map(t => (
            <NavLink key={t.to} to={t.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap no-underline
                 ${isActive ? 'bg-[#4F7CFF] text-white' : 'text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'}`
              }>{t.label}</NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-3 shrink-0">
          {userEmail && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: '#4F7CFF33', color: '#4F7CFF' }}>
                {userEmail[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium max-w-[90px] truncate" style={{ color: 'var(--text2)' }}>
                {userEmail.split('@')[0]}
              </span>
            </div>
          )}

          <button onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
            {theme === 'dark'
              ? <Sun size={15} style={{ color: 'var(--text2)' }} />
              : <Moon size={15} style={{ color: 'var(--text2)' }} />}
          </button>

          <span className="font-mono text-xs px-2.5 py-1 rounded-md"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
            {date}
          </span>

          <button onClick={logout}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            title="Sair">
            <LogOut size={14} style={{ color: 'var(--text3)' }} />
          </button>
        </div>
      </nav>

      <main style={{ paddingTop: 72, paddingBottom: 48 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
