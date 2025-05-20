import React, { useEffect, useState } from "react";
import "./css/profile.css";
import MenuDashboard from "./MenuDashboard"; // Importamos el menú como componente

function UserProfile() {
  const [menuOpen, setMenuOpen] = useState(true); // Estado para controlar el menú

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Alternar el menú
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    fetch("/pages/userProfile.html") // Cargar el HTML del perfil
      .then((response) => response.text())
      .then((html) => {
        const container = document.getElementById("user-profile-container");
        if (container) {
          container.innerHTML = html; // Inserta el perfil sin borrar el menú

          // Esperar unos milisegundos para garantizar que los elementos del formulario ya existen
          setTimeout(() => {
            fetchUserData();
            attachEventListeners();
          }, 200); // Pequeño delay para asegurar que los elementos ya existen
        }
      })
      .catch((error) => {
        console.error("Error loading userProfile.html:", error);
      });
  }, []);

  const fetchUserData = async () => {
    try {
      const emailField = document.querySelector("#email");
      const usernameField = document.querySelector("#username");
      const errorMessage = document.querySelector("#error-message");

      if (!emailField || !usernameField) {
        console.error("User profile elements not found yet.");
        return;
      }

      const response = await fetch("http://localhost:5000/userRoutes/get-user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        emailField.value = data.email;
        usernameField.value = data.username;
      } else {
        errorMessage.textContent = data.message || "Error fetching user data.";
      }
    } catch (err) {
      document.getElementById("error-message").textContent = "Server error. Please try again later.";
    }
  };

  const attachEventListeners = () => {
    const emailField = document.querySelector("#email");
    const usernameField = document.querySelector("#username");
    const passwordField = document.querySelector("#password");
    const updateButton = document.querySelector("#update-button");
    const successMessage = document.querySelector("#success-message");
    const errorMessage = document.querySelector("#error-message");

    if (emailField && usernameField && passwordField && updateButton) {
      updateButton.addEventListener("click", async (e) => {
        e.preventDefault();

        const updatedData = {
          email: emailField.value,
          username: usernameField.value,
          password: passwordField.value,
        };

        try {
          const response = await fetch("http://localhost:5000/userRoutes/edit-user", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(updatedData),
          });

          const data = await response.json();
          if (response.ok) {
            successMessage.textContent = "User updated successfully!";
            passwordField.value = ""; // Limpiar el campo de contraseña

            // 🔄 Recargar la página para reflejar los cambios
            setTimeout(() => {
              window.location.reload();
            }, 1000); // Espera 1 segundo para que el usuario vea el mensaje de éxito antes de recargar
          } else {
            errorMessage.textContent = data.message || "Error updating user.";
          }
        } catch (error) {
          errorMessage.textContent = "Server error. Please try again later.";
        }
      });
    } else {
      console.error("Elements not found for attaching event listeners.");
    }
  };

  return (
    <div className="profile-wrapper">
      <MenuDashboard handleLogout={handleLogout} toggleMenu={toggleMenu} menuOpen={menuOpen} />
      <div
        id="user-profile-container"
        className={`profile-content ${menuOpen ? "menu-open" : "menu-closed"}`}
      ></div>
    </div>
  );
}

export default UserProfile;
