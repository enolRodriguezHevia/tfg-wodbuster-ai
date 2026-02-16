# Módulo de Análisis de Video

Este módulo contiene toda la lógica para analizar videos de ejercicios usando MediaPipe Pose Landmarker.

## 📁 Estructura

```
videoAnalysis/
├── config/
│   └── mediaPipeConfig.js          # Configuración e inicialización de MediaPipe
├── core/
│   ├── geometryUtils.js            # Funciones de cálculo geométrico (ángulos, vectores)
│   ├── visualizationUtils.js       # Renderizado de landmarks en canvas
│   └── videoProcessor.js           # Procesamiento genérico de frames de video
├── detectors/
│   ├── sentadillaDetector.js       # Análisis específico de sentadilla
│   ├── pressHombroDetector.js      # Análisis específico de press de hombros
│   ├── remoBarraDetector.js        # Análisis específico de remo con barra
│   └── pesoMuertoDetector.js       # Análisis específico de peso muerto
└── index.js                        # API pública - exporta todas las funciones
```

## 🎯 Uso

### Importar funciones de análisis

```javascript
import { 
  analizarSentadillaVideo, 
  analizarPressHombroVideo,
  analizarRemoBarraVideo,
  analizarPesoMuertoVideo
} from '../utils/videoAnalysis';
```

### Analizar un video

```javascript
const resultado = await analizarSentadillaVideo(archivo);

// Resultado contiene:
// - angulos: { rodilla, alineacion, flexionCadera }
// - rompioParalelo: boolean
// - repeticionesDetectadas: number
// - imagenVisualizada: base64 string
// - framesCompletos: array de todos los frames analizados
// - framesClave: { inicio, peak }
// - metricas: estadísticas del análisis
```

## 🔧 Arquitectura

### Separación de Responsabilidades

- **config/**: Lógica de inicialización de MediaPipe (ML framework)
- **core/**: Utilidades reutilizables (geometría, visualización, procesamiento)
- **detectors/**: Lógica específica de cada ejercicio (independiente entre sí)
- **index.js**: Punto de entrada único, oculta la estructura interna

### Ventajas de esta estructura

✅ **Mantenibilidad**: Cambiar un ejercicio no afecta otros  
✅ **Escalabilidad**: Agregar ejercicio = crear 1 detector nuevo (~250 líneas)  
✅ **Testabilidad**: Cada módulo se puede testear independientemente  
✅ **Reutilización**: Core utils compartidos evitan duplicación  
✅ **Claridad**: Un archivo = una responsabilidad (SRP)

## 📝 Agregar un nuevo ejercicio

1. Crear `detectors/nuevoEjercicioDetector.js`
2. Implementar 3 funciones:
   - `procesarFrameNuevoEjercicio(landmarks, tiempo, frameIndex)` → objeto con datos del frame
   - `analizarResultadosNuevoEjercicio(frames, ...)` → resultado final con feedback
   - `analizarNuevoEjercicioVideo(videoFile)` → función principal (exportada)
3. Exportar función en `index.js`:
   ```javascript
   export { analizarNuevoEjercicioVideo } from './detectors/nuevoEjercicioDetector.js';
   ```

## 🔄 Migración desde archivo monolítico

**Antes** (videoAnalysis.js - 1800 líneas):
- Todo mezclado en un solo archivo
- ~400 líneas duplicadas por ejercicio
- Difícil de mantener y testear

**Después** (videoAnalysis/ - 9 archivos modulares):
- Código organizado por responsabilidad
- ~60% menos duplicación
- Fácil de escalar y mantener

## 📊 Métricas

- **Reducción de duplicación**: ~60%
- **Archivos creados**: 9 módulos especializados
- **Líneas totales**: ~1400 (vs 1800 original)
- **Complejidad por módulo**: <250 líneas cada detector
