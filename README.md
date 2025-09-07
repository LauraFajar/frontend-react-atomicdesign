# AgroTIC Frontend - React con Atomic Design

Frontend desarrollado en React con arquitectura Atomic Design para la plataforma AgroTIC de trazabilidad agrícola.

## 🚀 Tecnologías

- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Herramienta de construcción y desarrollo
- **React Router DOM** - Navegación entre páginas
- **Axios** - Cliente HTTP para API calls
- **CSS Vanilla** - Estilos personalizados (Tailwind se agregará después)

## 📁 Estructura Atomic Design

```
src/
├── components/
│   ├── atoms/          # Componentes básicos
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Icon/
│   ├── molecules/      # Combinación de átomos
│   │   └── LoginForm/
│   ├── organisms/      # Secciones complejas
│   │   ├── Header/
│   │   └── Sidebar/
│   └── pages/          # Páginas completas
│       ├── LoginPage/
│       └── DashboardPage/
├── contexts/           # Context API
│   └── AuthContext.jsx
└── App.jsx            # Componente principal
```

## 🎨 Paleta de Colores

- **Verde Primario**: #4CAF50
- **Verde Secundario**: #66BB6A
- **Verde Claro**: #C8E6C9
- **Verde Oscuro**: #388E3C
- **Blanco**: #FFFFFF
- **Gris Claro**: #F5F5F5

## 🔧 Instalación y Uso

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Construir para producción:**
   ```bash
   npm run build
   ```

## 🔐 Autenticación

El sistema se conecta al backend NestJS en `http://localhost:3001`:

- **Login**: POST `/auth/login`
- **Registro**: POST `/auth/register`

## 📱 Funcionalidades

### ✅ Implementadas
- Login con validación
- Dashboard principal
- Navegación por módulos
- Diseño responsivo
- Contexto de autenticación

### 🔄 Módulos del Dashboard
- **Inicio**: Página de bienvenida
- **IoT**: Monitoreo de sensores
- **Cultivos**: Gestión agrícola
- **Fitosanitario**: Control de plagas
- **Finanzas**: Gestión económica
- **Inventario**: Control de stock

## 🌐 Conexión con Backend

Asegúrate de que el backend NestJS esté corriendo en el puerto 3001:

```bash
# En el directorio del backend
npm run start:dev
```

## 📝 Próximas Mejoras

- Implementación de Tailwind CSS
- Módulos específicos de cada sección
- Formularios CRUD completos
- Gráficos y reportes
- Notificaciones en tiempo real
