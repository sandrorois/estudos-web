import { NavLink, Outlet } from 'react-router-dom'
import { Sun, Moon, LogOut, Menu, X } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)

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
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-0"
           style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>

        <div className="flex flex-col leading-tight mr-5 shrink-0 select-none">
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text3)' }}>Plano de</span>
          <span className="text-sm font-bold tracking-tight" style={{ color: '#4F7CFF' }}>Aprovação</span>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex gap-0.5 flex-1 overflow-x-auto">
          {TABS.map(t => (
            <NavLink key={t.to} to={t.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap no-underline
                 ${isActive ? 'bg-[#4F7CFF] text-white' : 'text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'}`
              }>{t.label}</NavLink>
          ))}
        </div>

        {/* Mobile spacer */}
        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-2 ml-2 shrink-0">
          {userEmail && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0"
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

          <span className="hidden sm:block font-mono text-xs px-2.5 py-1 rounded-md"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
            {date}
          </span>

          <button onClick={logout}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            title="Sair">
            <LogOut size={14} style={{ color: 'var(--text3)' }} />
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: menuOpen ? '#4F7CFF' : 'var(--surface2)', border: '1px solid var(--border)' }}
            onClick={() => setMenuOpen(o => !o)}>
            {menuOpen
              ? <X size={16} style={{ color: 'white' }} />
              : <Menu size={16} style={{ color: 'var(--text2)' }} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40"
          style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
          onClick={() => setMenuOpen(false)}>
          <div className="flex flex-col p-4 gap-1" onClick={e => e.stopPropagation()}>
            {TABS.map(t => (
              <NavLink key={t.to} to={t.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-medium transition-all no-underline
                   ${isActive ? 'bg-[#4F7CFF] text-white' : 'text-[var(--text)] hover:bg-[var(--surface2)]'}`
                }>{t.label}</NavLink>
            ))}
            {userEmail && (
              <div className="mt-4 px-4 py-2 text-xs" style={{ color: 'var(--text3)' }}>
                Logado como <strong style={{ color: 'var(--text2)' }}>{userEmail}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      <main style={{ paddingTop: 72, paddingBottom: 48 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 16px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
