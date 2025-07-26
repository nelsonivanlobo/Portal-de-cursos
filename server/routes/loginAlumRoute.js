import express from 'express';
import controller from '../controllers/loginAlumControll.js';
const router = express.Router();

/* REGISTRO DE ALUMNO ------------------------*/
// Endpoint para registrar un nuevo alumno
router.post('/alumno', controller.loginAlum);

export default router;