# AGROTIC Frontend - React con estructura Atomic Design

Frontend desarrollado en React con arquitectura Atomic Design para la plataforma AGROTIC de trazabilidad agrícola.

## 🚀 Tecnologías

- **React 18** - Biblioteca para construir interfaces de usuario.
- **Vite** - Herramienta de frontend para desarrollo y construcción de proyectos web.
- **React Router DOM** - Para la navegación y el enrutamiento en la aplicación.
- **Axios** - Cliente HTTP para realizar solicitudes a la API del backend.
- **Material-UI (MUI)** - Biblioteca de componentes de UI para un diseño consistente y moderno.
- **Chart.js** - Para la creación de gráficos y visualización de datos.
- **Leaflet** - Biblioteca de mapas interactivos.
- **MQTT.js & Socket.IO Client** - Para la comunicación en tiempo real con dispositivos IoT y el servidor.
- **CSS Vanilla** - Estilos personalizados.

## 📁 Estructura Atomic Design

El proyecto sigue la metodología de Atomic Design para organizar los componentes de la interfaz de usuario, promoviendo la reutilización y la escalabilidad.

```
src/
├── components/
│   ├── atoms/          # Componentes más básicos e indivisibles (botones, inputs).
│   ├── molecules/      # Combinaciones de átomos que forman componentes simples (un campo de búsqueda con un botón).
│   ├── organisms/      # Componentes más complejos que forman secciones de una interfaz (cabecera, barra lateral).
│   ├── pages/          # Páginas completas que los usuarios ven y con las que interactúan.
│   └── templates/      # Estructuras de página reutilizables.
├── contexts/           # Proveedores de Context API para el manejo de estado global (ej. AuthContext).
├── hooks/              # Hooks personalizados para lógica reutilizable.
├── services/           # Lógica para interactuar con APIs externas y el backend.
└── App.jsx             # Componente principal que envuelve toda la aplicación.
```

## 🎨 Paleta de Colores

- **Verde Primario**: `#4CAF50`
- **Verde Secundario**: `#66BB6A`
- **Verde Claro**: `#C8E6C9`
- **Verde Oscuro**: `#388E3C`
- **Blanco**: `#FFFFFF`
- **Gris Claro**: `#F5F5F5`

## 🔧 Instalación y Uso

Sigue estos pasos para levantar el entorno de desarrollo local:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/LauraFajar/frontend-react-atomicdesign.git
    cd frontend-react-atomicdesign
    ```

2.  **Instalar dependencias:**
    Asegúrate de tener Node.js instalado (versión 18 o superior).
    ```bash
    npm install
    ```

3.  **Iniciar servidor de desarrollo:**
    El servidor de desarrollo se iniciará por defecto en `http://localhost:3000`.
    ```bash
    npm start
    ```

4.  **Construir para producción:**
    Genera los archivos estáticos para el despliegue.
    ```bash
    npm run build
    ```

## 🔐 Autenticación

El sistema de autenticación se comunica con el backend de NestJS (esperado en `http://localhost:3001` por defecto).

-   **Login**: `POST /auth/login`
-   **Registro**: `POST /auth/register`
-   **Verificar Token**: `GET /auth/profile`

La autenticación se gestiona mediante tokens JWT. Tras un login exitoso, el token JWT y los datos del usuario se almacenan de forma segura en **cookies** en el navegador. Este token se incluye automáticamente en la cabecera `Authorization` de las solicitudes posteriores a rutas protegidas.

## Conexión con Backend

Para que el frontend funcione correctamente, el backend de NestJS debe estar en ejecución.

## ✅ Funcionalidades Principales

-   **Autenticación de Usuarios**: Login y registro con validación de roles.
-   **Dashboard Centralizado**: Visualización general de la información más relevante.
-   **Gestión de Cultivos**: Administración de lotes, sublotes y actividades agrícolas.
-   **Monitoreo IoT**: Visualización en tiempo real de datos de sensores (temperatura, humedad, etc.).
-   **Control Fitosanitario**: Registro y seguimiento de tratamientos y aplicaciones.
-   **Gestión Financiera**: Seguimiento de ingresos y egresos.
-   **Control de Inventario**: Administración de insumos y almacenes.
-   **Notificaciones y Alertas**: Sistema de alertas en tiempo real.
-   **Diseño Responsivo**: Adaptado para su uso en diferentes dispositivos.