import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './NuevoProspecto.css'

const FUENTES = [
  'Facebook', 'WhatsApp', 'Messenger', 'Instagram',
  'Referido de cliente', 'Prospecto viejo', 'Folletería', 'Otro',
]

export default function NuevoProspecto() {
  const { asesor } = useAuth()
  const navigate = useNavigate()

  const [asesores, setAsesores] = useState([])
  const [localidades, setLocalidades] = useState([])
  const [busquedaLocalidad, setBusquedaLocalidad] = useState('')
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState(null)
  const [mostrarListaLocalidad, setMostrarListaLocalidad] = useState(false)
  const localidadRef = useRef(null)

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    producto_interes: '',
    fecha_consulta: new Date().toISOString().slice(0, 10),
    fecha_distribucion: '',
    asesor_id: '',
    fuente: '',
  })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    supabase.from('asesores').select('*').order('nombre').then(({ data }) => {
      if (data) setAsesores(data)
    })
  }, [])

  useEffect(() => {
    function handleClickFuera(e) {
      if (localidadRef.current && !localidadRef.current.contains(e.target)) {
        setMostrarListaLocalidad(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  useEffect(() => {
    if (busquedaLocalidad.trim().length < 2) {
      setLocalidades([])
      return
    }
    const timeout = setTimeout(() => {
      supabase
        .from('localidades')
        .select('*')
        .ilike('nombre', `%${busquedaLocalidad}%`)
        .order('nombre')
        .limit(20)
        .then(({ data }) => setLocalidades(data || []))
    }, 200)
    return () => clearTimeout(timeout)
  }, [busquedaLocalidad])

  function handleChange(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function elegirLocalidad(loc) {
    setLocalidadSeleccionada(loc)
    setBusquedaLocalidad(`${loc.nombre} (${loc.provincia})`)
    setMostrarListaLocalidad(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.telefono.trim()) {
      setError('El número de teléfono es obligatorio.')
      return
    }
    if (!form.fecha_consulta) {
      setError('La fecha de consulta es obligatoria.')
      return
    }
    if (!form.asesor_id) {
      setError('Tenés que elegir un asesor designado.')
      return
    }

    setGuardando(true)

    const { error: insertError } = await supabase.from('prospectos').insert({
      nombre: form.nombre.trim() || null,
      telefono: form.telefono.trim(),
      localidad_id: localidadSeleccionada?.id || null,
      producto_interes: form.producto_interes.trim() || null,
      fecha_consulta: form.fecha_consulta,
      fecha_distribucion: form.fecha_distribucion || null,
      asesor_id: form.asesor_id,
      fuente: form.fuente || null,
      ingresado_por: asesor?.id,
      estado_contacto: 'pendiente',
    })

    setGuardando(false)

    if (insertError) {
      setError('No se pudo guardar el prospecto. Intentá de nuevo.')
      console.error(insertError)
      return
    }

    setExito(true)
    setTimeout(() => navigate('/'), 1200)
  }

  return (
    <div className="np-page">
      <h1 className="np-title">Cargar prospecto</h1>
      <p className="np-subtitle">Completá los datos del nuevo contacto.</p>

      <form className="np-form" onSubmit={handleSubmit}>
        <div className="np-grid">
          <label className="np-field">
            <span className="np-label">Nombre <em>(opcional)</em></span>
            <input
              className="np-input"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre del prospecto"
            />
          </label>

          <label className="np-field">
            <span className="np-label">Teléfono <em>(obligatorio)</em></span>
            <input
              className="np-input"
              value={form.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              placeholder="Ej: 3764123456"
              required
            />
          </label>

          <label className="np-field" ref={localidadRef} style={{ position: 'relative' }}>
            <span className="np-label">Localidad <em>(opcional)</em></span>
            <input
              className="np-input"
              value={busquedaLocalidad}
              onChange={(e) => {
                setBusquedaLocalidad(e.target.value)
                setLocalidadSeleccionada(null)
                setMostrarListaLocalidad(true)
              }}
              onFocus={() => setMostrarListaLocalidad(true)}
              placeholder="Buscar localidad..."
              autoComplete="off"
            />
            {mostrarListaLocalidad && localidades.length > 0 && (
              <div className="np-dropdown">
                {localidades.map((loc) => (
                  <button
                    type="button"
                    key={loc.id}
                    className="np-dropdownItem"
                    onClick={() => elegirLocalidad(loc)}
                  >
                    {loc.nombre} <span className="np-dropdownProv">{loc.provincia}</span>
                  </button>
                ))}
              </div>
            )}
          </label>

          <label className="np-field">
            <span className="np-label">Producto de interés <em>(opcional)</em></span>
            <input
              className="np-input"
              value={form.producto_interes}
              onChange={(e) => handleChange('producto_interes', e.target.value)}
              placeholder="Ej: Moto 110cc"
            />
          </label>

          <label className="np-field">
            <span className="np-label">Fecha de consulta <em>(obligatorio)</em></span>
            <input
              type="date"
              className="np-input"
              value={form.fecha_consulta}
              onChange={(e) => handleChange('fecha_consulta', e.target.value)}
              required
            />
          </label>

          <label className="np-field">
            <span className="np-label">Fecha de distribución <em>(obligatorio)</em></span>
            <input
              type="date"
              className="np-input"
              value={form.fecha_distribucion}
              onChange={(e) => handleChange('fecha_distribucion', e.target.value)}
              required
            />
          </label>

          <label className="np-field">
            <span className="np-label">Asesor designado <em>(obligatorio)</em></span>
            <select
              className="np-input"
              value={form.asesor_id}
              onChange={(e) => handleChange('asesor_id', e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {asesores.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </label>

          <label className="np-field">
            <span className="np-label">Fuente de ingreso <em>(opcional)</em></span>
            <select
              className="np-input"
              value={form.fuente}
              onChange={(e) => handleChange('fuente', e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {FUENTES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="np-infoBox">
          Vos sos quien está ingresando este prospecto: <strong>{asesor?.nombre}</strong>
        </div>

        {error && <div className="np-error">{error}</div>}
        {exito && <div className="np-exito">Prospecto guardado correctamente ✓</div>}

        <button type="submit" className="np-submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar prospecto'}
        </button>
      </form>
    </div>
  )
      }
