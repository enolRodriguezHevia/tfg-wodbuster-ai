const mongoose = require('mongoose');

const oneRMSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombreEjercicio: {
    type: String,
    required: true,
    trim: true
  },
  peso: {
    type: Number,
    required: true,
    min: 0
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { timestamps: true });

// Índice compuesto para mejorar consultas por usuario y ejercicio
oneRMSchema.index({ userId: 1, nombreEjercicio: 1, fecha: -1 });

module.exports = mongoose.model('OneRM', oneRMSchema);
