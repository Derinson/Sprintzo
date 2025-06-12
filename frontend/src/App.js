import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/private/Dashboard";
import PrivateRoute from "./pages/private/PrivateRoute"; // Protege rutas privadas
import Inicio from "./pages/Inicio";
import Board from "./pages/private/Board"; // Ahora está en una ruta privada
import UserProfile from "./pages/private/UserProfile";
import ArchivedBoards from "./pages/private/ArchivedBoards"; // Importamos el nuevo componente


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
        <Route
          path="/board/:id"
          element={
            <PrivateRoute>
              <Board />
            </PrivateRoute>
          }
        />
     
           <Route
          path="/profile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />

        <Route
          path="/archived-boards"
          element={
            <PrivateRoute>
              <ArchivedBoards />
            </PrivateRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
