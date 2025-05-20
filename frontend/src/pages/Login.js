import { useEffect } from "react";
import "./login.css";

function Login() {
  useEffect(() => {
    fetch("/pages/login.html")
      .then((response) => response.text())
      .then((html) => {
        document.getElementById("root").innerHTML = html;

        // Selección de elementos del DOM
        const elements = {
          container: document.querySelector(".container"),
          signUpBtn: document.querySelector("#sign-up-btn"),
          signInBtn: document.querySelector("#sign-in-btn"),
          loginButton: document.querySelector("#login-button"),
          registerButton: document.querySelector("#register-button"),
          emailInput: document.querySelector("#email"),
          passwordInput: document.querySelector("#password"),
          signUpEmail: document.querySelector("#signup-email"),
          signUpUsername: document.querySelector("#signup-username"),
          signUpPassword: document.querySelector("#signup-password"),
          signInMessage: document.querySelector("#sign-in-message"),
          signUpMessage: document.querySelector("#sign-up-message"),
        };

        // Validación de existencia de elementos
        if (Object.values(elements).some((el) => !el)) {
          console.error("Elements not found after loading login.html");
          return;
        }

        // Alternar entre modos Sign Up y Sign In
        elements.signUpBtn.addEventListener("click", () => elements.container.classList.add("sign-up-mode"));
        elements.signInBtn.addEventListener("click", () => elements.container.classList.remove("sign-up-mode"));

        // Validación de email
        const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        // Función de inicio de sesión
        elements.loginButton.addEventListener("click", async (e) => {
          e.preventDefault();
          const { emailInput, passwordInput, signInMessage } = elements;
          const email = emailInput.value.trim();
          const password = passwordInput.value.trim();

          if (!validarEmail(email)) {
            signInMessage.style.color = "red";
            signInMessage.textContent = "Please enter a valid email address.";
            return;
          }

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

            if (response.status === 200) {
              signInMessage.style.color = "green";
              signInMessage.textContent = data.message;
              localStorage.setItem("token", data.token);
              localStorage.setItem("username", data.username);
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

        // Función de registro
        elements.registerButton.addEventListener("click", async (e) => {
          e.preventDefault();
          const { signUpEmail, signUpUsername, signUpPassword, signUpMessage } = elements;
          const email = signUpEmail.value.trim();
          const username = signUpUsername.value.trim();
          const password = signUpPassword.value.trim();

          if (!validarEmail(email)) {
            signUpMessage.style.color = "red";
            signUpMessage.textContent = "Please enter a valid email address.";
            return;
          }

          if (!email || !username || !password) {
            signUpMessage.style.color = "red";
            signUpMessage.textContent = "Please fill in all fields.";
            return;
          }

          try {
            const response = await fetch("http://localhost:5000/userRoutes/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, username, password }),
            });

            const data = await response.json();
            if (response.status === 201) {
              signUpMessage.style.color = "green";
              signUpMessage.textContent = data.message;
              signUpEmail.value = "";
              signUpUsername.value = "";
              signUpPassword.value = "";
              window.location.href = "/dashboard";
            } else {
              signUpMessage.style.color = "red";
              signUpMessage.textContent = data.message;
            }
          } catch (error) {
            signUpMessage.style.color = "red";
            signUpMessage.textContent = "Server error. Please try again later.";
          }
        });
      })
      .catch((error) => console.error("Error loading login.html:", error));
  }, []);

  return null;
}

export default Login;
