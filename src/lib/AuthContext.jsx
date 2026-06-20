import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [asesor, setAsesor] = useState(null)
  const [loading, setLoading] = useState(true)

  async function cargarAsesor(userId) {
    const { data } = await supabase
      .from('asesores')
      .select('*')
      .eq('id', userId)
      .single()
    setAsesor(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        cargarAsesor(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        cargarAsesor(session.user.id)
      } else {
        setAsesor(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  const esSupervisor = asesor?.rol === 'supervisor'

  return (
    <AuthContext.Provider value={{ session, asesor, loading, login, logout, esSupervisor }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
