# 🎨 Frontend - Dashboard de Deudores BCRA

Este es el frontend del sistema de gestión de deudores del BCRA, desarrollado con Next.js 15 y React 19. Proporciona una interfaz web moderna y completa para interactuar con la API de Laravel.

## 🚀 Tecnologías utilizadas

- **Next.js 15** - Framework de React con App Router
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Framework de CSS utility-first
- **Radix UI** - Componentes de UI accesibles
- **Lucide React** - Iconos modernos
- **Docker** - Containerización

## 📦 Páginas implementadas

### 1. **Home** (`/`) - Upload de archivos
- Interfaz drag & drop para archivos TXT
- Progreso de carga en tiempo real
- Información detallada del procesamiento
- Estados de carga y error
- Validación de archivos

### 2. **Deudores** (`/deudores`) - Lista paginada
- Tabla con todos los campos de deudores
- Paginación (20 registros por página)
- Navegación anterior/siguiente
- Estados de carga
- Manejo de errores

### 3. **Buscar por CUIT** (`/about`) - Búsqueda individual
- Campo de entrada para CUIT
- Búsqueda con Enter o botón
- Resultado detallado del deudor
- Tabla con todos los campos
- Validación de entrada

### 4. **Top** (`/top`) - Deudores con mayor deuda
- Selector de cantidad (default: 5)
- Ranking de deudores por monto
- Información de total deuda y préstamos
- Estados de carga
- Validación numérica

### 5. **Entidades** (`/entidades`) - Información de entidades
- Búsqueda por código de entidad
- Información detallada de la entidad
- Dashboard de métricas visuales
- Formateo de moneda en pesos argentinos
- Estados de carga y error

### 6. **Estadísticas** (`/stats`) - Dashboard general
- Resumen general del sistema
- Distribución por situación de deudores
- Top entidades
- Métricas visuales con formateo de moneda
- Carga automática al entrar

## 🎯 Características principales

### UI/UX
- **Diseño responsive** - Funciona en móviles y desktop
- **Tema moderno** - Interfaz limpia y profesional
- **Estados de carga** - Spinners y feedback visual
- **Manejo de errores** - Mensajes claros y útiles
- **Navegación intuitiva** - Sidebar con todas las páginas
- **Formateo de moneda** - Pesos argentinos con separadores

### Funcionalidades
- **Hot reload** - Cambios automáticos en desarrollo
- **Validación de formularios** - Entradas seguras
- **Estados de carga** - Feedback durante operaciones
- **Manejo de errores** - Recuperación graceful
- **Tipado TypeScript** - Código seguro y mantenible

### Integración
- **API REST** - Conexión con Laravel backend
- **Endpoints documentados** - Todos los servicios disponibles
- **Formateo de datos** - Presentación consistente
- **Estados reactivos** - UI actualizada automáticamente

## 🛠️ Instalación y desarrollo

### Prerrequisitos
- Node.js 18+ 
- npm, yarn, pnpm o bun
- Docker (opcional, para desarrollo con contenedores)

### Desarrollo local
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Abrir en el navegador
open http://localhost:3000
```

### Con Docker
```bash
# Desde la raíz del proyecto
docker-compose up frontend

# O solo el frontend
docker build -t frontend .
docker run -p 3000:3000 frontend
```

## 📁 Estructura del proyecto

```
frontend/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── page.tsx           # Home - Upload
│   │   ├── deudores/          # Lista de deudores
│   │   ├── about/             # Búsqueda por CUIT
│   │   ├── top/               # Deudores top
│   │   ├── entidades/         # Información de entidades
│   │   └── stats/             # Estadísticas generales
│   ├── components/            # Componentes reutilizables
│   │   ├── layout/           # Layout y navegación
│   │   └── ui/               # Componentes de UI
│   └── lib/                  # Utilidades y configuraciones
├── public/                   # Archivos estáticos
├── package.json             # Dependencias y scripts
├── tailwind.config.js       # Configuración de Tailwind
├── tsconfig.json           # Configuración de TypeScript
└── Dockerfile              # Configuración de Docker
```

## 🔧 Scripts disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
npm run type-check   # Verificación de tipos TypeScript
```

## 🌐 Endpoints utilizados

El frontend se conecta con la API de Laravel en `http://localhost:8000`:

- `POST /upload` - Subir archivos TXT
- `GET /api/deudores/list` - Lista paginada de deudores
- `GET /api/deudores/{cuit}` - Buscar por CUIT
- `GET /api/deudores/top/{n}` - Deudores top
- `GET /api/entidades/{codigo}` - Información de entidad
- `GET /api/stats` - Estadísticas generales

## 🎨 Componentes principales

### Layout
- `DashboardLayout` - Layout principal con sidebar
- `Sidebar` - Navegación lateral

### UI Components
- `Card` - Tarjetas de contenido
- `Input` - Campos de entrada
- `Button` - Botones interactivos
- `Progress` - Barras de progreso

### Páginas
- `HomePage` - Upload de archivos
- `DeudoresPage` - Lista paginada
- `BuscarCuitPage` - Búsqueda por CUIT
- `TopDeudoresPage` - Ranking de deudores
- `EntidadesPage` - Información de entidades
- `StatsPage` - Dashboard de estadísticas

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Docker
```bash
# Build de producción
docker build -t frontend-prod .

# Ejecutar
docker run -p 3000:3000 frontend-prod
```

## 🔍 Variables de entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📝 Notas de desarrollo

- El proyecto usa **App Router** de Next.js 15
- **TypeScript** está configurado para máxima seguridad
- **Tailwind CSS** para estilos utility-first
- **Radix UI** para componentes accesibles
- **Hot reload** funciona en desarrollo con Docker

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte del challenge técnico de Wayni Móvil.
