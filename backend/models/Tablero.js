const mongoose = require("mongoose");

const tableroSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contribuyentes: [{ 
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    email: { type: String, required: true }, // 📌 Se añade el correo
    rol: { type: String, enum: ["lectura", "edicion"], required: true } 
  }],
  createdAt: { type: Date, default: Date.now },
});

const Tablero = mongoose.model("Board", tableroSchema);
module.exports = Tablero;
