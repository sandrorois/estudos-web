import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import { useStore } from './store/app'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import TimerPage from './pages/TimerPage'
import MateriasPage from './pages/MateriasPage'
import SemanaPage from './pages/SemanaPage'
import MensalPage from './pages/MensalPage'
import ErrosPage from './pages/ErrosPage'
import RegistrosPage from './pages/RegistrosPage'
import DashboardPage from './pages/DashboardPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function ProtectedRoute() {
  const { userId } = useStore()
  if (!userId) return <Navigate to="/auth" replace />
  return <Outlet />
}

function App() {
  const { theme, loaded, loadData, clearData } = useStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (session?.user) {
          loadData(session.user.id)
        } else {
          useStore.setState({ loaded: true })
        }
      } else if (event === 'SIGNED_OUT') {
        clearData()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: '#4F7CFF', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/timer" replace />} />
            <Route path="timer"      element={<TimerPage />} />
            <Route path="materias"   element={<MateriasPage />} />
            <Route path="semana"     element={<SemanaPage />} />
            <Route path="mensal"     element={<MensalPage />} />
            <Route path="erros"      element={<ErrosPage />} />
            <Route path="registros"  element={<RegistrosPage />} />
            <Route path="dashboard"  element={<DashboardPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/timer" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
