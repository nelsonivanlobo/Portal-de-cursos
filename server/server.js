import express from 'express';
import cors from 'cors';
import connection from '../server/db.js'; // importa la conexión desde db.js
import path from 'path';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();
const __dirname = path.resolve();

// Servir archivos estáticos desde 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const uploadPath = path.join(__dirname, 'uploads');     

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

import dotenv from "dotenv";
dotenv.config();

app.use(express.json()); // Middleware para parsear JSON

app.use(cors({
    origin: 'http://127.0.0.1:5501',
    credentials: true, 
}));
app.use(bodyParser.json());


import session from 'express-session';

// Configuración de la sesión
app.use(session({
    secret: 'tu_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
    },
}));

// ROUTES
import loginAdimRoute from './routes/loginAdimRoute.js';
app.use(loginAdimRoute);

import adminRoute from './routes/adminRoute.js';
app.use(adminRoute);

import mpRoute from './routes/mpRoute.js'
app.use(mpRoute);

import loginAlumRoute from './routes/loginAlumRoute.js'
app.use(loginAlumRoute);

// Iniciar servidor
app.listen(8080, () => {
    console.log("Servidor corriendo en http://localhost:8080");
});