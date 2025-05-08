/* const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql");
const multer = require("multer");
const path = require('path'); // fs ya existe en path
const bodyParser = require('body-parser');
const fs = require('fs');
const uploadPath = path.join(__dirname, 'uploads'); // Cambiar a ruta absoluta
*/

import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import multer from 'multer';
import path from 'path';
import bodyParser from 'body-parser';
import fs from 'fs';
import mercadopago from 'mercadopago';

const app = express();
const __dirname = path.resolve();
const uploadPath = path.join(__dirname, 'uploads'); // Cambiar a ruta absoluta
         
          
// SDK de Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';
// Agrega credenciales
const client = new MercadoPagoConfig({ accessToken: 'acces_token' });


if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath); // Crear la carpeta 'uploads' si no existe
}

/* const mercadopago = require("mercadopago"); */
/* require("dotenv").config();  */// Importa dotenv
import dotenv from "dotenv";
dotenv.config();

app.use(express.json()); // Middleware para parsear JSON
app.use(cors()); // Middleware para habilitar CORS
app.use(bodyParser.json()); // Parsear datos en formato JSON

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath); // Carpeta donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nombre único para cada archivo
    },
});
const upload = multer({ storage });


// Middleware para manejar múltiples archivos con nombres diferentes
const multipleUpload = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'zip', maxCount: 1 },
]);
// Servir archivos estáticos desde 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Sirve archivos estáticos desde 'server/uploads'


// Configuración de conexión a la base de datos
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '1234',
    database: process.env.DB_NAME || 'cursosbalance2',
});


// mp
app.post("/create_preference", async (req, res)=>{
    try {
        const body = {
            items: [{
                title: req.body.title,
                quantity: Number(req.body.quantity), // transforma a numero
                unit_price: Number(req.body.price),
                currency_id: "ARS",
            }],
            back_urls: {
                success: "https://portfolio-nl.netlify.app", // aqui va la url donde ira si el pago es exitoso
                failure: "https://portfolio-nl.netlify.app", // " " fallo
                pending: "https://portfolio-nl.netlify.app"  // " " pendiente
            },
            auto_return: "approved", // vuelve a la pagina una vez realizado el pago
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });
        res.json({
            id: result.id,
        })
    } catch(error) {
        console.log(error)
        res.status(500).json({
            error: "Error al crear la preferencia :("
        })
    }
});


// Ruta POST para agregar un curso -------------------------------------------------------------------
app.post('/api/cursos', multipleUpload, (req, res) => {
    const { imagen, titulo, precio, duracion, descripcion, link_video } = req.body;

    // Validar si los archivos fueron subidos correctamente
    const ruta_pdf = req.files['pdf'] ? `/uploads/${req.files['pdf'][0].filename}` : null;
    const ruta_zip = req.files['zip'] ? `/uploads/${req.files['zip'][0].filename}` : null;

    if (!ruta_pdf || !ruta_zip) {
        return res.status(400).json({ message: 'Se deben subir ambos archivos: PDF y ZIP' });
    }

    // Consulta SQL para insertar datos en la base de datos
    const query = `
        INSERT INTO curso (imagen, titulo, precio, duracion, descripcion, ruta_pdf, ruta_zip, link_video) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(query, [imagen, titulo, precio, duracion, descripcion, ruta_pdf, ruta_zip, link_video], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'Curso agregado exitosamente', id: results.insertId });
    });
});
//--------------------------------------------------------------------------


// GET A CURSOS-----------------------------------------------------------
// Endpoint para obtener todos los cursos
app.get('/api/cursos', (req, res) => {
    const query = 'SELECT * FROM curso';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err); // Asegúrate de que el error se muestre completo
        }
        res.json(results);
    });
});


//EDICIÓN CURSOS-----------------------------------------------------------------
// Endpoint para obtener un curso por ID (Edición)
app.get('/api/cursos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM curso WHERE id_curso = ?';

    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }
        res.json(results[0]);
    });
});

// Endpoint para actualizar un curso
app.put('/api/cursos/:id', multipleUpload, (req, res) => {
    const { id } = req.params;
    const { imagen, titulo, precio, duracion, descripcion, link_video } = req.body;

    // Consulta actual para obtener los valores existentes
    const querySelect = 'SELECT * FROM curso WHERE id_curso = ?';
    connection.query(querySelect, [id], (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }

        const curso = results[0];

        // Usar valores existentes si no se proporcionan nuevos
        const updatedImagen = imagen || curso.imagen;
        const updatedTitulo = titulo || curso.titulo;
        const updatedPrecio = precio || curso.precio;
        const updatedDuracion = duracion || curso.duracion;
        const updatedDescripcion = descripcion || curso.descripcion;
        const updatedLinkVideo = link_video || curso.link_video;

        const updatedRutaPdf = req.files.pdf
            ? `/uploads/${req.files.pdf[0].filename}`
            : curso.ruta_pdf;
        const updatedRutaZip = req.files.zip
            ? `/uploads/${req.files.zip[0].filename}`
            : curso.ruta_zip;

        // Consulta de actualización
        const queryUpdate = `
            UPDATE curso
            SET imagen = ?, titulo = ?, precio = ?, duracion = ?, descripcion = ?, 
                link_video = ?, ruta_pdf = ?, ruta_zip = ?
            WHERE id_curso = ?
        `;
        const params = [
            updatedImagen,
            updatedTitulo,
            updatedPrecio,
            updatedDuracion,
            updatedDescripcion,
            updatedLinkVideo,
            updatedRutaPdf,
            updatedRutaZip,
            id,
        ];

        connection.query(queryUpdate, params, (err, results) => {
            if (err) return res.status(500).send(err);
            res.json({ message: 'Curso actualizado exitosamente' });
        });
    });
});
//--------------------------------------------------------------------------




// ELIMINAR CURSOS----------------------------------------------------------
app.delete('/api/cursos/:id', (req, res) => {
    const { id } = req.params;

    // Primero obtenemos las rutas del PDF y ZIP asociados al curso
    const querySelect = 'SELECT ruta_pdf, ruta_zip FROM curso WHERE id_curso = ?';

    connection.query(querySelect, [id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }

        const rutaPdf = path.join(__dirname, results[0].ruta_pdf);
        const rutaZip = path.join(__dirname, results[0].ruta_zip);

        // Eliminamos el archivo PDF
        fs.unlink(rutaPdf, (unlinkPdfErr) => {
            if (unlinkPdfErr && unlinkPdfErr.code !== 'ENOENT') {
                // Error diferente de "archivo no encontrado"
                return res.status(500).send(unlinkPdfErr);
            }

            // Eliminamos el archivo ZIP
            fs.unlink(rutaZip, (unlinkZipErr) => {
                if (unlinkZipErr && unlinkZipErr.code !== 'ENOENT') {
                    return res.status(500).send(unlinkZipErr);
                }

                // Después eliminamos el registro de la base de datos
                const queryDelete = 'DELETE FROM curso WHERE id_curso = ?';

                connection.query(queryDelete, [id], (deleteErr, deleteResults) => {
                    if (deleteErr) {
                        return res.status(500).send(deleteErr);
                    }

                    res.json({ message: 'Curso eliminado exitosamente' });
                });
            });
        });
    });
});
//--------------------------------------------------------------------------





















// CLIENTES ----------------------------------------------------------------
/* // Obtener los clientes
app.get('/api/clientes', (req, res) => {
    const query = 'SELECT * FROM cliente';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Obtener los documentos
app.get('/api/documentos', (req, res) => {
    const query = 'SELECT * FROM material';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
}); */


// Iniciar servidor
app.listen(8080, () => {
    console.log("Servidor corriendo en http://localhost:8080");
});



/* //berifico que el archivo existe en la dirección
const fs = require('fs');
const filePath = path.join(__dirname, 'uploads', 'InfoCurso.pdf');

fs.exists(filePath, (exists) => {
  if (exists) {
    console.log('El archivo existe');
  } else {
    console.log('El archivo NO existe');
  }
}); */