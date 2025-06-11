const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
    name: { type: String, required: true }, // 📌 Ahora cada lista tiene un título obligatorio
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // 📌 Ya no es obligatorio
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true } // 📌 Se mantiene obligatorio
}, { timestamps: true });

module.exports = mongoose.model('List', listSchema);
module.exports = List;
