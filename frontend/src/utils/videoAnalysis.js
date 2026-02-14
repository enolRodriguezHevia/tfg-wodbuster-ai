import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let poseLandmarker = null;

/**
 * Inicializar MediaPipe Pose Landmarker
 */
export async function initializePoseLandmarker() {
  if (poseLandmarker) return poseLandmarker;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    console.log("✅ PoseLandmarker inicializado");
    return poseLandmarker;
  } catch (error) {
    console.error("❌ Error al inicializar PoseLandmarker:", error);
    throw error;
  }
}

/**
 * Calcular ángulo entre tres puntos usando producto punto
 * punto2 es el vértice del ángulo
 */
function calcularAngulo(punto1, punto2, punto3) {
  // Vectores desde punto2 (vértice)
  const v1 = {
    x: punto1.x - punto2.x,
    y: punto1.y - punto2.y
  };
  const v2 = {
    x: punto3.x - punto2.x,
    y: punto3.y - punto2.y
  };
  
  // Producto punto
  const dot = v1.x * v2.x + v1.y * v2.y;
  
  // Magnitudes
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  // Evitar división por cero
  if (mag1 === 0 || mag2 === 0) return 0;
  
  // Ángulo en radianes (producto punto / producto de magnitudes)
  let cosAngle = dot / (mag1 * mag2);
  
  // Asegurar que esté en el rango [-1, 1] por errores de precisión
  cosAngle = Math.max(-1, Math.min(1, cosAngle));
  
  // Convertir a grados
  const angulo = Math.acos(cosAngle) * 180.0 / Math.PI;
  
  return Math.round(angulo * 10) / 10;
}

/**
 * Dibujar landmarks y conexiones en un canvas
 */
function dibujarLandmarks(ctx, landmarks, videoWidth, videoHeight) {
  // Conexiones del cuerpo (índices de landmarks a conectar)
  const conexiones = [
    // Torso
    [11, 12], // Hombros
    [11, 23], // Hombro izq -> Cadera izq
    [12, 24], // Hombro der -> Cadera der
    [23, 24], // Caderas
    
    // Pierna izquierda
    [23, 25], // Cadera -> Rodilla
    [25, 27], // Rodilla -> Tobillo
    [27, 31], // Tobillo -> Pie
    
    // Pierna derecha
    [24, 26], // Cadera -> Rodilla
    [26, 28], // Rodilla -> Tobillo
    [28, 32], // Tobillo -> Pie
    
    // Brazos izquierdo
    [11, 13], // Hombro -> Codo
    [13, 15], // Codo -> Muñeca
    
    // Brazo derecho
    [12, 14], // Hombro -> Codo
    [14, 16], // Codo -> Muñeca
  ];
  
  // Dibujar conexiones (líneas rojas)
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 3;
  
  conexiones.forEach(([idx1, idx2]) => {
    const p1 = landmarks[idx1];
    const p2 = landmarks[idx2];
    
    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x * videoWidth, p1.y * videoHeight);
      ctx.lineTo(p2.x * videoWidth, p2.y * videoHeight);
      ctx.stroke();
    }
  });
  
  // Dibujar puntos clave (círculos amarillos)
  ctx.fillStyle = '#FFFF00';
  const puntosClaveIdx = [11, 12, 23, 24, 25, 26, 27, 28]; // Hombros, caderas, rodillas, tobillos
  
  puntosClaveIdx.forEach(idx => {
    const punto = landmarks[idx];
    if (punto) {
      ctx.beginPath();
      ctx.arc(punto.x * videoWidth, punto.y * videoHeight, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

/**
 * Analizar video de sentadilla frame por frame
 */
export async function analizarSentadillaVideo(videoFile) {
  try {
    console.log("🎬 Iniciando análisis de sentadilla...");
    
    // Inicializar PoseLandmarker
    const detector = await initializePoseLandmarker();
    
    // Crear elemento de video
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    
    // Esperar a que el video esté listo
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });
    
    const duracion = video.duration;
    const fps = 30; // Analizar 30 frames por segundo
    const frameInterval = 1 / fps;
    
    const resultadosFrames = [];
    const landmarksFrames = []; // Guardar landmarks para visualización
    let frameCount = 0;
    
    // Crear canvas para visualización
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Analizar frames
    for (let tiempo = 0; tiempo < duracion; tiempo += frameInterval) {
      video.currentTime = tiempo;
      
      // Esperar a que el frame esté listo
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });
      
      // Detectar pose
      const resultados = detector.detectForVideo(video, performance.now());
      
      if (resultados.landmarks && resultados.landmarks.length > 0) {
        const landmarks = resultados.landmarks[0];
        
        // Usar el lado más visible (el que tiene mayor diferencia en coordenada Z)
        const caderaIzq = landmarks[23]; // LEFT_HIP
        const rodillaIzq = landmarks[25]; // LEFT_KNEE
        const tobilloIzq = landmarks[27]; // LEFT_ANKLE
        const hombroIzq = landmarks[11]; // LEFT_SHOULDER
        
        const caderaDer = landmarks[24]; // RIGHT_HIP
        const rodillaDer = landmarks[26]; // RIGHT_KNEE
        const tobilloDer = landmarks[28]; // RIGHT_ANKLE
        const hombroDer = landmarks[12]; // RIGHT_SHOULDER
        
        // Determinar qué lado está más de perfil (mayor visibilidad Z)
        const visibilidadIzq = Math.abs(caderaIzq.z - rodillaIzq.z);
        const visibilidadDer = Math.abs(caderaDer.z - rodillaDer.z);
        
        let cadera, rodilla, tobillo, hombro;
        if (visibilidadIzq < visibilidadDer) {
          // Lado izquierdo más visible (más de perfil)
          cadera = caderaIzq;
          rodilla = rodillaIzq;
          tobillo = tobilloIzq;
          hombro = hombroIzq;
        } else {
          // Lado derecho más visible
          cadera = caderaDer;
          rodilla = rodillaDer;
          tobillo = tobilloDer;
          hombro = hombroDer;
        }
        
        // Calcular ángulos clave
        const anguloRodilla = calcularAngulo(cadera, rodilla, tobillo);
        
        // Ángulo de alineación espalda-cadera (hombro-cadera-rodilla)
        // 180° = perfectamente recto
        const anguloAlineacion = calcularAngulo(hombro, cadera, rodilla);
        
        // Altura relativa de cadera respecto a rodilla (para verificar profundidad REAL)
        // En MediaPipe, Y aumenta hacia abajo (0 arriba, 1 abajo)
        const alturaRelativa = cadera.y - rodilla.y; // Positivo = cadera más baja que rodilla (rompió paralelo)
        
        // Ángulo del torso respecto a la vertical (para detectar inclinación excesiva)
        // Calcular como arctan de la diferencia X/Y entre hombro y cadera
        const deltaX = Math.abs(hombro.x - cadera.x);
        const deltaY = Math.abs(hombro.y - cadera.y);
        const anguloTorso = Math.atan2(deltaX, deltaY) * 180 / Math.PI; // 0° = vertical, 90° = horizontal
        
        // Validar que sea un frame válido de sentadilla
        const esFrameValido = anguloRodilla >= 30 && anguloRodilla <= 180 &&
                              anguloAlineacion >= 30 && anguloAlineacion <= 180;
        
        if (!esFrameValido) {
          console.log(`⚠️ Frame ${frameCount} descartado - ángulos anómalos: Rodilla=${anguloRodilla}°`);
          frameCount++;
          continue;
        }
        
        // Debug: log primeros 3 frames válidos
        if (resultadosFrames.length < 3) {
          console.log(`✓ Frame ${resultadosFrames.length}: Rodilla=${anguloRodilla}°, AlturaRel=${alturaRelativa.toFixed(3)}, Torso=${anguloTorso.toFixed(1)}°`);
        }
        
        resultadosFrames.push({
          tiempo,
          anguloRodilla,
          anguloAlineacion,
          alturaRelativa,
          anguloTorso,
          posicionCadera: cadera.y,
          posicionRodilla: rodilla.y,
          frameIndex: resultadosFrames.length
        });
        
        // Guardar landmarks para visualización
        landmarksFrames.push({
          landmarks,
          tiempo,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
        
        frameCount++;
      }
      
      // Limitar análisis para no saturar (máximo 90 frames)
      if (frameCount >= 90) break;
    }
    
    console.log(`✅ Analizados ${frameCount} frames`);
    
    // Analizar resultados y obtener imagen visualizada
    const resultado = await analizarResultadosSentadilla(resultadosFrames, landmarksFrames, duracion, video, canvas, ctx);
    
    // Limpiar
    URL.revokeObjectURL(video.src);
    
    return resultado;
    
  } catch (error) {
    console.error("❌ Error en análisis:", error);
    throw error;
  }
}

/**
 * Analizar resultados de todos los frames
 */
async function analizarResultadosSentadilla(frames, landmarksFrames, duracion, video, canvas, ctx) {
  if (frames.length === 0) {
    return {
      esCorrecta: false,
      angulos: {},
      feedback: [
        "❌ No se pudo detectar la pose en el video.",
        "📹 Asegúrate de grabar:",
        "• Completamente de LADO (perfil, no de frente)",
        "• Tu cuerpo COMPLETO visible (cabeza a pies)",
        "• Buena iluminación",
        "• Cámara estable y a altura media"
      ],
      duracion: Math.round(duracion),
      repeticionesDetectadas: 0,
      imagenVisualizada: null
    };
  }
  
  // Filtrar frames de sentadilla válidos (rodilla entre 40° y 170°)
  // 40° permite capturar sentadillas muy profundas
  const framesValidos = frames.filter(f => 
    f.anguloRodilla >= 40 && f.anguloRodilla <= 170
  );
  
  if (framesValidos.length === 0) {
    return {
      esCorrecta: false,
      angulos: {},
      feedback: [
        "❌ No se detectó una sentadilla válida en el video.",
        "📹 Asegúrate de:",
        "• Grabar SOLO la ejecución de la sentadilla",
        "• Estar completamente de LADO a la cámara (perfil)",
        "• No incluir movimientos previos o preparatorios",
        "• Mantener tu cuerpo completo visible"
      ],
      duracion: Math.round(duracion),
      repeticionesDetectadas: 0,
      imagenVisualizada: null
    };
  }
  
  // Encontrar el punto más bajo por posición vertical de la cadera
  // En MediaPipe, Y aumenta hacia abajo (0=arriba, 1=abajo)
  // Cadera con mayor Y = posición más baja = punto más bajo de la sentadilla
  const posicionesCadera = framesValidos.map(f => f.posicionCadera);
  const posicionCaderaMax = Math.max(...posicionesCadera);
  const frameMin = framesValidos.find(f => f.posicionCadera === posicionCaderaMax);
  
  // Usar los valores en el punto más bajo para evaluar
  const anguloRodillaBaja = frameMin.anguloRodilla;
  const anguloAlineacionBaja = frameMin.anguloAlineacion;
  const alturaRelativaBaja = frameMin.alturaRelativa;
  const anguloTorsoBajo = frameMin.anguloTorso;
  
  // Romper paralelo: cadera al nivel o más abajo que rodilla
  // Usar umbral de -0.08 (8cm tolerancia) porque MediaPipe no es 100% preciso
  // SOLO usar altura relativa Y, NO el ángulo de rodilla (no es indicador confiable)
  const rompioParalelo = alturaRelativaBaja >= -0.08;
  
  console.log(`📊 Punto más bajo (${framesValidos.length} frames): Rodilla=${anguloRodillaBaja}°, AlturaRel=${alturaRelativaBaja.toFixed(3)}, Torso=${anguloTorsoBajo.toFixed(1)}° (Paralelo: ${rompioParalelo})`);
  const angulosRodillaValidos = framesValidos.map(f => f.anguloRodilla);
  
  // Detectar repeticiones en frames válidos (contar cuántas veces baja)
  let repeticiones = 0;
  let enBajada = false;
  for (let i = 1; i < angulosRodillaValidos.length; i++) {
    if (angulosRodillaValidos[i] < 110 && !enBajada) {
      repeticiones++;
      enBajada = true;
    } else if (angulosRodillaValidos[i] > 140) {
      enBajada = false;
    }
  }
  
  // Evaluar técnica
  const feedback = [];
  let esCorrecta = true;
  
  // 1. Verificar profundidad (romper paralelo)
  if (!rompioParalelo) {
    esCorrecta = false;
    const distanciaCm = Math.abs(alturaRelativaBaja * 100);
    feedback.push(`❌ No rompiste el paralelo. Tu cadera se quedó ${distanciaCm.toFixed(1)}cm por encima de las rodillas.`);
    feedback.push(`💡 Baja más hasta que tus caderas estén al nivel de las rodillas o por debajo.`);
  } else {
    feedback.push(`✅ ¡Buena profundidad! Rompiste el paralelo correctamente.`);
  }
  
  // 2. Verificar inclinación del torso (ángulo respecto a vertical)
  // Solo validar si el torso está peligrosamente horizontal (>70°)
  // Notas: MediaPipe puede dar lecturas inconsistentes, así que ser conservador
  if (anguloTorsoBajo > 70) {
    esCorrecta = false;
    feedback.push(`⚠️ ¡PELIGRO! Tu torso está prácticamente horizontal (${anguloTorsoBajo.toFixed(1)}° de inclinación).`);
    feedback.push(`💡 Mantén el torso más erguido. Saca el pecho y mira al frente.`);
  } else if (anguloTorsoBajo > 55 && anguloTorsoBajo <= 70) {
    feedback.push(`⚠️ Tu torso está muy inclinado (${anguloTorsoBajo.toFixed(1)}°). Intenta mantenerlo más vertical.`);
  } else {
    // No dar feedback si está en rango normal (0-55°)
  }
  
  // 3. Verificar alineación espalda-cadera (hombro-cadera-rodilla)
  // NOTA: Este ángulo es pequeño (20-60°) cuando te inclinas hacia adelante (CORRECTO en sentadilla)
  // Solo marcamos error si es extremadamente pequeño (<15°), que indicaría colapso o postura muy rara
  // Un ángulo de 30-60° es NORMAL y NO significa espalda curva
  if (anguloAlineacionBaja < 15) {
    esCorrecta = false;
    feedback.push(`⚠️ Postura muy colapsada (alineación: ${anguloAlineacionBaja.toFixed(1)}°). Revisa tu técnica.`);
  }
  // No dar más feedback sobre alineación - es un ángulo confuso que no mide curvatura real
  
  // 4. Verificar seguridad: no bajar demasiado (rodilla < 50°)
  if (anguloRodillaBaja < 50) {
    feedback.push(`⚠️ Estás bajando demasiado (${anguloRodillaBaja.toFixed(1)}°). Esto puede causar estrés excesivo en las rodillas.`);
  }
  
  if (esCorrecta) {
    feedback.push("🎉 ¡Técnica perfecta! Rompiste el paralelo y mantuviste la espalda recta.");
    feedback.push("💪 Mantén esta forma en todas las repeticiones.");
    feedback.push("💡 Recuerda: rodillas alineadas con los pies, core activado, mirada al frente.");
  } else {
    feedback.push("📝 Corrige estos aspectos para mejorar tu técnica y prevenir lesiones.");
  }
  
  // Generar imagen visualizada del punto más bajo
  let imagenVisualizada = null;
  try {
    if (frameMin && frameMin.frameIndex !== undefined && landmarksFrames[frameMin.frameIndex]) {
      const frameData = landmarksFrames[frameMin.frameIndex];
      
      // Posicionar video en el tiempo del frame
      video.currentTime = frameData.tiempo;
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });
      
      // Dibujar el frame del video en el canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Dibujar landmarks encima
      dibujarLandmarks(ctx, frameData.landmarks, canvas.width, canvas.height);
      
      // Convertir canvas a blob URL
      imagenVisualizada = canvas.toDataURL('image/jpeg', 0.9);
    }
  } catch (error) {
    console.error("⚠️ Error al generar imagen visualizada:", error);
  }
  
  return {
    esCorrecta,
    angulos: {
      rodilla: anguloRodillaBaja,
      alineacion: anguloAlineacionBaja
    },
    rompioParalelo,
    feedback,
    duracion: Math.round(duracion),
    repeticionesDetectadas: repeticiones,
    imagenVisualizada
  };
}

/**
 * Analizar video de peso muerto frame por frame
 */
export async function analizarPesoMuertoVideo(videoFile) {
  try {
    console.log("🎬 Iniciando análisis de peso muerto...");
    
    // Inicializar PoseLandmarker
    const detector = await initializePoseLandmarker();
    
    // Crear elemento de video
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    
    // Esperar a que el video esté listo
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });
    
    const duracion = video.duration;
    const fps = 30; // Analizar 30 frames por segundo
    const frameInterval = 1 / fps;
    
    const resultadosFrames = [];
    const landmarksFrames = []; // Guardar landmarks para visualización
    let frameCount = 0;
    
    // Crear canvas para visualización
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Analizar frames
    for (let tiempo = 0; tiempo < duracion; tiempo += frameInterval) {
      video.currentTime = tiempo;
      
      // Esperar a que el frame esté listo
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });
      
      // Detectar pose
      const resultados = detector.detectForVideo(video, performance.now());
      
      if (resultados.landmarks && resultados.landmarks.length > 0) {
        const landmarks = resultados.landmarks[0];
        
        // Usar el lado más visible (el que tiene mayor diferencia en coordenada Z)
        const caderaIzq = landmarks[23]; // LEFT_HIP
        const rodillaIzq = landmarks[25]; // LEFT_KNEE
        const tobilloIzq = landmarks[27]; // LEFT_ANKLE
        const hombroIzq = landmarks[11]; // LEFT_SHOULDER
        
        const caderaDer = landmarks[24]; // RIGHT_HIP
        const rodillaDer = landmarks[26]; // RIGHT_KNEE
        const tobilloDer = landmarks[28]; // RIGHT_ANKLE
        const hombroDer = landmarks[12]; // RIGHT_SHOULDER
        
        // Determinar qué lado está más de perfil
        const visibilidadIzq = Math.abs(caderaIzq.z - rodillaIzq.z);
        const visibilidadDer = Math.abs(caderaDer.z - rodillaDer.z);
        
        let cadera, rodilla, tobillo, hombro;
        if (visibilidadIzq < visibilidadDer) {
          cadera = caderaIzq;
          rodilla = rodillaIzq;
          tobillo = tobilloIzq;
          hombro = hombroIzq;
        } else {
          cadera = caderaDer;
          rodilla = rodillaDer;
          tobillo = tobilloDer;
          hombro = hombroDer;
        }
        
        // Calcular ángulos clave
        const anguloRodilla = calcularAngulo(cadera, rodilla, tobillo);
        const anguloCadera = calcularAngulo(hombro, cadera, rodilla);
        
        // Posición Y de la cadera (0 = arriba, 1 = abajo en MediaPipe)
        const posicionCadera = cadera.y;
        
        // Calcular ángulo del torso con respecto a la vertical
        const deltaX = Math.abs(hombro.x - cadera.x);
        const deltaY = Math.abs(hombro.y - cadera.y);
        const anguloTorso = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
        
        // Validar que sea un frame válido de peso muerto (rangos más permisivos)
        const esFrameValido = anguloRodilla >= 20 && anguloRodilla <= 180 &&
                              anguloCadera >= 20 && anguloCadera <= 180;
        
        if (!esFrameValido) {
          frameCount++;
          continue;
        }
        
        resultadosFrames.push({
          tiempo,
          frameIndex: resultadosFrames.length,
          posicionCadera,
          anguloRodilla,
          anguloCadera,
          anguloTorso,
          posicionHombro: hombro.y,
          posicionRodilla: rodilla.y,
          posicionTobillo: tobillo.y
        });
        
        // Guardar landmarks para visualización
        landmarksFrames.push({
          landmarks,
          tiempo,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
        
        frameCount++;
      }
      
      // Limitar análisis para no saturar (máximo 300 frames = 10 segundos)
      if (frameCount >= 300) break;
    }
    
    console.log(`✅ Analizados ${frameCount} frames (${duracion.toFixed(2)}s de video)`);
    
    // Analizar resultados y detectar repeticiones
    const resultado = await analizarResultadosPesoMuerto(resultadosFrames, landmarksFrames, duracion, video, canvas, ctx);
    
    // Limpiar
    URL.revokeObjectURL(video.src);
    
    return resultado;
    
  } catch (error) {
    console.error("❌ Error en análisis de peso muerto:", error);
    throw error;
  }
}

/**
 * Detectar repeticiones de peso muerto basándose en la posición de la cadera
 * Enfoque simple: encontrar cadera más baja (inicio) y postura más erguida DESPUÉS del inicio (lockout)
 */
function detectarRepeticionesPesoMuerto(frames) {
  if (frames.length < 10) {
    console.log('⚠️ Muy pocos frames para análisis:', frames.length);
    return [];
  }
  
  console.log(`📊 Análisis de peso muerto:`);
  console.log(`  - Total frames: ${frames.length}`);
  console.log(`  - Rango temporal: ${frames[0].tiempo.toFixed(2)}s - ${frames[frames.length-1].tiempo.toFixed(2)}s`);
  
  // 1. INICIO: Buscar el punto donde la cadera está MÁS BAJA (máximo Y) en todo el video
  // Este es el punto donde el atleta agarra la barra antes de levantar
  const posicionesCadera = frames.map(f => f.posicionCadera);
  const maxCaderaY = Math.max(...posicionesCadera);
  const minCaderaY = Math.min(...posicionesCadera);
  console.log(`  - Rango cadera Y: ${minCaderaY.toFixed(3)} (más alta) a ${maxCaderaY.toFixed(3)} (más baja)`);
  
  const frameInicio = frames.find(f => f.posicionCadera === maxCaderaY);
  const indiceInicio = frames.indexOf(frameInicio);
  
  console.log(`  - INICIO encontrado (cadera más baja): índice=${indiceInicio}, t=${frameInicio.tiempo.toFixed(2)}s`);
  console.log(`    - Cadera Y=${frameInicio.posicionCadera.toFixed(3)} (más baja)`);
  console.log(`    - Hombro Y=${frameInicio.posicionHombro.toFixed(3)}`);
  
  // 2. LOCKOUT: Buscar hombros MÁS ALTOS (menor Y) DESPUÉS del inicio
  console.log(`\n📋 TODAS LAS POSICIONES desde inicio hasta final:`);
  console.log(`    Idx | Tiempo  | Cadera Y | Hombro Y`);
  console.log(`    ----|---------|----------|----------`);
  
  let framesPosteriores = frames.slice(indiceInicio + 1);
  
  if (framesPosteriores.length === 0) {
    console.log('⚠️ No hay frames posteriores al inicio');
    return [];
  }
  
  // Imprimir todas las posiciones
  for (let i = 0; i < framesPosteriores.length; i++) {
    const frame = framesPosteriores[i];
    const idxGlobal = indiceInicio + 1 + i;
    console.log(`    ${idxGlobal.toString().padStart(3)} | ${frame.tiempo.toFixed(2)}s | ${frame.posicionCadera.toFixed(3)} | ${frame.posicionHombro.toFixed(3)}`);
  }
  
  // Buscar el frame con TORSO MÁS VERTICAL (menor ángulo de torso)
  // Este es el mejor indicador del lockout en peso muerto
  let mejorLockout = null;
  let mejorScore = Infinity; // Menor ángulo de torso = más vertical = mejor
  let mejorIndice = -1;
  
  for (let i = 0; i < framesPosteriores.length; i++) {
    const frame = framesPosteriores[i];
    const scoreTorso = frame.anguloTorso; // Menor ángulo = más vertical
    
    if (scoreTorso < mejorScore) {
      mejorScore = scoreTorso;
      mejorLockout = frame;
      mejorIndice = indiceInicio + 1 + i;
    }
  }
  
  const frameLockout = mejorLockout;
  
  console.log(`\n  - LOCKOUT encontrado (torso más vertical): índice=${mejorIndice}, t=${frameLockout.tiempo.toFixed(2)}s`);
  console.log(`    - Cadera Y=${frameLockout.posicionCadera.toFixed(3)}, Hombro Y=${frameLockout.posicionHombro.toFixed(3)}`);
  console.log(`    - Torso: ${frameLockout.anguloTorso.toFixed(1)}° (más vertical)`);
  console.log(`  - Movimiento de cadera: ${frameInicio.posicionCadera.toFixed(3)} → ${frameLockout.posicionCadera.toFixed(3)} (subió ${(frameInicio.posicionCadera - frameLockout.posicionCadera).toFixed(3)})`);
  console.log(`  - Movimiento de hombros: ${frameInicio.posicionHombro.toFixed(3)} → ${frameLockout.posicionHombro.toFixed(3)} (subió ${(frameInicio.posicionHombro - frameLockout.posicionHombro).toFixed(3)})`);
  console.log(`  - Cambio de torso: ${frameInicio.anguloTorso.toFixed(1)}° → ${frameLockout.anguloTorso.toFixed(1)}° (enderezó ${(frameInicio.anguloTorso - frameLockout.anguloTorso).toFixed(1)}°)`);  
  // Calcular amplitud del movimiento
  const amplitudCadera = frameInicio.posicionCadera - frameLockout.posicionCadera;
  const amplitudHombros = frameInicio.posicionHombro - frameLockout.posicionHombro;
  
  console.log(`  - Amplitud cadera: ${amplitudCadera.toFixed(3)}`);
  console.log(`  - Amplitud hombros: ${amplitudHombros.toFixed(3)}`);
  
  // Crear una repetición con los frames detectados
  const repeticion = {
    numero: 1,
    frameInicio: frameInicio,
    frameLockout: frameLockout,
    amplitud: Math.max(amplitudCadera, amplitudHombros),
    tiempoInicio: frameInicio.tiempo,
    tiempoLockout: frameLockout.tiempo,
    duracion: Math.abs(frameLockout.tiempo - frameInicio.tiempo)
  };
  
  console.log(`✅ Frames detectados - duración: ${repeticion.duracion.toFixed(2)}s`);
  
  return [repeticion];
}

/**
 * Analizar resultados de peso muerto
 */
async function analizarResultadosPesoMuerto(frames, landmarksFrames, duracion, video, canvas, ctx) {
  if (frames.length === 0) {
    return {
      esCorrecta: false,
      feedback: [
        "❌ No se pudo detectar la pose en el video.",
        "📹 Asegúrate de grabar:",
        "• Completamente de LADO (perfil, no de frente)",
        "• Tu cuerpo COMPLETO visible (cabeza a pies)",
        "• Buena iluminación",
        "• Cámara estable y a altura media"
      ],
      duracion: Math.round(duracion),
      repeticionesDetectadas: 0,
      repeticiones: [],
      imagenInicio: null,
      imagenLockout: null
    };
  }
  
  // Detectar repeticiones
  const repeticiones = detectarRepeticionesPesoMuerto(frames);
  
  if (repeticiones.length === 0) {
    return {
      esCorrecta: false,
      feedback: [
        "❌ No se detectaron repeticiones válidas de peso muerto.",
        "📹 Asegúrate de:",
        "• Realizar el movimiento completo (desde abajo hasta lockout)",
        "• Mantener tu cuerpo completo visible durante todo el ejercicio",
        "• Grabar completamente de perfil",
        "💡 Consejo: El movimiento debe tener suficiente rango de movimiento (subir y bajar la cadera claramente)"
      ],
      duracion: Math.round(duracion),
      repeticionesDetectadas: 0,
      repeticiones: [],
      imagenInicio: null,
      imagenLockout: null
    };
  }
  
  // Tomar la primera repetición para análisis de técnica
  const primeraRep = repeticiones[0];
  const frameInicio = primeraRep.frameInicio;
  const frameLockout = primeraRep.frameLockout;
  
  console.log(`📊 Analizando repetición 1:`);
  console.log(`  - Inicio: ${frameInicio.tiempo.toFixed(2)}s, Cadera Y=${frameInicio.posicionCadera.toFixed(3)}`);
  console.log(`  - Lockout: ${frameLockout.tiempo.toFixed(2)}s, Cadera Y=${frameLockout.posicionCadera.toFixed(3)}`);
  console.log(`  - Amplitud: ${primeraRep.amplitud.toFixed(3)}, Duración: ${primeraRep.duracion.toFixed(2)}s`);
  
  // Generar imágenes visualizadas para inicio y lockout
  let imagenInicio = null;
  let imagenLockout = null;
  
  try {
    // Imagen de inicio
    const inicioIdx = frameInicio.frameIndex;
    if (inicioIdx !== undefined && inicioIdx < landmarksFrames.length && landmarksFrames[inicioIdx]) {
      const frameData = landmarksFrames[inicioIdx];
      video.currentTime = frameData.tiempo;
      await new Promise((resolve) => { video.onseeked = resolve; });
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      dibujarLandmarks(ctx, frameData.landmarks, canvas.width, canvas.height);
      
      // Agregar texto indicando que es el inicio
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 30px Arial';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('INICIO', 20, 50);
      ctx.fillText('INICIO', 20, 50);
      
      imagenInicio = canvas.toDataURL('image/jpeg', 0.9);
    }
    
    // Imagen de lockout
    const lockoutIdx = frameLockout.frameIndex;
    if (lockoutIdx !== undefined && lockoutIdx < landmarksFrames.length && landmarksFrames[lockoutIdx]) {
      const frameData = landmarksFrames[lockoutIdx];
      video.currentTime = frameData.tiempo;
      await new Promise((resolve) => { video.onseeked = resolve; });
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      dibujarLandmarks(ctx, frameData.landmarks, canvas.width, canvas.height);
      
      // Agregar texto indicando que es el lockout
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 30px Arial';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('LOCKOUT', 20, 50);
      ctx.fillText('LOCKOUT', 20, 50);
      
      imagenLockout = canvas.toDataURL('image/jpeg', 0.9);
    }
  } catch (error) {
    console.error("⚠️ Error al generar imágenes visualizadas:", error);
  }
  
  // Evaluar técnica
  const feedback = [];
  let esCorrecta = true;
  
  // 1. Verificar ángulo de rodilla en lockout (debe estar casi completamente extendida)
  if (frameLockout.anguloRodilla < 160) {
    feedback.push(`❌ No extendiste completamente las rodillas en el lockout (${frameLockout.anguloRodilla.toFixed(1)}°).`);
    feedback.push(`💡 Extiende completamente piernas y caderas al final del movimiento.`);
    esCorrecta = false;
  } else {
    feedback.push(`✅ Buena extensión de rodillas en el lockout (${frameLockout.anguloRodilla.toFixed(1)}°).`);
  }
  
  // 2. Verificar posición relativa hombros-cadera en inicio (hombros NO deben estar más bajos que cadera)
  // En MediaPipe: Y más grande = más abajo
  if (frameInicio.posicionHombro > frameInicio.posicionCadera) {
    feedback.push(`❌ Tus hombros están por debajo de las caderas al inicio. Esto es peligroso para la espalda.`);
    feedback.push(`💡 Antes de levantar: sube el pecho, activa el core y mantén los hombros por encima de las caderas.`);
    esCorrecta = false;
  }
  
  // 3. Verificar ángulo del torso en inicio (debe estar inclinado hacia adelante, no horizontal)
  if (frameInicio.anguloTorso < 30) {
    feedback.push(`⚠️ Tu torso está muy vertical al inicio (${frameInicio.anguloTorso.toFixed(1)}°). El peso muerto requiere inclinación.`);
    esCorrecta = false;
  } else if (frameInicio.anguloTorso > 75) {
    feedback.push(`❌ Tu espalda está demasiado horizontal al inicio (${frameInicio.anguloTorso.toFixed(1)}°). Esto es peligroso.`);
    feedback.push(`💡 Eleva más el pecho y baja las caderas antes de levantar. Tu espalda debe estar más diagonal, no horizontal.`);
    esCorrecta = false;
  }
  
  // 4. Verificar que el torso termine más vertical en lockout
  if (frameLockout.anguloTorso > 15) {
    feedback.push(`⚠️ Tu torso no está completamente vertical en el lockout (${frameLockout.anguloTorso.toFixed(1)}°).`);
    feedback.push(`💡 Empuja las caderas hacia adelante y endereza el torso completamente.`);
    esCorrecta = false;
  } else {
    feedback.push(`✅ Buena postura final, torso vertical en el lockout.`);
  }
  
  if (esCorrecta) {
    feedback.push("🎉 ¡Excelente técnica de peso muerto!");
    feedback.push("💪 Mantén esta forma en todas las repeticiones.");
  } else {
    feedback.push("📝 Corrige estos aspectos para mejorar tu técnica y prevenir lesiones.");
  }
  
  // Preparar información de todas las repeticiones
  const repeticionesInfo = repeticiones.map(rep => ({
    numero: rep.numero,
    tiempoInicio: rep.tiempoInicio.toFixed(2),
    tiempoLockout: rep.tiempoLockout.toFixed(2),
    duracion: rep.duracion.toFixed(2),
    anguloRodillaInicio: rep.frameInicio.anguloRodilla.toFixed(1),
    anguloRodillaLockout: rep.frameLockout.anguloRodilla.toFixed(1),
    anguloTorsoInicio: rep.frameInicio.anguloTorso.toFixed(1),
    anguloTorsoLockout: rep.frameLockout.anguloTorso.toFixed(1)
  }));
  
  return {
    esCorrecta,
    feedback,
    duracion: Math.round(duracion),
    repeticionesDetectadas: repeticiones.length,
    repeticiones: repeticionesInfo,
    imagenInicio,
    imagenLockout,
    detallesPrimeraRep: {
      inicio: {
        tiempo: frameInicio.tiempo.toFixed(2),
        anguloRodilla: frameInicio.anguloRodilla.toFixed(1),
        anguloTorso: frameInicio.anguloTorso.toFixed(1)
      },
      lockout: {
        tiempo: frameLockout.tiempo.toFixed(2),
        anguloRodilla: frameLockout.anguloRodilla.toFixed(1),
        anguloTorso: frameLockout.anguloTorso.toFixed(1)
      }
    }
  };
}