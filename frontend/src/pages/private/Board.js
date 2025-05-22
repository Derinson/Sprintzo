import React, { useEffect, useState } from "react";
import "./css/board.css";
import MenuDashboard from "./MenuDashboard"; // Importamos el menú

function Board() {
  const [menuOpen, setMenuOpen] = useState(true); // Estado para controlar el menú

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Alterna entre abierto/cerrado
  };

useEffect(() => {
  fetch("/pages/board.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("board-container").innerHTML = html;

      const addTaskBtn = document.querySelector("#add-task-btn");
      const addColumnBtn = document.querySelector("#add-column-btn");

      if (addTaskBtn && addColumnBtn) {
        addTaskBtn.addEventListener("click", addTask);
        addColumnBtn.addEventListener("click", addColumn);
      } else {
        console.error("Buttons not found in the loaded HTML.");
      }

      // Cargar las tareas desde la base de datos
      fetch("http://localhost:5000/api/cards")
        .then(res => res.json())
        .then(cards => {
          clearAllTasks(); // LIMPIAR primero para evitar duplicados
          cards.forEach(renderCard); // Renderizar una vez por tarjeta
        });
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

  const columnChoice = "todo"; // Ahora todas las tareas se crearán en "todo"

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
      // Opcional: volver a cargar las tarjetas desde la DB para asegurarnos
      fetch("http://localhost:5000/api/cards")
        .then(res => res.json())
        .then(cards => {
          // Limpiar primero
          clearAllTasks();
          cards.forEach(renderCard);
        });
    })
    .catch(err => {
      console.error(err);
      alert("No se pudo guardar la tarea en la base de datos");
    });
}


  /////
  function renderCard(card) {
  const container = document.getElementById(`${card.column}-tasks`);
  if (!container) {
    console.warn(`Column ${card.column} not found`);
    return;
  }

  const div = document.createElement("div");
  div.className = "task-card";

  const editBtn = document.createElement("button");

  editBtn.textContent = "✏️ Editar";
  editBtn.className = "edit-btn";

  // ✅ Nuevo botón Eliminar
  const deleteBtn = document.createElement("button");

  deleteBtn.textContent = "🗑️ Eliminar";
  deleteBtn.className = "delete-btn";

  // ✅ Acción para eliminar tarjeta
  deleteBtn.addEventListener("click", () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta tarjeta?")) {
      fetch(`http://localhost:5000/api/cards/${card._id}`, {
  method: "DELETE",
})
  .then(async res => {
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Respuesta con error:", res.status, errorText);
      throw new Error("Error al eliminar la tarjeta");
    }
    return res.json();
  })
  .then(() => {
    div.remove(); // Eliminar del DOM si fue exitoso
  })
  .catch(err => {
    console.error(err);
    alert("No se pudo eliminar la tarjeta");
  });
    }
  });

  editBtn.addEventListener("click", () => {
    const newResponsible = prompt("Nuevo responsable:", card.responsible);
    if (!newResponsible) return;

    const newDescription = prompt("Nueva descripción:", card.description);
    if (!newDescription) return;

    fetch(`http://localhost:5000/api/cards/${card._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        responsible: newResponsible,
        description: newDescription,
        column: card.column
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al editar la tarjeta");
        return res.json();
      })
      .then(updatedCard => {
        fetch("http://localhost:5000/api/cards")
          .then(res => res.json())
          .then(cards => {
            clearAllTasks();
            cards.forEach(renderCard);
          });
      })
      .catch(err => {
        console.error(err);
        alert("No se pudo editar la tarjeta");
      });
  });

  div.innerHTML = `
    <p class="responsible">👤 ${card.responsible}</p>
    <p>${card.description}</p>
  `;

  div.appendChild(editBtn);
  div.appendChild(deleteBtn); // ✅ Agrega el botón de eliminar
  container.appendChild(div);
}

/////
function clearAllTasks() {
  const containers = document.querySelectorAll(".task-container");
  containers.forEach(container => container.innerHTML = "");
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