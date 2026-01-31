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
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  series: {
    type: Number,
    required: true,
    min: 1
  },
  repeticiones: {
    type: Number,
    required: true,
    min: 1
  },
  peso: {
    type: Number,
    required: true,
    min: 0
  },
  valoracion: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }
}, { timestamps: true });

module.exports = mongoose.model('Ejercicio', ejercicioSchema);
