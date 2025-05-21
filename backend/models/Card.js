const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  responsible: { type: String, required: true },
  description: { type: String, required: true },
  column: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Card', cardSchema);
