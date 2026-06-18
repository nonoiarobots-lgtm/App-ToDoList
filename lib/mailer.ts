import nodemailer from 'nodemailer';

// Envoi d'emails via Gmail SMTP (compte expéditeur dédié).
// Variables d'env requises : GMAIL_USER, GMAIL_APP_PASSWORD (mot de passe d'application).
let transporteur: nodemailer.Transporter | null = null;

function getTransporteur(): nodemailer.Transporter {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD manquants');
  }
  if (!transporteur) {
    transporteur = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return transporteur;
}

export async function envoyerEmail(params: {
  to: string;
  sujet: string;
  html: string;
  text: string;
}): Promise<void> {
  await getTransporteur().sendMail({
    from: `Mes Tâches <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: params.sujet,
    html: params.html,
    text: params.text,
  });
}
