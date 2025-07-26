// Configuración de conexión a la base de datos
import connection from '../db.js'; // importa la conexión desde db.js
import path from 'path';


// Objeto que se va a exportar
const controller = {}

controller.adminLogin = (req, res) => {
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
};


controller.logout = (req, res) => {
    // Verificar si el usuario está autenticado
    if (!req.session.isAuthenticated) {
        return res.status(403).json({ error: 'Acceso denegado. Debes iniciar sesión.' });
    }

    // Si está autenticado, servir la página
    res.sendFile(path.join(__dirname, 'client/private/admin_control.html'));
};


controller.error = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.status(200).json({ message: 'Sesión cerrada correctamente' });
    });
};

export default controller
/* module.exports = controller */