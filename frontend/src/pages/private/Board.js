import React, { useEffect, useState } from "react";
import "./css/board.css";
import "./css/sweetalert-custom.css"; // Importamos los estilos personalizados para SweetAlert
import MenuDashboard from "./MenuDashboard"; // Importamos el menú
import Swal from "sweetalert2"; // Importamos SweetAlert

function Board() {
  const [menuOpen, setMenuOpen] = useState(true); // Estado para controlar el menú
  const [userRole, setUserRole] = useState(null); // Nuevo estado para el rol
  const [contributors, setContributors] = useState([]);
  const [showArchived, setShowArchived] = useState(false); // Estado para mostrar/ocultar archivadas

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Alterna entre abierto/cerrado
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Función para obtener el color según el rol
  const getRoleColor = (role) => {
    switch(role) {
      case "edition": return "#4CAF50";
      case "reading": return "#2196F3";
      default: return "#f44336";
    }
  };

  // Función para obtener el icono según el rol
  const getRoleIcon = (role) => {
    switch(role) {
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
    // Verificar si viene de la página de archivados
    const fromArchived = document.referrer.includes('/archived-boards');
    if (fromArchived) {
      setShowArchived(true);
    }

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

      if (rolData.rol === "reading") {
        // Deshabilitar todas las acciones para usuarios de solo lectura
        document.documentElement.style.setProperty('--action-disabled-opacity', '0.6');
        document.documentElement.style.setProperty('--action-disabled-cursor', 'not-allowed');
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
        
        // Crear el encabezado del tablero
        const boardHeader = document.createElement("div");
        boardHeader.className = "board-header";

        // Sección de contribuyentes
        const contributorsSection = document.createElement("div");
        contributorsSection.className = "contributors-section";

        const contributorsLabel = document.createElement("span");
        contributorsLabel.className = "contributors-label";
        contributorsLabel.textContent = "Contributors:";

        const contributorsList = document.createElement("div");
        contributorsList.className = "contributors-list";
        
        contributors.forEach(contributor => {
          const avatar = document.createElement("div");
          avatar.className = "contributor-avatar";
          avatar.style.backgroundColor = getRandomColor(contributor.email);
          avatar.title = contributor.email;
          avatar.textContent = getInitials(contributor.email);
          contributorsList.appendChild(avatar);
        });

        contributorsSection.appendChild(contributorsLabel);
        contributorsSection.appendChild(contributorsList);
        
        // Crear el contenedor de botones
        const actionButtonsContainer = document.createElement("div");
        actionButtonsContainer.className = "action-buttons-container";
        
        // Crear el botón de archivados
        const toggleArchivedBtn = document.createElement("button");
        toggleArchivedBtn.id = "toggle-archived-btn";
        toggleArchivedBtn.className = "global-add-task-btn";
        toggleArchivedBtn.innerHTML = `<span>🗃️</span> ${showArchived ? 'Show Active' : 'Show Archived'}`;
        
        toggleArchivedBtn.onclick = () => {
          const boardId = window.location.pathname.split("/board/")[1];
          
          // Si vamos a mostrar archivados, primero verificamos si hay
          if (!showArchived) {
            fetch(`http://localhost:5000/api/cards/board/${boardId}?archived=true`)
            .then(res => res.json())
            .then(archivedCards => {
              if (!archivedCards || archivedCards.length === 0) {
                Swal.fire({
                  title: "No hay tarjetas archivadas",
                  text: "Aún no hay tarjetas archivadas en este tablero",
                  icon: "info",
                  confirmButtonText: "OK"
                });
                return;
              }
              // Si hay archivados, cambiamos el estado y actualizamos el botón
              setShowArchived(true);
              toggleArchivedBtn.innerHTML = `<span>🗃️</span> Show Active`;
              loadCards(boardId);
            });
          } else {
            // Si estamos mostrando archivados y queremos ver activos, simplemente cambiamos
            setShowArchived(false);
            toggleArchivedBtn.innerHTML = `<span>🗃️</span> Show Archived`;
            loadCards(boardId);
          }
        };

        // Mover los botones al nuevo contenedor
        actionButtonsContainer.appendChild(addTaskBtn);
        actionButtonsContainer.appendChild(addColumnBtn);
        actionButtonsContainer.appendChild(toggleArchivedBtn);

        // Si es usuario de lectura, deshabilitar botones de acción
        if (userRole === "reading") {
          addTaskBtn.style.display = "none";
          addColumnBtn.style.display = "none";
        }

        // Agregar las secciones al encabezado
        boardHeader.appendChild(contributorsSection);
        boardHeader.appendChild(actionButtonsContainer);

        // Insertar el encabezado al inicio del board-container
        const boardContainer = document.getElementById("board-container");
        boardContainer.insertBefore(boardHeader, boardContainer.firstChild);

        // Agregar el badge de rol
        const roleBadge = document.createElement("div");
        roleBadge.className = `role-badge ${userRole}`;
        roleBadge.innerHTML = `
          <span>${getRoleIcon(userRole)}</span>
          <span>${userRole === "edition" ? "Edition" : "Reader"}</span>
        `;
        document.body.appendChild(roleBadge);

        if (addTaskBtn && addColumnBtn && userRole === "edition") {
          addTaskBtn.addEventListener("click", addTask);
          addColumnBtn.addEventListener("click", addColumn);
        }

        // Obtener el `boardId` desde la URL
        const boardId = window.location.pathname.split("/board/")[1];

        // Cargar las tareas del tablero desde la base de datos
        loadCards(boardId);

        // Configurar los contenedores para drag and drop solo si tiene permisos de edición
        if (userRole === "edition") {
          const containers = document.querySelectorAll(".task-container");
          containers.forEach(container => {
            container.addEventListener("dragover", (e) => {
              e.preventDefault();
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
                  loadCards(boardId);
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
        }
      })
      .catch((error) => {
        console.error("Error loading board.html:", error);
      });
  }, [showArchived, userRole, contributors]);

  // Función para cargar las tarjetas
  const loadCards = (boardId) => {
    fetch(`http://localhost:5000/api/cards/board/${boardId}?archived=${showArchived}`)
      .then(res => res.json())
      .then(cards => {
        clearAllTasks();
        cards.forEach(renderCard);
      });
  };

  function addColumn() {
    Swal.fire("Feature not implemented yet", "", "info");
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
              confirmButtonText: 'Create',
              cancelButtonText: 'Cancel',
            }).then(descriptionResult => {
              if (!descriptionResult.value) return;

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
                loadCards(boardId);
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
  }

  function renderCard(card) {
    const container = document.getElementById(`${card.column}-tasks`);
    if (!container) {
      console.warn(`Column ${card.column} not found`);
      return;
    }

    const div = document.createElement("div");
    div.className = "task-card";
    // Solo permitir drag and drop si el usuario tiene permisos de edición y la tarjeta no está archivada
    div.setAttribute("draggable", userRole === "edition" && !card.archived);
    div.dataset.id = card._id;

    const contentDiv = document.createElement("div");
    contentDiv.className = "task-content";
    contentDiv.style.cursor = userRole === "edition" && !card.archived ? "pointer" : "default";
    contentDiv.style.transition = "background-color 0.3s ease";
    contentDiv.style.position = "relative";

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

    contentDiv.style.backgroundColor = "transparent";

    // Solo agregar el evento click para editar si el usuario tiene permisos de edición
    if (userRole === "edition" && !card.archived) {
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

                <div class="form-group">
                  <label class="form-label">
                    📄 Description:
                  </label>
                  <textarea 
                    id="swal-input-description" 
                    class="swal2-textarea"
                  >${card.description}</textarea>
                </div>
              </div>
            `,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Save',
            denyButtonText: 'Archive',
            cancelButtonText: 'Delete',
            showConfirmButton: true,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonColor: '#0052cc',
            denyButtonColor: '#6c757d',
            cancelButtonColor: '#dc3545',
            reverseButtons: true,
            preConfirm: () => {
              const selectedCheckboxes = document.querySelectorAll('.contributor-checkbox:checked');
              const selectedResponsibles = selectedCheckboxes.length > 0 
                ? Array.from(selectedCheckboxes).map(cb => cb.value)
                : ['Unassigned'];
              
              return {
                title: document.getElementById('swal-input-title').value,
                responsible: selectedResponsibles,
                description: document.getElementById('swal-input-description').value
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
                  loadCards(boardId);
                });
              })
              .catch(() => {
                Swal.fire('Error', 'Could not update task', 'error');
              });
            } else if (result.isDenied) {
              fetch(`http://localhost:5000/api/cards/${card._id}/archive`, {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
              })
              .then(response => {
                if (!response.ok) throw new Error('Error archiving');
                return response.json();
              })
              .then(() => {
                Swal.fire({
                  title: 'Task archived!',
                  text: 'Task has been archived successfully',
                  icon: "success",
                  timer: 1500,
                  timerProgressBar: true,
                  showConfirmButton: false
                }).then(() => {
                  loadCards(boardId);
                });
              })
              .catch(() => {
                Swal.fire('Error', 'Could not archive task', 'error');
              });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
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
                    
                    Swal.fire({
                      title: 'Deleted!',
                      text: 'Task has been deleted',
                      icon: 'success',
                      timer: 1500,
                      timerProgressBar: true,
                      showConfirmButton: false
                    }).then(() => {
                      loadCards(boardId);
                    });
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
    } else if (card.archived) {
      contentDiv.addEventListener("click", () => {
        // Mostrar vista de solo lectura para tarjetas archivadas
        Swal.fire({
          title: '<h2 class="swal2-title">📄 Tarjeta Archivada</h2>',
          html: `
            <div style="text-align: left; padding: 10px;">
              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="font-weight: bold;">
                  📝 Título:
                </label>
                <p>${card.title}</p>
              </div>
              
              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="font-weight: bold;">
                  👥 Responsables:
                </label>
                <p>${Array.isArray(card.responsible) ? card.responsible.join(', ') : card.responsible}</p>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight: bold;">
                  📄 Descripción:
                </label>
                <p>${card.description}</p>
              </div>

              <div class="form-group" style="margin-top: 20px;">
                <label class="form-label" style="font-weight: bold;">
                  🗃️ Archivada el:
                </label>
                <p>${new Date(card.archivedAt).toLocaleString()}</p>
              </div>
            </div>
          `,
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#6c757d'
        });
      });
    }

    // Solo agregar drag and drop si el usuario tiene permisos de edición
    if (userRole === "edition" && !card.archived) {
      div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card._id);
      });
    }

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "task-buttons";
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.gap = "8px";
    buttonsDiv.style.marginTop = "10px";

    // Agregar indicador visual si la tarjeta está archivada
    if (card.archived) {
      const archivedBadge = document.createElement("div");
      archivedBadge.className = "archived-badge";
      archivedBadge.textContent = "🗃️ Archived";
      contentDiv.appendChild(archivedBadge);
      
      // Agregar estilo de opacidad a la tarjeta archivada
      div.style.opacity = "0.7";
      div.classList.add("archived");
    }

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
      <div id="board-container" className={`board-content ${menuOpen ? "menu-open" : "menu-closed"}`}></div>
    </div>
  );
}

export default Board;
