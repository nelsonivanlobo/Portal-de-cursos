import express from 'express';
import controller from '../controllers/loginAdminControll.js';

const router = express.Router();

/* ADMINISTRADOR ---------------------------*/
// Endpoint para autenticar al administrador
router.post('/administrador', controller.adminLogin);

router.get('/client/private/admin_control.html', controller.logout);

router.post('/logout', controller.error);

export default router;