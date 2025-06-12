const express = require('express');
const router = express.Router();
const Notificacion = require('../models/Notificacion');
const authenticateToken = require('../middleware/authenticateToken');

// Obtener todas las notificaciones del usuario
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notificaciones = await Notificacion.find({ 
            usuario: req.user.id 
        })
        .sort({ createdAt: -1 })
        .limit(50); // Limitamos a las 50 más recientes para mejor rendimiento

        const noLeidas = await Notificacion.countDocuments({
            usuario: req.user.id,
            leida: false
        });

        res.json({
            notificaciones,
            noLeidas
        });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ 
            error: 'Error al obtener las notificaciones',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Marcar una notificación como leída
router.patch('/:id/leer', authenticateToken, async (req, res) => {
    try {
        const notificacion = await Notificacion.findOneAndUpdate(
            { 
                _id: req.params.id,
                usuario: req.user.id // Aseguramos que la notificación pertenece al usuario
            },
            { leida: true },
            { new: true }
        );

        if (!notificacion) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        res.json(notificacion);
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({ 
            error: 'Error al actualizar la notificación',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Marcar todas las notificaciones como leídas
router.post('/leer-todas', authenticateToken, async (req, res) => {
    try {
        const resultado = await Notificacion.updateMany(
            { 
                usuario: req.user.id,
                leida: false
            },
            { leida: true }
        );

        res.json({
            mensaje: 'Todas las notificaciones han sido marcadas como leídas',
            actualizadas: resultado.modifiedCount
        });
    } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        res.status(500).json({ 
            error: 'Error al actualizar las notificaciones',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Eliminar una notificación
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notificacion = await Notificacion.findOneAndDelete({
            _id: req.params.id,
            usuario: req.user.id
        });

        if (!notificacion) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        res.json({ mensaje: 'Notificación eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        res.status(500).json({ 
            error: 'Error al eliminar la notificación',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 