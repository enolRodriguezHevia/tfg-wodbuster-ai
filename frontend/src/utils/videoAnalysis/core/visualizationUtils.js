/**
 * Dibujar landmarks y conexiones en un canvas
 */
export function dibujarLandmarks(ctx, landmarks, videoWidth, videoHeight) {
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
 * Generar imagen con landmarks dibujados
 */
export async function generarImagenConLandmarks(video, frameData, ctx, canvas, label) {
  video.currentTime = frameData.tiempo;
  await new Promise((resolve) => { video.onseeked = resolve; });
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  dibujarLandmarks(ctx, frameData.landmarks, canvas.width, canvas.height);
  
  // Agregar etiqueta
  ctx.fillStyle = '#00FF00';
  ctx.font = 'bold 30px Arial';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeText(label, 20, 50);
  ctx.fillText(label, 20, 50);
  
  return canvas.toDataURL('image/jpeg', 0.9);
}
