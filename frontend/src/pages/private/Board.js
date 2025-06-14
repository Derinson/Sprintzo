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

  // Definir los colores disponibles para las etiquetas
  const labelColors = {
    red: { color: '#ff4444', name: 'Alta Prioridad' },
    orange: { color: '#ffbb33', name: 'Media Prioridad' },
    green: { color: '#00C851', name: 'Baja Prioridad' },
    blue: { color: '#33b5e5', name: 'Bug' },
    purple: { color: '#aa66cc', name: 'Mejora' },
    yellow: { color: '#ffeb3b', name: 'Documentación' },
    pink: { color: '#ff4081', name: 'Diseño' },
    teal: { color: '#009688', name: 'Testing' }
  };

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
          
          if (!showArchived) {
            fetch(`http://localhost:5000/api/cards/board/${boardId}?archived=true`)
            .then(res => res.json())
            .then(archivedCards => {
              if (!archivedCards || archivedCards.length === 0) {
                Swal.fire({
                  title: "No Archived Cards",
                  text: "There are no archived cards in this board yet",
                  icon: "info",
                  confirmButtonText: "OK"
                });
                return;
              }
              setShowArchived(true);
              toggleArchivedBtn.innerHTML = `<span>🗃️</span> Show Active`;
              loadCards(boardId);
            });
          } else {
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

        const boardId = window.location.pathname.split("/board/")[1];
        loadCards(boardId);

        // Configurar drag and drop solo para usuarios con permisos de edición
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

              fetch(`http://localhost:5000/api/cards/${cardId}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
              })
              .then(res => res.json())
              .then(currentCard => {
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
                    column: newColumn,
                    labels: currentCard.labels,
                    checklist: currentCard.checklist
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

  function duplicateCard(originalCard) {
    const boardId = window.location.pathname.split("/board/")[1];
    const token = localStorage.getItem("token");

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
        labels: originalCard.labels,
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
      loadCards(boardId);
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
          title: '<h2 class="swal2-title">Assign Labels</h2>',
          html: `
            <div class="labels-selector">
              ${Object.entries(labelColors).map(([key, value]) => `
                <div 
                  class="label-badge-selectable" 
                  data-label="${key}" 
                  style="background: ${value.color}; color: #fff;"
                >
                  ${value.name}
                </div>
              `).join('')}
            </div>
            <input type="hidden" id="selected-labels" value="">
          `,
          showCancelButton: true,
          confirmButtonText: 'Next',
          cancelButtonText: 'Cancel',
          didOpen: () => {
            const selected = new Set();
            document.querySelectorAll('.label-badge-selectable').forEach(badge => {
              badge.onclick = () => {
                const label = badge.dataset.label;
                if (selected.has(label)) {
                  selected.delete(label);
                  badge.classList.remove('selected');
                } else {
                  selected.add(label);
                  badge.classList.add('selected');
                }
                document.getElementById('selected-labels').value = Array.from(selected).join(',');
              };
            });
          },
          preConfirm: () => {
            const selectedLabels = document.getElementById('selected-labels').value.split(',').filter(Boolean);
            return {
              title: titleResult.value,
              labels: selectedLabels
            };
          }
        }).then(labelsResult => {
          if (!labelsResult.value) return;

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
                title: labelsResult.value.title,
                labels: labelsResult.value.labels,
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
                    labels: responsibleResult.value.labels,
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
    div.setAttribute("draggable", userRole === "edition" && !card.archived);
    div.dataset.id = card._id;

    const contentDiv = document.createElement("div");
    contentDiv.className = "task-content";
    contentDiv.style.cursor = userRole === "edition" && !card.archived ? "pointer" : "default";
    contentDiv.style.transition = "background-color 0.3s ease";
    contentDiv.style.position = "relative";

    // HEADER: responsables (izq) y labels (der)
    const headerContainer = document.createElement("div");
    headerContainer.style.display = "flex";
    headerContainer.style.justifyContent = "space-between";
    headerContainer.style.alignItems = "flex-start";
    headerContainer.style.marginBottom = "8px";

    // Responsables (izquierda)
    const responsibleContainer = document.createElement("div");
    responsibleContainer.style.display = "flex";
    responsibleContainer.style.alignItems = "center";
    responsibleContainer.style.gap = "4px";
    responsibleContainer.style.flexWrap = "wrap";
    responsibleContainer.style.minWidth = "fit-content";
    const responsibles = Array.isArray(card.responsible) ? card.responsible : [card.responsible];
    const avatarsContainer = document.createElement("div");
    avatarsContainer.style.display = "flex";
    avatarsContainer.style.gap = "2px";
    avatarsContainer.style.flexDirection = "row-reverse";
    responsibles.forEach(responsible => {
      const avatarContainer = document.createElement("div");
      avatarContainer.style.position = "relative";
      avatarContainer.style.display = "inline-block";
      avatarContainer.style.marginLeft = "-8px";
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
      avatar.title = responsible;
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

    // Labels (derecha)
    const labelsContainer = document.createElement("div");
    labelsContainer.className = "labels-container";
    labelsContainer.style.display = "flex";
    labelsContainer.style.flexWrap = "wrap";
    labelsContainer.style.gap = "6px";
    labelsContainer.style.justifyContent = "flex-end";
    labelsContainer.style.alignItems = "center";
    labelsContainer.style.maxWidth = "60%";
    if (card.labels && card.labels.length > 0) {
      card.labels.forEach(label => {
        const labelElement = document.createElement("div");
        labelElement.className = "label";
        labelElement.style.background = labelColors[label]?.color || "#888";
        labelElement.textContent = labelColors[label]?.name || label;
        labelsContainer.appendChild(labelElement);
      });
    }

    headerContainer.appendChild(responsibleContainer);
    headerContainer.appendChild(labelsContainer);
    contentDiv.appendChild(headerContainer);

    // Título con icono
    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.alignItems = "center";
    titleRow.style.gap = "8px";
    titleRow.style.margin = "0 0 6px 0";

    const pinIcon = document.createElement("span");
    pinIcon.textContent = "📌";
    pinIcon.style.fontSize = "18px";
    pinIcon.style.marginRight = "2px";

    const titleElement = document.createElement("h3");
    titleElement.className = "titl";
    titleElement.textContent = card.title;
    titleElement.style.margin = "0";
    titleElement.style.fontSize = "16px";
    titleElement.style.fontWeight = "600";
    titleElement.style.color = "#2c3e50";

    titleRow.appendChild(pinIcon);
    titleRow.appendChild(titleElement);
    contentDiv.appendChild(titleRow);

    // Descripción
    const descriptionContainer = document.createElement("div");
    descriptionContainer.style.marginTop = "4px";
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

    // Agregar indicador visual si la tarjeta está archivada
    if (card.archived) {
      const archivedBadge = document.createElement("div");
      archivedBadge.className = "archived-badge";
      archivedBadge.textContent = "🗃️ Archived";
      contentDiv.appendChild(archivedBadge);
      div.style.opacity = "0.7";
      div.classList.add("archived");
    }

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
                    🏷️ Labels:
                  </label>
                  <div class="labels-selector">
                    ${Object.entries(labelColors).map(([key, value]) => `
                      <div 
                        class="label-badge-selectable${card.labels && card.labels.includes(key) ? ' selected' : ''}" 
                        data-label="${key}" 
                        style="background: ${value.color}; color: #fff;"
                      >
                        ${value.name}
                      </div>
                    `).join('')}
                  </div>
                  <input type="hidden" id="selected-labels" value="${card.labels ? card.labels.join(',') : ''}">
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
            denyButtonText: 'Archive',
            cancelButtonText: 'Delete',
            showConfirmButton: true,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonColor: '#0052cc',
            denyButtonColor: '#6c757d',
            cancelButtonColor: '#dc3545',
            reverseButtons: true,
            didOpen: () => {
              const selected = new Set(card.labels || []);
              document.querySelectorAll('.label-badge-selectable').forEach(badge => {
                if (selected.has(badge.dataset.label)) badge.classList.add('selected');
                badge.onclick = () => {
                  const label = badge.dataset.label;
                  if (selected.has(label)) {
                    selected.delete(label);
                    badge.classList.remove('selected');
                  } else {
                    selected.add(label);
                    badge.classList.add('selected');
                  }
                  document.getElementById('selected-labels').value = Array.from(selected).join(',');
                };
              });
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

              const selectedCheckboxes = document.querySelectorAll('.contributor-checkbox:checked');
              const selectedResponsibles = selectedCheckboxes.length > 0 
                ? Array.from(selectedCheckboxes).map(cb => cb.value)
                : ['Unassigned'];

              const selectedLabels = document.getElementById('selected-labels').value.split(',').filter(Boolean);
              
              return {
                title: document.getElementById('swal-input-title').value,
                responsible: selectedResponsibles,
                description: document.getElementById('swal-input-description').value,
                checklist: checklistItems,
                labels: selectedLabels
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
        Swal.fire({
          title: '<h2 class="swal2-title">📄 Archived Card</h2>',
          html: `
            <div style="text-align: left; padding: 10px;">
              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="font-weight: bold;">
                  📝 Title:
                </label>
                <p>${card.title}</p>
              </div>
              
              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="font-weight: bold;">
                  👥 Responsible:
                </label>
                <p>${Array.isArray(card.responsible) ? card.responsible.join(', ') : card.responsible}</p>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight: bold;">
                  📄 Description:
                </label>
                <p>${card.description}</p>
              </div>

              <div class="form-group" style="margin-top: 20px;">
                <label class="form-label" style="font-weight: bold;">
                  🗃️ Archived on:
                </label>
                <p>${new Date(card.archivedAt).toLocaleString()}</p>
              </div>
            </div>
          `,
          showCancelButton: userRole === "edition",
          confirmButtonText: 'Close',
          confirmButtonColor: '#6c757d',
          cancelButtonText: '🔄 Unarchive',
          cancelButtonColor: '#28a745'
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.cancel && userRole === "edition") {
            Swal.fire({
              title: 'Unarchive card?',
              text: "The card will be active again on the board",
              icon: 'question',
              showCancelButton: true,
              confirmButtonColor: '#28a745',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Yes, unarchive',
              cancelButtonText: 'Cancel'
            }).then((confirmResult) => {
              if (confirmResult.isConfirmed) {
                const boardId = window.location.pathname.split("/board/")[1];
                
                fetch(`http://localhost:5000/api/cards/${card._id}/unarchive`, {
                  method: "PUT",
                  headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                  }
                })
                .then(response => {
                  if (!response.ok) throw new Error('Error unarchiving');
                  return response.json();
                })
                .then(() => {
                  Swal.fire({
                    title: 'Unarchived!',
                    text: 'The card has been unarchived successfully',
                    icon: 'success',
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false
                  }).then(() => {
                    loadCards(boardId);
                  });
                })
                .catch(() => {
                  Swal.fire('Error', 'Could not unarchive the card', 'error');
                });
              }
            });
          }
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

    // Solo mostrar el botón de duplicar si el usuario tiene permisos de edición
    if (userRole === "edition" && !card.archived) {
      const duplicateBtn = document.createElement("button");
      duplicateBtn.textContent = "Duplicate";
      duplicateBtn.className = "edit-btn";
      duplicateBtn.onclick = () => duplicateCard(card);
      buttonsDiv.appendChild(duplicateBtn);
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
      <MenuDashboard
        handleLogout={handleLogout}
        toggleMenu={toggleMenu}
        menuOpen={menuOpen}
      />
      <div className={`board-content ${!menuOpen ? 'menu-closed' : ''}`} id="board-container">
        {/* El contenido del tablero se insertará aquí dinámicamente */}
      </div>
    </div>
  );
}

export default Board;