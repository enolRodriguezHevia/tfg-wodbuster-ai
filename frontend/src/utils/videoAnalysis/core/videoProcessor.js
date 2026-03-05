/**
 * Crear y preparar elemento de video para análisis
 */
export async function prepararVideo(videoFile) {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  video.muted = true;
  
  await new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });
  
  return video;
}

/**
 * Crear canvas para visualización
 */
export function crearCanvas(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  
  return { canvas, ctx };
}

/**
 * Procesar frames de video genéricamente
 */
export async function procesarFrames(video, detector, procesarFrame, fps = 10, maxFrames = 300) {
  const duracion = video.duration;
  const frameInterval = 1 / fps;
  const resultadosFrames = [];
  const landmarksFrames = [];
  let frameCount = 0;
  
  for (let tiempo = 0; tiempo < duracion; tiempo += frameInterval) {
    video.currentTime = tiempo;
    
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });
    
    const resultados = detector.detectForVideo(video, performance.now());
    
    if (resultados.landmarks && resultados.landmarks.length > 0) {
      const landmarks = resultados.landmarks[0];
      
      // Procesar frame con función personalizada
      const datosFrame = procesarFrame(landmarks, tiempo, resultadosFrames.length);
      
      if (datosFrame) {
        resultadosFrames.push(datosFrame);
        
        landmarksFrames.push({
          landmarks,
          tiempo,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      }
      
      frameCount++;
    }
    
    if (frameCount >= maxFrames) break;
  }
    
  return { resultadosFrames, landmarksFrames, duracion };
}

/**
 * Generar respuesta de error estándar
 */
export function generarRespuestaError(duracion, tipoDeError = 'pose') {
  const mensajes = {
    pose: {
      feedback: [
        "❌ No se pudo detectar la pose en el video.",
        "📹 Asegúrate de grabar:",
        "• Completamente de LADO (perfil, no de frente)",
        "• Tu cuerpo COMPLETO visible (cabeza a pies)",
        "• Buena iluminación",
        "• Cámara estable y a altura media"
      ]
    },
    repeticiones: {
      feedback: [
        "❌ No se detectaron repeticiones válidas.",
        "📹 Asegúrate de:",
        "• Realizar el movimiento completo",
        "• Mantener tu cuerpo completo visible durante todo el ejercicio",
        "• Grabar completamente de perfil",
        "💡 Consejo: El movimiento debe tener suficiente rango"
      ]
    }
  };
  
  const mensaje = mensajes[tipoDeError] || mensajes.pose;
  
  return {
    esCorrecta: false,
    feedback: mensaje.feedback,
    repeticiones: []
  };
}
