import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api.js'

export function SatelliteMap({ records = [], selectedId, onSelect, position, onPosition }) {
  const editable = Boolean(onPosition)
  function place(event) {
    if (!editable) return
    const bounds = event.currentTarget.getBoundingClientRect()
    onPosition({ map_x: Math.round(Math.min(100, Math.max(0, (event.clientX - bounds.left) / bounds.width * 100)) * 100) / 100,
      map_y: Math.round(Math.min(100, Math.max(0, (event.clientY - bounds.top) / bounds.height * 100)) * 100) / 100 })
  }
  const photo = <img src="/images/cementerio-sectores.png" alt="Vista satelital del cementerio con los sectores A, B, C, D, E, F y G señalados" draggable="false" />
  if (editable) return <button type="button" className="satellite-map satellite-editor" aria-label="Marcar ubicación en el plano. Hacé clic sobre el nicho; con Enter se marca el centro y podés ajustar las coordenadas." onClick={(event) => { if (event.detail === 0) onPosition({map_x:50,map_y:50}); else place(event) }}>{photo}{position?.map_x != null && position?.map_y != null && <span className="map-pin" style={{left:`${position.map_x}%`,top:`${position.map_y}%`}}>●</span>}</button>
  return <div className="satellite-map">{photo}{records.filter(record => record.map_x != null && record.map_y != null).map(record => <button type="button" key={record.id} className={`map-pin ${selectedId === record.id ? 'selected' : ''}`} style={{left:`${record.map_x}%`,top:`${record.map_y}%`}} title={`${record.full_name} - ${record.sector}`} aria-label={`Ver ubicación de ${record.full_name}`} onClick={() => onSelect?.(record.id)}>●</button>)}</div>
}

export default function SatellitePage() {
  const [records, setRecords] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    apiRecords()
    async function apiRecords() {
      try {
        const result = await api.mapRecords()
        if (active) setRecords(result)
      } catch (err) { if (active) setError(err.message) }
      finally { if (active) setLoading(false) }
    }
    return () => { active = false }
  }, [])
  const matches = records.filter(record => `${record.full_name} ${record.known_as || ''} ${record.sector} ${record.grave_number || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  const selected = records.find(record => record.id === selectedId)
  return <>
    <div className="admin-page-heading"><div><span className="eyebrow">PLANO DEL CEMENTERIO</span><h1>Ubicación de nichos</h1><p>Consultá los sectores y las ubicaciones marcadas en la vista satelital.</p></div></div>
    <section className="detail-panel satellite-panel"><SatelliteMap records={matches} selectedId={selectedId} onSelect={setSelectedId} /><p className="filter-help">Los marcadores representan ubicaciones indicadas por la administración. Para ubicar un nicho, abrí su registro y marcá el punto en el plano.</p></section>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    <section className="detail-panel"><label className="field-control"><span>Buscar nombre, CC, sector o nicho</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscá un registro para ubicarlo" /></label>
      {loading ? <p>Cargando registros…</p> : <p>{matches.length} registros · {matches.filter(record => record.map_x != null).length} con ubicación marcada</p>}
      {selected && <div className="map-selected"><strong>{selected.full_name}</strong><p>{selected.sector} · {selected.grave_number || 'Sin número de tumba o nicho'}{selected.map_x == null ? ' · Pendiente de ubicar en el plano' : ''}</p><Link className="button button-quiet" to={`/admin/deceased/${selected.id}`}>Ver registro</Link><Link className="button button-dark" to={`/admin/deceased/${selected.id}/edit`}>Editar ubicación</Link></div>}
      <div className="map-records">{matches.map(record => <button type="button" key={record.id} onClick={() => setSelectedId(record.id)} className={selectedId === record.id ? 'selected' : ''}><strong>{record.full_name}</strong><span>{record.sector} · {record.grave_number || 'Sin número'} · {record.map_x == null ? 'Sin marcar' : 'Ubicado'}</span></button>)}</div>
    </section>
  </>
}
