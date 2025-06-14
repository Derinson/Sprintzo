const express = require('express');
const router = express.Router();
const Card = require('../models/Card');

// Crear una nueva tarjeta vinculada a un tablero
router.post('/', async (req, res) => {
    const { title, responsible, description, column, boardId, checklist, labels } = req.body;

    try {
        if (!boardId) {
            return res.status(400).json({ error: "Se requiere el ID del tablero" });
        }

        if (!Array.isArray(responsible)) {
            return res.status(400).json({ error: "El campo responsible debe ser un array" });
        }

        if (checklist && !Array.isArray(checklist)) {
            return res.status(400).json({ error: "El campo checklist debe ser un array" });
        }

        if (labels && !Array.isArray(labels)) {
            return res.status(400).json({ error: "El campo labels debe ser un array" });
        }

        const newCard = new Card({ 
            title, 
            responsible, 
            description, 
            column, 
            boardId,
            checklist: checklist || [],
            labels: labels || []
        });
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
        const { archived } = req.query; // Obtener el parámetro de consulta
        const query = { boardId: req.params.boardId };
        
        // Si se especifica archived, filtrar por ese valor
        if (archived !== undefined) {
            query.archived = archived === 'true';
        } else {
            // Por defecto, mostrar solo las tarjetas no archivadas
            query.archived = false;
        }
        
        const cards = await Card.find(query);
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
    const { title, responsible, description, column, checklist, labels } = req.body;
    try {
        if (responsible && !Array.isArray(responsible)) {
            return res.status(400).json({ error: "El campo responsible debe ser un array" });
        }

        if (checklist && !Array.isArray(checklist)) {
            return res.status(400).json({ error: "El campo checklist debe ser un array" });
        }

        if (labels && !Array.isArray(labels)) {
            return res.status(400).json({ error: "El campo labels debe ser un array" });
        }

        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            { 
                ...(title && { title }),
                ...(responsible && { responsible }),
                ...(description && { description }),
                ...(column && { column }),
                ...(checklist && { checklist }),
                ...(labels && { labels })
            },
            { new: true }
        );
        if (!updatedCard) return res.status(404).json({ error: "Tarjeta no encontrada" });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar la tarjeta" });
    }
});

// Archivar una tarjeta
router.put('/:id/archive', async (req, res) => {
    try {
        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            { 
                archived: true,
                archivedAt: new Date()
            },
            { new: true }
        );
        if (!updatedCard) return res.status(404).json({ error: "Tarjeta no encontrada" });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: "Error al archivar la tarjeta" });
    }
});

// Desarchivar una tarjeta
router.put('/:id/unarchive', async (req, res) => {
    try {
        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            { 
                archived: false,
                archivedAt: null
            },
            { new: true }
        );
        if (!updatedCard) return res.status(404).json({ error: "Tarjeta no encontrada" });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: "Error al desarchivar la tarjeta" });
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

// 📌 Duplicar una tarjeta
router.post('/duplicate/:id', async (req, res) => {
    try {
        const originalCard = await Card.findById(req.params.id);
        if (!originalCard) {
            return res.status(404).json({ error: "Tarjeta original no encontrada" });
        }

        // Crear una nueva tarjeta con los mismos datos
        const duplicatedCard = new Card({
            title: originalCard.title + " (Copy)",
            responsible: originalCard.responsible,
            description: originalCard.description,
            column: originalCard.column,
            boardId: originalCard.boardId,
            checklist: originalCard.checklist || [],
            labels: originalCard.labels || []
        });

        await duplicatedCard.save();
        res.status(201).json({ message: "Tarjeta duplicada exitosamente", card: duplicatedCard });

    } catch (error) {
        console.error("❌ Error al duplicar la tarjeta:", error);
        res.status(500).json({ error: "Error al duplicar la tarjeta" });
    }
});

module.exports = router;

