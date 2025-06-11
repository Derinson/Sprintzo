const express = require("express");
const router = express.Router();

const List = require("../models/List");

// Crear una nueva lista vinculada a un tablero
router.post('/', async (req, res) => {
    const { name, boardId } = req.body;

    try {
        if (!boardId) {
            return res.status(400).json({ error: "Se requiere el ID del tablero" });
        }

        const newList = new List({ name, boardId });
        await newList.save();
        res.status(201).json({ message: "Lista creada exitosamente", list: newList });
    } catch (error) {
        console.error("❌ Error al crear la lista:", error);
        res.status(500).json({ error: "Error al guardar la lista en la base de datos" });
    }
});

// Obtener listas de un tablero específico
router.get('/board/:boardId', async (req, res) => {
    try {
        const lists = await Card.find({ boardId: req.params.boardId });
        res.status(200).json(cards);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las listas" });
    }
});



// Eliminar una lista
router.delete('/:id', async (req, res) => {
    try {
        const deletedList = await List.findByIdAndDelete(req.params.id);
        if (!deletedList) return res.status(404).json({ error: "Lista no encontrada" });
        res.json({ message: "Lista eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la Lista" });
    }
});

module.exports = router;









