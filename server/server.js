import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import multer from 'multer';
import path from 'path';
import bodyParser from 'body-parser';
import fs from 'fs';

import { Payment } from 'mercadopago';

import nodemailer from 'nodemailer'; /* envio de correo */

const app = express();
const __dirname = path.resolve();
const uploadPath = path.join(__dirname, 'uploads');
         
          
// SDK de Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';
const client = new MercadoPagoConfig({ accessToken: '----' });


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

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage });


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

// Middleware para manejar múltiples archivos con nombres diferentes
const multipleUpload = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'zip', maxCount: 1 },
]);
// Servir archivos estáticos desde 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de conexión a la base de datos
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '1234',
    database: process.env.DB_NAME || 'cursosbalance2',
});

// Configuración del transportador de Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


/* MERCADO PAGO */
app.post("/create_preference", async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);

        const body = {
            items: [{
                title: req.body.title,
                quantity: Number(req.body.quantity),
                unit_price: Number(req.body.price),
                currency_id: "ARS",
            }],
            back_urls: {
                success: "https://balance-cp.netlify.app",
                failure: "",
                pending: "",
            },
            auto_return: "approved",
            metadata: {
                nombre: req.body.cliente.nombre,
                telefono: req.body.cliente.telefono,
                email: req.body.cliente.email,
                provincia: req.body.cliente.provincia,
                curso: req.body.title,
                precio: req.body.price,
            },
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        console.log("Preferencia creada:", result);
        res.json({ id: result.id });
    } catch (error) {
        console.error("Error al crear preferencia:", error);
        res.status(500).json({ error: "Error al crear la preferencia :(" });
    }
});


// Webhook para manejar notificaciones de Mercado Pago
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);

        const { action, data } = req.body;

        if (action === 'payment.created') {
            const paymentId = data.id;

            // Lógica para consultar detalles del pago
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: paymentId });

            if (paymentInfo.body.status === 'approved') {
                const { metadata, payer } = paymentInfo.body;

                // Extraer datos relevantes para la tabla compra
                const nombre = payer.first_name + ' ' + payer.last_name;
                const correo = payer.email;
                const telefono = payer.phone?.number || null;
                const provincia = metadata.provincia || null;
                const idCurso = metadata.curso;

                // Conexión a la base de datos para insertar el registro
                const queryCompra = `
                    INSERT INTO compra (id_curso, nombre, correo, telefono, provincia)
                    VALUES (?, ?, ?, ?, ?)
                `;

                connection.query(
                    queryCompra,
                    [idCurso, nombre, correo, telefono, provincia],
                    async (err, results) => {
                        if (err) {
                            console.error('Error al insertar la compra en la base de datos:', err);
                        } else {
                            console.log('Compra registrada exitosamente:', results);

                            // Obtener información del curso
                            const queryCurso = `
                                SELECT ruta_zip, link_video FROM curso WHERE id_curso = ?
                            `;
                            connection.query(queryCurso, [idCurso], (err, cursoResults) => {
                                if (err) {
                                    console.error('Error al obtener información del curso:', err);
                                } else {
                                    const curso = cursoResults[0];

                                    // Enviar correo al alumno
                                    const mailOptions = {
                                        from: process.env.EMAIL_USER,
                                        to: correo,
                                        subject: 'Confirmación de Compra del Curso',
                                        text: `¡Gracias por tu compra, ${nombre}!\n\nHas adquirido el curso. Aquí tienes los enlaces:\n\n- Descarga: ${curso.ruta_zip}\n- Video: ${curso.link_video}\n\n¡Disfruta tu curso!`,
                                    };

                                    transporter.sendMail(mailOptions, (error, info) => {
                                        if (error) {
                                            return console.error('Error al enviar el correo:', error);
                                        }
                                        console.log('Correo enviado:', info.response);
                                    });
                                }
                            });
                        }
                    }
                );
            }

            console.log(`Pago aprobado con ID: ${paymentId}`);
        }

        res.sendStatus(200); // Confirmar recepción del webhook
    } catch (error) {
        console.error('Error procesando el webhook:', error);
        res.sendStatus(500);
    }
});

/* GESTION DE ADMINISTRADOR ---------------------------*/
// Endpoint para autenticar al administrador
app.post('/administrador', (req, res) => {
    const { nombre, email, password } = req.body;

    // Consulta para obtener el administrador por nombre y correo
    const query = 'SELECT * FROM administrador WHERE nombre_adm = ? AND correo_adm = ?';
    connection.query(query, [nombre, email], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const admin = results[0];

        // Comparar la contraseña (sin encriptación)
        if (admin.contrasena !== password) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Si las credenciales son correctas, puedes guardar la sesión
        req.session.isAuthenticated = true;
        req.session.adminId = admin.id;

        return res.status(200).json({ message: 'Inicio de sesión exitoso' });
    });
});

app.get('/client/private/admin_control.html', (req, res) => {
    // Verificar si el usuario está autenticado
    if (!req.session.isAuthenticated) {
        return res.status(403).json({ error: 'Acceso denegado. Debes iniciar sesión.' });
    }

    // Si está autenticado, servir la página
    res.sendFile(path.join(__dirname, 'client/private/admin_control.html'));
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.status(200).json({ message: 'Sesión cerrada correctamente' });
    });
});

/* GESTION DE COMPRAS-------------------------- */
// Endpoint para obtener el reporte de compras
app.get('api/compra', (req, res) => {
     const query = 'SELECT * FROM compra';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener el reporte de compras:', err);
            return res.status(500).json({ error: 'Error al obtener el reporte' });
        }
        res.json(results);
    });
});

app.get('/api/compra', (req, res) => {
    const { curso, alumno } = req.query;
    let query = 'SELECT * FROM compra';
    const filters = [];

    if (curso) filters.push(`id_curso = ${connection.escape(curso)}`);
    if (alumno) filters.push(`id_alumno = ${connection.escape(alumno)}`);

    if (filters.length > 0) {
        query += ' WHERE ' + filters.join(' AND ');
    }

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener las compras:', err);
            return res.status(500).json({ error: 'Error al obtener las compras' });
        }
        res.json(results);
    });
});

/* REGISTRO DE ALUMNO ------------------------*/
// Endpoint para registrar un nuevo alumno
app.post('/alumno', (req, res) => {
    const { correo, contrasena } = req.body;

    // Consulta para insertar el nuevo alumno
    const query = `
        INSERT INTO alumno (correo, contrasena) VALUES (?, ?)
    `;

    connection.query(query, [correo, contrasena], (err, results) => {
        if (err) {
            console.error('Error al insertar el alumno en la base de datos:', err);
            return res.status(500).json({ error: 'Error al registrar el alumno' });
        }
        console.log('Alumno registrado exitosamente:', results);
        res.status(201).json({ message: 'Alumno registrado exitosamente' });
    });
});


/* GESTION DE CURSOS */
// Ruta POST para agregar un curso ---------------------------------------------
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

// Endpoint para obtener todos los cursos
app.get('/api/cursos', (req, res) => {
    const query = 'SELECT * FROM curso';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

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

// Endpoint para eliminar un curso
app.delete('/api/cursos/:id', (req, res) => {
    const { id } = req.params;

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

        // Eliminar archivos físicos
        fs.unlink(rutaPdf, (err) => {
            if (err && err.code !== 'ENOENT') console.error('Error al eliminar PDF:', err);
        });
        fs.unlink(rutaZip, (err) => {
            if (err && err.code !== 'ENOENT') console.error('Error al eliminar ZIP:', err);
        });

        // Eliminar curso de la base de datos
        const queryDelete = 'DELETE FROM curso WHERE id_curso = ?';
        connection.query(queryDelete, [id], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.json({ message: 'Curso eliminado exitosamente' });
        });
    });
});


// Iniciar servidor
app.listen(8080, () => {
    console.log("Servidor corriendo en http://localhost:8080");
});