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

  as
