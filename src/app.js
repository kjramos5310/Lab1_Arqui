const express = require('express');
const cors = require('cors');
require('dotenv').config();

const personaRoutes = require('./routes/personaRoutes');
const libroRoutes = require('./routes/libroRoutes');
const prestamoRoutes = require('./routes/prestamoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//rutas
app.use('/api/personas', personaRoutes);
app.use('/api/autores', personaRoutes);   // RF-2: alias para /api/autores/buscar
app.use('/api/libros', libroRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/usuarios', usuarioRoutes);  // RF-3: /api/usuarios/:id/prestamos

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'API de biblioteca funcionando' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});