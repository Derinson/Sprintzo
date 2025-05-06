
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authUser = require('./routes/userRoutes');

const app = express();

// Conectar a MongoDB
connectDB();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Opcional, para formularios codificados en URL

// Rutas
app.use('/userRoutes', authUser);



const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
