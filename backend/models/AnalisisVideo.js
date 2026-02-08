const mongoose = require("mongoose");

const analisisVideoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ejercicio: {
      type: String,
      required: true,
      enum: ["sentadilla", "press-hombros", "peso-muerto", "flexiones", "dominadas"],
    },
    videoUrl: {
      type: String,
      required: true,
    },
    esCorrecta: {
      type: Boolean,
      required: true,
    },
    angulos: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // Cambiar a Mixed para soportar números y otros valores
    },
    rompioParalelo: {
      type: Boolean,
    },
    feedback: [{
      type: String,
    }],
    coordenadas: {
      type: mongoose.Schema.Types.Mixed,
    },
    duracion: {
      type: Number, // duración en segundos
    },
    repeticionesDetectadas: {
      type: Number,
    },
    fechaAnalisis: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar las consultas
analisisVideoSchema.index({ usuario: 1, fechaAnalisis: -1 });
analisisVideoSchema.index({ ejercicio: 1 });

module.exports = mongoose.model("AnalisisVideo", analisisVideoSchema);
