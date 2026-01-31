const mongoose = require('mongoose');

const wodCrossFitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombreWod: {
    type: String,
    required: true,
    enum: ['Fran', 'Isabel', 'Grace', 'Randy', 'Diane', 'Elizabeth', 'Linda', 'King Kong', 'DT', 'Bear Complex']
  },
  nivel: {
    type: String,
    required: true,
    enum: ['rx', 'intermedio', 'escalado']
  },
  tiempo: {
    type: Number, // tiempo en segundos
    required: true,
    min: 0
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  notas: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

module.exports = mongoose.model('WodCrossFit', wodCrossFitSchema);
