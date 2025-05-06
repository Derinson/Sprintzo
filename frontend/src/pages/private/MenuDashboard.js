import React, { useEffect, useState } from "react";
import "./css/menu.css"; 
import logo from "../../pages/logo_Sprintzo.png";

const MenuDashboard = ({ handleLogout, toggleMenu, menuOpen }) => {
  const [username, setUsername] = useState(""); // Para almacenar el nombre del usuario

  useEffect(() => {
    // Función para obtener el username
    const fetchUsername = async () => {
      try {
        const response = await fetch("http://localhost:5000/userRoutes/get-username", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Usa el token almacenado
          },
        });

        const data = await response.json();
        if (response.status === 200) {
          setUsername(data.username); // Almacena el username
        } else {
          console.error("Error fetching username:", data.message);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchUsername(); // Llama a la función para obtener el username

    // Configuración del toggle para abrir/cerrar el menú
    const toggle = document.querySelector(".menu-toggle");
    const menuDashboard = document.querySelector(".menu-dashboard");

    const handleToggleMenu = () => {
      menuDashboard.classList.toggle("menu-closed");
      toggleMenu(); // Sincroniza el estado con el Dashboard
    };

    toggle?.addEventListener("click", handleToggleMenu);

    // Cleanup para evitar problemas de memoria
    return () => {
      toggle?.removeEventListener("click", handleToggleMenu);
    };
  }, [toggleMenu]);

  return (
    <div className={`menu-dashboard ${menuOpen ? "" : "menu-closed"}`}>
      <div className="top-menu">
        <div className="logo">
          <img src={logo} alt="logo" />
          <div className="username">
            <span>Hola, {username}</span> {/* Aquí se muestra el username */}
          </div>
        </div>
        <div className="menu-toggle">
          <i className={`bx ${menuOpen ? "bx-menu" : "bx-x"}`}></i>
        </div>
      </div>
      <div className="menu">
        <div className="enlace">
          <i className="bx bx-grid-alt"></i>
          <span>Dashboard</span>
        </div>
        <div className="enlace" onClick={() => (window.location.href = "/edit-profile")}>
          <i className="bx bx-user"></i>
          <span>Perfil</span>
        </div>
        <div className="enlace">
          <i className="bx bx-line-chart"></i>
          <span>Analíticas</span>
        </div>
        <div className="enlace">
          <i className="bx bx-message-square"></i>
          <span>Mensajes</span>
        </div>
        <div className="enlace">
          <i className="bx bx-file"></i>
          <span>Archivos</span>
        </div>
        <div className="enlace">
          <i className="bx bx-cog"></i>
          <span>Configuración</span>
        </div>
        <div className="enlace" id="logout-icon" onClick={handleLogout}>
          <i className="bx bx-log-out"></i>
          <span>Cerrar sesión</span>
        </div>
      </div>
    </div>
  );
};

export default MenuDashboard;
