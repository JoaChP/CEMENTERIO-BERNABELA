# Cementerio Bernabela

Aplicación web en español para la presentación pública del Cementerio Bernabela y la gestión administrativa privada de registros de difuntos. La página pública no consulta ni expone registros personales.

## Requisitos

- Python 3.11 o superior.
- Node.js 20 o superior y npm.
- Docker Desktop (o Docker Engine) para ejecutar MariaDB.

## Configurar el entorno

Desde la raíz del proyecto, creá el archivo local de variables y completá los valores de ejemplo:

```powershell
Copy-Item .env.example .env
```

Usá contraseñas propias para MariaDB y generá un secreto JWT aleatorio. Por ejemplo, con Python:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copiá el resultado a `JWT_SECRET` en `.env`. `DATABASE_URL` debe tener la misma contraseña que `MARIADB_PASSWORD`. No subas `.env`: está excluido por `.gitignore`.

Opcionalmente, copiá `frontend/.env.example` a `frontend/.env` para cambiar la URL de FastAPI o configurar teléfono, correo y dirección públicos. Los datos de contacto quedan vacíos si no se configuran; no hay datos reales precargados.

## Ejecutar MariaDB

Desde la raíz:

```powershell
docker compose up -d db
```

El servicio publica MariaDB en el puerto `MARIADB_PORT` (3306 por defecto) y conserva los datos en un volumen Docker.

## Preparar y ejecutar el backend

En una terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python -m app.create_admin
uvicorn app.main:app --reload
```

En macOS/Linux, activá el entorno con `source .venv/bin/activate`. El comando de alta solicita usuario y contraseña de forma interactiva; no existe una cuenta predeterminada. La contraseña debe tener al menos 12 caracteres y se guarda con hash Argon2.

La API queda disponible en `http://localhost:8000` y su documentación interactiva en `http://localhost:8000/docs`.

## Ejecutar el frontend

En otra terminal, desde la raíz:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Abrí `http://localhost:5173`. El frontend usa cookies de sesión `HttpOnly` y envía las credenciales solo a la API configurada.

## Pruebas y build

Las pruebas de API usan SQLite temporal y datos ficticios únicamente dentro del entorno de pruebas. No insertan registros de demostración en MariaDB.

```powershell
cd backend
python -m pytest
```

Para validar el bundle de producción:

```powershell
cd frontend
npm run build
```

## Seguridad y despliegue

- Configurá `CORS_ORIGINS` con los orígenes exactos del frontend, separados por comas; no uses `*` con credenciales.
- En producción serví frontend y API exclusivamente por HTTPS y establecé `COOKIE_SECURE=true`.
- Reemplazá todos los valores de `.env.example`, protegé el acceso al servidor y a MariaDB, y prepará copias de seguridad cifradas.
- Los endpoints de listado, detalle, creación y edición requieren sesión administrativa. No se implementan eliminación de registros, pagos, mapas ni registro público.
- Los datos de contacto de la portada son variables de entorno y deben ser completados por la administración antes de publicar.
