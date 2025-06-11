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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // 📌 Ya no es obligatorio
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true } // 📌 Se mantiene obligatorio
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
