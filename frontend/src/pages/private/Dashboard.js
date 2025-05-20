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
      title: "Crear Tablero",
      input: "text",
      inputPlaceholder: "Nombre del tablero",
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
        Swal.fire("✅ Tablero creado!", "", "success");
      } else {
        Swal.fire("🚨 Error", data.message, "error");
      }
    }
  };

  const eliminarTablero = async (id) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`http://localhost:5000/tablerosRoutes/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (response.ok) {
      setTableros(tableros.filter((tablero) => tablero._id !== id));
      Swal.fire("✅ Tablero eliminado!", "", "success");
    }
  };

  const agregarContribuyente = async (id) => {
    const { value: email } = await Swal.fire({
      title: "Añadir Contribuyente",
      input: "email",
      inputPlaceholder: "Introduce el correo",
      showCancelButton: true,
    });

    if (!email) return;

    const { value: rol } = await Swal.fire({
      title: "Selecciona el rol",
      input: "select",
      inputOptions: { lectura: "Lectura", edicion: "Edición" },
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
        title: `✅ Contribuyente ${email} agregado con rol ${rol}`,
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
  const { value: formValues } = await Swal.fire({
    title: "Editar Tablero",
    html: `
      <label>Nuevo Nombre para el Tablero:</label>
      <input id="swal-input-nombre" class="swal2-input" value="${nombreActual}">
      <label>Selecciona un contribuyente:</label>
      <select id="swal-input-contribuyente" class="swal2-select">
        ${contribuyentes.map(contribuyente => 
          `<option value="${contribuyente.email}">${contribuyente.email} - ${contribuyente.rol}</option>`
        ).join("")}
      </select>
      <label>Nuevo Rol:</label>
      <select id="swal-input-rol" class="swal2-select">
        <option value="lectura">Lectura</option>
        <option value="edicion">Edición</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar cambios",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      return {
        nuevoNombre: document.getElementById("swal-input-nombre").value,
        contribuyenteSeleccionado: document.getElementById("swal-input-contribuyente").value,
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
      title: "✅ Tablero actualizado!",
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
    window.location.href = `/Board/${id}`;
  };


  return (
 <div className="dashboard-wrapper">
      <MenuDashboard handleLogout={handleLogout} toggleMenu={toggleMenu} menuOpen={menuOpen} />
      <div className={`dashboard-content ${menuOpen ? "menu-open" : "menu-closed"}`}>
        <h2>Mis Tableros</h2>
        <button onClick={crearTablero}>Crear Tablero</button>
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
                  {tablero.contribuyentes.map(contribuyente => (
                    <p key={contribuyente.email}>{contribuyente.email}</p>
                  ))}
                </div>
              )}

              {dropdownOpen === tablero._id && (
                <div className="dropdown-menu" style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}>
                  <button onClick={() => editarTablero(tablero._id, tablero.nombre, tablero.contribuyentes)}>Editar</button>
                  <button onClick={() => eliminarTablero(tablero._id)}>Eliminar</button>
                  <button onClick={() => agregarContribuyente(tablero._id)}>Añadir contribuyente</button>
                </div>
              )}

              <button onClick={() => abrirTablero(tablero._id)}>Abrir</button>
            </div>
          ))}
        </div>

        <h2>Tableros compartidos conmigo</h2>
        <div className="tableros">
          {tablerosCompartidos.map((tablero) => (
            <div key={tablero._id} className="tablero">
              <h3>{tablero.nombre} <span className="contador">({tablero.contribuyentes.length})</span></h3>
              <button onClick={() => abrirTablero(tablero._id)}>Abrir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
