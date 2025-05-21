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


// (Opcional) Obtener todas las tarjetas
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find();
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cards' });
  }
});

module.exports = router;
