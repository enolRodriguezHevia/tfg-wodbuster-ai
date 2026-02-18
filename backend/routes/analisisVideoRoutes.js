const express = require("express");
const router = express.Router();
const multer = require("multer");
const analisisVideoController = require("../controllers/analisisVideoController");
const authMiddleware = require("../middleware/authMiddleware");

// Configuración de multer - Solo para validación, sin guardar archivos
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Aceptar solo videos mp4 y webm
  const allowedTypes = ["video/mp4", "video/webm"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de video no válido. Solo se permiten MP4 y WebM"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

// POST /api/analisis-video/analizar - Analizar video
router.post("/analizar", upload.single("video"), analisisVideoController.analizarVideo);


module.exports = router;
