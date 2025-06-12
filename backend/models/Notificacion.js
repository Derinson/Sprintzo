const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  leida: {
    type: Boolean,
    default: false
  },
  tablero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: false
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento de las consultas
notificacionSchema.index({ usuario: 1, createdAt: -1 });
notificacionSchema.index({ leida: 1 });

const Notificacion = mongoose.model('Notificacion', notificacionSchema);

module.exports = Notificacion; 