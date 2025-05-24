import React, { useEffect, useState } from "react";
import "./css/board.css";
import MenuDashboard from "./MenuDashboard"; // Importamos el menú
import Swal from "sweetalert2"; // Importamos SweetAlert

function Board() {
  const [menuOpen, setMenuOpen] = useState(true); // Estado para controlar el menú

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Alterna entre abierto/cerrado
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
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

        // Obtener el `boardId` desde la URL
        const boardId = window.location.pathname.split("/board/")[1];

        // Cargar las tareas del tablero desde la base de datos
        fetch(`http://localhost:5000/api/cards/board/${boardId}`)
          .then(res => res.json())
          .then(cards => {
            clearAllTasks(); // LIMPIAR primero para evitar duplicados
            cards.forEach(renderCard); // Renderizar una vez por tarjeta

            const containers = document.querySelectorAll(".task-container");
            containers.forEach(container => {
              container.addEventListener("dragover", (e) => {
                e.preventDefault(); // Necesario para permitir drop
              });

              container.addEventListener("drop", (e) => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData("text/plain");
                const newColumn = container.id.replace("-tasks", "");

                fetch(`http://localhost:5000/api/cards/${cardId}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ column: newColumn })
                })
                  .then(res => {
                    if (!res.ok) throw new Error("Error al mover la tarjeta");
                    return res.json();
                  })
                  .then(() => {
                    fetch(`http://localhost:5000/api/cards/board/${boardId}`)
                      .then(res => res.json())
                      .then(cards => {
                        clearAllTasks();
                        cards.forEach(renderCard);
                      });
                  })
                  .catch(err => {
                    console.error(err);
                    alert("No se pudo mover la tarjeta");
                  });
              });
            });
          });
      })
      .catch((error) => {
        console.error("Error loading board.html:", error);
      });
  }, []);

  function addColumn() {
    Swal.fire("Función no implementada aún", "", "info");
  }

  function addTask() {
    const boardId = window.location.pathname.split("/board/")[1]; // 📌 Extraer ID del tablero

    Swal.fire({
      title: "Nuevo Responsable",
      input: "text",
      inputPlaceholder: "Ingresa el nombre del responsable",
      showCancelButton: true
    }).then(responsibleResult => {
      if (!responsibleResult.value) return;

      Swal.fire({
        title: "Descripción de la tarea",
        input: "text",
        inputPlaceholder: "Ingresa la descripción",
        showCancelButton: true
      }).then(descriptionResult => {
        if (!descriptionResult.value) return;

        const columnChoice = "todo"; // Todas las tareas se crearán en "todo"

        const token = localStorage.getItem("token");

        // Enviar al backend con el `boardId`
        fetch("http://localhost:5000/api/cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            responsible: responsibleResult.value,
            description: descriptionResult.value,
            column: columnChoice,
            boardId // 📌 Enviar el ID del tablero
          })
        })
          .then(res => res.json())
          .then(() => {
            Swal.fire("¡Guardado!", "La tarjeta se ha creado correctamente.", "success");
            fetch(`http://localhost:5000/api/cards/board/${boardId}`)
              .then(res => res.json())
              .then(cards => {
                clearAllTasks();
                cards.forEach(renderCard);
              });
          })
          .catch(err => {
            console.error(err);
            Swal.fire("Error", "No se pudo guardar la tarea en la base de datos.", "error");
          });
      });
    });
  }

  function renderCard(card) {
    const container = document.getElementById(`${card.column}-tasks`);
    if (!container) {
      console.warn(`Column ${card.column} not found`);
      return;
    }

    const div = document.createElement("div");
    div.className = "task-card";
    div.setAttribute("draggable", true);
    div.dataset.id = card._id;

    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card._id);
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️ Editar";
    editBtn.className = "edit-btn";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Eliminar";
    deleteBtn.className = "delete-btn";

    deleteBtn.addEventListener("click", () => {
      fetch(`http://localhost:5000/api/cards/${card._id}`, {
        method: "DELETE",
      })
        .then(() => {
          div.remove();
          Swal.fire("¡Eliminada!", "La tarjeta se ha eliminado correctamente.", "success");
        })
        .catch(err => Swal.fire("Error", "No se pudo eliminar la tarjeta.", "error"));
    });

    editBtn.addEventListener("click", () => {
      Swal.fire({
        title: "Nuevo responsable",
        input: "text",
        inputValue: card.responsible,
        showCancelButton: true
      }).then(responsibleResult => {
        if (!responsibleResult.value) return;

        Swal.fire({
          title: "Nueva descripción",
          input: "text",
          inputValue: card.description,
          showCancelButton: true
        }).then(descriptionResult => {
          if (!descriptionResult.value) return;

          fetch(`http://localhost:5000/api/cards/${card._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              responsible: responsibleResult.value,
              description: descriptionResult.value,
              column: card.column
            })
          })
            .then(() => {
              Swal.fire("¡Actualizada!", "La tarjeta se ha editado correctamente.", "success");
            })
            .catch(err => Swal.fire("Error", "No se pudo editar la tarjeta.", "error"));
        });
      });
    });

    div.innerHTML = `<p class="responsible">👤 ${card.responsible}</p><p>${card.description}</p>`;
    div.appendChild(editBtn);
    div.appendChild(deleteBtn);
    container.appendChild(div);
  }

  function clearAllTasks() {
    document.querySelectorAll(".task-container").forEach(container => container.innerHTML = "");
  }

  return (
    <div className="board-wrapper">
      <MenuDashboard handleLogout={handleLogout} toggleMenu={toggleMenu} menuOpen={menuOpen} />
      <div id="board-container" className={`board-content ${menuOpen ? "menu-open" : "menu-closed"}`}></div>
    </div>
  );
}

export default Board;
