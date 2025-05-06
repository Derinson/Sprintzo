import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token"); // Verifica si el token está presente
  return token ? children : <Navigate to="/login" />; // Redirige a login si no hay token
}

export default PrivateRoute;
