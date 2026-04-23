# TCC Seguimiento — Frontend

Frontend interno para el sistema de seguimiento automático de guías TCC.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** estricto
- **Tailwind CSS** + `@tailwindcss/forms`
- **TanStack Query v5** — server state y cache
- **React Hook Form + Zod** — formularios con validación
- **Axios** — HTTP client con interceptores JWT
- **Sonner** — toasts
- **Lucide React** — iconografía

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Editar NEXT_PUBLIC_API_URL con la URL del backend FastAPI

# 3. Correr en desarrollo
npm run dev
```

La app corre en [http://localhost:3000](http://localhost:3000).

## Modo demo (sin backend)

Para desarrollar sin backend FastAPI activo:

```bash
# En .env.local
NEXT_PUBLIC_MOCK_MODE=true
```

Credenciales demo: `admin` / `tcc2024`

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── login/              # Página de login
│   ├── dashboard/          # Dashboard con KPIs
│   ├── guias/              # Listado de guías
│   │   ├── nueva/          # Formulario de registro
│   │   └── [id]/           # Detalle de guía
│   ├── sistema/            # Salud del sistema
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # Query Client + Auth + Toaster
├── components/
│   ├── ui/                 # Componentes base (Button, Input, Badge...)
│   ├── layout/             # Sidebar, Header, DashboardLayout
│   └── features/           # Componentes por dominio
│       ├── dashboard/      # KPICard, SystemStatus
│       └── guias/          # GuiaForm, GuiasTable, GuiaHistorial...
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación JWT
├── hooks/
│   ├── useGuias.ts         # Queries y mutations de guías
│   ├── useDashboard.ts     # Stats del dashboard
│   └── useSystem.ts        # Salud del servicio
├── services/api/
│   ├── client.ts           # Axios con interceptor JWT
│   ├── auth.service.ts     # Login / sesión
│   ├── guias.service.ts    # CRUD de guías
│   ├── dashboard.service.ts
│   ├── system.service.ts
│   └── mock.ts             # Datos mock para desarrollo sin backend
├── types/
│   └── index.ts            # Tipos TypeScript del dominio
├── utils/
│   ├── cn.ts               # clsx + tailwind-merge
│   ├── format.ts           # Fechas, errores
│   └── status.ts           # Colores y etiquetas de estados
└── lib/
    └── constants.ts        # Constantes globales y query keys
```

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend FastAPI | `http://localhost:8000` |
| `NEXT_PUBLIC_MOCK_MODE` | Usar datos mock locales | `false` |
| `NEXT_PUBLIC_APP_NAME` | Nombre en UI | `TCC Seguimiento` |

## Conexión con el backend FastAPI

Los servicios en `src/services/api/` consumen estos endpoints:

| Módulo | Endpoint |
|---|---|
| Login | `POST /auth/login` |
| Stats dashboard | `GET /dashboard/stats` |
| Listar guías | `GET /guias?estado=&asesor=&search=&activa=` |
| Detalle guía | `GET /guias/:id` |
| Registrar guía | `POST /guias` |
| Cerrar guía | `PATCH /guias/:id/cerrar` |
| Refrescar guía | `POST /guias/:id/refresh` |
| Salud sistema | `GET /system/health` |

Si un endpoint no existe aún en el backend, activa `NEXT_PUBLIC_MOCK_MODE=true` — todos los servicios tienen adaptador mock integrado.

## Autenticación

- JWT almacenado en `localStorage` (para el cliente API) y en cookie `tcc_auth` (para el middleware Next.js)
- El middleware protege todas las rutas excepto `/login`
- Expiración: 24h (configurable en el backend)
- Al expirar, redirige automáticamente a `/login?session=expired`

## Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run type-check   # Verificación TypeScript sin build
npm run lint         # ESLint
```
