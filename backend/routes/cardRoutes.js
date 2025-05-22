const express = require('express');
const router = express.Router();
const Card = require('../models/Card');

// Crear nueva tarjeta
router.post('/', async (req, res) => {
  console.log("📩 POST recibido en /api/cards");
  console.log("Contenido del body:", req.body);

  const { responsible, description, column } = req.body;

  try {
    const newCard = new Card({ responsible, description, column });
    await newCard.save();
    res.status(201).json({ message: 'Card created successfully' });
  } catch (error) {
    console.error("❌ Error al guardar la tarjeta:", error);
    res.status(500).json({ error: 'Error saving card to the database' });
  }
});

// Actualizar una tarjeta
router.put('/:id', async (req, res) => {
  const { responsible, description, column } = req.body;
  try {
    const updatedCard = await Card.findByIdAndUpdate(
      req.params.id,
      { responsible, description, column },
      { new: true }
    );
    if (!updatedCard) return res.status(404).json({ error: 'Card not found' });
    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ error: 'Error updating card' });
  }
});

// (Opcional) Obtener todas las tarjetas
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find();
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cards' });
  }
});

// Eliminar una tarjeta
router.delete('/:id', async (req, res) => {
  try {
    const deletedCard = await Card.findByIdAndDelete(req.params.id);
    if (!deletedCard) return res.status(404).json({ error: 'Card not found' });
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting card' });
  }
});

module.exports = router;
