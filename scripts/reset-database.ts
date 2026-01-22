import { execSync } from 'child_process';

import 'dotenv/config';
import Clerk from '@clerk/clerk-sdk-node';

const clerkClient = Clerk;

// liste des adresses e-mail des comptes de test quis eront suprimer supprimer.
const testEmails = [
  'testpourapp30@gmail.com',

  // ... ajoutez d'autres e-mails de test
];

async function main() {
  console.log(
    "🔄 Réinitialisation complète de l'environnement de développement..."
  );

  // Cette section du code gère la suppression de TOUS les utilisateurs dans le service Clerk.
  console.log('🗑️ Suppression de TOUS les utilisateurs de test dans Clerk...');

  // Pagination : Clerk retourne max 10/100 utilisateurs par défaut, on doit boucler ou augmenter la limit
  const clerkUsers = await clerkClient.users.getUserList({ limit: 500 });

  if (clerkUsers.length === 0) {
    console.log('   Aucun utilisateur trouvé dans Clerk.');
  }

  for (const user of clerkUsers) {
    try {
      const email = user.emailAddresses[0]?.emailAddress || 'No Email';
      await clerkClient.users.deleteUser(user.id);
      console.log(`   ✅ Utilisateur Clerk supprimé: ${email} (${user.id})`);
    } catch (error) {
      console.error(`   ❌ Erreur suppression utilisateur ${user.id}:`, error);
    }
  }

  // C'est cette ligne qui fait le travail de suppression complète de la base de données.
  // - `prisma migrate reset`: Réinitialise la base de données.
  // - `--force`: Exécute la commande sans demander de confirmation.
  // - `prisma migrate reset`: Réinitialise la base de données.
  // - `--force`: Exécute la commande sans demander de confirmation.
  console.log('🗑️ Suppression et recréation de la base de données locale...');
  execSync('npx prisma migrate reset --force', {
    stdio: 'inherit',
  });

  console.log('✅ Environnement de développement réinitialisé avec succès!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
