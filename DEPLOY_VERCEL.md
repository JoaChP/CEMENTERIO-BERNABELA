# Publicar en Vercel: dos proyectos

## 1. Frontend
Importar este repositorio en Vercel. Nombre sugerido: campo-santo-fatima.
Root Directory: frontend. Framework: Vite. Build: npm run build. Output: dist.
No configurar VITE_API_URL: el frontend de producción usa /api en su propio dominio.
No agregar contraseñas, DATABASE_URL ni JWT_SECRET al frontend.
La portada funciona desde este primer despliegue; el login estará disponible después de conectar el backend.

## 2. Backend
Importar el mismo repositorio en otro proyecto. Nombre sugerido: campo-santo-fatima-api.
Root Directory: backend. Framework: FastAPI. No configurar Output Directory ni ejecutar uvicorn como Build Command.
Variables privadas de Production:
- DATABASE_URL: URL postgresql+psycopg del pooler de Supabase, con sslmode=require. Para Vercel usar Transaction pooler (puerto 6543); copiar el endpoint del panel de Supabase.
- JWT_SECRET: secreto aleatorio de al menos 32 caracteres; conservar el mismo secreto entre despliegues.
- CORS_ORIGINS: origen HTTPS exacto del frontend, sin barra final.
- COOKIE_SECURE: true
- COOKIE_SAMESITE: lax
- SESSION_EXPIRE_HOURS: 8
Las tablas ya existen: no ejecutar migraciones en cada petición ni durante cada arranque.

Comprobar https://URL-DEL-BACKEND/api/health.
Si Deployment Protection exige autenticación de Vercel, permitir el acceso al deployment de producción de la API; las rutas administrativas conservan su autenticación propia.

## 3. Conectar
Con la URL final del backend ejecutar desde la raíz:

    node frontend/configure-backend.mjs https://URL-DEL-BACKEND

Guardar el cambio frontend/vercel.json en Git y desplegar otra vez el frontend.
La regla /api reenvía a Python y mantiene las cookies en el dominio del frontend.
Comprobar login, guardar, búsqueda, edición, recarga y logout en la URL pública.

## Configuración local
La aplicación local sigue usando Supabase mediante el archivo .env privado.
backend/.local y los secretos están excluidos tanto de Git como del despliegue CLI.
