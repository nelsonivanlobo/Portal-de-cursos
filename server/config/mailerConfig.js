import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Configuración del transportador de Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // o el correcto según tu proveedor
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default transporter;