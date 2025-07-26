import express from 'express';
import controller from '../controllers/mpControll.js';

const router = express.Router();

/* MERCADO PAGO */
router.post("/create_preference", controller.mpPreference)

// Webhook para manejar notificaciones de Mercado Pago
router.post('/webhook', controller.mpWebhook)

export default router;