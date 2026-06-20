import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Layout() {
  const { asesor, logout, esSupervisor } = useAuth()
  const navigate = useNavigate()

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
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>K</div>
          <div>
            <div style={styles.brandName}>Kapital Klub</div>
            <div style={styles.brandSub}>{esSupervisor ? 'Supervisor' : 'Asesor'}</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <span style={styles.navIcon}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.userBox}>
          <div style={styles.userName}>{asesor?.nombre}</div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '240px',
    flexShrink: 0,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 8px',
    marginBottom: '28px',
  },
  brandMark: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--verde), var(--verde-dim))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '16px',
    color: '#0A0E0A',
    flexShrink: 0,
  },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '14.5px',
    letterSpacing: '-0.01em',
  },
  brandSub: {
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-dim)',
  },
  navLinkActive: {
    background: 'var(--verde-bg)',
    color: 'var(--verde)',
  },
  navIcon: {
    width: '18px',
    textAlign: 'center',
    fontSize: '14px',
  },
  userBox: {
    borderTop: '1px solid var(--border)',
    paddingTop: '14px',
    padding: '14px 8px 0',
  },
  userName: {
    fontSize: '13.5px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12.5px',
    color: 'var(--text-dim)',
    width: '100%',
  },
  main: {
    flex: 1,
    padding: '32px 36px',
    minWidth: 0,
  },
  }
