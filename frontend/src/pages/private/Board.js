import React, { useEffect, useState } from "react";
import "./css/board.css";
import "./css/sweetalert-custom.css"; // Importamos los estilos personalizados para SweetAlert
import MenuDashboard from "./MenuDashboard"; // Importamos el menú
import Swal from "sweetalert2"; // Importamos SweetAlert

function Board() {
  const [menuOpen, setMenuOpen] = useState(true); // Estado para controlar el menú
  const [userRole, setUserRole] = useState(null); // Nuevo estado para el rol
  const [contributors, setContributors] = useState([]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Alterna entre abierto/cerrado
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Función para obtener el color según el rol
  const getRoleColor = (role) => {
    switch (role) {
      case "edition": return "#4CAF50";
      case "reading": return "#2196F3";
      default: return "#f44336";
    }
  };

  // Función para obtener el icono según el rol
  const getRoleIcon = (role) => {
    switch (role) {
      case "edition": return "✏️";
      case "reading": return "👁️";
      default: return "⛔";
    }
  };

  // Función para obtener las iniciales de un email
  const getInitials = (email) => {
    const name = email.split('@')[0];
    const words = name.split(/[._-]/);
    return words.map(word => word[0].toUpperCase()).join('');
  };

  // Función para obtener un color basado en el email
  const getRandomColor = (email) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
      '#E67E22', '#27AE60', '#F1C40F', '#E74C3C'
    ];
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  useEffect(() => {
    const boardId = window.location.pathname.split("/board/")[1];

    // Obtener el rol y los contribuyentes
    Promise.all([
      fetch(`http://localhost:5000/tablerosRoutes/${boardId}/mi-rol`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      }),
      fetch(`http://localhost:5000/tablerosRoutes/${boardId}/contribuyentes`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
    ])
      .then(([rolRes, contribRes]) => Promise.all([rolRes.json(), contribRes.json()]))
      .then(([rolData, contribData]) => {
        setUserRole(rolData.rol);
        setContributors(contribData);

        if (rolData.rol === "edition") {
          // Lógica para editor
        } else if (rolData.rol === "reading") {
          document.querySelector("#vista").classList.add("disabled-view");
        } else {
          Swal.fire({
            title: "❌ Access Denied",
            text: "You don't have access to this board",
            icon: "error",
            confirmButtonText: "OK"
          }).then(() => {
            window.location.href = "/dashboard";
          });
        }
      })
      .catch(error => {
        console.error("Error:", error);
        Swal.fire({
          title: "Error",
          text: "There was a problem loading the data",
          icon: "error",
          confirmButtonText: "OK"
        });
      });
  }, []);

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

                // Primero obtener la tarjeta actual para mantener sus datos
                fetch(`http://localhost:5000/api/cards/${cardId}`, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                  }
                })
                  .then(res => res.json())
                  .then(currentCard => {
                    // Actualizar la tarjeta manteniendo todos sus datos excepto la columna
                    fetch(`http://localhost:5000/api/cards/${cardId}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                      },
                      body: JSON.stringify({
                        title: currentCard.title,
                        responsible: currentCard.responsible,
                        description: currentCard.description,
                        column: newColumn
                      })
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
                        Swal.fire('Error', 'No se pudo mover la tarjeta', 'error');
                      });
                  })
                  .catch(err => {
                    console.error(err);
                    Swal.fire('Error', 'No se pudo obtener la información de la tarjeta', 'error');
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
    Swal.fire("Feature not implemented yet", "", "info");
  } function duplicateCard(originalCard) {
    const boardId = window.location.pathname.split("/board/")[1];
    const token = localStorage.getItem("token");

    // Crear la nueva tarjeta basada en la original
    fetch("http://localhost:5000/api/cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        title: originalCard.title + " (Copy)",
        responsible: originalCard.responsible,
        description: originalCard.description,
        checklist: originalCard.checklist,
        column: originalCard.column,
        boardId: boardId
      })
    })

      .then(res => {
        if (!res.ok) throw new Error('Error duplicating task');
        return res.json();
      })
      .then(() => {
        Swal.fire({
          title: "Duplicated!",
          text: "Task has been duplicated successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });

        // Recargar tarjetas
        fetch(`http://localhost:5000/api/cards/board/${boardId}`)
          .then(res => res.json())
          .then(cards => {
            clearAllTasks();
            cards.forEach(renderCard);
          });
      })
      .catch(err => {
        console.error(err);
        Swal.fire('Error', 'Could not duplicate the task', 'error');
      });
  }

  function addTask() {
    const boardId = window.location.pathname.split("/board/")[1];

    fetch(`http://localhost:5000/tablerosRoutes/${boardId}/contribuyentes`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(contribuyentes => {
        if (!contribuyentes.length) {
          Swal.fire("Error", "No contributors in this board.", "error");
          return;
        }

        Swal.fire({
          title: '<h2 class="swal2-title">New Task</h2>',
          input: "text",
          inputPlaceholder: "Enter title",
          showCancelButton: true,
          confirmButtonText: 'Next',
          cancelButtonText: 'Cancel',
        }).then(titleResult => {
          if (!titleResult.value) return;

          Swal.fire({
            title: '<h2 class="swal2-title">Assign Responsibles</h2>',
            html: `
              <div class="contributor-selector">
                ${contribuyentes.map(c => `
                  <div class="contributor-item">
                    <input type="checkbox"
                    id="check-${c.email}"
                    value="${c.email}"
                    class="contributor-checkbox">
                    <div class="contributor-avatar" style="background-color: ${getRandomColor(c.email)}">
                      ${getInitials(c.email)}
                    </div>
                    <label for="check-${c.email}">${c.email}</label>
                  </div>
                `).join('')}
                <div class="contributor-item unassigned">
                  <div class="contributor-avatar" style="background-color: #95a5a6">
                    UA
                  </div>
                  <span class="unassigned-label">Unassigned (default)</span>
                </div>
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Next',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
              const selectedCheckboxes = document.querySelectorAll('.contributor-checkbox:checked');
              const selectedResponsibles = selectedCheckboxes.length > 0
                ? Array.from(selectedCheckboxes).map(cb => cb.value)
                : ['Unassigned'];

              return {
                title: titleResult.value,
                responsible: selectedResponsibles
              };
            }
          }).then(responsibleResult => {
            if (!responsibleResult.value) return;

            Swal.fire({
              title: '<h2 class="swal2-title">Task Description</h2>',
              input: "textarea",
              inputPlaceholder: "Enter description",
              showCancelButton: true,
              confirmButtonText: 'Next',
              cancelButtonText: 'Cancel',
            }).then(descriptionResult => {
              if (!descriptionResult.value) return;

              Swal.fire({
                title: '<h2 class="swal2-title">Add Checklist (Optional)</h2>',
                html: `
                  <div style="text-align: left; padding: 10px;">
                    <div id="checklist-container" style="margin-bottom: 10px;"></div>
                    <button
                      type="button"
                      onclick="addChecklistItem()"
                      style="background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;"
                    >
                      + Add Item
                    </button>
                  </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Create Task',
                cancelButtonText: 'Cancel',
                didOpen: () => {
                  window.addChecklistItem = () => {
                    const container = document.getElementById('checklist-container');
                    const newItem = document.createElement('div');
                    newItem.className = 'checklist-item';
                    newItem.style = 'display: flex; align-items: center; margin-bottom: 8px;';
                    newItem.innerHTML = `
                      <input
                        type="checkbox"
                        class="checklist-checkbox"
                        style="margin-right: 8px;"
                      >
                      <input
                        type="text"
                        placeholder="Enter checklist item..."
                        class="checklist-text swal2-input"
                        style="flex: 1; margin: 0;"
                      >
                      <button
                        type="button"
                        class="checklist-delete-btn"
                        style="margin-left: 8px; background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px;"
                        onclick="this.parentElement.remove()"
                      >
                        ×
                      </button>
                    `;
                    container.appendChild(newItem);
                  };
                },
                preConfirm: () => {
                  const checklistItems = Array.from(document.querySelectorAll('.checklist-item')).map(item => ({
                    text: item.querySelector('.checklist-text').value,
                    completed: item.querySelector('.checklist-checkbox').checked
                  })).filter(item => item.text.trim() !== '');

                  return checklistItems;
                }
              }).then(checklistResult => {
                if (!checklistResult.value) return;

                const columnChoice = "todo";
                const token = localStorage.getItem("token");

                fetch("http://localhost:5000/api/cards", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    title: responsibleResult.value.title,
                    responsible: responsibleResult.value.responsible,
                    description: descriptionResult.value,
                    checklist: checklistResult.value,
                    column: columnChoice,
                    boardId
                  })
                })
                  .then(res => {
                    if (!res.ok) throw new Error('Error saving task');
                    return res.json();
                  })
                  .then(() => {
                    Swal.fire({
                      title: "Saved!",
                      text: "Task has been created successfully",
                      icon: "success",
                      timer: 1500,
                      timerProgressBar: true,
                      showConfirmButton: false
                    });

                    // Reload tasks
                    fetch(`http://localhost:5000/api/cards/board/${boardId}`)
                      .then(res => res.json())
                      .then(cards => {
                        clearAllTasks();
                        cards.forEach(renderCard);
                      });
                  })
                  .catch(err => {
                    console.error(err);
                    Swal.fire({
                      title: "Error",
                      text: "Could not save task to database",
                      icon: "error"
                    });
                  });
              });
            });
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

    const contentDiv = document.createElement("div");
    contentDiv.className = "task-content";
    contentDiv.style.cursor = "pointer";
    contentDiv.style.transition = "background-color 0.3s ease";
    contentDiv.style.position = "relative"; // Para posicionamiento absoluto de los avatares

    // Header container para título y avatares
    const headerContainer = document.createElement("div");
    headerContainer.style.display = "flex";
    headerContainer.style.justifyContent = "space-between";
    headerContainer.style.alignItems = "flex-start";
    headerContainer.style.marginBottom = "12px";

    const titleElement = document.createElement("h3");
    titleElement.className = "titl";
    titleElement.textContent = `📌 ${card.title}`;
    titleElement.style.margin = "0";
    titleElement.style.fontSize = "16px";
    titleElement.style.fontWeight = "600";
    titleElement.style.color = "#2c3e50";
    titleElement.style.flex = "1";
    titleElement.style.marginRight = "10px";

    // Contenedor de avatares
    const responsibleContainer = document.createElement("div");
    responsibleContainer.style.display = "flex";
    responsibleContainer.style.alignItems = "center";
    responsibleContainer.style.gap = "4px";
    responsibleContainer.style.flexWrap = "wrap";
    responsibleContainer.style.minWidth = "fit-content";

    const responsibles = Array.isArray(card.responsible) ? card.responsible : [card.responsible];

    // Contenedor para los avatares
    const avatarsContainer = document.createElement("div");
    avatarsContainer.style.display = "flex";
    avatarsContainer.style.gap = "2px";
    avatarsContainer.style.flexDirection = "row-reverse"; // Para que se apilen desde la derecha

    responsibles.forEach(responsible => {
      const avatarContainer = document.createElement("div");
      avatarContainer.style.position = "relative";
      avatarContainer.style.display = "inline-block";
      avatarContainer.style.marginLeft = "-8px"; // Para que los avatares se superpongan ligeramente

      const avatar = document.createElement("div");
      avatar.style.width = "24px";
      avatar.style.height = "24px";
      avatar.style.borderRadius = "50%";
      avatar.style.backgroundColor = getRandomColor(responsible);
      avatar.style.color = "white";
      avatar.style.display = "flex";
      avatar.style.alignItems = "center";
      avatar.style.justifyContent = "center";
      avatar.style.fontSize = "11px";
      avatar.style.fontWeight = "bold";
      avatar.style.cursor = "pointer";
      avatar.style.border = "2px solid white";
      avatar.style.boxSizing = "border-box";
      avatar.textContent = getInitials(responsible);

      // Tooltip para mostrar el email completo
      avatar.title = responsible;

      // Efecto hover
      avatar.onmouseover = () => {
        avatar.style.transform = "scale(1.1)";
        avatar.style.transition = "transform 0.2s ease";
        avatar.style.zIndex = "1";
      };
      avatar.onmouseout = () => {
        avatar.style.transform = "scale(1)";
        avatar.style.zIndex = "0";
      };

      avatarContainer.appendChild(avatar);
      avatarsContainer.appendChild(avatarContainer);
    });

    responsibleContainer.appendChild(avatarsContainer);
    headerContainer.appendChild(titleElement);
    headerContainer.appendChild(responsibleContainer);

    // Contenedor de descripción con icono
    const descriptionContainer = document.createElement("div");
    descriptionContainer.style.marginTop = "8px";
    descriptionContainer.style.display = "flex";
    descriptionContainer.style.gap = "8px";
    descriptionContainer.style.alignItems = "flex-start";
    descriptionContainer.style.backgroundColor = "#f8f9fa";
    descriptionContainer.style.padding = "8px";
    descriptionContainer.style.borderRadius = "6px";

    const descriptionIcon = document.createElement("span");
    descriptionIcon.textContent = "📝";
    descriptionIcon.style.fontSize = "14px";

    const descriptionElement = document.createElement("p");
    descriptionElement.className = "description";
    descriptionElement.style.margin = "0";
    descriptionElement.style.fontSize = "14px";
    descriptionElement.style.color = "#495057";
    descriptionElement.style.flex = "1";
    descriptionElement.style.lineHeight = "1.4";
    descriptionElement.textContent = card.description;

    descriptionContainer.appendChild(descriptionIcon);
    descriptionContainer.appendChild(descriptionElement);

    contentDiv.appendChild(headerContainer);
    contentDiv.appendChild(descriptionContainer);

    // Add checklist to card display
    if (card.checklist && card.checklist.length > 0) {
      const checklistContainer = document.createElement("div");
      checklistContainer.style.marginTop = "12px";
      checklistContainer.style.padding = "8px";
      checklistContainer.style.backgroundColor = "#f8f9fa";
      checklistContainer.style.borderRadius = "6px";

      const checklistTitle = document.createElement("div");
      checklistTitle.style.display = "flex";
      checklistTitle.style.alignItems = "center";
      checklistTitle.style.marginBottom = "8px";
      checklistTitle.innerHTML = `
        <span style="font-size: 14px; margin-right: 8px;">✅</span>
        <span style="font-weight: 600; color: #2c3e50;">Checklist</span>
      `;

      const checklistProgress = document.createElement("div");
      const completedItems = card.checklist.filter(item => item.completed).length;
      const totalItems = card.checklist.length;
      const progressPercentage = Math.round((completedItems / totalItems) * 100);

      checklistProgress.style.marginBottom = "8px";
      checklistProgress.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12px; color: #666;">${completedItems}/${totalItems}</span>
          <span style="font-size: 12px; color: #666;">${progressPercentage}%</span>
        </div>
        <div style="height: 4px; background-color: #e9ecef; border-radius: 2px;">
          <div style="height: 100%; width: ${progressPercentage}%; background-color: #4CAF50; border-radius: 2px;"></div>
        </div>
      `;

      const checklistItems = document.createElement("div");
      checklistItems.style.marginTop = "8px";

      card.checklist.forEach(item => {
        const itemElement = document.createElement("div");
        itemElement.style.display = "flex";
        itemElement.style.alignItems = "center";
        itemElement.style.marginBottom = "4px";
        itemElement.innerHTML = `
          <input type="checkbox" ${item.completed ? 'checked' : ''} disabled style="margin-right: 8px;">
          <span style="font-size: 13px; color: ${item.completed ? '#95a5a6' : '#2c3e50'}; text-decoration: ${item.completed ? 'line-through' : 'none'};">
            ${item.text}
          </span>
        `;
        checklistItems.appendChild(itemElement);
      });

      checklistContainer.appendChild(checklistTitle);
      checklistContainer.appendChild(checklistProgress);
      checklistContainer.appendChild(checklistItems);
      contentDiv.appendChild(checklistContainer);
    }

    contentDiv.style.backgroundColor = "transparent";

    contentDiv.addEventListener("click", () => {
      const boardId = window.location.pathname.split("/board/")[1];

      fetch(`http://localhost:5000/tablerosRoutes/${boardId}/contribuyentes`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })
        .then(res => res.json())
        .then(contribuyentes => {
          if (!contribuyentes.length) {
            return Swal.fire({
              title: "Error",
              text: "No contributors in this board.",
              icon: "error",
              showConfirmButton: true,
            });
          }

          Swal.fire({
            title: '<h2 class="swal2-title">✏️ Edit Task</h2>',
            html: `
            <div style="text-align: left; padding: 10px;">
              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">
                  📝 Title:
                </label>
                <input
                  id="swal-input-title"
                  class="swal2-input"
                  value="${card.title}"
                >
              </div>
              
              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">
                  👥 Responsibles:
                </label>
                <div class="contributor-selector">
                  <div class="contributor-item unassigned">
                    <div class="contributor-avatar" style="background-color: #95a5a6">
                      UA
                    </div>
                    <span class="unassigned-label">Unassigned (default)</span>
                  </div>
                  ${contribuyentes.map(c => `
                    <div class="contributor-item">
                      <input type="checkbox"
                        id="edit-check-${c.email}"
                        value="${c.email}"
                        class="contributor-checkbox"
                        ${Array.isArray(card.responsible) && card.responsible.includes(c.email) ? 'checked' : ''}>
                      <div class="contributor-avatar" style="background-color: ${getRandomColor(c.email)}">
                        ${getInitials(c.email)}
                      </div>
                      <label for="edit-check-${c.email}">${c.email}</label>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">
                  📄 Description:
                </label>
                <textarea
                  id="swal-input-description"
                  class="swal2-textarea"
                >${card.description}</textarea>
              </div>

              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label">
                  ✅ Checklist:
                </label>
                <div id="checklist-container" style="margin-bottom: 10px;">
                  ${(card.checklist || []).map((item, index) => `
                    <div class="checklist-item" style="display: flex; align-items: center; margin-bottom: 8px;">
                      <input
                        type="checkbox"
                        id="checklist-${index}"
                        class="checklist-checkbox"
                        ${item.completed ? 'checked' : ''}
                        style="margin-right: 8px;"
                      >
                      <input
                        type="text"
                        value="${item.text}"
                        class="checklist-text swal2-input"
                        style="flex: 1; margin: 0;"
                      >
                      <button
                        type="button"
                        class="checklist-delete-btn"
                        style="margin-left: 8px; background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px;"
                        onclick="this.parentElement.remove()"
                      >
                        ×
                      </button>
                    </div>
                  `).join('')}
                </div>
                <button
                  type="button"
                  onclick="addChecklistItem()"
                  style="background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;"
                >
                  + Add Item
                </button>
              </div>
            </div>
          `,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Save',
            denyButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            didOpen: () => {
              // Add the function to the window object so it can be called from the HTML
              window.addChecklistItem = () => {
                const container = document.getElementById('checklist-container');
                const newItem = document.createElement('div');
                newItem.className = 'checklist-item';
                newItem.style = 'display: flex; align-items: center; margin-bottom: 8px;';
                newItem.innerHTML = `
                <input
                  type="checkbox"
                  class="checklist-checkbox"
                  style="margin-right: 8px;"
                >
                <input
                  type="text"
                  placeholder="Enter checklist item..."
                  class="checklist-text swal2-input"
                  style="flex: 1; margin: 0;"
                >
                <button
                  type="button"
                  class="checklist-delete-btn"
                  style="margin-left: 8px; background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px;"
                  onclick="this.parentElement.remove()"
                >
                  ×
                </button>
              `;
                container.appendChild(newItem);
              };
            },
            preConfirm: () => {
              const checklistItems = Array.from(document.querySelectorAll('.checklist-item')).map(item => ({
                text: item.querySelector('.checklist-text').value,
                completed: item.querySelector('.checklist-checkbox').checked
              }));

              const selectedCheckboxes = document.querySelectorAll('.contributor-checkbox:checked');
              const selectedResponsibles = selectedCheckboxes.length > 0
                ? Array.from(selectedCheckboxes).map(cb => cb.value)
                : ['Unassigned'];

              return {
                title: document.getElementById('swal-input-title').value,
                responsible: selectedResponsibles,
                description: document.getElementById('swal-input-description').value,
                checklist: checklistItems
              };
            }
          }).then((result) => {
            if (result.isConfirmed) {
              fetch(`http://localhost:5000/api/cards/${card._id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(result.value)
              })
                .then(response => {
                  if (!response.ok) throw new Error('Error updating');

                  Swal.fire({
                    title: "Changes saved!",
                    text: "Task has been updated successfully",
                    icon: "success",
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false
                  }).then(() => {
                    window.location.reload();
                  });
                })
                .catch(() => {
                  Swal.fire('Error', 'Could not update task', 'error');
                });
            } else if (result.isDenied) {
              Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
              }).then((confirmResult) => {
                if (confirmResult.isConfirmed) {
                  fetch(`http://localhost:5000/api/cards/${card._id}`, {
                    method: "DELETE",
                    headers: {
                      "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                  })
                    .then(response => {
                      if (!response.ok) throw new Error('Error deleting');

                      div.remove();
                      Swal.fire('Deleted!', 'Task has been deleted', 'success');
                    })
                    .catch(() => {
                      Swal.fire('Error', 'Could not delete task', 'error');
                    });
                }
              });
            }
          });
        })
        .catch(error => {
          console.error("Error getting contributors:", error);
          Swal.fire('Error', 'Could not load contributors', 'error');
        });
    });

    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card._id);
    });

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "task-buttons";
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.gap = "8px";
    buttonsDiv.style.marginTop = "10px";

    const duplicateBtn = document.createElement("button");
    duplicateBtn.textContent = "Duplicate";
    duplicateBtn.className = "edit-btn"; // reutilizamos estilo existente
    duplicateBtn.onclick = () => duplicateCard(card);

    buttonsDiv.appendChild(duplicateBtn);

    div.appendChild(contentDiv);
    div.appendChild(buttonsDiv);

    container.appendChild(div);
  }

  function clearAllTasks() {
    document.querySelectorAll(".task-container").forEach(container => container.innerHTML = "");
  }

  return (
    <div className="board-wrapper">
      <MenuDashboard handleLogout={handleLogout} toggleMenu={toggleMenu} menuOpen={menuOpen} />

      {/* Banner de rol */}
      {userRole && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            right: '20px',
            padding: '8px 15px',
            borderRadius: '0 0 8px 8px',
            backgroundColor: getRoleColor(userRole),
            color: 'white',
            fontWeight: 'bold',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          <span>{getRoleIcon(userRole)}</span>
          <span>
            {userRole === "edition" ? "Edition" :
              userRole === "reading" ? "Reader" : "No access"}
          </span>
        </div>
      )}

      {/* Avatares de contribuyentes */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: menuOpen ? '280px' : '80px', // Se ajusta según el estado del menú
        padding: '8px 15px',
        display: 'flex',
        gap: '8px',
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: '15px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        transition: 'left 0.3s ease', // Animación suave al abrir/cerrar menú
        alignItems: 'center'
      }}>
        <span style={{
          marginRight: '8px',
          fontSize: '14px',
          color: '#666',
          fontWeight: '500'
        }}>
          Contributors:
        </span>
        {contributors.map((contributor, index) => (
          <div
            key={index}
            title={contributor.email}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: getRandomColor(contributor.email),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {getInitials(contributor.email)}
          </div>
        ))}
      </div>

      <div id="board-container" className={`board-content ${menuOpen ? "menu-open" : "menu-closed"}`}></div>
    </div>
  );
}

export default Board;
