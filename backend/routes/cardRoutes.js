const express = require('express');
const router = express.Router();
const Card = require('../models/Card');

// Crear una nueva tarjeta vinculada a un tablero (sin autenticación)
router.post('/', async (req, res) => {
    const { title, responsible, description, column, boardId } = req.body;

    try {
        if (!boardId) {
            return res.status(400).json({ error: "Board ID is required" });
        }

        const newCard = new Card({ title, responsible, description, column, boardId });
        await newCard.save();
        res.status(201).json({ message: "Card created successfully", card: newCard });
    } catch (error) {
        console.error("❌ Error creating card:", error);
        res.status(500).json({ error: "Error saving card to the database" });
    }
});

// Obtener tarjetas de un tablero específico
router.get('/board/:boardId', async (req, res) => {
    try {
        const cards = await Card.find({ boardId: req.params.boardId });
        res.status(200).json(cards);
    } catch (error) {
        res.status(500).json({ error: "Error fetching cards" });
    }
});

// Actualizar una tarjeta
router.put('/:id', async (req, res) => {
    const { title, responsible, description, column } = req.body;
    try {
        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            { title, responsible, description, column },
            { new: true }
        );
        if (!updatedCard) return res.status(404).json({ error: "Card not found" });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: "Error updating card" });
    }
});

// Eliminar una tarjeta
router.delete('/:id', async (req, res) => {
    try {
        const deletedCard = await Card.findByIdAndDelete(req.params.id);
        if (!deletedCard) return res.status(404).json({ error: "Card not found" });
        res.json({ message: "Card deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting card" });
    }
});

module.exports = router;
