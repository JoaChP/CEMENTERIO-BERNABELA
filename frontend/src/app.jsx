import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  createBrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  RouterProvider,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  DoorOpen,
  Download,
  FilePlus2,
  Flower2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Pencil,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { api } from './api.js'

const CONTACT = {
  email: import.meta.env.VITE_CONTACT_EMAIL || '',
  phone: import.meta.env.VITE_CONTACT_PHONE || '',
  address: import.meta.env.VITE_CONTACT_ADDRESS || '1.3 km de la plaza de deportes de Bernabela, Santa Cruz, Guanacaste, Costa Rica',
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'admin/login', element: <LoginPage /> },
      {
        path: 'admin',
        element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <Navigate to="/admin/records" replace /> },
          { path: 'records', element: <RecordsPage /> },
          { path: 'deceased/new', element: <DeceasedForm /> },
          { path: 'deceased/:id', element: <RecordDetail /> },
          { path: 'deceased/:id/edit', element: <DeceasedForm /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

function RootLayout() {
  return <Outlet />
}

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <main className="public-page">
      <header className="public-header">
        <Link className="brand" to="/" aria-label="Campo Santo Nuestra Señora de Fátima, inicio">
          <span className="brand-mark"><Flower2 size={21} strokeWidth={1.65} /></span>
          <span><b>Campo Santo</b><small>Nuestra Señora de Fátima</small></span>
        </Link>
        <button className="icon-button menu-toggle" aria-label="Abrir menú" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`public-nav ${menuOpen ? 'is-open' : ''}`}>
          <a href="#nosotros" onClick={() => setMenuOpen(false)}>El cementerio</a>
          <a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
          <Link className="nav-admin" to="/admin/login"><LockKeyhole size={15} /> Acceso administrativo</Link>
        </nav>
      </header>

      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> UN LUGAR PARA RECORDAR</span>
          <h1>La memoria<br />permanece <i>.</i></h1>
          <p>Un espacio de respeto y recogimiento, dedicado a honrar la vida y acompañar a quienes mantienen vivo el recuerdo.</p>
          <a className="button button-dark" href="#nosotros">Conocé el cementerio <ArrowRight size={17} /></a>
        </div>
        <div className="hero-art" aria-label="Jardín sereno con árboles y flores" role="img">
          <div className="art-sun" />
          <div className="art-horizon" />
          <div className="art-tree tree-left"><span /><span /><span /></div>
          <div className="art-tree tree-right"><span /><span /><span /></div>
          <div className="art-path" />
          <div className="art-stone stone-one" />
          <div className="art-stone stone-two" />
          <div className="art-stone stone-three" />
          <div className="art-caption"><Flower2 size={15} /> Un lugar de paz</div>
        </div>
        <div className="hero-index"><span>01</span><span className="index-rule" /><span>03</span></div>
      </section>

      <section className="intro-section" id="nosotros">
        <div className="section-marker"><span>01</span><span className="marker-line" /> NUESTRA ESENCIA</div>
        <div className="intro-content">
          <h2>Un sitio cuidado<br />con <em>respeto</em> y cercanía.</h2>
          <div className="intro-body">
            <p>Campo Santo Nuestra Señora de Fátima es un espacio de memoria, encuentro y acompañamiento. Cada historia merece ser recordada con dignidad.</p>
            <p>Nuestro compromiso es cuidar este lugar y recibir a cada familia con la consideración que merece.</p>
            <a className="text-link" href="#contacto">Estamos para acompañarte <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </section>

      <section className="visit-band">
        <div className="visit-symbol"><Flower2 size={27} strokeWidth={1.3} /></div>
        <div><span className="eyebrow">UN ESPACIO DE RECUERDO</span><h2>La memoria nos reúne.</h2></div>
        <p>Un entorno sereno para honrar a quienes forman parte de nuestra historia.</p>
        <span className="visit-flourish" aria-hidden="true">✳</span>
      </section>

      <section className="contact-section" id="contacto">
        <div className="section-marker"><span>02</span><span className="marker-line" /> CONTACTO</div>
        <div className="contact-content">
          <div><h2>Estamos cerca<br />cuando <em>nos necesitás.</em></h2><p>Para consultas, comunicate con la administración del cementerio.</p></div>
          <div className="contact-list">
            <ContactItem icon={<Phone size={18} />} label="Teléfono" value={CONTACT.phone} />
            <ContactItem icon={<Mail size={18} />} label="Correo electrónico" value={CONTACT.email} />
            <ContactItem icon={<MapPin size={18} />} label="Dirección" value={CONTACT.address} />
            <a className="button button-dark location-link" href="https://www.google.com/maps/search/?api=1&query=10.3128735%2C-85.5668366" target="_blank" rel="noopener noreferrer"><MapPin size={18} /> Ver ubicación en Google Maps <ArrowUpRight size={16} /></a>
            {!CONTACT.phone && !CONTACT.email && !CONTACT.address && (
              <div className="contact-config-note">Los datos de contacto se habilitarán cuando sean configurados por la administración.</div>
            )}
          </div>
        </div>
      </section>

      <section className="location-section" aria-labelledby="location-title">
        <div className="location-heading"><span className="eyebrow">CÓMO LLEGAR</span><h2 id="location-title">Nuestra ubicación</h2><p>Encontrá el Campo Santo Nuestra Señora de Fátima en el mapa.</p></div>
        <iframe title="Ubicación del Campo Santo Nuestra Señora de Fátima" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6665.455269698428!2d-85.57180045714445!3d10.315333564192324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f9fcb12bd608b37%3A0x67aabdd2e35aca42!2sCementerio%20Bernabela!5e0!3m2!1ses-419!2scr!4v1790890737463!5m2!1ses-419!2scr" width="600" height="450" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
      </section>

      <footer className="public-footer">
        <Link className="brand footer-brand" to="/"><span className="brand-mark"><Flower2 size={19} /></span><span><b>Campo Santo</b><small>Nuestra Señora de Fátima</small></span></Link>
        <span>Un lugar para recordar.</span>
        <Link to="/admin/login" className="footer-admin">Acceso administrativo <ArrowUpRight size={14} /></Link>
      </footer>
    </main>
  )
}

function ContactItem({ icon, label, value }) {
  return (
    <div className="contact-item">
      <span className="contact-icon">{icon}</span>
      <span><small>{label}</small><b>{value || 'No disponible'}</b></span>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.login(username.trim(), password)
      navigate('/admin/records', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <aside className="login-aside">
        <Link className="brand brand-light" to="/"><span className="brand-mark"><Flower2 size={21} /></span><span><b>Campo Santo</b><small>Nuestra Señora de Fátima</small></span></Link>
        <div className="login-aside-copy"><span className="eyebrow">GESTIÓN INTERNA</span><h1>Administrar<br />con <em>cuidado.</em></h1><p>Un espacio seguro para gestionar los registros y cuidar la memoria de cada persona.</p></div>
        <div className="aside-note"><ShieldCheck size={16} /> Acceso reservado al personal autorizado</div>
        <div className="login-aside-pattern" aria-hidden="true">✳</div>
      </aside>
      <section className="login-main">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Volver al sitio</Link>
        <div className="login-form-wrap">
          <div className="login-symbol"><LockKeyhole size={21} /></div>
          <span className="eyebrow">PORTAL DE ADMINISTRACIÓN</span>
          <h2>Iniciar sesión</h2>
          <p className="login-hint">Ingresá tus credenciales para continuar.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="username">Usuario</label>
            <div className="input-with-icon"><UserRound size={17} /><input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></div>
            <label className="field-label" htmlFor="password">Contraseña</label>
            <div className="input-with-icon password-input"><LockKeyhole size={17} /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div>
            {error && <div className="alert alert-error" role="alert"><CircleHelp size={17} />{error}</div>}
            <button className="button button-dark login-submit" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> Verificando…</> : <>Ingresar <ArrowRight size={17} /></>}</button>
          </form>
          <p className="login-security"><ShieldCheck size={15} /> Conexión protegida. Tus credenciales no se almacenan en este dispositivo.</p>
        </div>
        <span className="login-footer">Campo Santo Nuestra Señora de Fátima <span>·</span> Administración</span>
      </section>
    </main>
  )
}

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking')
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    api.currentAdmin().then(() => {
      if (active) setStatus('ready')
    }).catch(() => {
      if (active) {
        setStatus('denied')
        navigate('/admin/login', { replace: true })
      }
    })
    return () => { active = false }
  }, [navigate])

  if (status !== 'ready') return <div className="screen-loading"><span className="spinner" />{status === 'checking' ? 'Verificando acceso…' : 'Redirigiendo…'}</div>
  return children
}

function AdminLayout() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError('')
    try {
      await api.logout()
      navigate('/admin/login', { replace: true })
    } catch {
      setLogoutError('No se pudo cerrar la sesión. Revisá la conexión y volvé a intentarlo.')
    } finally {
      setLoggingOut(false)
    }
  }
  return (
    <div className="admin-app">
      <header className="admin-topbar">
        <Link className="brand admin-brand" to="/admin/records"><span className="brand-mark"><Flower2 size={19} /></span><span><b>Campo Santo</b><small>Nuestra Señora de Fátima</small></span></Link>
        <div className="admin-top-right"><span className="secure-label"><ShieldCheck size={15} /> Sesión protegida</span><button className="logout-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /><span>{loggingOut ? 'Cerrando…' : 'Cerrar sesión'}</span></button></div>
      </header>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <span className="sidebar-label">ADMINISTRACIÓN</span>
          <NavLink to="/admin/records" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><ClipboardList size={17} /> Ver registros</NavLink>
          <NavLink to="/admin/deceased/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><FilePlus2 size={17} /> Crear registro</NavLink>
          <div className="sidebar-bottom"><span className="sidebar-label">SITIO PÚBLICO</span><Link to="/" className="sidebar-public">Ver página principal <ArrowUpRight size={15} /></Link></div>
        </aside>
        <main className="admin-content">{logoutError && <div className="alert alert-error" role="alert">{logoutError}</div>}<Outlet /></main>
      </div>
    </div>
  )
}

const EMPTY_FILTERS = { search: '', date_of_birth: '', burial_date: '', date_of_death: '', location: '' }

function RecordsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [filterInput, setFilterInput] = useState({ ...EMPTY_FILTERS })
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS })
  const [downloading, setDownloading] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, page_size: 10 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const pageSize = 10

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.listDeceased({ ...filters, page, pageSize }).then((response) => {
      if (active) setData({ items: response.items || [], total: response.total || 0, page_size: response.page_size || pageSize })
    }).catch((err) => {
      if (active) setError(err.message)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters, page, refresh])

  const pageCount = Math.max(1, Math.ceil(data.total / data.page_size))
  function searchRecords(event) {
    event.preventDefault()
    setPage(1)
    setFilters(Object.fromEntries(Object.entries(filterInput).map(([key, value]) => [key, value.trim()])))
  }

  const hasFilters = Object.values(filters).some(Boolean)
  const pendingFilters = JSON.stringify(filterInput) !== JSON.stringify(filters)
  function updateFilter(event) {
    const { name, value } = event.target
    setFilterInput((current) => ({ ...current, [name]: value }))
  }
  function clearFilters() {
    setFilterInput({ ...EMPTY_FILTERS })
    setFilters({ ...EMPTY_FILTERS })
    setPage(1)
  }
  async function downloadPdf(all) {
    setDownloadError('')
    setDownloading(all ? 'all' : 'filtered')
    try {
      await api.downloadRecordsPdf(all ? {} : filters)
    } catch (err) {
      setDownloadError(err.message)
    } finally {
      setDownloading('')
    }
  }

  async function deleteRecord(record) {
    if (!window.confirm(`¿Eliminar el registro de ${record.full_name}? Esta acción elimina todos sus datos y no se puede deshacer.`)) return
    setDeletingId(record.id)
    setError('')
    try {
      await api.deleteDeceased(record.id)
      setNotice(`Se eliminó el registro de ${record.full_name}.`)
      setPage((current) => Math.min(current, Math.max(1, Math.ceil((data.total - 1) / pageSize))))
      setRefresh((current) => current + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId('')
    }
  }

  return (
    <>
      <div className="admin-page-heading">
        <div><span className="eyebrow">GESTIÓN DE REGISTROS</span><h1>Ver registros</h1><p>Consultá los registros por nombre, fechas o ubicación y descargá un reporte en PDF.</p></div>
        <button className="button button-dark" onClick={() => navigate('/admin/deceased/new')}><FilePlus2 size={17} /> Registrar difunto</button>
      </div>
      {notice && <div className="alert alert-success"><Check size={17} />{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={16} /></button></div>}
      <section className="records-panel">
        <div className="records-toolbar">
          <div><h2>{hasFilters ? 'Resultados de búsqueda' : 'Todos los registros'}</h2><span className="record-count">{loading ? 'Cargando…' : `${data.total} ${data.total === 1 ? 'registro' : 'registros'}`}</span></div>
          <div className="export-actions"><button type="button" className="button button-quiet" onClick={() => downloadPdf(false)} disabled={Boolean(downloading) || loading || Boolean(error) || pendingFilters}><Download size={16} />{downloading === 'filtered' ? 'Generando…' : 'PDF de resultados'}</button><button type="button" className="button button-quiet" onClick={() => downloadPdf(true)} disabled={Boolean(downloading)}><Download size={16} />{downloading === 'all' ? 'Generando…' : 'PDF de todos'}</button></div>
        </div>
        <form className="records-filters" onSubmit={searchRecords}>
          <FormField label="Nombre, apellidos o CC" name="search" value={filterInput.search} onChange={updateFilter} placeholder="Escribí un nombre o apellido" className="filter-name" />
          <FormField label="Ubicación" name="location" value={filterInput.location} onChange={updateFilter} placeholder="Sector, fila o tumba / nicho" />
          <FormField label="Fecha de nacimiento" name="date_of_birth" type="date" value={filterInput.date_of_birth} onChange={updateFilter} />
          <FormField label="Fecha de sepultura" name="burial_date" type="date" value={filterInput.burial_date} onChange={updateFilter} />
          <FormField label="Fecha de fallecimiento" name="date_of_death" type="date" value={filterInput.date_of_death} onChange={updateFilter} />
          <div className="filter-actions"><button type="button" className="button button-quiet" onClick={clearFilters}>Limpiar filtros</button><button type="submit" className="button button-dark"><Search size={17} /> Buscar</button></div>
          <p className="filter-help">Combiná los filtros que necesités. Las fechas buscan coincidencias exactas y el PDF incluye todas las páginas de los resultados.{pendingFilters ? ' Presioná Buscar para aplicar los cambios antes de descargar los resultados.' : ''}</p>
        </form>
        {downloadError && <div className="alert alert-error table-alert" role="alert">{downloadError}</div>}
        {error && <div className="alert alert-error table-alert"><CircleHelp size={17} />{error}</div>}
        <div className="table-scroll">
          <table className="records-table">
            <thead><tr><th>Nombre completo / CC</th><th>Nacimiento</th><th>Sepultura</th><th>Fallecimiento</th><th>Ubicación</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6"><div className="table-state"><span className="spinner" />Cargando registros…</div></td></tr> : data.items.length === 0 ? <tr><td colSpan="6"><div className="table-state empty-state"><span className="empty-icon"><Flower2 size={22} /></span><b>{hasFilters ? 'No encontramos coincidencias' : 'Todavía no hay registros'}</b><span>{hasFilters ? 'Probá con otros filtros o revisá la escritura.' : 'Los registros aparecerán aquí cuando sean cargados.'}</span></div></td></tr> : data.items.map((record) => (
                <tr key={record.id}>
                  <td><span className="person-name">{record.full_name}</span>{record.known_as && <small className="record-known-as">CC: {record.known_as}</small>}</td>
                  <td>{formatDate(record.date_of_birth)}</td>
                  <td>{formatDate(record.burial_date)}</td>
                  <td>{formatDate(record.date_of_death)}</td>
                  <td><span className="location-cell">{formatLocation(record)}</span></td>
                  <td><div className="row-actions"><button title="Ver detalle" aria-label={`Ver detalle de ${record.full_name}`} onClick={() => navigate(`/admin/deceased/${record.id}`)}><ArrowUpRight size={17} /></button><button title="Editar" aria-label={`Editar a ${record.full_name}`} onClick={() => navigate(`/admin/deceased/${record.id}/edit`)}><Pencil size={16} /></button><button type="button" className="delete-record-button" title="Eliminar registro" aria-label={`Eliminar a ${record.full_name}`} disabled={Boolean(deletingId) || loading} onClick={() => deleteRecord(record)}>{deletingId === record.id ? <span className="spinner" /> : <Trash2 size={16} />}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-pagination"><span>Mostrando {data.total === 0 ? 0 : (page - 1) * data.page_size + 1}–{Math.min(page * data.page_size, data.total)} de {data.total}</span><div><button aria-label="Página anterior" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}><ChevronLeft size={17} /></button><span>Página {page} de {pageCount}</span><button aria-label="Página siguiente" disabled={page >= pageCount || loading} onClick={() => setPage(page + 1)}><ChevronRight size={17} /></button></div></div>
      </section>
    </>
  )
}

const EMPTY_RECORD = {
  full_name: '', known_as: '', date_of_birth: '', date_of_death: '', burial_date: '', sector: '', row: '', grave_number: '', notes: '',
}

function DeceasedForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const initialRecord = useMemo(() => ({ ...EMPTY_RECORD }), [])
  const [form, setForm] = useState(initialRecord)
  const [original, setOriginal] = useState(initialRecord)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [validation, setValidation] = useState({})
  const [cedula, setCedula] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState('')
  const [lookupNames, setLookupNames] = useState([])
  const dirty = JSON.stringify(form) !== JSON.stringify(original)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (!editing) return
    let active = true
    api.getDeceased(id).then((record) => {
      if (!active) return
      const values = Object.fromEntries(Object.keys(EMPTY_RECORD).map((key) => [key, record[key] ?? '']))
      setForm(values)
      setOriginal(values)
    }).catch((err) => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [editing, id])

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('Tenés cambios sin guardar. ¿Querés descartarlos?')) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  useEffect(() => {
    function warnBeforeUnload(event) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirty])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (validation[name]) setValidation((current) => ({ ...current, [name]: '' }))
  }

  async function lookupIdentity() {
    const normalized = cedula.replace(/[-\s]/g, '')
    setLookupNames([])
    setLookupMessage('')
    if (!/^[1-9][0-9]{8}$/.test(normalized)) {
      setLookupMessage('Ingresá una cédula física de Costa Rica de 9 dígitos.')
      return
    }
    setLookupLoading(true)
    try {
      const result = await api.lookupIdentity(normalized)
      setLookupNames(result.names)
    } catch (err) {
      setLookupMessage(err.message)
    } finally {
      setLookupLoading(false)
    }
  }

  function applyLookupName(name) {
    setForm((current) => ({ ...current, full_name: name }))
    setValidation((current) => ({ ...current, full_name: '' }))
    setLookupNames([])
    setLookupMessage('Nombre aplicado. Revisá los datos y completá las fechas manualmente.')
  }

  function validate() {
    const issues = {}
    if (!form.full_name.trim()) issues.full_name = 'Ingresá el nombre completo.'
    if (!form.date_of_death) issues.date_of_death = 'La fecha de fallecimiento es obligatoria.'
    if (!form.burial_date) issues.burial_date = 'La fecha de sepultura es obligatoria.'
    if (!form.sector.trim()) issues.sector = 'Ingresá el sector.'
    if (!form.grave_number.trim()) issues.grave_number = 'Ingresá el número de tumba o nicho.'
    if (form.date_of_birth && form.date_of_death && form.date_of_birth > form.date_of_death) issues.date_of_birth = 'La fecha de nacimiento no puede ser posterior al fallecimiento.'
    if (form.date_of_death && form.burial_date && form.burial_date < form.date_of_death) issues.burial_date = 'La fecha de sepultura no puede ser anterior al fallecimiento.'
    setValidation(issues)
    return Object.keys(issues).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!validate()) return
    setSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() || null : value]))
      const saved = editing ? await api.updateDeceased(id, payload) : await api.createDeceased(payload)
      flushSync(() => setOriginal(form))
      navigate('/admin/records', { replace: true, state: { notice: editing ? 'Los cambios se guardaron correctamente.' : 'El registro se creó correctamente.', savedId: saved?.id } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    navigate('/admin/records')
  }

  if (loading) return <div className="content-loading"><span className="spinner" />Cargando registro…</div>
  if (editing && error && !form.full_name) return <div className="alert alert-error"><CircleHelp size={17} />{error}<Link to="/admin/records" className="inline-link">Volver al registro</Link></div>

  return (
    <>
      <div className="admin-page-heading form-heading"><div><Link to="/admin/records" className="back-link"><ArrowLeft size={15} /> Registro de difuntos</Link><span className="eyebrow">{editing ? 'ACTUALIZACIÓN DE DATOS' : 'NUEVO REGISTRO'}</span><h1>{editing ? 'Editar registro' : 'Registrar difunto'}</h1><p>Completá la información requerida para el registro.</p></div></div>
      {error && <div className="alert alert-error form-alert"><CircleHelp size={17} />{error}</div>}
      <form className="deceased-form" onSubmit={handleSubmit} noValidate>
        <section className="form-section"><div className="form-section-title"><span className="form-section-number">01</span><div><h2>Datos personales</h2><p>Información de identificación y fechas.</p></div></div>
          <div className="identity-lookup">
            <label className="field-control" htmlFor="lookup-cedula"><span>Cédula para consultar en GoMeta</span><input id="lookup-cedula" value={cedula} disabled={lookupLoading} inputMode="numeric" maxLength={11} placeholder="Ej. 1-1111-1111" onChange={(event) => { setCedula(event.target.value); setLookupNames([]); setLookupMessage('') }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (!lookupLoading) lookupIdentity() } }} /></label>
            <button className="button button-quiet" type="button" onClick={lookupIdentity} disabled={lookupLoading || saving}>{lookupLoading ? 'Consultando…' : 'Consultar cédula'}<Search size={17} /></button>
            <p className="lookup-help">Consulta opcional de nombre y apellidos. La fecha de nacimiento se ingresa manualmente. Esta cédula se usa solo para la consulta.</p>
            <div className="lookup-results" aria-live="polite">
              {lookupMessage && <p>{lookupMessage}</p>}
              {lookupNames.length > 0 && <><p>Revisá el nombre encontrado antes de aplicarlo al registro:</p>{lookupNames.map((name) => <div className="lookup-candidate" key={name}><strong>{name}</strong><button className="button button-quiet" type="button" onClick={() => applyLookupName(name)} disabled={saving}>Usar nombre</button></div>)}</>}
            </div>
          </div>
          <div className="form-grid">
            <FormField label="Nombre completo" name="full_name" value={form.full_name} onChange={updateField} required error={validation.full_name} placeholder="Nombre y apellido" className="span-two" />
            <FormField label="CC (conocido como)" name="known_as" value={form.known_as} onChange={updateField} placeholder="Opcional" className="span-two" />
            <FormField label="Fecha de nacimiento (opcional)" name="date_of_birth" type="date" value={form.date_of_birth} onChange={updateField} error={validation.date_of_birth} />
            <FormField label="Fecha de fallecimiento" name="date_of_death" type="date" value={form.date_of_death} onChange={updateField} required error={validation.date_of_death} />
            <FormField label="Fecha de sepultura" name="burial_date" type="date" value={form.burial_date} onChange={updateField} required error={validation.burial_date} />
          </div>
        </section>
        <section className="form-section"><div className="form-section-title"><span className="form-section-number">02</span><div><h2>Ubicación</h2><p>Datos para encontrar el lugar de descanso.</p></div></div>
          <div className="form-grid">
            <FormField label="Sector" name="sector" value={form.sector} onChange={updateField} required error={validation.sector} placeholder="Ej. Sector A" />
            <FormField label="Fila" name="row" value={form.row} onChange={updateField} placeholder="Opcional" />
            <FormField label="Número de tumba o nicho" name="grave_number" value={form.grave_number} onChange={updateField} required error={validation.grave_number} placeholder="Ej. 014-B" className="span-two" />
          </div>
        </section>
        <section className="form-section"><div className="form-section-title"><span className="form-section-number">03</span><div><h2>Observaciones</h2><p>Información adicional, si corresponde.</p></div></div>
          <label className="field-control"><span>Notas</span><textarea name="notes" value={form.notes} onChange={updateField} rows="4" placeholder="Escribí una observación (opcional)" /></label>
        </section>
        <div className="form-actions"><span className="required-note">* Campos obligatorios</span><div><button type="button" className="button button-quiet" onClick={cancel}>Cancelar</button><button type="submit" className="button button-dark" disabled={saving}>{saving ? <><span className="spinner spinner-light" /> Guardando…</> : <><Check size={17} /> {editing ? 'Guardar cambios' : 'Guardar registro'}</>}</button></div></div>
      </form>
    </>
  )
}

function FormField({ label, name, value, onChange, type = 'text', required = false, error, placeholder, className = '' }) {
  return (
    <label className={`field-control ${className}`}>
      <span>{label}{required && <b className="required-mark"> *</b>}</span>
      <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />
      {error && <small className="field-error" id={`${name}-error`}>{error}</small>}
    </label>
  )
}

function RecordDetail() {
  const { id } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api.getDeceased(id).then((value) => { if (active) setRecord(value) }).catch((err) => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])
  if (loading) return <div className="content-loading"><span className="spinner" />Cargando registro…</div>
  if (error) return <div className="alert alert-error"><CircleHelp size={17} />{error}<Link to="/admin/records" className="inline-link">Volver al registro</Link></div>
  if (!record) return null
  return (
    <>
      <div className="admin-page-heading detail-heading"><div><Link to="/admin/records" className="back-link"><ArrowLeft size={15} /> Registro de difuntos</Link><span className="eyebrow">DETALLE DEL REGISTRO</span><h1>{record.full_name}</h1><p>Información registrada en el sistema.</p></div><Link className="button button-dark" to={`/admin/deceased/${record.id}/edit`}><Pencil size={16} /> Editar</Link></div>
      <section className="detail-panel"><div className="detail-section-heading"><span className="detail-icon"><UserRound size={18} /></span><h2>Datos personales</h2></div><div className="detail-grid"><DetailValue label="Nombre completo" value={record.full_name} /><DetailValue label="CC (conocido como)" value={record.known_as} /><DetailValue label="Fecha de nacimiento" value={formatDate(record.date_of_birth)} /><DetailValue label="Fecha de fallecimiento" value={formatDate(record.date_of_death)} /><DetailValue label="Fecha de sepultura" value={formatDate(record.burial_date)} /></div></section>
      <section className="detail-panel"><div className="detail-section-heading"><span className="detail-icon"><MapPin size={18} /></span><h2>Ubicación</h2></div><div className="detail-grid"><DetailValue label="Sector" value={record.sector} /><DetailValue label="Fila" value={record.row || 'No especificada'} /><DetailValue label="Número de tumba o nicho" value={record.grave_number} /></div></section>
      <section className="detail-panel"><div className="detail-section-heading"><span className="detail-icon"><CalendarDays size={18} /></span><h2>Observaciones y registro</h2></div><div className="detail-grid"><DetailValue label="Observaciones" value={record.notes || 'Sin observaciones'} wide /><DetailValue label="Fecha de creación" value={formatDateTime(record.created_at)} /><DetailValue label="Última modificación" value={formatDateTime(record.updated_at)} /></div></section>
      <Link to="/admin/records" className="text-link detail-back"><ArrowLeft size={16} /> Volver al listado</Link>
    </>
  )
}

function DetailValue({ label, value, wide = false }) {
  return <div className={`detail-value ${wide ? 'detail-wide' : ''}`}><small>{label}</small><span>{value || 'No especificada'}</span></div>
}

function NotFoundPage() {
  return <main className="not-found"><Flower2 size={32} /><span className="eyebrow">CAMPO SANTO NUESTRA SEÑORA DE FÁTIMA</span><h1>No encontramos esta página.</h1><Link to="/" className="button button-dark">Volver al inicio <ArrowRight size={16} /></Link></main>
}

function formatDate(value) {
  if (!value) return 'No especificada'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatDateTime(value) {
  if (!value) return 'No disponible'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatLocation(record) {
  return [record.sector, record.row && `Fila ${record.row}`, record.grave_number].filter(Boolean).join(' · ') || 'Sin ubicación'
}
