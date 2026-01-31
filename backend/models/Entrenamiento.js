const mongoose = require('mongoose');

const entrenamientoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  volumenTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  ejercicios: [{
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
  }]
}, { timestamps: true });

// Middleware para calcular volumen total antes de guardar
entrenamientoSchema.pre('save', function() {
  if (this.ejercicios && this.ejercicios.length > 0) {
    this.volumenTotal = this.ejercicios.reduce((total, ejercicio) => {
      return total + (ejercicio.peso * ejercicio.repeticiones * ejercicio.series);
    }, 0);
  }
});

module.exports = mongoose.model('Entrenamiento', entrenamientoSchema);
