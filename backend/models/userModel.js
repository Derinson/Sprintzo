const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Correo único
  username: { type: String, required: true, unique: true }, // Nombre de usuario único
  password: { type: String, required: true },
});

module.exports = mongoose.model("User", userSchema);
