import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import DashboardPage from './pages/DashboardPage'
import RegistrosPage from './pages/RegistrosPage'
import { useEffect } from 'react'

function App() {
  const { theme, setUserId } = useStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/timer" replace />} />
          <Route path="timer"     element={<TimerPage />} />
          <Route path="materias"  element={<MateriasPage />} />
          <Route path="semana"    element={<SemanaPage />} />
          <Route path="mensal"    element={<MensalPage />} />
          <Route path="erros"      element={<ErrosPage />} />
          <Route path="registros"  element={<RegistrosPage />} />
          <Route path="dashboard"  element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/timer" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
