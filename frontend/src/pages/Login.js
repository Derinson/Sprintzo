import React, { useEffect } from "react";
import "./login.css";

function Login() {
  useEffect(() => {
    fetch("/pages/login.html") // Ruta del archivo HTML
      .then((response) => response.text()) // Convierte la respuesta a texto
      .then((html) => {
        document.getElementById("root").innerHTML = html; // Inserta el contenido HTML en el DOM

        // Una vez cargado, interactúa con los elementos del DOM
        const container = document.querySelector(".container");
        const signUpBtn = document.querySelector("#sign-up-btn");
        const signInBtn = document.querySelector("#sign-in-btn");
        const loginButton = document.querySelector("#login-button");
        const registerButton = document.querySelector("#register-button");
        const emailInput = document.querySelector("#email"); // Actualizado para email en login
        const passwordInput = document.querySelector("#password");
        const signUpEmail = document.querySelector("#signup-email"); // Agregado para email en registro
        const signUpUsername = document.querySelector("#signup-username");
        const signUpPassword = document.querySelector("#signup-password");
        const signInMessage = document.querySelector("#sign-in-message");
        const signUpMessage = document.querySelector("#sign-up-message");

        if (
          container &&
          signUpBtn &&
          signInBtn &&
          loginButton &&
          registerButton &&
          emailInput &&
          passwordInput &&
          signUpEmail &&
          signUpUsername &&
          signUpPassword
        ) {
          // Alternar entre modos Sign Up y Sign In
          signUpBtn.addEventListener("click", () => {
            container.classList.add("sign-up-mode");
          });

          signInBtn.addEventListener("click", () => {
            container.classList.remove("sign-up-mode");
          });

          // Funcionalidad de Inicio de Sesión
          loginButton.addEventListener("click", async (e) => {
            e.preventDefault();
          
            const email = emailInput.value;
            const password = passwordInput.value;
          
            if (!email || !password) {
              signInMessage.style.color = "red";
              signInMessage.textContent = "Please fill in all fields.";
              return;
            }
          
            try {
              const response = await fetch("http://localhost:5000/userRoutes/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });
          
              const data = await response.json();
              console.log(data); // Verifica qué campos están disponibles en la respuesta
          
              if (response.status === 200) {
                signInMessage.style.color = "green";
                signInMessage.textContent = data.message;
          
                // Almacena el token y el username
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.username); // Asegúrate de que esto almacene el nombre correctamente
          
                // Redirige al dashboard
                window.location.href = "/dashboard";
              } else {
                signInMessage.style.color = "red";
                signInMessage.textContent = data.message;
              }
            } catch (error) {
              signInMessage.style.color = "red";
              signInMessage.textContent = "Server error. Please try again later.";
            }
          });
          
          

          // Funcionalidad de Registro
          registerButton.addEventListener("click", async (e) => {
            e.preventDefault();

            const email = signUpEmail.value; // Usando email en registro
            const username = signUpUsername.value;
            const password = signUpPassword.value;

            if (!email || !username || !password) {
              signUpMessage.style.color = "red";
              signUpMessage.textContent = "Please fill in all fields.";
              return;
            }

            try {
              const response = await fetch("http://localhost:5000/userRoutes/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, username, password }), // Incluyendo email y username
              });

              const data = await response.json();
              if (response.status === 201) {
                // Mensaje de éxito
                signUpMessage.style.color = "green";
                signUpMessage.textContent = data.message;

                // Limpia los inputs después de registrar
                signUpEmail.value = "";
                signUpUsername.value = "";
                signUpPassword.value = "";

                // Redirigir al dashboard después del registro
                window.location.href = "/dashboard"; // Cambia al dashboard
              } else {
                signUpMessage.style.color = "red";
                signUpMessage.textContent = data.message;
              }
            } catch (error) {
              signUpMessage.style.color = "red";
              signUpMessage.textContent = "Server error. Please try again later.";
            }
          });
        } else {
          console.error("Elements not found after loading login.html");
        }
      })
      .catch((error) => {
        console.error("Error loading login.html:", error);
      });
  }, []);

  return null; // React no renderiza directamente aquí
}

export default Login;
