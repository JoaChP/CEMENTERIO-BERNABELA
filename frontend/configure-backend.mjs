import { readFileSync, writeFileSync } from 'node:fs'

const input = process.argv[2]
if (!input) throw new Error('Indicar la URL HTTPS del backend de Vercel.')
const backend = new URL(input)
if (backend.protocol !== 'https:' || backend.pathname !== '/' || backend.username || backend.password || backend.search || backend.hash) {
  throw new Error('Usar solo el origen HTTPS del backend, sin rutas ni credenciales.')
}
const file = new URL('./vercel.json', import.meta.url)
const config = JSON.parse(readFileSync(file, 'utf8'))
config.rewrites = [
  { source: '/api/:path*', destination: `${backend.origin}/api/:path*` },
  { source: '/((?!api(?:/|$)).*)', destination: '/index.html' },
]
writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`)
console.log('Frontend conectado al backend mediante /api. Volver a desplegar el frontend.')
