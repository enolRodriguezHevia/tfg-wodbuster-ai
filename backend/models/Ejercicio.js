const mongoose = require('mongoose');

const ejercicioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entrenamientoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entrenamiento',
    default: null
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  series: {
    type: Number,
    min: 0
  },
  repeticiones: {
    type: Number,
    min: 0
  },
  peso: {
    type: Number,
    min: 0
  },
  valoracion: {
    type: Number,
    min: 1,
    max: 10
  }
}, { timestamps: true });

module.exports = mongoose.model('Ejercicio', ejercicioSchema);
