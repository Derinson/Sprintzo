const express = require("express");
const jwt = require("jsonwebtoken");
const Tablero = require("../models/Tablero");
const User = require("../models/userModel");
const router = express.Router();

// 📌 **Middleware para validar el token**
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "🚨 No hay token de autenticación" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "🚨 Token inválido" });
  }
};

// 📌 **Crear un tablero asignado al usuario autenticado**
router.post("/", verifyToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ message: "🚨 El nombre del tablero es obligatorio." });

    const nuevoTablero = new Tablero({
      nombre,
      creadoPor: req.user.id,
      contribuyentes: [],
    });

    await nuevoTablero.save();
    res.status(201).json({ message: "✅ Tablero creado exitosamente", tablero: nuevoTablero });
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al crear el tablero", error });
  }
});

// 📌 **Añadir contribuyente con validación de existencia**
router.post("/contribuyente/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, rol } = req.body;

    if (!["lectura", "edicion"].includes(rol)) {
      return res.status(400).json({ message: "🚨 Rol inválido. Debe ser 'lectura' o 'edicion'" });
    }

    const tablero = await Tablero.findById(id);
    if (!tablero) return res.status(404).json({ message: "🚨 Tablero no encontrado" });

    if (tablero.creadoPor.toString() !== req.user.id) {
      return res.status(403).json({ message: "🚨 No tienes permiso para agregar contribuyentes" });
    }

    const usuario = await User.findOne({ email });
    if (!usuario) return res.status(404).json({ message: "🚨 Usuario no encontrado" });

    // 📌 Verificar si el usuario ya está contribuyendo
    if (tablero.contribuyentes.some(c => c.usuario.toString() === usuario._id.toString())) {
      return res.status(400).json({ message: "🚨 Este usuario ya está contribuyendo en el tablero" });
    }

    // Si el usuario no está, agregarlo
    
    // 📌 Se guarda el correo junto con el usuario y el rol
    tablero.contribuyentes.push({ email, usuario: req.user.id, rol });
    await tablero.save();

    res.json({ message: `✅ Contribuyente ${email} agregado con rol ${rol}`, tablero });
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al agregar contribuyente", error });
  }
});


router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contribuyente, rol } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "🚨 El nuevo nombre es obligatorio" });
    }

    const tablero = await Tablero.findById(id);
    if (!tablero) {
      return res.status(404).json({ message: "🚨 Tablero no encontrado" });
    }

    if (tablero.creadoPor.toString() !== req.user.id) {
      return res.status(403).json({ message: "🚨 No tienes permiso para editar este tablero" });
    }

    tablero.nombre = nombre;

    if (contribuyente && rol) {
      const contribuyenteIndex = tablero.contribuyentes.findIndex(c => c.email.toString() === contribuyente);
      if (contribuyenteIndex !== -1) {
        tablero.contribuyentes[contribuyenteIndex].rol = rol;
      }
    }

    await tablero.save();

    res.json({ message: "✅ Tablero actualizado exitosamente", tablero });
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al actualizar el tablero", error });
  }
});



// 📌 **Obtener tableros creados por el usuario autenticado**
router.get("/", verifyToken, async (req, res) => {
  try {
    const tableros = await Tablero.find({ creadoPor: req.user.id });
    res.status(200).json(tableros);
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al obtener los tableros", error });
  }
});

// 📌 **Obtener tableros compartidos con el usuario autenticado**
router.get("/compartidos", verifyToken, async (req, res) => {
  try {
    const tableros = await Tablero.find({ "contribuyentes.usuario": req.user.id });
    res.status(200).json(tableros);
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al obtener tableros compartidos", error });
  }
});

// 📌 **Eliminar un tablero**
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el tablero por ID
    const tablero = await Tablero.findById(id);
    if (!tablero) return res.status(404).json({ message: "🚨 Tablero no encontrado" });

    // Verificar que el usuario autenticado sea el creador del tablero
    if (tablero.creadoPor.toString() !== req.user.id) {
      return res.status(403).json({ message: "🚨 No tienes permiso para eliminar este tablero" });
    }

    // Eliminar el tablero
    await Tablero.findByIdAndDelete(id);
    res.json({ message: "✅ Tablero eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al eliminar el tablero", error });
  }
});



module.exports = router;
