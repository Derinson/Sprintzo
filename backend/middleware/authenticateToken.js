const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  // Obtener el token de las cabeceras de la solicitud
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Extraer el token del formato "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." }); // Usuario no autenticado
  }

  // Verificar el token con la clave secreta
  jwt.verify(token, process.env.JWT_SECRET || "your_secret_key", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." }); // Token no válido o expirado
    }

    req.user = user; // Agregar la información del usuario decodificada al objeto req
    next(); // Continuar al siguiente middleware o controlador
  });
}

module.exports = authenticateToken;
