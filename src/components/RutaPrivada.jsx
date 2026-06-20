import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function RutaPrivada({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-dim)',
      }}>
        Cargando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
