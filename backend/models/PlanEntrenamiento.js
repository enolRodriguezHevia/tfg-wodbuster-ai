const mongoose = require('mongoose');

const planEntrenamientoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  titulo: {
    type: String,
    default: 'Plan de Entrenamiento Personalizado'
  },
  contenido: {
    type: String,
    required: true
  },
  promptGenerado: {
    type: String,
    required: true
  },
  fechaGeneracion: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Índice para facilitar consultas por usuario y fecha
planEntrenamientoSchema.index({ userId: 1, fechaGeneracion: -1 });

module.exports = mongoose.model('PlanEntrenamiento', planEntrenamientoSchema);
