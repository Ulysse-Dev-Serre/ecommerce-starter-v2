import { execSync } from 'child_process';
import 'dotenv/config';
import Clerk from '@clerk/clerk-sdk-node';


const clerkClient = Clerk;

// liste des adresses e-mail des comptes de test quis eront suprimer supprimer.
const testEmails = [
  'testpourapp30@gmail.com'

  // ... ajoutez d'autres e-mails de test
];

async function main() {
  console.log('🔄 Réinitialisation complète de l\'environnement de développement...');

   // Cette section du code gère la suppression des utilisateurs directement dans le service Clerk.
  console.log('🗑️ Suppression des utilisateurs de test dans Clerk...');
  const clerkUsers = await clerkClient.users.getUserList();
  for (const user of clerkUsers) {
     // La condition vérifie si l'e-mail se termine par '@test.com' OU s'il est dans la liste `testEmails`.
    if (user.emailAddresses.some(e => e.emailAddress.endsWith('@test.com') || testEmails.includes(e.emailAddress))) {
      await clerkClient.users.deleteUser(user.id);
      console.log(`   ✅ Utilisateur Clerk supprimé: ${user.emailAddresses[0].emailAddress}`);
    }
  }

   // C'est cette ligne qui fait le travail de suppression complète de la base de données.
  // - `prisma migrate reset`: Réinitialise la base de données.
  // - `--force`: Exécute la commande sans demander de confirmation.
  // - `--skip-seed`: Indique à Prisma de ne pas relancer le script de 'seed' après la réinitialisation.
  // A vérifier la redondance de supression des données entre cette ligne et la suppression intégre dans seed.ts
  console.log('🗑️ Suppression et recréation de la base de données locale...');
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });

  console.log('✅ Environnement de développement réinitialisé avec succès!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});