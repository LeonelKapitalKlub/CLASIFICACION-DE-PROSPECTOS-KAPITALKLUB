import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import RutaPrivada from './components/RutaPrivada'
import Layout from './components/Layout'
import Login from './pages/Login'
import MisProspectos from './pages/MisProspectos'
import NuevoProspecto from './pages/NuevoProspecto'
import Dashboard from './pages/Dashboard'
import Transferir from './pages/Transferir'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RutaPrivada>
                <Layout />
              </RutaPrivada>
            }
          >
            <Route index element={<MisProspectos />} />
            <Route path="nuevo" element={<NuevoProspecto />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transferir" element={<Transferir />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
