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
