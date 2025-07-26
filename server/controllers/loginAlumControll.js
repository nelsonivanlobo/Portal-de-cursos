import connection from '../db.js'; // importa la conexión desde db.js

const controller = {}

controller.loginAlum = (req, res) => {
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
};

export default controller;