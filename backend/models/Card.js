const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    title: { type: String, required: true }, // 📌 Ahora cada tarjeta tiene un título obligatorio
    responsible: [{ type: String, required: true }], // Modificado para ser un array de strings
    description: { type: String, required: true },
    column: { type: String, required: true },
    checklist: [{
        text: { type: String, required: true },
        completed: { type: Boolean, default: false }
    }],
    labels: [{ type: String }], // Array de etiquetas (opcional)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // 📌 Ya no es obligatorio
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true }, // 📌 Se mantiene obligatorio
    archived: { type: Boolean, default: false }, // Campo para indicar si la tarjeta está archivada
    archivedAt: { type: Date }, // Fecha en que se archivó la tarjeta
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }]


}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
