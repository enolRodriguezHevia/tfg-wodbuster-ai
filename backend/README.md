# Backend - WodBuster AI

API REST desarrollada con Node.js y Express para la gestión de entrenamientos, análisis de video con IA y generación de planes personalizados.

## 🏗️ Arquitectura

```
backend/
├── app.js                    # Punto de entrada de la aplicación
├── config/                   # Configuración
│   ├── db.js                # Conexión a MongoDB
│   └── promptTemplate.txt   # Templates para LLMs
├── controllers/             # Lógica de negocio
│   ├── authController.js
│   ├── userController.js
│   ├── entrenamientoController.js
│   ├── oneRMController.js
│   ├── wodCrossFitController.js
│   ├── analisisVideoController.js
│   └── planEntrenamientoController.js
├── middleware/              # Middlewares
│   └── authMiddleware.js   # Autenticación JWT
├── models/                  # Modelos de datos (Mongoose)
│   ├── User.js
│   ├── Entrenamiento.js
│   ├── OneRM.js
│   ├── WodCrossFit.js
│   ├── AnalisisVideo.js
│   └── PlanEntrenamiento.js
├── routes/                  # Definición de rutas
├── services/                # Servicios externos
│   ├── llmService.js       # Integración con Claude/OpenAI
│   └── s3Service.js        # Gestión de archivos en S3
├── validators/              # Validación de datos
├── utils/                   # Utilidades
├── prompts/                 # Prompts específicos por ejercicio
└── tests/                   # Tests unitarios e integración
```

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` en la raíz del backend:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/wodbuster
# o para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/wodbuster

# JWT
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui

# AWS S3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
S3_BUCKET_NAME=wodbuster-profile-photos

# APIs de IA
ANTHROPIC_API_KEY=tu_api_key_de_claude
OPENAI_API_KEY=tu_api_key_de_openai

# Servidor
PORT=5000
NODE_ENV=development
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Usuario
- `GET /api/user/profile` - Obtener perfil
- `PUT /api/user/profile` - Actualizar perfil
- `POST /api/user/profile-photo` - Subir foto de perfil
- `DELETE /api/user/account` - Eliminar cuenta

### Entrenamientos
- `GET /api/entrenamientos` - Listar entrenamientos
- `POST /api/entrenamientos` - Crear entrenamiento
- `GET /api/entrenamientos/:id` - Obtener detalle
- `DELETE /api/entrenamientos/:id` - Eliminar entrenamiento

### 1RM (One Rep Max)
- `GET /api/onerm` - Listar registros de 1RM
- `POST /api/onerm` - Registrar 1RM
- `GET /api/onerm/:ejercicio` - Historial por ejercicio
- `DELETE /api/onerm/:id` - Eliminar registro

### WODs CrossFit
- `GET /api/wods` - Listar WODs
- `POST /api/wods` - Registrar WOD
- `DELETE /api/wods/:id` - Eliminar WOD

### Análisis de Video
- `POST /api/analisis-video` - Analizar video y generar feedback
- `GET /api/analisis-video` - Historial de análisis

### Planes de Entrenamiento
- `POST /api/planes` - Generar plan personalizado
- `GET /api/planes` - Listar planes generados
- `DELETE /api/planes/:id` - Eliminar plan

### Configuración
- `GET /api/user/llm-config` - Obtener configuración de LLM
- `PUT /api/user/llm-config` - Actualizar modelo preferido

## 🧪 Testing

### Ejecutar todos los tests
```bash
npm test
```

### Tests con cobertura
```bash
npm run test:coverage
```

### Tests en modo watch
```bash
npm run test:watch
```

### Estructura de tests
```
tests/
├── unit/                           # Tests unitarios
│   ├── authController.test.js
│   ├── userController.test.js
│   ├── entrenamientoController.test.js
│   ├── oneRMController.test.js
│   ├── wodCrossFitController.test.js
│   ├── analisisVideoController.test.js
│   ├── planEntrenamientoController.test.js
│   └── validators/
└── integration/                    # Tests de integración
    ├── authController.int.test.js
    ├── userController.int.test.js
    ├── entrenamientoController.int.test.js
    ├── oneRMController.int.test.js
    ├── wodCrossFitController.int.test.js
    ├── analisisVideoController.int.test.js
    ├── planEntrenamientoController.int.test.js
    └── llmService.int.test.js
```

## 🔧 Servicios

### LLM Service
Gestiona la integración con modelos de lenguaje (Claude y OpenAI):

```javascript
const { generateFeedback, generatePlan } = require('./services/llmService');

// Generar feedback de análisis
const feedback = await generateFeedback(userData, analysisData, 'claude');

// Generar plan de entrenamiento
const plan = await generatePlan(userData, 'openai');
```

### S3 Service
Gestiona la subida de fotos de perfil a AWS S3:

```javascript
const { uploadProfilePhotoToS3 } = require('./services/s3Service');

const photoUrl = await uploadProfilePhotoToS3(file, userId);
```

## 🔐 Autenticación

El backend utiliza JWT (JSON Web Tokens) para autenticación:

1. Usuario se registra/inicia sesión
2. Backend genera token JWT
3. Cliente incluye token en header: `Authorization: Bearer <token>`
4. Middleware `authMiddleware` valida el token en rutas protegidas

## 🐳 Docker

### Construir imagen
```bash
docker build -t wodbuster-backend .
```

### Ejecutar contenedor
```bash
docker run -p 5000:5000 --env-file .env wodbuster-backend
```

## 📊 Modelos de Datos

### User
```javascript
{
  username: String,
  email: String,
  password: String (hasheada),
  profilePhoto: String,
  edad: Number,
  peso: Number,
  altura: Number,
  sexo: String,
  llmPreference: String
}
```

### Entrenamiento
```javascript
{
  usuario: ObjectId,
  fecha: Date,
  ejercicios: [{
    nombre: String,
    series: Number,
    repeticiones: Number,
    peso: Number,
    rpe: Number
  }],
  notas: String
}
```

### OneRM
```javascript
{
  usuario: ObjectId,
  ejercicio: String,
  peso: Number,
  fecha: Date
}
```

### WodCrossFit
```javascript
{
  usuario: ObjectId,
  nombre: String,
  nivel: String,
  tiempo: String,
  fecha: Date,
  notas: String
}
```

### AnalisisVideo
```javascript
{
  usuario: ObjectId,
  ejercicio: String,
  landmarks: Object,
  metricas: Object,
  feedback: String,
  fecha: Date
}
```

### PlanEntrenamiento
```javascript
{
  usuario: ObjectId,
  nombre: String,
  contenido: String,
  fecha: Date
}
```

## 🚀 Despliegue

El backend se despliega automáticamente mediante GitHub Actions:

1. Push a rama `main`
2. GitHub Actions construye imagen Docker
3. Sube imagen a AWS ECR
4. Actualiza servicio en ECS Fargate
5. Actualiza DNS en Route 53

Ver `.github/workflows/deploy-backend.yml`

## 📝 Notas de Desarrollo

- Usar `nodemon` en desarrollo para hot-reload
- Validar siempre los datos de entrada con los validators
- Manejar errores con try-catch y respuestas consistentes
- Documentar nuevos endpoints en este README
- Mantener cobertura de tests > 80%

## 🐛 Debugging

Para debuggear con VS Code, usar la configuración en `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/app.js",
  "envFile": "${workspaceFolder}/backend/.env"
}
```

## 📚 Recursos

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [Claude API Documentation](https://docs.anthropic.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
