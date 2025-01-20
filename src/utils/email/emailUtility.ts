import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// SMTP configuration
const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g. 'smtp.example.com'
  port: Number(process.env.SMTP_PORT), // e.g. 587 or 465
  secure: process.env.SMTP_PORT === '465', // true for SSL, false for TLS
  auth: {
    user: process.env.SMTP_USER, // Your email address
    pass: process.env.SMTP_PASS, // Your email password or app password
  },
});

// Function to send an email
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, // Sender's email address
      to,                          // Recipient's email address
      subject,                     // Email subject
      html,                        // HTML content for the email
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
