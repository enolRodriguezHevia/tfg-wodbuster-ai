const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    // Obtener token del header
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({ message: "No hay token, autorización denegada" });
    }

    // Verificar token (puede venir como "Bearer <token>")
    const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token;

    // Verificar y decodificar token
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET || "secretkey");

    // Agregar usuario al request
    req.user = decoded;
    next();

  } catch (err) {
    res.status(401).json({ message: "Token no válido" });
  }
};
