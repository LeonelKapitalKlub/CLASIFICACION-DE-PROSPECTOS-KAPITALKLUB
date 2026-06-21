import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import './Layout.css'

export default function Layout() {
  const { asesor, logout, esSupervisor } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const links = [
    { to: '/', label: 'Mis prospectos', icon: '◐' },
    { to: '/nuevo', label: 'Cargar prospecto', icon: '+' },
    { to: '/dashboard', label: 'Dashboard', icon: '▤' },
    { to: '/transferir', label: 'Transferir', icon: '⇄' },
  ]

  return (
    <div className="layout-shell">
      <header className="layout-topbar">
        <div className="layout-brand">
          <div className="layout-brandMark">K</div>
          <div>
            <div className="layout-brandName">Kapital Klub</div>
            <div className="layout-brandSub">{esSupervisor ? 'Supervisor' : 'Asesor'}</div>
          </div>
        </div>
        <button
          className="layout-menuBtn"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label="Abrir menú"
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
      </header>

      <aside className={`layout-sidebar ${menuAbierto ? 'is-open' : ''}`}>
        <div className="layout-brand layout-brandDesktop">
          <div className="layout-brandMark">K</div>
          <div>
            <div className="layout-brandName">Kapital Klub</div>
            <div className="layout-brandSub">{esSupervisor ? 'Supervisor' : 'Asesor'}</div>
          </div>
        </div>

        <nav className="layout-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `layout-navLink ${isActive ? 'is-active' : ''}`}
            >
              <span className="layout-navIcon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="layout-userBox">
          <div className="layout-userName">{asesor?.nombre}</div>
          <button onClick={handleLogout} className="layout-logoutBtn">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {menuAbierto && (
        <div className="layout-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
