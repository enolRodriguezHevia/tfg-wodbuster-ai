const User = require('../models/User');
const Entrenamiento = require('../models/Entrenamiento');
const Ejercicio = require('../models/Ejercicio');
const OneRM = require('../models/OneRM');
const WodCrossFit = require('../models/WodCrossFit');
const PlanEntrenamiento = require('../models/PlanEntrenamiento');
const fs = require('fs').promises;
const path = require('path');

/**
 * Valida que el usuario tenga información suficiente para generar un plan
 */
const validarInformacionUsuario = (user, entrenamientos, registros1RM) => {
  const camposFaltantes = [];
  
  if (!user.sex || user.sex === 'N/D') {
    camposFaltantes.push('sexo');
  }
  if (!user.age) {
    camposFaltantes.push('edad');
  }
  if (!user.weight) {
    camposFaltantes.push('peso');
  }
  if (!user.height) {
    camposFaltantes.push('altura');
  }
  
  // Verificar si tiene al menos algo de información histórica
  const tieneHistorial = entrenamientos.length > 0 || registros1RM.length > 0;
  
  // Si no tiene ningún dato básico Y no tiene historial, no se puede generar el plan
  if (camposFaltantes.length === 4 && !tieneHistorial) {
    return {
      valido: false,
      mensaje: 'No tienes información suficiente para generar un plan de entrenamiento personalizado.',
      camposFaltantes: [...camposFaltantes, 'entrenamientos o registros de 1RM']
    };
  }
  
  // Si falta algún campo pero tiene historial, advertir pero permitir
  if (camposFaltantes.length > 0) {
    return {
      valido: true,
      advertencia: true,
      mensaje: 'El plan se generará con la información disponible, aunque falta: ' + camposFaltantes.join(', '),
      camposFaltantes
    };
  }
  
  return { valido: true };
};

/**
 * Formatea la información del usuario para el prompt
 */
const formatearInfoUsuario = (user) => {
  let info = [];
  
  if (user.sex && user.sex !== 'N/D') {
    info.push(`- Sexo: ${user.sex}`);
  }
  if (user.age) {
    info.push(`- Edad: ${user.age} años`);
  }
  if (user.weight) {
    info.push(`- Peso: ${user.weight} kg`);
  }
  if (user.height) {
    info.push(`- Altura: ${user.height} cm`);
  }
  
  return info.length > 0 ? info.join('\n') : 'No se ha proporcionado información básica del usuario.';
};

/**
 * Formatea el historial de entrenamientos para el prompt
 */
const formatearHistorialEntrenamientos = async (entrenamientos) => {
  if (entrenamientos.length === 0) {
    return 'El usuario no ha registrado entrenamientos previos.';
  }
  
  // Ordenar por fecha más reciente
  const entrenamientosOrdenados = entrenamientos.sort((a, b) => b.fecha - a.fecha);
  
  // Estadísticas generales
  const totalEntrenamientos = entrenamientos.length;
  const volumenTotal = entrenamientos.reduce((sum, e) => sum + (e.volumenTotal || 0), 0);
  const volumenPromedio = volumenTotal / totalEntrenamientos;
  
  let texto = `El usuario ha registrado ${totalEntrenamientos} entrenamientos.\n`;
  texto += `Volumen total acumulado: ${volumenTotal.toFixed(0)} kg\n`;
  texto += `Volumen promedio por sesión: ${volumenPromedio.toFixed(0)} kg\n\n`;
  
  // Mostrar últimos 10 entrenamientos con ejercicios detallados
  const ultimos = entrenamientosOrdenados.slice(0, 10);
  texto += 'Últimos entrenamientos:\n\n';
  
  for (let i = 0; i < ultimos.length; i++) {
    const entrenamiento = ultimos[i];
    const fecha = new Date(entrenamiento.fecha).toLocaleDateString('es-ES');
    texto += `${i + 1}. Fecha: ${fecha} - Volumen total: ${entrenamiento.volumenTotal || 0} kg\n`;
    
    // Obtener ejercicios de este entrenamiento
    const ejercicios = await Ejercicio.find({ entrenamientoId: entrenamiento._id })
      .sort({ createdAt: 1 });
    
    if (ejercicios.length > 0) {
      texto += '   Ejercicios realizados:\n';
      ejercicios.forEach((ej, idx) => {
        const volumenEjercicio = ej.series * ej.repeticiones * ej.peso;
        texto += `   ${idx + 1}. ${ej.nombre}: ${ej.series}x${ej.repeticiones} @ ${ej.peso}kg`;
        texto += ` (Volumen: ${volumenEjercicio}kg, Valoración: ${ej.valoracion}/10)\n`;
      });
    } else {
      texto += '   Sin ejercicios registrados\n';
    }
    texto += '\n';
  }
  
  return texto;
};

/**
 * Formatea los registros de 1RM para el prompt
 */
const formatearRegistros1RM = (registros) => {
  if (registros.length === 0) {
    return 'El usuario no ha registrado marcas de 1RM (Una Repetición Máxima).';
  }
  
  // Agrupar por ejercicio y obtener el último registro de cada uno
  const registrosPorEjercicio = {};
  
  registros.forEach(r => {
    const ejercicio = r.nombreEjercicio;
    if (!registrosPorEjercicio[ejercicio] || r.fecha > registrosPorEjercicio[ejercicio].fecha) {
      registrosPorEjercicio[ejercicio] = r;
    }
  });
  
  let texto = `El usuario ha registrado 1RM en ${Object.keys(registrosPorEjercicio).length} ejercicios diferentes:\n\n`;
  
  Object.entries(registrosPorEjercicio).forEach(([ejercicio, registro]) => {
    const fecha = new Date(registro.fecha).toLocaleDateString('es-ES');
    texto += `- ${ejercicio}: ${registro.peso} kg (${fecha})\n`;
  });
  
  return texto;
};

/**
 * Formatea los WODs de CrossFit para el prompt
 */
const formatearWodsCrossFit = (wods) => {
  if (wods.length === 0) {
    return 'El usuario no ha registrado WODs de CrossFit.';
  }
  
  // Agrupar por nombre de WOD y obtener mejor tiempo
  const wodsPorNombre = {};
  
  wods.forEach(w => {
    const nombre = w.nombreWod;
    if (!wodsPorNombre[nombre]) {
      wodsPorNombre[nombre] = [];
    }
    wodsPorNombre[nombre].push(w);
  });
  
  let texto = `El usuario ha registrado ${wods.length} WODs de CrossFit en ${Object.keys(wodsPorNombre).length} benchmarks diferentes:\n\n`;
  
  Object.entries(wodsPorNombre).forEach(([nombre, registros]) => {
    // Ordenar por tiempo (menor es mejor)
    registros.sort((a, b) => a.tiempo - b.tiempo);
    const mejor = registros[0];
    
    const minutos = Math.floor(mejor.tiempo / 60);
    const segundos = mejor.tiempo % 60;
    const tiempoFormateado = `${minutos}:${segundos.toString().padStart(2, '0')}`;
    const fecha = new Date(mejor.fecha).toLocaleDateString('es-ES');
    
    texto += `- ${nombre} (${mejor.nivel}): ${tiempoFormateado} (${fecha})`;
    
    if (registros.length > 1) {
      // Mostrar evolución si hay múltiples intentos
      const primerIntento = registros[registros.length - 1];
      const mejora = primerIntento.tiempo - mejor.tiempo;
      const porcentajeMejora = ((mejora / primerIntento.tiempo) * 100).toFixed(1);
      texto += ` - Mejora de ${mejora}s (${porcentajeMejora}%) en ${registros.length} intentos`;
    }
    
    texto += '\n';
  });
  
  return texto;
};

/**
 * Genera el prompt completo para el LLM
 */
const generarPrompt = async (userId) => {
  // Obtener información del usuario
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  // Obtener historial de entrenamientos
  const entrenamientos = await Entrenamiento.find({ userId }).sort({ fecha: -1 });
  
  // Obtener registros de 1RM
  const registros1RM = await OneRM.find({ userId }).sort({ fecha: -1 });
  
  // Obtener WODs de CrossFit
  const wodsCrossFit = await WodCrossFit.find({ userId }).sort({ fecha: -1 });
  
  // Validar información
  const validacion = validarInformacionUsuario(user, entrenamientos, registros1RM);
  if (!validacion.valido) {
    return {
      error: true,
      mensaje: validacion.mensaje,
      camposFaltantes: validacion.camposFaltantes
    };
  }
  
  // Leer template del prompt
  const templatePath = path.join(__dirname, '../config/promptTemplate.txt');
  let template = await fs.readFile(templatePath, 'utf8');
  
  // Formatear datos
  const infoUsuario = formatearInfoUsuario(user);
  const historialEntrenamientos = await formatearHistorialEntrenamientos(entrenamientos);
  const registros1RMTexto = formatearRegistros1RM(registros1RM);
  const wodsCrossFitTexto = formatearWodsCrossFit(wodsCrossFit);
  
  // Reemplazar placeholders
  template = template.replace('{{USER_INFO}}', infoUsuario);
  template = template.replace('{{TRAINING_HISTORY}}', historialEntrenamientos);
  template = template.replace('{{ONE_RM_RECORDS}}', registros1RMTexto);
  template = template.replace('{{CROSSFIT_WODS}}', wodsCrossFitTexto);
  
  return {
    prompt: template,
    advertencia: validacion.advertencia ? validacion.mensaje : null
  };
};

/**
 * Controlador para generar el prompt (por ahora solo devuelve el prompt)
 */
exports.generarPlanEntrenamiento = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Obtener el userId desde el username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const resultado = await generarPrompt(user._id);
    
    if (resultado.error) {
      return res.status(400).json({
        success: false,
        message: resultado.mensaje,
        camposFaltantes: resultado.camposFaltantes
      });
    }
    
    // Guardar el prompt generado en la base de datos
    const nuevoPlan = new PlanEntrenamiento({
      userId: user._id,
      titulo: 'Plan de Entrenamiento Personalizado',
      contenido: 'Prompt generado - pendiente de procesar con LLM',
      promptGenerado: resultado.prompt
    });
    
    await nuevoPlan.save();
    
    // Por ahora, devolvemos el prompt generado para que el usuario lo vea
    res.json({
      success: true,
      message: 'Prompt generado correctamente',
      prompt: resultado.prompt,
      advertencia: resultado.advertencia,
      planId: nuevoPlan._id
    });
    
  } catch (error) {
    console.error('Error al generar prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el plan de entrenamiento',
      error: error.message
    });
  }
};

/**
 * Obtener planes de entrenamiento anteriores del usuario (PEP3.1)
 */
exports.obtenerPlanesAnteriores = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Obtener el userId desde el username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const planes = await PlanEntrenamiento.find({ userId: user._id })
      .sort({ fechaGeneracion: -1 });
    
    res.json({
      success: true,
      planes
    });
    
  } catch (error) {
    console.error('Error al obtener planes anteriores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener planes anteriores',
      error: error.message
    });
  }
};

/**
 * Obtener un plan específico por ID
 */
exports.obtenerPlanPorId = async (req, res) => {
  try {
    const { username, planId } = req.params;
    
    // Obtener el userId desde el username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const plan = await PlanEntrenamiento.findOne({ _id: planId, userId: user._id });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }
    
    res.json({
      success: true,
      plan
    });
    
  } catch (error) {
    console.error('Error al obtener plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el plan',
      error: error.message
    });
  }
};

/**
 * Eliminar un plan de entrenamiento
 */
exports.eliminarPlan = async (req, res) => {
  try {
    const { username, planId } = req.params;
    
    // Obtener el userId desde el username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Buscar y eliminar el plan
    const plan = await PlanEntrenamiento.findOneAndDelete({ _id: planId, userId: user._id });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado o no tienes permiso para eliminarlo'
      });
    }
    
    res.json({
      success: true,
      message: 'Plan eliminado correctamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el plan',
      error: error.message
    });
  }
};

module.exports = exports;
