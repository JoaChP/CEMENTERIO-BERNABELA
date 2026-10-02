import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api.js'
import { AuthContext } from './auth-context.js'

const EMPTY = { full_name: '', username: '', role: 'operator', is_active: true, password: '' }
const ACTIONS = { 'user.create': 'Creación de usuario', 'user.update': 'Modificación de usuario', 'user.password_reset': 'Restablecimiento de contraseña', 'user.password_change': 'Cambio de contraseña', 'deceased.create': 'Creación de difunto', 'deceased.update': 'Modificación de difunto', 'deceased.delete': 'Eliminación de difunto' }
const LABELS = { full_name: 'Nombre completo', username: 'Usuario', role: 'Rol', is_active: 'Activo', known_as: 'CC', date_of_birth: 'Nacimiento', date_of_death: 'Fallecimiento', burial_date: 'Sepultura', sector: 'Sector', row: 'Fila', grave_number: 'Tumba o nicho', notes: 'Observaciones', map_x: 'Posición horizontal', map_y: 'Posición vertical' }
function valueText(value) { return value == null || value === '' ? 'Sin dato' : value === true ? 'Sí' : value === false ? 'No' : value === 'administrator' ? 'Administrador' : value === 'operator' ? 'Operador' : String(value) }

export function UsersPage() {
  const current = useContext(AuthContext)
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...EMPTY })
  const [editing, setEditing] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const manager = current?.role === 'administrator'
  useEffect(() => {
    if (!manager) { setLoading(false); return }
    let active = true
    api.listUsers().then(data => { if (active) setUsers(data) }).catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [manager])
  if (!manager) return <div className="alert alert-error">Esta sección está reservada a administradores.</div>
  function update(event) { const { name, value, checked, type } = event.target; setForm(old => ({...old, [name]: type === 'checkbox' ? checked : value})) }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const { password: newPassword, ...data } = form
      if (editing) await api.updateUser(editing.id, data)
      else await api.createUser({...data, password:newPassword})
      if (editing?.id === current.id) { navigate('/admin/login', {replace:true}); return }
      setUsers(await api.listUsers()); setEditing(null); setForm({...EMPTY}); setMessage('Usuario guardado correctamente.')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function reset(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      await api.resetPassword(resetUser.id, password)
      if (resetUser.id === current.id) { navigate('/admin/login', {replace:true}); return }
      setResetUser(null); setPassword(''); setMessage('Contraseña restablecida. El usuario debe iniciar sesión nuevamente.')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <>
    <div className="admin-page-heading"><div><span className="eyebrow">USUARIOS</span><h1>Gestión de usuarios</h1><p>Creá cuentas, asigná roles y administrá su acceso al sistema.</p></div></div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}{message && <div className="alert alert-success" role="status">{message}</div>}
    <section className="detail-panel user-panel user-account-panel"><div className="user-card-heading"><span className="eyebrow">CUENTA DE ACCESO</span><h2>{editing ? 'Editar usuario' : 'Crear nuevo usuario'}</h2><p>Completá los datos de la persona y elegí su nivel de acceso.</p></div><form onSubmit={save} className="user-form user-account-form">
      <fieldset className="user-form-section"><legend><span>01</span> Datos de la cuenta</legend><div className="user-section-grid">
      <label className="field-control"><span>Nombre completo *</span><input name="full_name" value={form.full_name} onChange={update} maxLength={200} required /></label>
      <label className="field-control"><span>Usuario *</span><input name="username" value={form.username} onChange={update} minLength={3} maxLength={80}  required autoComplete="off" /><small>Podés usar un nombre de usuario o tu correo electrónico, sin espacios.</small></label>
      {!editing && <label className="field-control"><span>Contraseña inicial *</span><input type="password" name="password" value={form.password} onChange={update} minLength={8} maxLength={256} autoComplete="new-password" required /><small>Mínimo 8 caracteres.</small></label>}
      </div></fieldset>
      <fieldset className="user-form-section"><legend><span>02</span> Permisos y estado</legend><div className="user-section-grid">
      <label className="field-control"><span>Rol</span><select name="role" value={form.role} onChange={update} disabled={editing?.id === current.id}><option value="operator">Operador</option><option value="administrator">Administrador</option></select></label>
      <label className="user-active user-status-card"><input type="checkbox" name="is_active" checked={form.is_active} onChange={update} disabled={editing?.id === current.id} /><span><strong>Usuario activo</strong><small>{form.is_active ? 'Puede iniciar sesión en el sistema.' : 'El acceso a esta cuenta está deshabilitado.'}</small></span></label>
      <div className="user-permissions-note"><strong>{form.role === 'operator' ? 'Acceso de consulta' : 'Acceso de administrador'}</strong><p>{form.role === 'operator' ? 'Puede ver difuntos, consultar ubicaciones y descargar PDF. No puede crear, editar ni eliminar registros.' : 'Puede crear, editar y eliminar difuntos, gestionar usuarios y consultar la auditoría.'}</p></div>
      </div></fieldset>
      <div className="user-form-footer"><span>* Campos obligatorios</span><div className="user-actions">{editing && <button type="button" className="button button-quiet" disabled={busy} onClick={() => {setEditing(null);setForm({...EMPTY})}}>Cancelar edición</button>}<button className="button button-dark" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario'}</button></div></div>
    </form></section>
    <section className="records-panel"><div className="records-toolbar"><h2>Usuarios del sistema</h2></div><div className="table-scroll"><table className="records-table"><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{loading ? <tr><td colSpan={5}>Cargando…</td></tr> : users.map(user => <tr key={user.id}><td>{user.full_name || user.username}</td><td>{user.username}</td><td>{valueText(user.role)}</td><td>{user.is_active ? 'Activo' : 'Inactivo'}</td><td><div className="user-actions"><button className="button button-quiet" disabled={busy} onClick={() => {setEditing(user);setForm({...EMPTY,...user});setError('');setMessage('')}}>Editar</button><button className="button button-quiet" disabled={busy} onClick={() => {setResetUser(user);setPassword('');setError('')}}>Restablecer contraseña</button></div></td></tr>)}</tbody></table></div></section>
    {resetUser && <section className="detail-panel user-panel"><h2>Restablecer contraseña de {resetUser.username}</h2><form onSubmit={reset} className="form-stack"><label className="field-control"><span>Nueva contraseña</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={256} autoComplete="new-password" required /></label><p>Sus sesiones actuales se cerrarán.</p><div className="user-actions"><button type="button" className="button button-quiet" disabled={busy} onClick={() => {setResetUser(null);setPassword('')}}>Cancelar</button><button className="button button-dark" disabled={busy}>Restablecer contraseña</button></div></form></section>}
  </>
}

export function PasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({current_password:'',password:'',confirm:''})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(event) {
    event.preventDefault(); setError('')
    if (form.password !== form.confirm) {setError('Las contraseñas nuevas no coinciden.');return}
    setBusy(true)
    try { await api.changePassword({current_password:form.current_password,password:form.password}); navigate('/admin/login',{replace:true}) }
    catch(err) {setError(err.message)} finally {setBusy(false)}
  }
  return <><div className="admin-page-heading"><div><span className="eyebrow">MI CUENTA</span><h1>Cambiar contraseña</h1><p>Al guardar se cerrarán tus sesiones. Ingresá nuevamente con la contraseña nueva.</p></div></div><section className="detail-panel user-panel password-panel"><div className="user-card-heading"><span className="eyebrow">SEGURIDAD DE LA CUENTA</span><h2>Actualizar contraseña</h2><p>Ingresá tu contraseña actual y elegí una nueva de al menos 8 caracteres.</p></div>{error && <div className="alert alert-error" role="alert">{error}</div>}<form className="user-form password-form" onSubmit={save}>{[['current_password','Contraseña actual'],['password','Nueva contraseña'],['confirm','Confirmar nueva contraseña']].map(([key,label]) => <label className="field-control" key={key}><span>{label}</span><input type="password" value={form[key]} onChange={event => setForm({...form,[key]:event.target.value})} required minLength={key === 'current_password' ? 1 : 8} maxLength={256} autoComplete={key === 'current_password' ? 'current-password' : 'new-password'} /></label>)}<div className="user-form-footer"><span>Al guardar, tendrás que iniciar sesión nuevamente.</span><div className="user-actions"><button className="button button-dark" disabled={busy}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</button></div></div></form></section></>
}

export function AuditPage() {
  const current = useContext(AuthContext)
  const [input, setInput] = useState({actor:'',action:'',start_date:'',end_date:''})
  const [filters, setFilters] = useState({...input})
  const [page, setPage] = useState(1)
  const [data, setData] = useState({items:[],total:0})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const manager = current?.role === 'administrator'
  useEffect(() => {
    if (!manager) return
    let active = true; setLoading(true); setError('')
    api.listAudit({...filters,page}).then(result => {if(active)setData(result)}).catch(err => {if(active)setError(err.message)}).finally(() => {if(active)setLoading(false)})
    return () => {active=false}
  },[filters,page,manager])
  if (!manager) return <div className="alert alert-error">Esta sección está reservada a administradores.</div>
  return <><div className="admin-page-heading"><div><span className="eyebrow">USUARIOS</span><h1>Auditoría</h1><p>Historial de acciones y cambios de usuarios y difuntos. Se registra desde la activación de esta función.</p></div></div><section className="detail-panel user-panel audit-filter-panel"><div className="user-card-heading"><span className="eyebrow">CONSULTAR HISTORIAL</span><h2>Filtros de auditoría</h2><p>Buscá por usuario, tipo de acción o período. Las fechas corresponden a Costa Rica.</p></div><form className="user-form" onSubmit={event => {event.preventDefault();setPage(1);setFilters({...input})}}>
    <label className="field-control"><span>Usuario</span><input value={input.actor} onChange={event => setInput({...input,actor:event.target.value})} /></label><label className="field-control"><span>Acción</span><select value={input.action} onChange={event => setInput({...input,action:event.target.value})}><option value="">Todas las acciones</option>{Object.entries(ACTIONS).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>{[['start_date','Desde'],['end_date','Hasta']].map(([key,label]) => <label className="field-control" key={key}><span>{label} (Costa Rica)</span><input type="date" value={input[key]} onChange={event => setInput({...input,[key]:event.target.value})} /></label>)}<div className="user-actions"><button className="button button-dark">Buscar</button><button type="button" className="button button-quiet" onClick={() => {const empty={actor:'',action:'',start_date:'',end_date:''};setInput(empty);setFilters(empty);setPage(1)}}>Limpiar filtros</button></div></form></section>
    {error && <div className="alert alert-error" role="alert">{error}</div>}<section className="detail-panel user-panel"><div className="audit-results-heading"><div><span className="eyebrow">TRAZABILIDAD</span><h2>Historial de actividad</h2></div><span className="audit-count">{data.total} {data.total === 1 ? 'acción registrada' : 'acciones registradas'}</span></div>{loading ? <p>Cargando historial…</p> : data.items.length === 0 ? <p>No se encontraron acciones.</p> : data.items.map(item => <article className={`audit-entry audit-card ${item.action.endsWith('.delete') ? 'audit-deletion' : ''}`} key={item.id}><div className="audit-card-top"><span className="audit-action-badge">{ACTIONS[item.action] || item.action}</span><time dateTime={item.created_at}>{new Intl.DateTimeFormat('es-CR',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Costa_Rica'}).format(new Date(item.created_at))}</time></div><h3>{item.entity_name}</h3><div className="audit-actor"><span className="audit-avatar" aria-hidden="true">{item.actor_username.slice(0,1).toUpperCase()}</span><span>Realizado por <strong>{item.actor_username}</strong></span><span className="audit-entity-type">{item.entity_type === 'user' ? 'Usuario' : 'Difunto'}</span></div>{(item.before || item.after) && <details><summary>Ver datos y cambios</summary><div className="table-scroll"><table className="records-table"><thead><tr><th>Campo</th><th>Antes</th><th>Después</th></tr></thead><tbody>{[...new Set([...Object.keys(item.before || {}),...Object.keys(item.after || {})])].filter(key => !item.before || !item.after || item.before[key] !== item.after[key]).map(key => <tr key={key}><td>{LABELS[key] || key}</td><td className="audit-value">{valueText(item.before?.[key])}</td><td className="audit-value">{valueText(item.after?.[key])}</td></tr>)}</tbody></table></div></details>}</article>)}<div className="user-actions audit-pagination"><button className="button button-quiet" disabled={page<=1 || loading} onClick={() => setPage(page-1)}>Anterior</button><span>Página {page} de {Math.max(1,Math.ceil(data.total/20))}</span><button className="button button-quiet" disabled={page*20>=data.total || loading} onClick={() => setPage(page+1)}>Siguiente</button></div></section></>
}
