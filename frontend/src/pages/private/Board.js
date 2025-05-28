import React, { useEffect, useState } from "react";
import "./css/board.css";
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
          title: "Task Title",
          input: "text",
          inputPlaceholder: "Enter title",
          showCancelButton: true,
          confirmButtonText: 'Next',
          cancelButtonText: 'Cancel'
        }).then(titleResult => {
          if (!titleResult.value) return;

          Swal.fire({
            title: "Assign Responsible",
            input: "select",
            inputOptions: {
              "": "🔹 Unassigned",
              ...Object.fromEntries(contribuyentes.map(c => [c.email, `${c.email} `]))
            },
            showCancelButton: true,
            confirmButtonText: 'Next',
            cancelButtonText: 'Cancel'
          }).then(responsibleResult => {
            if (responsibleResult.dismiss) return;

            Swal.fire({
              title: "Task Description",
              input: "text",
              inputPlaceholder: "Enter description",
              showCancelButton: true,
              confirmButtonText: 'Create',
              cancelButtonText: 'Cancel'
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
                  title: titleResult.value,
                  responsible: responsibleResult.value || "Unassigned",
                  description: descriptionResult.value,
                  column: columnChoice,
                  boardId
                })
              })
                .then(res => res.json())
                .then(() => {
                  Swal.fire("Saved!", "The card has been created successfully.", "success");
                  fetch(`http://localhost:5000/api/cards/board/${boardId}`)
                    .then(res => res.json())
                    .then(cards => {
                      clearAllTasks();
                      cards.forEach(renderCard);
                    });
                })
                .catch(err => {
                  console.error(err);
                  Swal.fire("Error", "Could not save the task in the database.", "error");
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

    const titleElement = document.createElement("h3");
    titleElement.className = "titl";
    titleElement.textContent = `📌 ${card.title}`;

    const responsibleElement = document.createElement("p");
    responsibleElement.className = "responsible";
    responsibleElement.textContent = `👤 ${card.responsible}`;

    const descriptionElement = document.createElement("p");
    descriptionElement.className = "description";
    descriptionElement.textContent = card.description;

    contentDiv.appendChild(titleElement);
    contentDiv.appendChild(responsibleElement);
    contentDiv.appendChild(descriptionElement);

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
          title: '<h2 style="color: #2c3e50; font-size: 24px; margin-bottom: 20px;">✏️ Edit Card</h2>',
          html: `
            <div style="text-align: left; padding: 10px;">
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; color: #34495e; font-weight: 600; margin-bottom: 8px;">
                  📝 Title:
                </label>
                <input 
                  id="swal-input-title" 
                  class="swal2-input" 
                  value="${card.title}"
                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;"
                >
              </div>
              
              <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; color: #34495e; font-weight: 600; margin-bottom: 8px;">
                  👤 Responsible:
                </label>
                <select 
                  id="swal-input-responsible" 
                  class="swal2-select"
                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; background-color: white;"
                >
                  <option value="">🔹 Unassigned</option>
                  ${contribuyentes.map(c => `
                    <option value="${c.email}" ${c.email === card.responsible ? "selected" : ""}>
                      ${c.email}
                    </option>
                  `).join("")}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 10px;">
                <label style="display: block; color: #34495e; font-weight: 600; margin-bottom: 8px;">
                  📄 Description:
                </label>
                <textarea 
                  id="swal-input-description" 
                  class="swal2-textarea"
                  style="width: 100%; min-height: 100px; padding: 8px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; resize: vertical;"
                >${card.description}</textarea>
              </div>
            </div>
          `,
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: 'Save',
          denyButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#3085d6',
          denyButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          width: '600px',
          focusConfirm: false
        }).then((result) => {
          if (result.isConfirmed) {
            fetch(`http://localhost:5000/api/cards/${card._id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({
                title: document.getElementById("swal-input-title").value,
                responsible: document.getElementById("swal-input-responsible").value || "Unassigned",
                description: document.getElementById("swal-input-description").value
              })
            })
            .then(response => {
              if (!response.ok) throw new Error('Error updating');
              
              Swal.fire({
                title: "Changes saved!",
                text: "The card has been updated successfully",
                icon: "success",
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
              }).then(() => {
                window.location.reload();
              });
            })
            .catch(() => {
              Swal.fire('Error', 'Could not update the card', 'error');
            });
          } else if (result.isDenied) {
            Swal.fire({
              title: 'Are you sure?',
              text: "This action cannot be undone",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#dc3545',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Yes, delete it',
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
                  Swal.fire('Deleted!', 'The card has been deleted', 'success');
                })
                .catch(() => {
                  Swal.fire('Error', 'Could not delete the card', 'error');
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
