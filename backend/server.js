const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authUser = require("./routes/userRoutes");
const tablerosRoutes = require("./routes/tablerosRoutes");
const cardRoutes = require('./routes/cardRoutes');
const notificacionesRoutes = require('./routes/notificacionesRoutes');
const path = require('path');

const app = express();

// Conectar a MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/userRoutes", authUser); // Ruta de usuarios sigue igual
app.use("/tablerosRoutes", tablerosRoutes); // Ruta de tableros con autenticación
app.use('/api/cards', cardRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});