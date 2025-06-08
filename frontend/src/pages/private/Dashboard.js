import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./css/dashboard.css";
import MenuDashboard from "./MenuDashboard";

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [tableros, setTableros] = useState([]);
  const [tablerosCompartidos, setTablerosCompartidos] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
const [hoveredTablero, setHoveredTablero] = useState(null); // Estado para el contador interactivo

  const toggleDropdown = (id, event) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
    setMenuPosition({
      top: event.clientY + window.scrollY,
      left: event.clientX + window.scrollX,
    });
  };

  const handleMouseEnter = (id) => {
    setHoveredTablero(id);
  };

  const handleMouseLeave = () => {
    setHoveredTablero(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

 
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/tablerosRoutes/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => setTableros(data))
      .catch((error) => console.error("Error al obtener tableros:", error));

    fetch("http://localhost:5000/tablerosRoutes/compartidos", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => setTablerosCompartidos(data))
      .catch((error) => console.error("Error al obtener tableros compartidos:", error));
  }, []);

  const crearTablero = async () => {
    const { value: nombre } = await Swal.fire({
      title: "Create Board",
      input: "text",
      inputPlaceholder: "Board name",
      showCancelButton: true,
      customClass: {
        confirmButton: "swal-button-confirm",
        cancelButton: "swal-button-cancel",
      },
    });

    if (nombre) {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/tablerosRoutes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre }),
      });

      const data = await response.json();
      if (response.ok) {
        setTableros([...tableros, data.tablero]);
        Swal.fire("✅ Board created!", "", "success");
      } else {
        Swal.fire("🚨 Error", data.message, "error");
      }
    }
  };

 

  const agregarContribuyente = async (id) => {
    const { value: email } = await Swal.fire({
      title: "Add Contributor",
      input: "email",
      inputPlaceholder: "Enter the email",
      showCancelButton: true,
    });

    if (!email) return;

    const { value: rol } = await Swal.fire({
      title: "Select the role",
      input: "select",
      inputOptions: { reading: "Reading", edition: "Edition" },
      showCancelButton: true,
    });

    if (!rol) return;

    const token = localStorage.getItem("token");

    const response = await fetch(`http://localhost:5000/tablerosRoutes/contribuyente/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ email, rol }),
    });

    const data = await response.json();
    if (response.ok) {
      Swal.fire({
        title: `✅ Taxpayer ${email} added with role ${rol}`,
        icon: "success",
        confirmButtonText: "Ok",
      }).then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire("🚨 Error", data.message, "error");
    }
  };

const editarTablero = async (id, nombreActual, contribuyentes) => {
  // Identificar al creador (primer contribuyente)
  const creador = contribuyentes[0];
  const otrosContribuyentes = contribuyentes.slice(1);

  const { value: formValues } = await Swal.fire({
    title: "Edit Board",
    html: `
      <label>New Name for the Board:</label>
      <input id="swal-input-nombre" class="swal2-input" value="${nombreActual}">
      <label>Select a contributor:</label>
      <select id="swal-input-contribuyente" class="swal2-select">
        <option value="${creador.email}" disabled style="background-color: #f3f4f6; font-style: italic;">
          ${creador.email} - Creator (cannot be modified)
        </option>
        ${otrosContribuyentes.map(contribuyente => 
          `<option value="${contribuyente.email}">${contribuyente.email} - ${contribuyente.rol}</option>`
        ).join("")}
      </select>
      <label>New Role:</label>
      <select id="swal-input-rol" class="swal2-select">
        <option value="reading">Reading</option>
        <option value="edition">Edition</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Save changes",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const contribuyenteSeleccionado = document.getElementById("swal-input-contribuyente").value;
      // No permitir seleccionar al creador
      if (contribuyenteSeleccionado === creador.email) {
        Swal.showValidationMessage('Cannot modify the creator\'s role');
        return false;
      }
      return {
        nuevoNombre: document.getElementById("swal-input-nombre").value,
        contribuyenteSeleccionado,
        nuevoRol: document.getElementById("swal-input-rol").value,
      };
    },
    customClass: {
      confirmButton: "swal-button-confirm",
      cancelButton: "swal-button-cancel",
    },
  });

  if (!formValues) return;

  const token = localStorage.getItem("token");

  const response = await fetch(`http://localhost:5000/tablerosRoutes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: formValues.nuevoNombre,
      contribuyente: formValues.contribuyenteSeleccionado,
      rol: formValues.nuevoRol,
    }),
  });

  const data = await response.json();
  if (response.ok) {
    setTableros(tableros.map(tablero => 
      tablero._id === id 
        ? { ...tablero, nombre: formValues.nuevoNombre }
        : tablero
    ));
    Swal.fire({
      title: "✅ Updated board!",
      icon: "success",
      confirmButtonText: "Ok",
    }).then(() => {
      window.location.reload(); // 🔄 Recargar la página al confirmar
    });
  } else {
    Swal.fire("🚨 Error", data.message, "error");
  }
};

 const abrirTablero = (id) => {
    window.location.href = `/board/${id}`;
  };


  return (
 <div className="dashboard-wrapper">
<MenuDashboard
        handleLogout={handleLogout}
        toggleMenu={toggleMenu}
        menuOpen={menuOpen}
      />
      <div className={`dashboard-content ${menuOpen ? "menu-open" : "menu-closed"}`}>
       <button onClick={crearTablero} className="crear">Create Board</button>
        <h2>My Boards</h2>
        
        <div className="tableros">
          {tableros.map((tablero) => (
            <div key={tablero._id} className="tablero">
              <div className="tablero-header">
                <h3>
                  {tablero.nombre} 
                  <span 
                    className="contador" 
                    onMouseEnter={() => handleMouseEnter(tablero._id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    ({tablero.contribuyentes.length})
                  </span>
                </h3>
                <button className="menu-button" onClick={(event) => toggleDropdown(tablero._id, event)}>⋮</button>
              </div>

              {hoveredTablero === tablero._id && (
                <div className="contribuyentes-list">
                  {tablero.contribuyentes.map((contribuyente, index) => (
                    <p 
                      key={contribuyente.email} 
                      style={index === 0 ? {
                        color: '#2563eb',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      } : {}}
                    >
                      {index === 0 ? '👑 ' : ''}{contribuyente.email}
                      {index === 0 ? ' (Creator)' : ` - ${contribuyente.rol}`}
                    </p>
                  ))}
                </div>
              )}

              {dropdownOpen === tablero._id && (
                <div className="dropdown-menu" style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}>
                  <button onClick={() => editarTablero(tablero._id, tablero.nombre, tablero.contribuyentes)}>Edit</button>
                  <button>Delete</button>
                  <button onClick={() => agregarContribuyente(tablero._id)}>Add contributor</button>
                </div>

              )}

              <button onClick={() => abrirTablero(tablero._id)}>Open</button>
            </div>
          ))}
        </div>

        <h2>Shared boards with me</h2>
        <div className="tableros">
          {tablerosCompartidos.map((tablero) => (
            <div key={tablero._id} className="tablero">
              <h3>
                {tablero.nombre} 
                <span 
                  className="contador" 
                  onMouseEnter={() => handleMouseEnter(tablero._id)}
                  onMouseLeave={handleMouseLeave}
                >
                  ({tablero.contribuyentes.length})
                </span>
              </h3>

              {hoveredTablero === tablero._id && (
                <div className="contribuyentes-list">
                  {tablero.contribuyentes.map((contribuyente, index) => (
                    <p 
                      key={contribuyente.email} 
                      style={index === 0 ? {
                        color: '#2563eb',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      } : {}}
                    >
                      {index === 0 ? '👑 ' : ''}{contribuyente.email}
                      {index === 0 ? ' (Creator)' : ` - ${contribuyente.rol}`}
                    </p>
                  ))}
                </div>
              )}

              <button onClick={() => abrirTablero(tablero._id)}>Open</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
