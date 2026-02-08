require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (fotos de perfil)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conectar a MongoDB
connectDB();

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/onerm', require('./routes/oneRMRoutes'));
app.use('/api/entrenamiento', require('./routes/entrenamientoRoutes'));
app.use('/api/wod-crossfit', require('./routes/wodCrossFitRoutes'));
app.use('/api/plan-entrenamiento', require('./routes/planEntrenamientoRoutes'));
app.use('/api/analisis-video', require('./routes/analisisVideoRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
