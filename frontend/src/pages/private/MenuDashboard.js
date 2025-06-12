import React, { useEffect, useState } from "react";
import "./css/menu.css"; 
import logo from "../../pages/logo_Sprintzo.png";
import NotificacionesCampana from "../../components/NotificacionesCampana";

const MenuDashboard = ({ handleLogout, toggleMenu, menuOpen }) => {
  const [username, setUsername] = useState("");
  const [archivedCount, setArchivedCount] = useState(0);

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

    // Función para obtener el conteo de tableros con archivados
    const fetchArchivedBoards = async () => {
      try {
        const response = await fetch("http://localhost:5000/tablerosRoutes/with-archived", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();
        if (response.status === 200) {
          setArchivedCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error:", error);
        setArchivedCount(0);
      }
    };

    fetchUsername();
    fetchArchivedBoards(); // Obtiene el conteo de tableros con archivados

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
            <span>Hello, {username}</span>
          </div>
        </div>
        <NotificacionesCampana />
        <div className="menu-toggle">
          <i className={`bx ${menuOpen ? "bx-menu" : "bx-x"}`}></i>
        </div>
      </div>
      <div className="menu">
        <div className="enlace" onClick={() => (window.location.href = "/dashboard")}>
          <i className="bx bx-grid-alt"></i>
          <span>Dashboard</span>
        </div>
        <div className="enlace" onClick={() => (window.location.href = "/profile")}>
          <i className="bx bx-user"></i>
          <span>Profile</span>
        </div>
        
        
        
        <div 
          className="enlace" 
          onClick={() => (window.location.href = "/archived-boards")}
          style={{ position: 'relative' }}
        >
          <i className="bx bx-archive"></i>
          <span>Archived</span>
          {archivedCount > 0 && (
            <div className="archived-badge">
              {archivedCount}
            </div>
          )}
        </div>
        <div className="enlace">
          <i className="bx bx-cog"></i>
          <span>Settings</span>
        </div>
        <div className="enlace" id="logout-icon" onClick={handleLogout}>
          <i className="bx bx-log-out"></i>
          <span>Log out</span>
        </div>
      </div>
    </div>
  );
};

export default MenuDashboard;
