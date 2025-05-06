const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Importar jsonwebtoken


const User = require("../models/userModel");
require("dotenv").config(); // Para cargar las variables de entorno

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "10d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      username: user.username // Agregar el nombre del usuario en la respuesta
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});


router.post("/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Please provide an email, username, and password." });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const message = existingUser.email === email
        ? "Email already exists."
        : "Username already exists.";
      return res.status(409).json({ message });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Error during registration:", err);
    return res.status(500).json({ message: "Server error. Could not register user." });
  }
});


// Endpoint para obtener el username del usuario autenticado
router.get("/get-username", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extraer el token del header

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ username: user.username });
  } catch (err) {
    console.error("Error while fetching username:", err);
    return res.status(400).json({ message: "Invalid token." });
  }
});


router.get("/get-user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extraer el token del header

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

    // Encuentra al usuario por su ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Retorna los datos del usuario (excepto la contraseña por seguridad)
    return res.status(200).json({
      email: user.email,
      username: user.username,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(400).json({ message: "Invalid token." });
  }
});

// Endpoint para editar los datos del usuario
router.put("/edit-user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

    // Buscar al usuario por ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Actualizar los campos del usuario si están presentes en el body
    const { email, username, password } = req.body;

    if (email) user.email = email;
    if (username) user.username = username;
    if (password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds); // Hash de la nueva contraseña
    }

    // Guardar los cambios
    await user.save();
    return res.status(200).json({ message: "User updated successfully!" });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ message: "Server error. Could not update user." });
  }
});

module.exports = router;
