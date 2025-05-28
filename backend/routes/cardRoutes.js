const express = require('express');
const router = express.Router();
const Card = require('../models/Card');

// Crear una nueva tarjeta vinculada a un tablero
router.post('/', async (req, res) => {
    const { title, responsible, description, column, boardId } = req.body;

    try {
        if (!boardId) {
            return res.status(400).json({ error: "Se requiere el ID del tablero" });
        }

        // Validar que responsible sea un array
        if (!Array.isArray(responsible)) {
            return res.status(400).json({ error: "El campo responsible debe ser un array" });
        }

        const newCard = new Card({ title, responsible, description, column, boardId });
        await newCard.save();
        res.status(201).json({ message: "Tarjeta creada exitosamente", card: newCard });
    } catch (error) {
        console.error("❌ Error al crear la tarjeta:", error);
        res.status(500).json({ error: "Error al guardar la tarjeta en la base de datos" });
    }
});

// Obtener tarjetas de un tablero específico
router.get('/board/:boardId', async (req, res) => {
    try {
        const cards = await Card.find({ boardId: req.params.boardId });
        res.status(200).json(cards);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las tarjetas" });
    }
});

// Obtener una tarjeta específica por ID
router.get('/:id', async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ error: "Tarjeta no encontrada" });
        }
        res.status(200).json(card);
    } catch (error) {
        console.error("❌ Error al obtener la tarjeta:", error);
        res.status(500).json({ error: "Error al obtener la tarjeta de la base de datos" });
    }
});

// Actualizar una tarjeta
router.put('/:id', async (req, res) => {
    const { title, responsible, description, column } = req.body;
    try {
        // Validar que responsible sea un array
        if (responsible && !Array.isArray(responsible)) {
            return res.status(400).json({ error: "El campo responsible debe ser un array" });
        }

        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            { 
                ...(title && { title }),
                ...(responsible && { responsible }),
                ...(description && { description }),
                ...(column && { column })
            },
            { new: true }
        );
        if (!updatedCard) return res.status(404).json({ error: "Tarjeta no encontrada" });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar la tarjeta" });
    }
});

// Eliminar una tarjeta
router.delete('/:id', async (req, res) => {
    try {
        const deletedCard = await Card.findByIdAndDelete(req.params.id);
        if (!deletedCard) return res.status(404).json({ error: "Tarjeta no encontrada" });
        res.json({ message: "Tarjeta eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la tarjeta" });
    }
});

module.exports = router;
