import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Transferir.css'

function diasDesde(fechaStr) {
  if (!fechaStr) return null
  const fecha = new Date(fechaStr + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24))
}

export default function Transferir() {
  const { asesor, esSupervisor } = useAuth()
  const [asesores, setAsesores] = useState([])
  const [prospectos, setProspectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modo, setModo] = useState('general')
  const [asesoresFiltro, setAsesoresFiltro] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [asesorDestino, setAsesorDestino] = useState('')
  const [transfiriendo, setTransfiriendo] = useState(false)
  const [exito, setExito] = useState('')

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const { data: ases } = await supabase.from('asesores').select('*').order('nombre')
      setAsesores(ases || [])

      let query = supabase
        .from('prospectos')
        .select('*, asesores:asesor_id(nombre)')
        .eq('estado_contacto', 'no_respondio')
        .eq('es_cliente', false)
        .order('fecha_primer_contacto', { ascending: true })

      if (!esSupervisor) {
        query = query.eq('asesor_id', asesor.id)
      }

      const { data } = await query
      const listos = (data || []).filter((p) => {
        const dias = diasDesde(p.fecha_primer_contacto)
        return dias !== null && dias >= 3
      })
      setProspectos(listos)
      setCargando(false)
    }
    if (asesor) cargar()
  }, [asesor, esSupervisor])

  function toggleSeleccionado(id) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleAsesorFiltro(id) {
    setAsesoresFiltro((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const prospectosMostrados = modo === 'general'
    ? prospectos
    : prospectos.filter((p) => asesoresFiltro.includes(p.asesor_id))

  function seleccionarTodos() {
    setSeleccionados(prospectosMostrados.map((p) => p.id))
  }

  function deseleccionarTodos() {
    setSeleccionados([])
  }

  async function transferir() {
    if (!asesorDestino) return
    if (seleccionados.length === 0) return
    setTransfiriendo(true)

    for (const id of seleccionados) {
      const prospecto = prospectos.find((p) => p.id === id)
      if (!prospecto) continue

      await supabase.from('transferencias').insert({
        prospecto_id: id,
        de_asesor_id: prospecto.asesor_id,
        a_asesor_id: asesorDestino,
        transferido_por: asesor.id,
      })

      await supabase.from('prospectos').update({
        asesor_id: asesorDestino,
        fecha_primer_contacto: null,
        estado_contacto: 'pendiente',
        clasificacion: null,
      }).eq('id', id)
    }

    setExito(`${seleccionados.length} prospecto${seleccionados.length !== 1 ? 's' : ''} transferido${seleccionados.length !== 1 ? 's' : ''} correctamente.`)
    setSeleccionados([])
    setAsesorDestino('')

    const { data: ases } = await supabase.from('asesores').select('*').order('nombre')
    setAsesores(ases || [])

    let query = supabase
      .from('prospectos')
      .select('*, asesores:asesor_id(nombre)')
      .eq('estado_contacto', 'no_respondio')
      .eq('es_cliente', false)
      .order('fecha_primer_contacto', { ascending: true })
    if (!esSupervisor) query = query.eq('asesor_id', asesor.id)
    const { data } = await query
    const listos = (data || []).filter((p) => {
      const dias = diasDesde(p.fecha_primer_contacto)
      return dias !== null && dias >= 3
    })
    setProspectos(listos)
    setTransfiriendo(false)
    setTimeout(() => setExito(''), 4000)
  }

  if (cargando) return <div className="tr-loading">Cargando...</div>
  return (
    <div className="tr-page">
      <h1 className="tr-title">Transferir prospectos</h1>
      <p className="tr-subtitle">
        Prospectos listos para transferir (3+ días sin responder): <strong>{prospectos.length}</strong>
      </p>

      {prospectos.length === 0 && (
        <div className="tr-vacio">No hay prospectos listos para transferir por ahora.</div>
      )}

      {prospectos.length > 0 && (
        <>
          <div className="tr-modos">
            <button
              className={`tr-modoBtn ${modo === 'general' ? 'is-active' : ''}`}
              onClick={() => { setModo('general'); setSeleccionados([]) }}
            >
              Prospectos en general
            </button>
            {esSupervisor && (
              <button
                className={`tr-modoBtn ${modo === 'asesor' ? 'is-active' : ''}`}
                onClick={() => { setModo('asesor'); setSeleccionados([]) }}
              >
                Por asesor
              </button>
            )}
          </div>

          {modo === 'asesor' && esSupervisor && (
            <div className="tr-asesorFiltros">
              <p className="tr-asesorFiltrosLabel">Seleccioná los asesores a transferir:</p>
              <div className="tr-asesorBtns">
                {asesores.filter((a) => a.rol === 'asesor').map((a) => (
                  <button
                    key={a.id}
                    className={`tr-asesorBtn ${asesoresFiltro.includes(a.id) ? 'is-active' : ''}`}
                    onClick={() => toggleAsesorFiltro(a.id)}
                  >
                    {a.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {prospectosMostrados.length > 0 && (
            <>
              <div className="tr-acciones">
                <button className="tr-accionBtn" onClick={seleccionarTodos}>
                  Seleccionar todos ({prospectosMostrados.length})
                </button>
                {seleccionados.length > 0 && (
                  <button className="tr-accionBtn" onClick={deseleccionarTodos}>
                    Deseleccionar todos
                  </button>
                )}
              </div>

              <div className="tr-lista">
                {prospectosMostrados.map((p) => {
                  const dias = diasDesde(p.fecha_primer_contacto)
                  const sel = seleccionados.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      className={`tr-card ${sel ? 'is-selected' : ''}`}
                      onClick={() => toggleSeleccionado(p.id)}
                    >
                      <div className="tr-cardCheck">{sel ? '✓' : ''}</div>
                      <div className="tr-cardInfo">
                        <div className="tr-cardNombre">{p.nombre || 'Sin nombre'}</div>
                        <div className="tr-cardTel">{p.telefono}</div>
                        {esSupervisor && p.asesores?.nombre && (
                          <div className="tr-cardAsesor">👤 {p.asesores.nombre}</div>
                        )}
                      </div>
                      <div className="tr-cardDias">
                        <span className="tr-diasNum">{dias}</span>
                        <span className="tr-diasLabel">días</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {seleccionados.length > 0 && (
                <div className="tr-destino">
                  <p className="tr-destinoLabel">
                    Transferir <strong>{seleccionados.length}</strong> prospecto{seleccionados.length !== 1 ? 's' : ''} a:
                  </p>
                  <select
                    className="tr-select"
                    value={asesorDestino}
                    onChange={(e) => setAsesorDestino(e.target.value)}
                  >
                    <option value="">Elegir asesor...</option>
                    {asesores.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                  <button
                    className="tr-submit"
                    onClick={transferir}
                    disabled={!asesorDestino || transfiriendo}
                  >
                    {transfiriendo ? 'Transfiriendo...' : 'Confirmar transferencia'}
                  </button>
                </div>
              )}
            </>
          )}

          {modo === 'asesor' && asesoresFiltro.length > 0 && prospectosMostrados.length === 0 && (
            <div className="tr-vacio">Los asesores seleccionados no tienen prospectos listos para transferir.</div>
          )}
        </>
      )}

      {exito && <div className="tr-exito">{exito}</div>}
    </div>
  )
}
