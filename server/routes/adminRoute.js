import express from 'express';
import controller from '../controllers/adminControll.js';
import {multipleUpload} from '../middlewares/multer.js';

const router = express.Router();

// Ruta POST para agregar un curso ---------------------------------------------
router.post('/api/cursos', multipleUpload, controller.crearCurso);

// Endpoint para obtener todos los cursos
router.get('/api/cursos', controller.obtenerCursos)

// Endpoint para obtener un curso por ID (Edición)
router.get('/api/cursos/:id', controller.obtenerCursoPorId)

// Endpoint para actualizar un curso
router.put('/api/cursos/:id', multipleUpload, controller.actualizarCurso)

// Endpoint para eliminar un curso
router.delete('/api/cursos/:id', controller.eliminarCurso)

// Endpoint para obtener el reporte de compras
router.get('/api/compra', controller.reportCompra);

export default router;