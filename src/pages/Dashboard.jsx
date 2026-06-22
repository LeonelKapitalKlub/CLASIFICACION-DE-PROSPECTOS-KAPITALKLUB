import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Dashboard.css'

function calcularCampana(fechaStr) {
  if (!fechaStr) return null
  const fecha = new Date(fechaStr + 'T00:00:00')
  const meses = (fecha.getFullYear() - 2026) * 12 + (fecha.getMonth() - 5)
  return 13 + meses
}

export default function Dashboard() {
  const { esSupervisor, asesor } = useAuth()
  const [prospectos, setProspectos] = useState([])
  const [asesores, setAsesores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [asesorSeleccionado, setAsesorSeleccionado] = useState(null)
  const [campanaSeleccionada, setCampanaSeleccionada] = useState('todas')

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const { data: ases } = await supabase.from('asesores').select('*').order('nombre')
      setAsesores(ases || [])
      let query = supabase.from('prospectos').select('*')
      if (!esSupervisor) query = query.eq('asesor_id', asesor.id)
      const { data } = await query
      setProspectos(data || [])
      setCargando(false)
    }
    if (asesor) cargar()
  }, [asesor, esSupervisor])

  if (cargando) return <div className="db-loading">Cargando dashboard...</div>

  const total = prospectos.length
  const respondieron = prospectos.filter((p) => p.estado_contacto === 'respondio').length
  const noRespondieron = prospectos.filter((p) => p.estado_contacto === 'no_respondio').length
  const pendientes = prospectos.filter((p) => p.estado_contacto === 'pendiente').length
  const clientes = prospectos.filter((p) => p.es_cliente).length
  const tasaConversion = total > 0 ? ((clientes / total) * 100).toFixed(1) : '0.0'

  function metricasAsesor(asesorId) {
    const pp = prospectos.filter((p) => p.asesor_id === asesorId)
    const t = pp.length
    return {
      total: t,
      respondieron: pp.filter((p) => p.estado_contacto === 'respondio').length,
      noRespondieron: pp.filter((p) => p.estado_contacto === 'no_respondio').length,
      pendientes: pp.filter((p) => p.estado_contacto === 'pendiente').length,
      clientes: pp.filter((p) => p.es_cliente).length,
      tasa: t > 0 ? ((pp.filter((p) => p.es_cliente).length / t) * 100).toFixed(1) : '0.0',
    }
  }

  const campanaMap = {}
  prospectos.forEach((p) => {
    const c = calcularCampana(p.fecha_consulta)
    if (c === null) return
    if (!campanaMap[c]) campanaMap[c] = []
    campanaMap[c].push(p)
  })
  const campanasOrdenadas = Object.keys(campanaMap).map(Number).sort((a, b) => a - b)

  function metricasCampana(num) {
    const pp = campanaMap[num] || []
    const t = pp.length
    const cl = pp.filter((p) => p.es_cliente).length
    return { total: t, clientes: cl, tasa: t > 0 ? ((cl / t) * 100).toFixed(1) : '0.0' }
  }
  return (
    <div className="db-page">
      <h1 className="db-title">Dashboard</h1>
      <p className="db-subtitle">Resumen general del equipo</p>

      <div className="db-section">
        <h2 className="db-sectionTitle">General</h2>
        <div className="db-cards">
          <div className="db-card">
            <div className="db-cardNum">{total}</div>
            <div className="db-cardLabel">Prospectos totales</div>
          </div>
          <div className="db-card">
            <div className="db-cardNum db-cardNum--verde">{clientes}</div>
            <div className="db-cardLabel">Clientes</div>
          </div>
          <div className="db-card">
            <div className="db-cardNum db-cardNum--verde">{tasaConversion}%</div>
            <div className="db-cardLabel">Tasa de conversión</div>
          </div>
          <div className="db-card">
            <div className="db-cardNum db-cardNum--verde">{respondieron}</div>
            <div className="db-cardLabel">Respondieron</div>
          </div>
          <div className="db-card">
            <div className="db-cardNum db-cardNum--naranja">{noRespondieron}</div>
            <div className="db-cardLabel">No respondieron</div>
          </div>
          <div className="db-card">
            <div className="db-cardNum db-cardNum--naranja">{pendientes}</div>
            <div className="db-cardLabel">Pendientes de contacto</div>
          </div>
        </div>
      </div>

      {esSupervisor && (
        <div className="db-section">
          <h2 className="db-sectionTitle">Por asesor</h2>
          <div className="db-asesores">
            {asesores.filter((a) => a.rol === 'asesor').map((a) => {
              const m = metricasAsesor(a.id)
              const isOpen = asesorSeleccionado === a.id
              return (
                <div key={a.id} className="db-asesorCard">
                  <button
                    className="db-asesorHeader"
                    onClick={() => setAsesorSeleccionado(isOpen ? null : a.id)}
                  >
                    <div className="db-asesorNombre">{a.nombre}</div>
                    <div className="db-asesorResumen">
                      <span className="db-pill">{m.total} prospectos</span>
                      <span className="db-pill db-pill--verde">{m.clientes} clientes</span>
                      <span className="db-pill db-pill--verde">{m.tasa}%</span>
                    </div>
                    <span className="db-chevron">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="db-asesorDetalle">
                      <div className="db-asesorMetrica">
                        <span>Respondieron</span>
                        <strong className="db-verde">{m.respondieron}</strong>
                      </div>
                      <div className="db-asesorMetrica">
                        <span>No respondieron</span>
                        <strong className="db-naranja">{m.noRespondieron}</strong>
                      </div>
                      <div className="db-asesorMetrica">
                        <span>Pendientes</span>
                        <strong className="db-naranja">{m.pendientes}</strong>
                      </div>
                      <div className="db-asesorMetrica">
                        <span>Clientes</span>
                        <strong className="db-verde">{m.clientes}</strong>
                      </div>
                      <div className="db-asesorMetrica">
                        <span>Tasa de conversión</span>
                        <strong className="db-verde">{m.tasa}%</strong>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="db-section">
        <h2 className="db-sectionTitle">Por campaña</h2>
        <div className="db-campanaFiltros">
          <button
            className={`mp-filtroBtn ${campanaSeleccionada === 'todas' ? 'is-active' : ''}`}
            onClick={() => setCampanaSeleccionada('todas')}
          >
            Todas
          </button>
          {campanasOrdenadas.map((c) => (
            <button
              key={c}
              className={`mp-filtroBtn ${campanaSeleccionada === String(c) ? 'is-active' : ''}`}
              onClick={() => setCampanaSeleccionada(String(c))}
            >
              Campaña {c}
            </button>
          ))}
        </div>

        <div className="db-campanaTabla">
          <div className="db-campanaHeader">
            <span>Campaña</span>
            <span>Prospectos</span>
            <span>Clientes</span>
            <span>Conversión</span>
          </div>
          {campanasOrdenadas
            .filter((c) => campanaSeleccionada === 'todas' || String(c) === campanaSeleccionada)
            .map((c) => {
              const m = metricasCampana(c)
              return (
                <div key={c} className="db-campanaFila">
                  <span className="db-campanaNum">Campaña {c}</span>
                  <span>{m.total}</span>
                  <span className="db-verde">{m.clientes}</span>
                  <span className="db-verde">{m.tasa}%</span>
                </div>
              )
            })}
          {campanasOrdenadas.length === 0 && (
            <div className="db-campanaVacio">No hay datos de campañas todavía.</div>
          )}
        </div>
      </div>
    </div>
  )
          }
