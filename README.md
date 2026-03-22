# WodBuster AI

Aplicación web para análisis de entrenamientos y generación de planes personalizados mediante inteligencia artificial.

## 📋 Descripción

WodBuster AI es una plataforma integral diseñada para deportistas de CrossFit que combina:

- **Gestión de entrenamientos**: Registro y seguimiento de sesiones de entrenamiento
- **Análisis biomecánico con IA**: Análisis de técnica mediante visión por computadora
- **Planes personalizados**: Generación automática de programas de entrenamiento adaptados
- **Seguimiento de progreso**: Visualización de evolución en 1RM y WODs
- **Feedback inteligente**: Recomendaciones técnicas mediante modelos de lenguaje

## 🏗️ Arquitectura

El proyecto está dividido en dos componentes principales:

```
wodbuster-ai/
├── backend/          # API REST con Node.js + Express
├── frontend/         # Aplicación React (SPA)
└── docs/            # Documentación y diagramas del proyecto
```

### Stack Tecnológico

**Frontend:**
- React 19
- MediaPipe (análisis de pose)
- Chart.js (visualización de datos)
- React Router (navegación)
- Cypress (testing E2E)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT (autenticación)
- Claude API + OpenAI (LLMs)
- Jest + Supertest (testing)

**Infraestructura:**
- AWS S3 (almacenamiento)
- AWS CloudFront (CDN)
- AWS ECS + Fargate (contenedores)
- MongoDB Atlas (base de datos)
- GitHub Actions (CI/CD)

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- MongoDB (local o Atlas)
- Cuenta AWS (para S3)
- API Keys de Claude/OpenAI

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/enolRodriguezHevia/tfg-wodbuster-ai.git
cd wodbuster-ai
```

2. **Configurar Backend**
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

3. **Configurar Frontend**
```bash
cd frontend
npm install
npm start
```

Ver los README específicos de cada componente para más detalles:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## 📚 Documentación

La documentación completa del proyecto se encuentra en la carpeta `/docs`:

- **Diagramas de arquitectura**: Bloques, despliegue, OBS
- **Diagramas de backend**: Capas, clases, rutas, servicios
- **Diagramas de frontend**: Componentes, páginas, navegación
- **Diagramas de flujo**: Análisis de video, entrenamientos, planes
- **Planificación**: PBS y WBS del proyecto

## 🧪 Testing

**Backend:**
```bash
cd backend
npm test                 # Ejecutar tests
npm run test:coverage    # Con cobertura
```

**Frontend:**
```bash
cd frontend
npm test                 # Tests unitarios
npm run cypress:open     # Tests E2E (interfaz)
npm run cypress:run      # Tests E2E (headless)
```

## 🌐 Despliegue

El proyecto utiliza GitHub Actions para CI/CD automático:

- **Frontend**: Desplegado en S3 + CloudFront
- **Backend**: Contenedor Docker en ECS Fargate

Ver workflows en `.github/workflows/`

## 📄 Licencia

Este proyecto es un Trabajo de Fin de Grado (TFG) desarrollado para la titulación del Grado en Ingeniería Informática del Software de la Universidad de Oviedo.


## 🔗 Enlaces

- [Documentación del proyecto](./docs/README.md)
- [Manual de usuario](./docs/manual-usuario.md)
- [Manual técnico](./docs/manual-tecnico.md)
