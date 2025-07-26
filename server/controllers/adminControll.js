import connection from '../db.js'; // importa la conexión desde db.js
import path from 'path';
import fs from 'fs';

const controller = {}

controller.crearCurso = (req, res) => {
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
};


controller.obtenerCursos = (req, res) => {
    const query = 'SELECT * FROM curso';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
};


controller.obtenerCursoPorId = (req, res) => {
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
};


controller.actualizarCurso = (req, res) => {
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
};


controller.eliminarCurso = (req, res) => {
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
};




controller.reportCompra = (req, res) => {
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
};



export default controller