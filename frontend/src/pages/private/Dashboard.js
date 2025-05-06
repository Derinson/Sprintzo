import React, { useEffect, useState } from "react";
import "./css/dashboard.css";
import MenuDashboard from "./MenuDashboard"; // Importamos el menú como componente

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(true); // Estado para controlar el menú

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Cambia el estado del menú
  };

  useEffect(() => {
    fetch("/pages/dashboard.html")
      .then((response) => response.text())
      .then((html) => {
        const container = document.getElementById("dashboard-container");
        if (container) {
          container.innerHTML = html;
        }
      })
      .catch((error) => {
        console.error("Error loading dashboard.html:", error);
      });
  }, []);

  return (
    <div className="dashboard-wrapper">
      <MenuDashboard handleLogout={handleLogout} toggleMenu={toggleMenu} menuOpen={menuOpen} />
      <div
        id="dashboard-container"
        className={`dashboard-content ${menuOpen ? "menu-open" : "menu-closed"}`}
      >
      </div>
    </div>
  );
}

export default Dashboard;
