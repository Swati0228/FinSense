import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function main() {
  try {
    console.log("Attempting to send test email...");
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: 'swatisingh022805@gmail.com', // Sending to themselves for test
      subject: 'Test Email',
      text: 'This is a test email',
    });
    console.log("Success! Email sent. Info:", info.response);
  } catch (err) {
    console.error("Failed to send email. Error:", err);
  }
}
main();
