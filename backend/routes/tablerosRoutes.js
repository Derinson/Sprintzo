const express = require("express");
const jwt = require("jsonwebtoken");
const Tablero = require("../models/Tablero");
const User = require("../models/userModel");
const Card = require("../models/Card");
const Notificacion = require("../models/Notificacion");
const router = express.Router();

// 📌 Middleware de autenticación
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

// 📌 Eliminar un tablero creado por el usuario autenticado
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


// 📌 Obtener los tableros creados por el usuario autenticado
router.get("/", verifyToken, async (req, res) => {
  try {
    const tableros = await Tablero.find({ creadoPor: req.user.id });
    res.status(200).json(tableros);
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al obtener tus tableros", error });
  }
});

// 📌 Crear tablero
router.post("/", verifyToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ message: "🚨 El nombre es obligatorio." });

    // Obtener el email del usuario creador
    const usuario = await User.findById(req.user.id);
    if (!usuario) return res.status(404).json({ message: "🚨 Usuario no encontrado" });

    const nuevoTablero = new Tablero({
      nombre,
      creadoPor: req.user.id,
      contribuyentes: [{
        usuario: req.user.id,
        email: usuario.email,
        rol: "edition"
      }],
    });

    await nuevoTablero.save();
    res.status(201).json({ message: "✅ Tablero creado", tablero: nuevoTablero });
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al crear el tablero", error });
  }
});

// 📌 Agregar contribuyente
router.post("/contribuyente/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, rol } = req.body;

    const tablero = await Tablero.findById(id);
    if (!tablero) return res.status(404).json({ message: "🚨 Tablero no encontrado" });

    const usuario = await User.findOne({ email });
    if (!usuario) return res.status(404).json({ message: "🚨 Usuario no encontrado" });

    // 📌 Verificación para evitar duplicados
    if (tablero.contribuyentes.some(c => c.email === email)) {
      return res.status(400).json({ message: "🚨 Este usuario ya es contribuyente." });
    }

    tablero.contribuyentes.push({ email, usuario: usuario._id, rol });
    await tablero.save();

    // Crear notificación para el nuevo contribuyente
    const creador = await User.findById(tablero.creadoPor);
    const nuevaNotificacion = new Notificacion({
      usuario: usuario._id,
      mensaje: `${creador.email} te ha compartido el tablero "${tablero.nombre}" con rol de ${rol === 'edition' ? 'edición' : 'lectura'}`,
      tipo: 'info',
      tablero: tablero._id
    });
    await nuevaNotificacion.save();

    res.json({ message: `✅ Contribuyente ${email} agregado con rol ${rol}`, tablero });
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al agregar contribuyente", error });
  }
});

// 📌 Obtener tableros compartidos con el usuario
router.get("/compartidos", verifyToken, async (req, res) => {
  try {
    const tableros = await Tablero.find({
      $and: [
        { "contribuyentes.usuario": req.user.id }, // El usuario está en contribuyentes
        { creadoPor: { $ne: req.user.id } }       // El usuario NO es el creador
      ]
    });
    res.status(200).json(tableros);
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al obtener tableros compartidos", error });
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
      const contribuyenteIndex = tablero.contribuyentes.findIndex(c => c.email === contribuyente);
      if (contribuyenteIndex !== -1) {
        const rolAnterior = tablero.contribuyentes[contribuyenteIndex].rol;
        tablero.contribuyentes[contribuyenteIndex].rol = rol;

        // Si el rol cambió, crear una notificación
        if (rolAnterior !== rol) {
          const creador = await User.findById(req.user.id);
          const usuario = await User.findOne({ email: contribuyente });
          
          if (usuario) {
            const nuevaNotificacion = new Notificacion({
              usuario: usuario._id,
              mensaje: `${creador.email} ha cambiado tu rol en el tablero "${tablero.nombre}" a ${rol === 'edition' ? 'edición' : 'lectura'}`,
              tipo: 'info',
              tablero: tablero._id
            });
            await nuevaNotificacion.save();
          }
        }
      }
    }

    await tablero.save();

    res.json({ message: "✅ Tablero actualizado exitosamente", tablero });
  } catch (error) {
    res.status(500).json({ message: "🚨 Error al actualizar el tablero", error });
  }
});

router.get("/:boardId/contribuyentes", async (req, res) => {
  try {
    const tablero = await Tablero.findById(req.params.boardId);
    if (!tablero) return res.status(404).json({ error: "Tablero no encontrado" });

    res.json(tablero.contribuyentes); // 📌 Devolver lista de contribuyentes
  } catch (error) {
    res.status(500).json({ error: "Error al obtener contribuyentes" });
  }
});

router.get("/:boardId/mi-rol", verifyToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id; // 📌 Extraer ID del usuario desde el token

    const tablero = await Tablero.findById(boardId);
    if (!tablero) return res.status(404).json({ error: "Tablero no encontrado" });

    // Verificar si el usuario es el creador del tablero
    if (tablero.creadoPor.toString() === userId) {
      return res.json({ rol: "edition" }); // ✅ El creador tiene permisos de edición
    }

    // Verificar si el usuario es contribuyente
    const contribuyente = tablero.contribuyentes.find(c => c.usuario.toString() === userId);
    if (!contribuyente) {
      return res.json({ rol: "none" }); // 🚨 No tiene acceso al tablero
    }

    // Retornar el rol asignado
    res.json({ rol: contribuyente.rol });

  } catch (error) {
    res.status(500).json({ error: "Error al verificar rol en el tablero" });
  }
});

// 📌 Obtener tableros con tarjetas archivadas
router.get("/with-archived", verifyToken, async (req, res) => {
  try {
    // Primero obtenemos todos los tableros del usuario (creados y compartidos)
    const tableros = await Tablero.find({
      $or: [
        { creadoPor: req.user.id },
        { "contribuyentes.usuario": req.user.id }
      ]
    });

    // Obtenemos las tarjetas archivadas para cada tablero
    const boardsWithArchived = await Promise.all(
      tableros.map(async (tablero) => {
        const archivedCards = await Card.find({
          boardId: tablero._id,
          archived: true
        });

        if (archivedCards.length > 0) {
          // Si el tablero tiene tarjetas archivadas, lo incluimos con información adicional
          return {
            _id: tablero._id,
            name: tablero.nombre,
            description: tablero.descripcion || "Sin descripción",
            archivedCount: archivedCards.length,
            lastArchivedDate: Math.max(...archivedCards.map(card => new Date(card.archivedAt)))
          };
        }
        return null;
      })
    );

    // Filtramos los tableros que no tienen tarjetas archivadas
    const filteredBoards = boardsWithArchived.filter(board => board !== null);

    res.json({
      count: filteredBoards.length,
      boards: filteredBoards
    });
  } catch (error) {
    console.error("Error al obtener tableros con archivados:", error);
    res.status(500).json({ message: "🚨 Error al obtener tableros con archivados", error });
  }
});

module.exports = router;
