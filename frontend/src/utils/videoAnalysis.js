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
 * Calcular ángulo de flexión de cadera para sentadilla usando vectores direccionales
 * Mide el ángulo entre el torso (cadera->hombro) y muslo (cadera->rodilla)
 * @param {Object} hombro - Punto del hombro
 * @param {Object} cadera - Punto de la cadera (vértice)
 * @param {Object} rodilla - Punto de la rodilla
 * @returns {number} Ángulo en grados (0-180°)
 */
function calcularAnguloFlexionCadera(hombro, cadera, rodilla) {
  // Vector del torso: cadera -> hombro (hacia arriba)
  const vectorTorso = {
    x: hombro.x - cadera.x,
    y: hombro.y - cadera.y  // En MediaPipe: Y negativo = hacia arriba
  };
  
  // Vector del muslo: cadera -> rodilla (hacia abajo)
  const vectorMuslo = {
    x: rodilla.x - cadera.x,
    y: rodilla.y - cadera.y  // En MediaPipe: Y positivo = hacia abajo
  };
  
  // Calcular ángulos de cada vector respecto al eje horizontal
  const anguloTorso = Math.atan2(-vectorTorso.y, vectorTorso.x); // Invertir Y para que arriba sea positivo
  const anguloMuslo = Math.atan2(-vectorMuslo.y, vectorMuslo.x);
  
  // Diferencia de ángulos
  let diferencia = Math.abs(anguloTorso - anguloMuslo) * 180 / Math.PI;
  
  // Asegurar que esté en rango 0-180°
  if (diferencia > 180) {
    diferencia = 360 - diferencia;
  }
  
  return Math.round(diferencia * 10) / 10;
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
        
        // Ángulo de alineación espalda (hombro-cadera-tobillo)
        // Usa cálculo direccional específico para medir correctamente el ángulo del torso
        // 180° = perfectamente recto, valores menores indican mayor flexión hacia adelante
        const anguloAlineacion = calcularAnguloFlexionCadera(hombro, cadera, tobillo);
        
        // Ángulo de flexión de cadera (hombro-cadera-rodilla)
        // Para detectar butt wink: cambios bruscos indican rotación pélvica posterior
        const anguloFlexionCadera = calcularAnguloFlexionCadera(hombro, cadera, rodilla);
        
        // Altura relativa de cadera respecto a rodilla (para verificar profundidad REAL)
        // En MediaPipe, Y aumenta hacia abajo (0 arriba, 1 abajo)
        const alturaRelativa = cadera.y - rodilla.y; // Positivo = cadera más baja que rodilla (rompió paralelo)
        
        // Ángulo del torso respecto al suelo (para detectar inclinación excesiva)
        // Vector del torso: hombro -> cadera
        const deltaX = Math.abs(hombro.x - cadera.x);
        const deltaY = Math.abs(hombro.y - cadera.y);
        // atan2(deltaY, deltaX) da ángulo respecto a horizontal
        // Convertimos a ángulo respecto al suelo: 0° = horizontal, 90° = vertical
        const anguloTorso = Math.atan2(deltaY, deltaX) * 180 / Math.PI; // 90° = vertical, 0° = horizontal
        
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
          console.log(`✓ Frame ${resultadosFrames.length}: Rodilla=${anguloRodilla}°, FlexCadera=${anguloFlexionCadera.toFixed(1)}°, Alineación=${anguloAlineacion.toFixed(1)}°`);
        }
        
        resultadosFrames.push({
          tiempo,
          anguloRodilla,
          anguloAlineacion,
          anguloFlexionCadera,
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
  
  // Encontrar el punto más bajo y más alto por posición vertical de la cadera
  // En MediaPipe, Y aumenta hacia abajo (0=arriba, 1=abajo)
  // Cadera con mayor Y = posición más baja = punto más bajo de la sentadilla
  const posicionesCadera = framesValidos.map(f => f.posicionCadera);
  const posicionCaderaMax = Math.max(...posicionesCadera);
  const posicionCaderaMin = Math.min(...posicionesCadera);
  const frameMin = framesValidos.find(f => f.posicionCadera === posicionCaderaMax);
  const frameMax = framesValidos.find(f => f.posicionCadera === posicionCaderaMin);
  
  // Usar los valores en el punto más bajo para evaluar
  const anguloRodillaBaja = frameMin.anguloRodilla;
  const anguloAlineacionBaja = frameMin.anguloAlineacion;
  const anguloFlexionCaderaBaja = frameMin.anguloFlexionCadera;
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
  
  // No generar feedback aquí - el LLM lo hará en el backend
  
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
    angulos: {
      rodilla: anguloRodillaBaja,
      alineacion: anguloAlineacionBaja,
      flexionCadera: anguloFlexionCaderaBaja
    },
    rompioParalelo,
    duracion: Math.round(duracion),
    repeticionesDetectadas: repeticiones,
    imagenVisualizada,
    // Datos para el LLM
    framesCompletos: frames.map((frame, idx) => ({
      indice: idx,
      tiempo: frame.tiempo,
      anguloRodilla: frame.anguloRodilla,
      anguloTorso: frame.anguloTorso,
      anguloAlineacion: frame.anguloAlineacion,
      anguloFlexionCadera: frame.anguloFlexionCadera,
      alturaRelativa: frame.alturaRelativa,
      caderaY: frame.posicionCadera,
      rodillaY: frame.posicionRodilla
    })),
    framesClave: {
      inicio: frameMax ? {
        indice: frameMax.frameIndex,
        tiempo: frameMax.tiempo,
        anguloRodilla: frameMax.anguloRodilla,
        anguloTorso: frameMax.anguloTorso,
        anguloAlineacion: frameMax.anguloAlineacion,
        anguloFlexionCadera: frameMax.anguloFlexionCadera,
        caderaY: frameMax.posicionCadera,
        rodillaY: frameMax.posicionRodilla
      } : null,
      peak: frameMin ? {
        indice: frameMin.frameIndex,
        tiempo: frameMin.tiempo,
        anguloRodilla: frameMin.anguloRodilla,
        anguloTorso: frameMin.anguloTorso,
        anguloAlineacion: frameMin.anguloAlineacion,
        anguloFlexionCadera: frameMin.anguloFlexionCadera,
        caderaY: frameMin.posicionCadera,
        rodillaY: frameMin.posicionRodilla
      } : null
    },
    metricas: {
      duracion: Math.round(duracion),
      repeticiones,
      rompioParalelo,
      anguloRodillaMin: anguloRodillaBaja,
      anguloAlineacionMin: anguloAlineacionBaja,
      anguloFlexionCaderaMin: anguloFlexionCaderaBaja,
      amplitudCadera: frameMax && frameMin ? Math.abs(frameMax.posicionCadera - frameMin.posicionCadera) : 0
    }
  };
}

/**
 * Analizar video de press de hombros frame por frame
 */
export async function analizarPressHombroVideo(videoFile) {
  try {
    console.log("🎬 Iniciando análisis de press de hombros...");
    
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
        
        // Usar el lado más visible
        const codoIzq = landmarks[13]; // LEFT_ELBOW
        const munecaIzq = landmarks[15]; // LEFT_WRIST
        const hombroIzq = landmarks[11]; // LEFT_SHOULDER
        const caderaIzq = landmarks[23]; // LEFT_HIP
        const tobilloIzq = landmarks[27]; // LEFT_ANKLE
        
        const codoDer = landmarks[14]; // RIGHT_ELBOW
        const munecaDer = landmarks[16]; // RIGHT_WRIST
        const hombroDer = landmarks[12]; // RIGHT_SHOULDER
        const caderaDer = landmarks[24]; // RIGHT_HIP
        const tobilloDer = landmarks[28]; // RIGHT_ANKLE
        
        // Determinar qué lado está más de perfil
        const visibilidadIzq = Math.abs(codoIzq.z - munecaIzq.z);
        const visibilidadDer = Math.abs(codoDer.z - munecaDer.z);
        
        let codo, muneca, hombro, cadera, tobillo;
        if (visibilidadIzq < visibilidadDer) {
          codo = codoIzq;
          muneca = munecaIzq;
          hombro = hombroIzq;
          cadera = caderaIzq;
          tobillo = tobilloIzq;
        } else {
          codo = codoDer;
          muneca = munecaDer;
          hombro = hombroDer;
          cadera = caderaDer;
          tobillo = tobilloDer;
        }
        
        // Calcular ángulo del codo (hombro-codo-muñeca)
        const anguloCodo = calcularAngulo(hombro, codo, muneca);
        
        // Calcular ángulo del torso respecto al suelo
        const deltaX = Math.abs(hombro.x - cadera.x);
        const deltaY = Math.abs(hombro.y - cadera.y);
        const anguloTorso = Math.atan2(deltaY, deltaX) * 180 / Math.PI; // 90° = vertical, 0° = horizontal
        
        // Calcular alineación tobillo-cadera-hombro (detectar arqueo de espalda)
        // 180° = línea recta perfecta, <170° = espalda arqueada
        const anguloAlineacion = calcularAngulo(tobillo, cadera, hombro);
        
        // Posiciones Y (0 = arriba, 1 = abajo)
        const posicionMuneca = muneca.y;
        const posicionCodo = codo.y;
        const posicionHombro = hombro.y;
        const posicionCadera = cadera.y;
        const posicionTobillo = tobillo.y;
        
        // Posición X de la muñeca (para detectar trayectoria vertical)
        const posicionXMuneca = muneca.x;
        
        // Validar que sea un frame válido de press (codo no completamente extendido ni muy flexionado)
        const esFrameValido = anguloCodo >= 30 && anguloCodo <= 180;
        
        if (!esFrameValido) {
          frameCount++;
          continue;
        }
        
        resultadosFrames.push({
          tiempo,
          frameIndex: resultadosFrames.length,
          anguloCodo,
          anguloTorso,
          anguloAlineacion,
          posicionMuneca,
          posicionCodo,
          posicionHombro,
          posicionCadera,
          posicionTobillo,
          posicionXMuneca
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
    const resultado = await analizarResultadosPressHombro(resultadosFrames, landmarksFrames, duracion, video, canvas, ctx);
    
    // Limpiar
    URL.revokeObjectURL(video.src);
    
    return resultado;
    
  } catch (error) {
    console.error("❌ Error en análisis de press de hombros:", error);
    throw error;
  }
}

/**
 * Analizar video de remo con barra frame por frame
 */
export async function analizarRemoBarraVideo(videoFile) {
  try {
    console.log("🎬 Iniciando análisis de remo con barra...");
    
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
        
        // Usar el lado más visible
        const codoIzq = landmarks[13]; // LEFT_ELBOW
        const munecaIzq = landmarks[15]; // LEFT_WRIST
        const hombroIzq = landmarks[11]; // LEFT_SHOULDER
        const caderaIzq = landmarks[23]; // LEFT_HIP
        const rodillaIzq = landmarks[25]; // LEFT_KNEE
        const tobilloIzq = landmarks[27]; // LEFT_ANKLE
        
        const codoDer = landmarks[14]; // RIGHT_ELBOW
        const munecaDer = landmarks[16]; // RIGHT_WRIST
        const hombroDer = landmarks[12]; // RIGHT_SHOULDER
        const caderaDer = landmarks[24]; // RIGHT_HIP
        const rodillaDer = landmarks[26]; // RIGHT_KNEE
        const tobilloDer = landmarks[28]; // RIGHT_ANKLE
        
        // Determinar qué lado está más de perfil
        const visibilidadIzq = Math.abs(codoIzq.z - munecaIzq.z);
        const visibilidadDer = Math.abs(codoDer.z - munecaDer.z);
        
        let codo, muneca, hombro, cadera, rodilla, tobillo;
        if (visibilidadIzq < visibilidadDer) {
          codo = codoIzq;
          muneca = munecaIzq;
          hombro = hombroIzq;
          cadera = caderaIzq;
          rodilla = rodillaIzq;
          tobillo = tobilloIzq;
        } else {
          codo = codoDer;
          muneca = munecaDer;
          hombro = hombroDer;
          cadera = caderaDer;
          rodilla = rodillaDer;
          tobillo = tobilloDer;
        }
        
        // Calcular ángulo del codo (hombro-codo-muñeca)
        const anguloCodo = calcularAngulo(hombro, codo, muneca);
        
        // Calcular ángulo del torso respecto al suelo
        // IMPORTANTE: NO usar Math.abs en deltaY para detectar si torso va hacia arriba o abajo
        const deltaX = Math.abs(hombro.x - cadera.x);
        const deltaY = hombro.y - cadera.y; // Negativo = hombro arriba (NORMAL), Positivo = hombro abajo (ANORMAL)
        
        let anguloTorso;
        if (deltaY < 0) {
          // NORMAL: Hombro más alto que cadera (Y menor = más arriba)
          // Calcular ángulo normal: 90° = vertical, 0° = horizontal
          anguloTorso = Math.atan2(Math.abs(deltaY), deltaX) * 180 / Math.PI;
        } else {
          // ANORMAL: Hombro más bajo que cadera
          // Usar ángulo NEGATIVO para indicar dirección incorrecta
          anguloTorso = -Math.atan2(Math.abs(deltaY), deltaX) * 180 / Math.PI;
        }
        
        // Calcular ángulo de la rodilla (para verificar estabilidad de piernas)
        const anguloRodilla = calcularAngulo(cadera, rodilla, tobillo);
        
        // Calcular alineación rodilla-cadera-hombro (detectar curvatura de espalda)
        // Este ángulo mide si la espalda está recta o redondeada
        // 170-180° = espalda recta (incluso en posición inclinada)
        // <160° = espalda redondeada (PELIGROSO)
        const anguloAlineacion = calcularAngulo(rodilla, cadera, hombro);
        
        // Posiciones Y (0 = arriba, 1 = abajo)
        const posicionMuneca = muneca.y;
        const posicionCodo = codo.y;
        const posicionHombro = hombro.y;
        const posicionCadera = cadera.y;
        
        // Validar que sea un frame válido de remo
        const esFrameValido = anguloCodo >= 30 && anguloCodo <= 180;
        
        if (!esFrameValido) {
          frameCount++;
          continue;
        }
        
        resultadosFrames.push({
          tiempo,
          frameIndex: resultadosFrames.length,
          anguloCodo,
          anguloTorso,
          anguloRodilla,
          anguloAlineacion,
          posicionMuneca,
          posicionCodo,
          posicionHombro,
          posicionCadera
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
    const resultado = await analizarResultadosRemoBarra(resultadosFrames, landmarksFrames, duracion, video, canvas, ctx);
    
    // Agregar frames y frames clave para enviar al LLM (si está disponible)
    resultado.framesCompletos = resultadosFrames;
    resultado.framesClave = {
      inicio: resultado.detallesPrimeraRep?.inicio ? {
        tiempo: parseFloat(resultado.detallesPrimeraRep.inicio.tiempo),
        anguloCodo: parseFloat(resultado.detallesPrimeraRep.inicio.anguloCodo),
        anguloTorso: parseFloat(resultado.detallesPrimeraRep.inicio.anguloTorso),
        anguloAlineacion: parseFloat(resultado.detallesPrimeraRep.inicio.anguloAlineacion)
      } : null,
      peak: resultado.detallesPrimeraRep?.peak ? {
        tiempo: parseFloat(resultado.detallesPrimeraRep.peak.tiempo),
        anguloCodo: parseFloat(resultado.detallesPrimeraRep.peak.anguloCodo),
        anguloTorso: parseFloat(resultado.detallesPrimeraRep.peak.anguloTorso),
        anguloAlineacion: parseFloat(resultado.detallesPrimeraRep.peak.anguloAlineacion)
      } : null
    };
    resultado.metricas = {
      amplitud: resultado.detallesPrimeraRep ? parseFloat(resultado.detallesPrimeraRep.amplitud) : 0,
      cambioTorso: resultado.detallesPrimeraRep ? parseFloat(resultado.detallesPrimeraRep.cambioTorso) : 0,
      duracion: duracion,
      repeticiones: resultado.repeticionesDetectadas || 0
    };
    
    // Limpiar
    URL.revokeObjectURL(video.src);
    
    return resultado;
    
  } catch (error) {
    console.error("❌ Error en análisis de remo con barra:", error);
    throw error;
  }
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
        
        // Calcular alineación tobillo-cadera-hombro (detectar espalda curvada)
        // 180° = línea recta perfecta, <170° = espalda redondeada (PELIGRO)
        const anguloAlineacion = calcularAngulo(tobillo, cadera, hombro);
        
        // Posición Y de la cadera (0 = arriba, 1 = abajo en MediaPipe)
        const posicionCadera = cadera.y;
        
        // Calcular ángulo del torso con respecto al suelo
        // IMPORTANTE: NO usar Math.abs en deltaY para detectar si torso va hacia arriba o abajo
        const deltaX = Math.abs(hombro.x - cadera.x);
        const deltaY = hombro.y - cadera.y; // Negativo = hombro arriba (NORMAL), Positivo = hombro abajo (PELIGRO)
        
        let anguloTorso;
        if (deltaY < 0) {
          // NORMAL: Hombro más alto que cadera (Y menor = más arriba)
          // Calcular ángulo normal: 90° = vertical, 0° = horizontal
          anguloTorso = Math.atan2(Math.abs(deltaY), deltaX) * 180 / Math.PI;
        } else {
          // PELIGRO: Hombro más bajo que cadera (posición invertida/agachado extremo)
          // Usar ángulo NEGATIVO para indicar dirección incorrecta
          anguloTorso = -Math.atan2(Math.abs(deltaY), deltaX) * 180 / Math.PI;
        }
        
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
          anguloAlineacion,
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
 * Detectar repeticiones de press de hombros
 * Estrategia: encontrar muñecas en posición más ALTA (lockout) y más BAJA antes del lockout (inicio)
 */
function detectarRepeticionesPressHombro(frames) {
  if (frames.length < 10) {
    console.log('⚠️ Muy pocos frames para análisis:', frames.length);
    return [];
  }
  
  console.log(`📊 Análisis de press de hombros:`);
  console.log(`  - Total frames: ${frames.length}`);
  console.log(`  - Rango temporal: ${frames[0].tiempo.toFixed(2)}s - ${frames[frames.length-1].tiempo.toFixed(2)}s`);
  
  // 1. LOCKOUT: Buscar el punto donde las MUÑECAS están MÁS ALTAS (menor Y) en todo el video
  const posicionesMuneca = frames.map(f => f.posicionMuneca);
  const minMunecaY = Math.min(...posicionesMuneca);
  const maxMunecaY = Math.max(...posicionesMuneca);
  console.log(`  - Rango muñeca Y: ${minMunecaY.toFixed(3)} (más alta) a ${maxMunecaY.toFixed(3)} (más baja)`);
  
  const frameLockout = frames.find(f => f.posicionMuneca === minMunecaY);
  const indiceLockout = frames.indexOf(frameLockout);
  
  console.log(`  - LOCKOUT encontrado (muñeca más alta): índice=${indiceLockout}, t=${frameLockout.tiempo.toFixed(2)}s`);
  console.log(`    - Muñeca Y=${frameLockout.posicionMuneca.toFixed(3)} (más alta)`);
  console.log(`    - Codo: ${frameLockout.anguloCodo.toFixed(1)}°`);
  
  // 2. INICIO: Buscar muñecas MÁS BAJAS (mayor Y) ANTES del lockout
  const framesAnteriores = frames.slice(0, indiceLockout);
  
  if (framesAnteriores.length === 0) {
    console.log('⚠️ No hay frames anteriores al lockout');
    return [];
  }
  
  const maxMunecaYAntes = Math.max(...framesAnteriores.map(f => f.posicionMuneca));
  const frameInicio = framesAnteriores.find(f => f.posicionMuneca === maxMunecaYAntes);
  const indiceInicio = frames.indexOf(frameInicio);
  
  console.log(`  - INICIO encontrado (muñeca más baja antes de lockout): índice=${indiceInicio}, t=${frameInicio.tiempo.toFixed(2)}s`);
  console.log(`    - Muñeca Y=${frameInicio.posicionMuneca.toFixed(3)} (más baja)`);
  console.log(`    - Codo: ${frameInicio.anguloCodo.toFixed(1)}°`);
  
  // Calcular amplitud del movimiento
  const amplitudMuneca = frameInicio.posicionMuneca - frameLockout.posicionMuneca;
  console.log(`  - Amplitud muñeca: ${amplitudMuneca.toFixed(3)}`);
  console.log(`  - Cambio ángulo codo: ${frameInicio.anguloCodo.toFixed(1)}° → ${frameLockout.anguloCodo.toFixed(1)}°`);
  console.log(`  - Cambio ángulo torso: ${frameInicio.anguloTorso.toFixed(1)}° → ${frameLockout.anguloTorso.toFixed(1)}°`);
  
  // Calcular desviación lateral de la barra (trayectoria)
  const desviacionX = Math.abs(frameInicio.posicionXMuneca - frameLockout.posicionXMuneca);
  console.log(`  - Desviación lateral de la barra: ${desviacionX.toFixed(3)}`);
  
  // IMPRIMIR EVOLUCIÓN COMPLETA DEL MOVIMIENTO (torso y espalda)
  console.log(`\n📊 EVOLUCIÓN COMPLETA DEL MOVIMIENTO (frames ${indiceInicio} a ${indiceLockout}):`);
  console.log(`    Idx | Tiempo  | Muñeca Y | Codo Y | Hombro Y | Cadera Y | Tobillo Y | Ang.Codo | Ang.Torso | Ang.Alineación | Muñeca X`);
  console.log(`    ----|---------|----------|--------|----------|----------|-----------|----------|-----------|----------------|----------`);
  
  for (let i = indiceInicio; i <= indiceLockout; i++) {
    const frame = frames[i];
    const marcador = i === indiceInicio ? '🟢' : (i === indiceLockout ? '🔴' : '  ');
    console.log(
      `${marcador} ${i.toString().padStart(3)} | ${frame.tiempo.toFixed(2)}s | ` +
      `${frame.posicionMuneca.toFixed(3)} | ${frame.posicionCodo.toFixed(3)} | ` +
      `${frame.posicionHombro.toFixed(3)} | ${frame.posicionCadera.toFixed(3)} | ` +
      `${frame.posicionTobillo.toFixed(3)} | ` +
      `${frame.anguloCodo.toFixed(1).padStart(5)}° | ${frame.anguloTorso.toFixed(1).padStart(6)}° | ` +
      `${frame.anguloAlineacion.toFixed(1).padStart(7)}° | ` +
      `${frame.posicionXMuneca.toFixed(3)}`
    );
  }
  console.log(`\n  🟢 = INICIO (rack position)`);
  console.log(`  🔴 = LOCKOUT (brazos extendidos)`);
  console.log(`\n  📈 Cambios durante el movimiento:`);
  console.log(`     - Muñeca subió: ${amplitudMuneca.toFixed(3)} unidades`);
  console.log(`     - Codo extendió: ${(frameLockout.anguloCodo - frameInicio.anguloCodo).toFixed(1)}°`);
  console.log(`     - Torso cambió: ${(frameLockout.anguloTorso - frameInicio.anguloTorso).toFixed(1)}° ${frameLockout.anguloTorso > frameInicio.anguloTorso ? '(se arqueó)' : '(se mantuvo estable)'}`);
  console.log(`     - Alineación corporal en lockout: ${frameLockout.anguloAlineacion.toFixed(1)}° (ideal: ~180°)`);
  console.log(`     - Barra se desvió lateralmente: ${desviacionX.toFixed(3)} unidades\n`);
  
  // Crear una repetición con los frames detectados
  const repeticion = {
    numero: 1,
    frameInicio: frameInicio,
    frameLockout: frameLockout,
    amplitud: amplitudMuneca,
    desviacionX: desviacionX,
    tiempoInicio: frameInicio.tiempo,
    tiempoLockout: frameLockout.tiempo,
    duracion: Math.abs(frameLockout.tiempo - frameInicio.tiempo)
  };
  
  console.log(`✅ Frames detectados - duración: ${repeticion.duracion.toFixed(2)}s`);
  
  return [repeticion];
}

/**
 * Detectar repeticiones de remo con barra
 * Estrategia: encontrar muñeca MÁS ALTA (peak - tirar) y MÁS BAJA (inicio - brazos extendidos)
 */
function detectarRepeticionesRemoBarra(frames) {
  if (frames.length < 10) {
    console.log('⚠️ Muy pocos frames para análisis:', frames.length);
    return [];
  }
  
  console.log(`📊 Análisis de remo con barra:`);
  console.log(`  - Total frames: ${frames.length}`);
  console.log(`  - Rango temporal: ${frames[0].tiempo.toFixed(2)}s - ${frames[frames.length-1].tiempo.toFixed(2)}s`);
  
  // 1. INICIO (brazos extendidos): Muñeca MÁS BAJA (mayor Y)
  const posicionesMuneca = frames.map(f => f.posicionMuneca);
  const minMunecaY = Math.min(...posicionesMuneca);
  const maxMunecaY = Math.max(...posicionesMuneca);
  console.log(`  - Rango muñeca Y: ${minMunecaY.toFixed(3)} (más alta) a ${maxMunecaY.toFixed(3)} (más baja)`);
  
  const frameInicio = frames.find(f => f.posicionMuneca === maxMunecaY);
  const indiceInicio = frames.indexOf(frameInicio);
  
  console.log(`  - INICIO encontrado (brazos extendidos): índice=${indiceInicio}, t=${frameInicio.tiempo.toFixed(2)}s`);
  console.log(`    - Muñeca Y=${frameInicio.posicionMuneca.toFixed(3)} (más baja)`);
  console.log(`    - Codo: ${frameInicio.anguloCodo.toFixed(1)}°`);
  console.log(`    - Torso: ${frameInicio.anguloTorso.toFixed(1)}°`);
  
  // 2. PEAK (tirón completo): Muñeca MÁS ALTA (menor Y) DESPUÉS del inicio
  const framesPosteriores = frames.slice(indiceInicio + 1);
  
  if (framesPosteriores.length === 0) {
    console.log('⚠️ No hay frames posteriores al inicio');
    return [];
  }
  
  const minMunecaYDespues = Math.min(...framesPosteriores.map(f => f.posicionMuneca));
  const framePeak = framesPosteriores.find(f => f.posicionMuneca === minMunecaYDespues);
  const indicePeak = frames.indexOf(framePeak);
  
  console.log(`  - PEAK encontrado (tirón completo): índice=${indicePeak}, t=${framePeak.tiempo.toFixed(2)}s`);
  console.log(`    - Muñeca Y=${framePeak.posicionMuneca.toFixed(3)} (más alta)`);
  console.log(`    - Codo: ${framePeak.anguloCodo.toFixed(1)}°`);
  console.log(`    - Torso: ${framePeak.anguloTorso.toFixed(1)}°`);
  
  // Calcular amplitud del movimiento
  const amplitudMuneca = frameInicio.posicionMuneca - framePeak.posicionMuneca;
  console.log(`  - Amplitud muñeca: ${amplitudMuneca.toFixed(3)}`);
  console.log(`  - Cambio ángulo codo: ${frameInicio.anguloCodo.toFixed(1)}° → ${framePeak.anguloCodo.toFixed(1)}°`);
  console.log(`  - Cambio ángulo torso: ${frameInicio.anguloTorso.toFixed(1)}° → ${framePeak.anguloTorso.toFixed(1)}°`);
  
  // Imprimir tabla de evolución
  console.log(`\n📊 EVOLUCIÓN COMPLETA DEL MOVIMIENTO (frames ${indiceInicio} a ${indicePeak}):`);
  console.log(`    Idx | Tiempo  | Muñeca Y | Codo Y | Ang.Codo | Ang.Torso | Ang.Alineación`);
  console.log(`    ----|---------|----------|--------|----------|-----------|----------------`);
  
  for (let i = indiceInicio; i <= indicePeak; i++) {
    const frame = frames[i];
    const marcador = i === indiceInicio ? '🟢' : (i === indicePeak ? '🔴' : '  ');
    console.log(
      `${marcador} ${i.toString().padStart(3)} | ${frame.tiempo.toFixed(2)}s | ` +
      `${frame.posicionMuneca.toFixed(3)} | ${frame.posicionCodo.toFixed(3)} | ` +
      `${frame.anguloCodo.toFixed(1).padStart(5)}° | ${frame.anguloTorso.toFixed(1).padStart(6)}° | ` +
      `${frame.anguloAlineacion.toFixed(1).padStart(7)}°`
    );
  }
  
  console.log(`\n  🟢 = INICIO (brazos extendidos)`);
  console.log(`  🔴 = PEAK (tirón completo)`);
  console.log(`\n  📈 Cambios durante el movimiento:`);
  console.log(`     - Muñeca subió: ${amplitudMuneca.toFixed(3)} unidades`);
  console.log(`     - Codo flexionó: ${(frameInicio.anguloCodo - framePeak.anguloCodo).toFixed(1)}°`);
  console.log(`     - Torso cambió: ${Math.abs(framePeak.anguloTorso - frameInicio.anguloTorso).toFixed(1)}° ${framePeak.anguloTorso > frameInicio.anguloTorso ? '(se balanceó)' : '(estable)'}`);
  console.log(`     - Alineación en peak: ${framePeak.anguloAlineacion.toFixed(1)}° (ideal: >170°)\n`);
  
  // Crear una repetición con los frames detectados
  const repeticion = {
    numero: 1,
    frameInicio: frameInicio,
    framePeak: framePeak,
    amplitud: amplitudMuneca,
    tiempoInicio: frameInicio.tiempo,
    tiempoPeak: framePeak.tiempo,
    duracion: Math.abs(framePeak.tiempo - frameInicio.tiempo)
  };
  
  console.log(`✅ Frames detectados - duración: ${repeticion.duracion.toFixed(2)}s`);
  
  return [repeticion];
}

/**
 * Analizar resultados de remo con barra
 */
async function analizarResultadosRemoBarra(frames, landmarksFrames, duracion, video, canvas, ctx) {
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
      imagenPeak: null
    };
  }
  
  // Detectar repeticiones
  const repeticiones = detectarRepeticionesRemoBarra(frames);
  
  if (repeticiones.length === 0) {
    return {
      esCorrecta: false,
      feedback: [
        "❌ No se detectaron repeticiones válidas de remo con barra.",
        "📹 Asegúrate de:",
        "• Realizar el movimiento completo (desde brazos extendidos hasta tirar la barra al torso)",
        "• Mantener tu cuerpo completo visible durante todo el ejercicio",
        "• Grabar completamente de perfil",
        "💡 Consejo: El movimiento debe tener suficiente rango"
      ],
      duracion: Math.round(duracion),
      repeticionesDetectadas: 0,
      repeticiones: [],
      imagenInicio: null,
      imagenPeak: null
    };
  }
  
  // Tomar la primera repetición para análisis de técnica
  const primeraRep = repeticiones[0];
  const frameInicio = primeraRep.frameInicio;
  const framePeak = primeraRep.framePeak;
  
  console.log(`📊 Analizando repetición 1:`);
  console.log(`  - Inicio: ${frameInicio.tiempo.toFixed(2)}s, Muñeca Y=${frameInicio.posicionMuneca.toFixed(3)}`);
  console.log(`  - Peak: ${framePeak.tiempo.toFixed(2)}s, Muñeca Y=${framePeak.posicionMuneca.toFixed(3)}`);
  console.log(`  - Amplitud: ${primeraRep.amplitud.toFixed(3)}, Duración: ${primeraRep.duracion.toFixed(2)}s`);
  
  // Generar imágenes visualizadas para inicio y peak
  let imagenInicio = null;
  let imagenPeak = null;
  
  try {
    // Imagen de inicio
    const inicioIdx = frameInicio.frameIndex;
    if (inicioIdx !== undefined && inicioIdx < landmarksFrames.length && landmarksFrames[inicioIdx]) {
      const frameData = landmarksFrames[inicioIdx];
      video.currentTime = frameData.tiempo;
      await new Promise((resolve) => { video.onseeked = resolve; });
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      dibujarLandmarks(ctx, frameData.landmarks, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 30px Arial';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('INICIO', 20, 50);
      ctx.fillText('INICIO', 20, 50);
      
      imagenInicio = canvas.toDataURL('image/jpeg', 0.9);
    }
    
    // Imagen de peak
    const peakIdx = framePeak.frameIndex;
    if (peakIdx !== undefined && peakIdx < landmarksFrames.length && landmarksFrames[peakIdx]) {
      const frameData = landmarksFrames[peakIdx];
      video.currentTime = frameData.tiempo;
      await new Promise((resolve) => { video.onseeked = resolve; });
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      dibujarLandmarks(ctx, frameData.landmarks, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 30px Arial';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('PEAK', 20, 50);
      ctx.fillText('PEAK', 20, 50);
      
      imagenPeak = canvas.toDataURL('image/jpeg', 0.9);
    }
  } catch (error) {
    console.error("⚠️ Error al generar imágenes visualizadas:", error);
  }
  
  // No generar feedback aquí - el LLM lo hará en el backend
  const cambioTorso = Math.abs(framePeak.anguloTorso - frameInicio.anguloTorso);
  console.log(`  - Cambio de torso durante movimiento: ${cambioTorso.toFixed(1)}°`);
  
  // Preparar información de todas las repeticiones
  const repeticionesInfo = repeticiones.map(rep => ({
    numero: rep.numero,
    tiempoInicio: rep.tiempoInicio.toFixed(2),
    tiempoPeak: rep.tiempoPeak.toFixed(2),
    duracion: rep.duracion.toFixed(2),
    anguloCodoInicio: rep.frameInicio.anguloCodo.toFixed(1),
    anguloCodoPeak: rep.framePeak.anguloCodo.toFixed(1),
    anguloTorsoInicio: rep.frameInicio.anguloTorso.toFixed(1),
    anguloTorsoPeak: rep.framePeak.anguloTorso.toFixed(1)
  }));
  
  return {
    duracion: Math.round(duracion),
    repeticionesDetectadas: repeticiones.length,
    repeticiones: repeticionesInfo,
    imagenInicio,
    imagenPeak,
    detallesPrimeraRep: {
      inicio: {
        tiempo: frameInicio.tiempo.toFixed(2),
        anguloCodo: frameInicio.anguloCodo.toFixed(1),
        anguloTorso: frameInicio.anguloTorso.toFixed(1),
        anguloAlineacion: frameInicio.anguloAlineacion.toFixed(1)
      },
      peak: {
        tiempo: framePeak.tiempo.toFixed(2),
        anguloCodo: framePeak.anguloCodo.toFixed(1),
        anguloTorso: framePeak.anguloTorso.toFixed(1),
        anguloAlineacion: framePeak.anguloAlineacion.toFixed(1)
      },
      cambioTorso: cambioTorso.toFixed(1),
      amplitud: primeraRep.amplitud.toFixed(3)
    }
  };
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
  
  // 1. INICIO: Buscar el punto donde la cadera está MÁS BAJA (máximo Y) en TODO el video
  const posicionesCadera = frames.map(f => f.posicionCadera);
  const maxCaderaY = Math.max(...posicionesCadera);
  
  const frameInicio = frames.find(f => f.posicionCadera === maxCaderaY);
  const indiceInicio = frames.indexOf(frameInicio);
  
  console.log(`  - INICIO encontrado (cadera más baja): índice=${indiceInicio}, t=${frameInicio.tiempo.toFixed(2)}s`);
  console.log(`    - Cadera Y=${frameInicio.posicionCadera.toFixed(3)} (más baja)`);
  console.log(`    - Hombro Y=${frameInicio.posicionHombro.toFixed(3)}`);
  console.log(`    - Torso: ${frameInicio.anguloTorso.toFixed(1)}°`);
  
  // VALIDACIONES DE SEGURIDAD CRÍTICAS
  const hombroMasBajoQueCadera = frameInicio.posicionHombro > frameInicio.posicionCadera;
  const anguloTorsoNegativo = frameInicio.anguloTorso < 0; // Ángulo negativo = posición invertida
  const torsoMuyHorizontal = frameInicio.anguloTorso >= 0 && frameInicio.anguloTorso < 20;
  
  if (anguloTorsoNegativo || hombroMasBajoQueCadera) {
    console.log(`⚠️ 🔴 PELIGRO EXTREMO! Hombro más bajo que cadera - Ángulo torso: ${frameInicio.anguloTorso.toFixed(1)}° (NEGATIVO = invertido)`);
  }
  
  if (torsoMuyHorizontal) {
    console.log(`⚠️ ¡RIESGO MUY ALTO! Torso casi horizontal (${frameInicio.anguloTorso.toFixed(1)}° < 20°)`);
  }
  
  // 2. LOCKOUT: Buscar frame donde HOMBROS estén más altos (lockout real en peso muerto)
  let framesPosteriores = frames.slice(indiceInicio + 1);
  
  if (framesPosteriores.length === 0) {
    console.log('⚠️ No hay frames posteriores al inicio');
    return [];
  }
  
  // Buscar frame con HOMBROS más altos (menor Y)
  const posicionesHombroPost = framesPosteriores.map(f => f.posicionHombro);
  const minHombroY = Math.min(...posicionesHombroPost);
  
  const frameLockout = framesPosteriores.find(f => f.posicionHombro === minHombroY);
  const indiceLockout = frames.indexOf(frameLockout);
  
  console.log(`\n  - LOCKOUT encontrado (hombros más altos): índice=${indiceLockout}, t=${frameLockout.tiempo.toFixed(2)}s`);
  console.log(`    - Hombro Y=${frameLockout.posicionHombro.toFixed(3)} (más alto)`);
  console.log(`    - Cadera Y=${frameLockout.posicionCadera.toFixed(3)}`);
  console.log(`    - Torso: ${frameLockout.anguloTorso.toFixed(1)}°`);
  console.log(`  - Movimiento de cadera: ${frameInicio.posicionCadera.toFixed(3)} → ${frameLockout.posicionCadera.toFixed(3)} (subió ${(frameInicio.posicionCadera - frameLockout.posicionCadera).toFixed(3)})`);
  console.log(`  - Movimiento de hombros: ${frameInicio.posicionHombro.toFixed(3)} → ${frameLockout.posicionHombro.toFixed(3)} (subió ${(frameInicio.posicionHombro - frameLockout.posicionHombro).toFixed(3)})`);
  console.log(`  - Cambio de torso: ${frameInicio.anguloTorso.toFixed(1)}° → ${frameLockout.anguloTorso.toFixed(1)}° (${frameLockout.anguloTorso > frameInicio.anguloTorso ? 'enderezó' : 'inclinó'} ${(frameLockout.anguloTorso - frameInicio.anguloTorso).toFixed(1)}°)`);
  
  // Calcular amplitud del movimiento
  const amplitudCadera = frameInicio.posicionCadera - frameLockout.posicionCadera;
  const amplitudHombros = frameInicio.posicionHombro - frameLockout.posicionHombro;
  
  console.log(`  - Amplitud cadera: ${amplitudCadera.toFixed(3)}`);
  console.log(`  - Amplitud hombros: ${amplitudHombros.toFixed(3)}`);
  
  // Validar que hay movimiento significativo (reducido a 0.02 para detectar técnicas malas)
  if (amplitudHombros < 0.02) {
    console.log('⚠️ Movimiento insuficiente de hombros');
    return [];
  }
  
  // Crear una repetición con los frames detectados
  const repeticion = {
    numero: 1,
    frameInicio: frameInicio,
    frameLockout: frameLockout,
    amplitud: Math.max(amplitudCadera, amplitudHombros),
    tiempoInicio: frameInicio.tiempo,
    tiempoLockout: frameLockout.tiempo,
    duracion: Math.abs(frameLockout.tiempo - frameInicio.tiempo),
    // Advertencias de seguridad
    alertasSeguridad: {
      hombroMasBajoQueCadera: hombroMasBajoQueCadera,
      anguloTorsoNegativo: anguloTorsoNegativo,
      torsoMuyHorizontal: torsoMuyHorizontal,
      anguloTorsoInicio: frameInicio.anguloTorso
    }
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

  // No generar feedback aquí - el LLM lo hará en el backend

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
    },
    // Agregar datos para el LLM
    framesCompletos: frames.map((frame, idx) => ({
      indice: idx,
      tiempo: frame.tiempo,
      anguloRodilla: frame.anguloRodilla,
      anguloTorso: frame.anguloTorso,
      anguloAlineacion: frame.anguloAlineacion,
      caderaY: frame.posicionCadera,
      rodillaY: frame.posicionRodilla,
      munecaY: frame.posicionMuneca
    })),
    framesClave: {
      inicio: {
        indice: frameInicio.frameIndex,
        tiempo: frameInicio.tiempo,
        anguloRodilla: frameInicio.anguloRodilla,
        anguloTorso: frameInicio.anguloTorso,
        anguloAlineacion: frameInicio.anguloAlineacion,
        caderaY: frameInicio.posicionCadera,
        hombroY: frameInicio.posicionHombro,
        // Alertas críticas de seguridad
        alertasSeguridad: repeticiones[0].alertasSeguridad
      },
      peak: {
        indice: frameLockout.frameIndex,
        tiempo: frameLockout.tiempo,
        anguloRodilla: frameLockout.anguloRodilla,
        anguloTorso: frameLockout.anguloTorso,
        anguloAlineacion: frameLockout.anguloAlineacion,
        caderaY: frameLockout.posicionCadera,
        hombroY: frameLockout.posicionHombro
      }
    },
    metricas: {
      duracion: Math.round(duracion),
      repeticiones: repeticiones.length,
      cambioTorso: frameLockout.anguloTorso - frameInicio.anguloTorso,
      cambioRodilla: frameLockout.anguloRodilla - frameInicio.anguloRodilla,
      amplitudCadera: Math.abs(frameLockout.posicionCadera - frameInicio.posicionCadera)
    }
  };
}

/**
 * Analizar resultados de press de hombros
 */
async function analizarResultadosPressHombro(frames, landmarksFrames, duracion, video, canvas, ctx) {
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
      imagenLockout: null
    };
  }
  
  // Detectar repeticiones
  const repeticiones = detectarRepeticionesPressHombro(frames);
  
  if (repeticiones.length === 0) {
    return {
      esCorrecta: false,
      feedback: [
        "❌ No se detectaron repeticiones válidas de press de hombros.",
        "📹 Asegúrate de:",
        "• Realizar el movimiento completo (desde hombros hasta brazos extendidos)",
        "• Mantener tu cuerpo completo visible durante todo el ejercicio",
        "• Grabar completamente de perfil",
        "💡 Consejo: El movimiento debe tener suficiente rango (bajar la barra a hombros y extender completamente)"
      ],
      duracion: Math.round(duracion),
      repeticionesDetectadas: 0,
      repeticiones: [],
      imagenLockout: null
    };
  }
  
  // Tomar la primera repetición para análisis de técnica
  const primeraRep = repeticiones[0];
  const frameInicio = primeraRep.frameInicio;
  const frameLockout = primeraRep.frameLockout;
  
  console.log(`📊 Analizando repetición 1:`);
  console.log(`  - Inicio: ${frameInicio.tiempo.toFixed(2)}s, Muñeca Y=${frameInicio.posicionMuneca.toFixed(3)}`);
  console.log(`  - Lockout: ${frameLockout.tiempo.toFixed(2)}s, Muñeca Y=${frameLockout.posicionMuneca.toFixed(3)}`);
  console.log(`  - Amplitud: ${primeraRep.amplitud.toFixed(3)}, Duración: ${primeraRep.duracion.toFixed(2)}s`);
  
  // Generar imagen visualizada SOLO para lockout
  let imagenLockout = null;
  
  try {
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
  
  // No generar feedback aquí - el LLM lo hará en el backend
  
  // Calcular algunas métricas para enviar al LLM
  const alineacionLockout = frameLockout.anguloAlineacion;
  console.log(`  - Alineación tobillo-cadera-hombro en lockout: ${alineacionLockout.toFixed(1)}°`);

  const cambioTorso = frameLockout.anguloTorso - frameInicio.anguloTorso;
  
  // Preparar información de todas las repeticiones
  const repeticionesInfo = repeticiones.map(rep => ({
    numero: rep.numero,
    tiempoInicio: rep.tiempoInicio.toFixed(2),
    tiempoLockout: rep.tiempoLockout.toFixed(2),
    duracion: rep.duracion.toFixed(2),
    anguloCodoInicio: rep.frameInicio.anguloCodo.toFixed(1),
    anguloCodoLockout: rep.frameLockout.anguloCodo.toFixed(1),
    anguloTorsoInicio: rep.frameInicio.anguloTorso.toFixed(1),
    anguloTorsoLockout: rep.frameLockout.anguloTorso.toFixed(1),
    desviacionX: rep.desviacionX.toFixed(3)
  }));
  
  return {
    duracion: Math.round(duracion),
    repeticionesDetectadas: repeticiones.length,
    repeticiones: repeticionesInfo,
    imagenLockout,
    detallesPrimeraRep: {
      inicio: {
        tiempo: frameInicio.tiempo.toFixed(2),
        anguloCodo: frameInicio.anguloCodo.toFixed(1),
        anguloTorso: frameInicio.anguloTorso.toFixed(1),
        anguloAlineacion: frameInicio.anguloAlineacion.toFixed(1)
      },
      lockout: {
        tiempo: frameLockout.tiempo.toFixed(2),
        anguloCodo: frameLockout.anguloCodo.toFixed(1),
        anguloTorso: frameLockout.anguloTorso.toFixed(1),
        anguloAlineacion: frameLockout.anguloAlineacion.toFixed(1)
      },
      cambioTorso: cambioTorso.toFixed(1),
      desviacionX: primeraRep.desviacionX.toFixed(3),
      alineacionLockout: alineacionLockout.toFixed(1)
    },
    // Datos para el LLM
    framesCompletos: frames.map((frame, idx) => ({
      indice: idx,
      tiempo: frame.tiempo,
      anguloCodo: frame.anguloCodo,
      anguloTorso: frame.anguloTorso,
      anguloAlineacion: frame.anguloAlineacion,
      posicionMuneca: frame.posicionMuneca,
      posicionCodo: frame.posicionCodo,
      posicionHombro: frame.posicionHombro
    })),
    framesClave: {
      inicio: {
        indice: frameInicio.frameIndex,
        tiempo: frameInicio.tiempo,
        anguloCodo: frameInicio.anguloCodo,
        anguloTorso: frameInicio.anguloTorso,
        anguloAlineacion: frameInicio.anguloAlineacion,
        posicionMuneca: frameInicio.posicionMuneca
      },
      peak: {
        indice: frameLockout.frameIndex,
        tiempo: frameLockout.tiempo,
        anguloCodo: frameLockout.anguloCodo,
        anguloTorso: frameLockout.anguloTorso,
        anguloAlineacion: frameLockout.anguloAlineacion,
        posicionMuneca: frameLockout.posicionMuneca
      }
    },
    metricas: {
      duracion: Math.round(duracion),
      repeticiones: repeticiones.length,
      cambioTorso: cambioTorso,
      desviacionX: primeraRep.desviacionX,
      amplitud: primeraRep.amplitud
    }
  };
}