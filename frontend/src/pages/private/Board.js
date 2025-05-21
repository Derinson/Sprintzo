import React, { useEffect, useState } from "react";
import "./css/board.css";
import MenuDashboard from "./MenuDashboard"; // Importamos el menú

function Board() {
  const [menuOpen, setMenuOpen] = useState(true); // Estado para controlar el menú

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Alterna entre abierto/cerrado
  };

  useEffect(() => {
    fetch("/pages/board.html") // Cargar el HTML
      .then((response) => response.text())
      .then((html) => {
        document.getElementById("board-container").innerHTML = html;

        // Obtener elementos del DOM
        const addTaskBtn = document.querySelector("#add-task-btn");
        const addColumnBtn = document.querySelector("#add-column-btn");

        if (addTaskBtn && addColumnBtn) {
          addTaskBtn.addEventListener("click", addTask);
          addColumnBtn.addEventListener("click", addColumn);
        } else {
          console.error("Buttons not found in the loaded HTML.");
        }
      })
      .catch((error) => {
        console.error("Error loading board.html:", error);
      });
  }, []);

  /////

  function addTask() {
  const responsible = prompt("Enter the name of the responsible person:");
  if (!responsible) return;

  const description = prompt("Enter the task description:");
  if (!description) return;

  const columnChoice = prompt("Enter the column name (e.g. todo, doing, done, or custom):").toLowerCase();

  const container = document.getElementById(`${columnChoice}-tasks`);
  if (!container) {
    alert("Column not found. Please try again.");
    return;
  }

  // Mostrar la tarjeta en el frontend
  const card = document.createElement("div");
  card.className = "task-card";
  card.innerHTML = `
    <p class="responsible">👤 ${responsible}</p>
    <p>${description}</p>
  `;
  container.appendChild(card);

  // Enviar al backend
  fetch("http://localhost:5000/api/cards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      responsible: responsible,
      description: description,
      column: columnChoice
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("Error al guardar la tarjeta");
    return res.json();
  })
  .then(data => {
    console.log("Card saved:", data);
  })
  .catch(err => {
    console.error(err);
    alert("No se pudo guardar la tarea en la base de datos");
  });
}

  /////

  function addColumn() {
    const columnName = prompt("Enter the name for the new column:").toLowerCase().trim();
    if (!columnName) return;

    const board = document.getElementById("board");

    if (document.getElementById(`${columnName}-tasks`)) {
      alert("A column with this name already exists.");
      return;
    }

    const column = document.createElement("div");
    column.className = "column";
    column.setAttribute("data-id", columnName);

    const title = document.createElement("h2");
    title.textContent = columnName.charAt(0).toUpperCase() + columnName.slice(1);

    const taskContainer = document.createElement("div");
    taskContainer.className = "task-container";
    taskContainer.id = `${columnName}-tasks`;

    column.appendChild(title);
    column.appendChild(taskContainer);

    board.appendChild(column);
  }

  return (
    <div className="board-wrapper">
      <MenuDashboard toggleMenu={toggleMenu} menuOpen={menuOpen} />
      <div
        id="board-container"
        className={`board-content ${menuOpen ? "menu-open" : "menu-closed"}`}
      ></div>
    </div>
  );
}

export default Board;
