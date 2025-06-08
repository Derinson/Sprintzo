import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './NotificacionesCampana.css';

const NotificacionesCampana = () => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [mostrarMenu, setMostrarMenu] = useState(false);
    const menuRef = useRef(null);
    const TOKEN = localStorage.getItem('token');
    const API_URL = 'http://localhost:5000'; // URL base del backend

    const obtenerNotificaciones = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/notificaciones`, {
                headers: { Authorization: `Bearer ${TOKEN}` }
            });
            setNotificaciones(response.data.notificaciones);
            setNoLeidas(response.data.noLeidas);
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
        }
    };

    const marcarComoLeida = async (id) => {
        try {
            await axios.patch(
                `${API_URL}/api/notificaciones/${id}/leer`,
                {},
                { headers: { Authorization: `Bearer ${TOKEN}` }}
            );
            obtenerNotificaciones();
        } catch (error) {
            console.error('Error al marcar como leída:', error);
        }
    };

    const marcarTodasComoLeidas = async () => {
        try {
            await axios.post(
                `${API_URL}/api/notificaciones/leer-todas`,
                {},
                { headers: { Authorization: `Bearer ${TOKEN}` }}
            );
            obtenerNotificaciones();
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
        }
    };

    const eliminarNotificacion = async (id) => {
        try {
            await axios.delete(
                `${API_URL}/api/notificaciones/${id}`,
                { headers: { Authorization: `Bearer ${TOKEN}` }}
            );
            obtenerNotificaciones();
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
        }
    };

    useEffect(() => {
        obtenerNotificaciones();
        const intervalo = setInterval(obtenerNotificaciones, 60000);
        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMostrarMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatearFecha = (fecha) => {
        const f = new Date(fecha);
        return f.toLocaleString('es-ES', { 
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIconoTipo = (tipo) => {
        switch (tipo) {
            case 'success': return 'bx bx-check-circle';
            case 'warning': return 'bx bx-error';
            case 'error': return 'bx bx-x-circle';
            default: return 'bx bx-info-circle';
        }
    };

    return (
        <div className="notificaciones-container" ref={menuRef}>
            <button 
                className="campana-btn"
                onClick={() => setMostrarMenu(!mostrarMenu)}
                aria-label="Notificaciones"
            >
                <i className="bx bx-bell"></i>
                {noLeidas > 0 && (
                    <span className="badge">{noLeidas}</span>
                )}
            </button>

            {mostrarMenu && (
                <div className="menu-notificaciones">
                    <div className="notificaciones-header">
                        <h3>Notificaciones</h3>
                        {noLeidas > 0 && (
                            <button 
                                className="marcar-todas-btn"
                                onClick={marcarTodasComoLeidas}
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className="notificaciones-lista">
                        {notificaciones.length === 0 ? (
                            <p className="no-notificaciones">No hay notificaciones</p>
                        ) : (
                            notificaciones.map(notif => (
                                <div 
                                    key={notif._id} 
                                    className={`notificacion-item ${!notif.leida ? 'no-leida' : ''}`}
                                >
                                    <div className="notificacion-contenido">
                                        <i className={`${getIconoTipo(notif.tipo)} notificacion-icono`}></i>
                                        <p className="notificacion-mensaje">{notif.mensaje}</p>
                                        <small className="notificacion-fecha">
                                            {formatearFecha(notif.createdAt)}
                                        </small>
                                    </div>
                                    <div className="notificacion-acciones">
                                        {!notif.leida && (
                                            <button 
                                                onClick={() => marcarComoLeida(notif._id)}
                                                className="accion-btn leer"
                                                title="Marcar como leída"
                                            >
                                                <i className="bx bx-check"></i>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => eliminarNotificacion(notif._id)}
                                            className="accion-btn eliminar"
                                            title="Eliminar"
                                        >
                                            <i className="bx bx-x"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificacionesCampana;