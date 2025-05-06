import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/private/Dashboard";

import PrivateRoute from "./pages/private/PrivateRoute"; // Protege rutas privadas
import Inicio from "./pages/Inicio";



function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas Privadas */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
       

      </Routes>
    </Router>
  );
}

export default App;
