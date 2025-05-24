const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    responsible: { type: String, required: true },
    description: { type: String, required: true },
    column: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // 📌 Ya no es obligatorio
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true } // 📌 Se mantiene obligatorio
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
