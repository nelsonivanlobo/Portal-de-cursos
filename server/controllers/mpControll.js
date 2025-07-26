import connection from '../db.js'; // importa la conexión desde db.js
import { Preference } from 'mercadopago';
import { Payment } from 'mercadopago';
import transporter from '../config/mailerConfig.js';
import client from '../config/mpConfig.js';

const controller = {};

controller.mpPreference = async (req, res) => {
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
};

controller.mpWebhook = async (req, res) => {
    try {
        console.log('Webhook recibido:', req.body);

        const { action, data } = req.body;

        if (action === 'payment.created') {
            const paymentId = data.id;

            // Lógica para consultar detalles del pago
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: paymentId });
            /* const payment = await client.payment.get({ id: paymentId }); */

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
};

export default controller;