import nodemailer from "nodemailer";
import { ServiceServerError } from "./errors.js"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMPT_HOST,
  port: process.env.EMAIL_SMPT_PORT,
  auth: {
    user: process.env.EMAIL_SMPT_USER,
    pass: process.env.EMAIL_SMPT_PASSWORD,
  },
  secure: process.env.node_env === "production" ? true : false,
});

async function send(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ServiceServerError({
      message: "Não foi possivel enviar o e-mail.",
      action: "Verifique se o serviço de e-mail está disponível.",
      cause: error,
      context: mailOptions
    })
  }
}

const email = {
  send,
};

export default email;
