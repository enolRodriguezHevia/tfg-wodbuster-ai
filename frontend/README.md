# Frontend - WodBuster AI

Aplicación web desarrollada con React para la gestión de entrenamientos, análisis de video con IA y visualización de progreso deportivo.

## 🏗️ Arquitectura

```
frontend/
├── public/                  # Archivos estáticos
│   ├── index.html
│   └── assets/
├── src/
│   ├── App.js              # Componente principal
│   ├── App.css             # Estilos globales
│   ├── index.js            # Punto de entrada
│   ├── pages/              # Páginas de la aplicación
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── SignUp.js
│   │   ├── Dashboard.js
│   │   ├── Profile.js
│   │   ├── Entrenamientos.js
│   │   ├── OneRM.js
│   │   ├── WodsCrossFit.js
│   │   ├── AnalisisVideo.js
│   │   ├── PlanEntrenamiento.js
│   │   └── ConfiguracionIA.js
│   ├── components/         # Componentes reutilizables
│   │   ├── Navbar.js
│   │   ├── ProtectedRoute.js
│   │   ├── VideoAnalyzer.js
│   │   ├── ChartComponent.js
│   │   └── ...
│   ├── utils/              # Utilidades
│   │   ├── api.js         # Cliente API
│   │   ├── auth.js        # Gestión de autenticación
│   │   └── videoAnalysis.js  # Análisis de video con MediaPipe
│   └── cypress/            # Tests E2E
│       ├── e2e/
│       └── support/
```

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` en la raíz del frontend:

```env
REACT_APP_API_URL=http://localhost:5000/api
# o para producción:
# REACT_APP_API_URL=https://api.wodbuster-ai.online/api
```

### 3. Ejecutar en desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

### 4. Construir para producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `build/`

## 📱 Páginas y Rutas

### Públicas
- `/` - Página de inicio
- `/login` - Inicio de sesión
- `/signup` - Registro de usuario

### Protegidas (requieren autenticación)
- `/dashboard` - Panel principal con resumen
- `/profile` - Perfil de usuario
- `/entrenamientos` - Gestión de entrenamientos
- `/onerm` - Registro y seguimiento de 1RM
- `/wods` - WODs de CrossFit
- `/analisis-video` - Análisis de técnica con IA
- `/plan-entrenamiento` - Generación de planes personalizados
- `/configuracion-ia` - Configuración de modelo LLM

## 🎨 Componentes Principales

### VideoAnalyzer
Componente que utiliza MediaPipe para analizar videos de ejercicios:

```jsx
import VideoAnalyzer from './components/VideoAnalyzer';

<VideoAnalyzer
  ejercicio="sentadilla"
  onAnalysisComplete={(data) => console.log(data)}
/>
```

**Funcionalidades:**
- Captura de video desde cámara o archivo
- Detección de pose en tiempo real
- Extracción de landmarks y métricas
- Validación biomecánica del ejercicio

### ChartComponent
Visualización de progreso con Chart.js:

```jsx
import ChartComponent from './components/ChartComponent';

<ChartComponent
  type="line"
  data={chartData}
  options={chartOptions}
/>
```

### ProtectedRoute
Componente para proteger rutas que requieren autenticación:

```jsx
import ProtectedRoute from './components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## 🔧 Utilidades

### API Client (`utils/api.js`)

Cliente HTTP para comunicación con el backend:

```javascript
import api from './utils/api';

// GET request
const entrenamientos = await api.get('/entrenamientos');

// POST request
const nuevoEntrenamiento = await api.post('/entrenamientos', data);

// PUT request
await api.put('/user/profile', profileData);

// DELETE request
await api.delete('/entrenamientos/123');
```

**Características:**
- Incluye automáticamente el token JWT
- Manejo de errores centralizado
- Interceptores para requests/responses

### Auth Utils (`utils/auth.js`)

Gestión de autenticación:

```javascript
import { login, logout, isAuthenticated, getToken } from './utils/auth';

// Login
await login(email, password);

// Logout
logout();

// Verificar autenticación
if (isAuthenticated()) {
  // Usuario autenticado
}

// Obtener token
const token = getToken();
```

### Video Analysis (`utils/videoAnalysis.js`)

Análisis de video con MediaPipe:

```javascript
import { analyzeVideo, extractLandmarks } from './utils/videoAnalysis';

// Analizar video
const analysis = await analyzeVideo(videoFile, 'sentadilla');

// Extraer landmarks
const landmarks = extractLandmarks(videoFrame);
```

## 🧪 Testing

### Tests Unitarios (Jest + React Testing Library)

```bash
npm test
```

Ejecuta tests unitarios de componentes:

```javascript
// Ejemplo: Profile.test.js
import { render, screen } from '@testing-library/react';
import Profile from './pages/Profile';

test('renders profile page', () => {
  render(<Profile />);
  expect(screen.getByText(/Mi Perfil/i)).toBeInTheDocument();
});
```

### Tests E2E (Cypress)

**Abrir interfaz de Cypress:**
```bash
npm run cypress:open
```

**Ejecutar tests en modo headless:**
```bash
npm run cypress:run
```

**Estructura de tests E2E:**
```
cypress/
├── e2e/
│   ├── auth.cy.js              # Tests de autenticación
│   ├── entrenamientos.cy.js    # Tests de entrenamientos
│   ├── onerm.cy.js             # Tests de 1RM
│   ├── wods.cy.js              # Tests de WODs
│   ├── analisis-video.cy.js    # Tests de análisis
│   └── plan-entrenamiento.cy.js # Tests de planes
└── support/
    ├── commands.js             # Comandos personalizados
    └── e2e.js                  # Configuración global
```

**Ejemplo de test E2E:**
```javascript
describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## 🎨 Estilos

El proyecto utiliza CSS modular con archivos `.css` por componente:

```
src/
├── App.css                 # Estilos globales
├── pages/
│   ├── Home.css
│   ├── Dashboard.css
│   └── ...
└── components/
    ├── Navbar.css
    └── ...
```

**Variables CSS globales:**
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
}
```

## 📊 Gestión de Estado

El proyecto utiliza React Hooks para gestión de estado:

- `useState` - Estado local de componentes
- `useEffect` - Efectos secundarios y llamadas API
- `useContext` - Contexto global (si se implementa)
- `useNavigate` - Navegación programática

**Ejemplo:**
```javascript
const [entrenamientos, setEntrenamientos] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await api.get('/entrenamientos');
      setEntrenamientos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

## 🎥 Análisis de Video con MediaPipe

El análisis de video se realiza completamente en el navegador usando MediaPipe:

1. **Captura de video**: Desde cámara o archivo
2. **Detección de pose**: MediaPipe identifica 33 landmarks del cuerpo
3. **Extracción de métricas**: Cálculo de ángulos y posiciones
4. **Validación**: Verificación biomecánica del ejercicio
5. **Envío al backend**: Solo se envían landmarks y métricas (no el video)

**Landmarks detectados:**
- Cabeza y cuello
- Hombros, codos, muñecas
- Caderas, rodillas, tobillos
- Torso y espalda

## 🚀 Despliegue

El frontend se despliega automáticamente mediante GitHub Actions:

1. Push a rama `main`
2. GitHub Actions ejecuta `npm run build`
3. Sube archivos a S3
4. Invalida caché de CloudFront
5. Aplicación disponible en `https://wodbuster-ai.online`

Ver `.github/workflows/deploy-frontend.yml`

## 🌐 Navegación

La navegación se gestiona con React Router v6:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={
      <ProtectedRoute><Dashboard /></ProtectedRoute>
    } />
  </Routes>
</BrowserRouter>
```

## 📱 Responsive Design

La aplicación es completamente responsive y se adapta a:

- 📱 Móviles (< 768px)
- 📱 Tablets (768px - 1024px)
- 💻 Desktop (> 1024px)

**Media queries:**
```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

## 🔐 Seguridad

- Tokens JWT almacenados en localStorage
- Validación de formularios en cliente
- Sanitización de inputs
- HTTPS en producción
- CORS configurado en backend

## 📝 Notas de Desarrollo

- Usar componentes funcionales con Hooks
- Mantener componentes pequeños y reutilizables
- Documentar props con PropTypes o TypeScript
- Seguir convenciones de nombres (PascalCase para componentes)
- Mantener cobertura de tests > 70%

## 🐛 Debugging

**React DevTools:**
- Instalar extensión de navegador
- Inspeccionar componentes y estado

**Console logs:**
```javascript
console.log('Debug:', data);
```

**Network tab:**
- Verificar llamadas API
- Inspeccionar requests/responses

## 📚 Recursos

- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [MediaPipe Documentation](https://developers.google.com/mediapipe/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Cypress Documentation](https://docs.cypress.io/)
