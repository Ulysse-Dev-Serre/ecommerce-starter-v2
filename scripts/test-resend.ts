import dotenv from 'dotenv';
import { Resend } from 'resend';
import path from 'path';

// Charger les variables d'environnement depuis la racine
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const toEmail = 'agtechnest@gmail.com'; // Seule adresse autorisée en mode test gratuit

console.log('--- Test Resend Configuration ---');
console.log(`API Key present: ${!!resendApiKey}`);
console.log(`From: ${fromEmail}`);
console.log(`To: ${toEmail}`);

if (!resendApiKey) {
  console.error('ERREUR: RESEND_API_KEY manquante dans .env');
  process.exit(1);
}

const resend = new Resend(resendApiKey);

async function sendTestEmail() {
  try {
    console.log("Tentative d'envoi...");
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Test Resend - Script de Debug',
      html: '<p>Ceci est un email de test pour vérifier la configuration Resend.</p>',
    });

    if (error) {
      console.error("❌ Échec de l'envoi Resend:");
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Email envoyé avec succès !');
      console.log('ID:', data?.id);
    }
  } catch (err: any) {
    console.error("❌ Exception levée lors de l'envoi:");
    console.error(err);
  }
}

sendTestEmail();
