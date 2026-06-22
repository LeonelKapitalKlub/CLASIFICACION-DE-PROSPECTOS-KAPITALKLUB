import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './MisProspectos.css'

function diasDesde(fechaStr) {
  if (!fechaStr) return null
  const fecha = new Date(fechaStr + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diffMs = hoy - fecha
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function linkWhatsapp(telefono) {
  let numero = (telefono || '').replace(/\D/g, '')
  if (!numero) return null
  if (!numero.startsWith('54')) numero = '54' + numero
  return `https://wa.me/${numero}`
}

function calcularEstadoVisual(p) {
  if (p.es_cliente) return { texto: 'Cliente', clase: 'cliente' }
  if (p.estado_contacto === 'pendiente') return { texto: 'Pendiente de contacto', clase: 'pendiente' }
  if (p.estado_contacto === 'respondio') {
    if (p.clasificacion === 'potable') return { texto: 'Potable · dato caliente', clase: 'potable' }
    if (p.clasificacion === 'tibio') return { texto: 'Tibio · dato medio', clase: 'tibio' }
    if (p.clasificacion === 'frio') return { texto: 'Frío · dato frío', clase: 'frio' }
    return { texto: 'Respondió · sin clasificar', clase: 'sinclasificar' }
  }
  if (p.estado_contacto === 'no_respondio') {
    const dias = diasDesde(p.fecha_primer_contacto)
    if (dias === null) return { texto: 'No respondió', clase: 'frio' }
    if (dias <= 1) return { texto: `No respondió · ${dias === 0 ? 'hoy' : '1 día'} · Frío`, clase: 'frio' }
    if (dias === 2) return { texto: 'No respondió · 2 días · Recontactar', clase: 'recontactar' }
    return { texto: `No respondió · ${dias} días · Listo para transferir`, clase: 'transferir' }
  }
  return { texto: 'Sin estado', clase: 'pendiente' }
}

export default function MisProspectos() {
  const { asesor, esSupervisor } = useAuth()
  const [prospectos, setProspectos] = useState([])
  const [localidadesMap, setLocalidadesMap] = useState({})
  const [asesoresMap, setAsesoresMap] = useState({})
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    const { data: locs } = await supabase.from('localidades').select('id, nombre')
    const locMap = {}
    ;(locs || []).forEach((l) => { locMap[l.id] = l.nombre })
    setLocalidadesMap(locMap)

    const { data: ases } = await supabase.from('asesores').select('id, nombre')
    const aMap = {}
    ;(ases || []).forEach((a) => { aMap[a.id] = a.nombre })
    setAsesoresMap(aMap)

    let query = supabase.from('prospectos').select('*').order('created_at', { ascending: false })
    if (!esSupervisor) query = query.eq('asesor_id', asesor.id)
    const { data, error } = await query
    if (!error) setProspectos(data || [])
    setCargando(false)
  }, [asesor, esSupervisor])

  useEffect(() => {
    if (asesor) cargarDatos()
  }, [asesor, cargarDatos])

  async function marcarPrimerContacto(id) {
    await supabase.from('prospectos').update({ fecha_primer_contacto: new Date().toISOString().slice(0, 10) }).eq('id', id)
    cargarDatos()
  }

  async function marcarRespuesta(id, respondio) {
    await supabase.from('prospectos').update({ estado_contacto: respondio ? 'respondio' : 'no_respondio' }).eq('id', id)
    cargarDatos()
  }

  async function clasificar(id, clasificacion) {
    await supabase.from('prospectos').update({ clasificacion }).eq('id', id)
    cargarDatos()
  }

  async function marcarCliente(id) {
    await supabase.from('prospectos').update({ es_cliente: true, fecha_conversion: new Date().toISOString().slice(0, 10) }).eq('id', id)
    cargarDatos()
  }

  async function eliminarProspecto(id, nombre, telefono) {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar a ${nombre || telefono}? Esta acción no se puede deshacer.`
    )
    if (!confirmar) return
    await supabase.from('prospectos').delete().eq('id', id)
    cargarDatos()
  }

  const prospectosFiltrados = prospectos.filter((p) => {
    if (filtro === 'todos') return true
    return calcularEstadoVisual(p).clase === filtro
  })

  if (cargando) return <div className="mp-loading">Cargando prospectos...</div>
  return (
    <div className="mp-page">
      <h1 className="mp-title">Mis prospectos</h1>
      <p className="mp-subtitle">
        {prospectos.length} prospecto{prospectos.length !== 1 ? 's' : ''} en total
      </p>

      <div className="mp-filtros">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'potable', label: 'Potables' },
          { id: 'tibio', label: 'Tibios' },
          { id: 'frio', label: 'Fríos' },
          { id: 'recontactar', label: 'Recontactar' },
          { id: 'transferir', label: 'Transferir' },
          { id: 'cliente', label: 'Clientes' },
        ].map((f) => (
          <button
            key={f.id}
            className={`mp-filtroBtn ${filtro === f.id ? 'is-active' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {prospectosFiltrados.length === 0 && (
        <div className="mp-vacio">No hay prospectos en esta categoría.</div>
      )}

      <div className="mp-lista">
        {prospectosFiltrados.map((p) => {
          const estado = calcularEstadoVisual(p)
          return (
            <div key={p.id} className={`mp-card mp-card--${estado.clase}`}>
              <div className="mp-cardHeader">
                <div>
                  <div className="mp-nombre">{p.nombre || 'Sin nombre'}</div>
                  <a
                    className="mp-telefono mp-telefono--link"
                    href={linkWhatsapp(p.telefono)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📞 {p.telefono} · WhatsApp
                  </a>
                </div>
                <div className="mp-cardHeaderRight">
                  <span className={`mp-badge mp-badge--${estado.clase}`}>{estado.texto}</span>
                  {esSupervisor && (
                    <button
                      className="mp-btn mp-btn--eliminar"
                      onClick={() => eliminarProspecto(p.id, p.nombre, p.telefono)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              <div className="mp-detalles">
                {p.localidad_id && localidadesMap[p.localidad_id] && (
                  <span className="mp-detalle">📍 {localidadesMap[p.localidad_id]}</span>
                )}
                {p.producto_interes && (
                  <span className="mp-detalle">🛍 {p.producto_interes}</span>
                )}
                {p.fuente && (
                  <span className="mp-detalle">↳ {p.fuente}</span>
                )}
                {esSupervisor && p.asesor_id && asesoresMap[p.asesor_id] && (
                  <span className="mp-detalle">👤 {asesoresMap[p.asesor_id]}</span>
                )}
              </div>

              {!p.es_cliente && (
                <div className="mp-acciones">
                  {p.estado_contacto === 'pendiente' && (
                    <button className="mp-btn mp-btn--primary" onClick={() => marcarPrimerContacto(p.id)}>
                      Marcar primer contacto
                    </button>
                  )}
                  {p.fecha_primer_contacto && p.estado_contacto !== 'respondio' && (
                    <>
                      <button className="mp-btn mp-btn--ok" onClick={() => marcarRespuesta(p.id, true)}>
                        Respondió
                      </button>
                      <button className="mp-btn mp-btn--muted" onClick={() => marcarRespuesta(p.id, false)}>
                        No respondió
                      </button>
                    </>
                  )}
                  {p.estado_contacto === 'respondio' && !p.clasificacion && (
                    <>
                      <button className="mp-btn mp-btn--potable" onClick={() => clasificar(p.id, 'potable')}>
                        Potable
                      </button>
                      <button className="mp-btn mp-btn--tibio" onClick={() => clasificar(p.id, 'tibio')}>
                        Tibio
                      </button>
                      <button className="mp-btn mp-btn--frio" onClick={() => clasificar(p.id, 'frio')}>
                        Frío
                      </button>
                    </>
                  )}
                  {p.estado_contacto === 'respondio' && (
                    <button className="mp-btn mp-btn--cliente" onClick={() => marcarCliente(p.id)}>
                      Convertir en cliente
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
