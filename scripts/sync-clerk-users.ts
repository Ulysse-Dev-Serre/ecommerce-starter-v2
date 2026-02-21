// scripts/sync-clerk-users.ts
import { createClerkClient } from '@clerk/backend';
import * as dotenv from 'dotenv';

import { prisma } from '../src/lib/core/db';
import { UserRole } from '../src/generated/prisma';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Créer le client Clerk avec les variables d'environnement
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Script pour synchroniser les utilisateurs Clerk avec la base de données locale
 * Utile pour récupérer les clerkId réels après création des utilisateurs de test
 */
async function syncClerkUsers() {
  console.log('🔄 Synchronisation des utilisateurs Clerk...');

  try {
    // Récupérer tous les utilisateurs de Clerk
    const clerkUsers = await clerkClient.users.getUserList({ limit: 100 });

    console.log(`📋 ${clerkUsers.data.length} utilisateurs trouvés dans Clerk`);

    for (const clerkUser of clerkUsers.data) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        console.log(`⚠️  Utilisateur Clerk sans email: ${clerkUser.id}`);
        continue;
      }

      // Vérifier si l'utilisateur existe déjà dans notre DB
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
      });

      if (existingUser) {
        // Mettre à jour les informations de base UNIQUEMENT
        // On ne touche JAMAIS au rôle ici pour des raisons de sécurité
        await prisma.user.update({
          where: { clerkId: clerkUser.id },
          data: {
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            // role: ON NE TOUCHE PAS
          },
        });
        console.log(
          `✅ Utilisateur mis à jour: ${email} (Role: ${existingUser.role})`
        );
      } else {
        // Créer le nouvel utilisateur
        // Par défaut, TOUT LE MONDE est CLIENT.
        // L'élévation au rang d'ADMIN doit être faite manuellement en base de données.
        await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            role: UserRole.CLIENT, // Sécurité : Toujours CLIENT par défaut
          },
        });
        console.log(`🆕 Nouvel utilisateur créé: ${email} (Role: CLIENT)`);
      }
    }

    // Afficher les IDs Clerk pour mettre à jour le seed
    console.log('\n📝 IDs Clerk pour votre seed:');
    const dbUsers = await prisma.user.findMany({
      orderBy: { role: 'asc' },
    });

    for (const user of dbUsers) {
      console.log(`   ${user.email}: "${user.clerkId}" (${user.role})`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
  }
}

/**
 * Fonction pour créer des utilisateurs de test directement dans Clerk
 */
async function createTestUsersInClerk() {
  console.log('👥 Création des utilisateurs de test dans Clerk...');

  const TEST_USERS = [
    {
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'Test',
      password: 'A_dmin_P@ssw0rd!123',
      role: 'admin',
    },
    {
      email: 'client@test.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      password: 'A_dmin_P@ssw0rd!123',
      role: 'client',
    },
    {
      email: 'marie@test.com',
      firstName: 'Marie',
      lastName: 'Martin',
      password: 'A_dmin_P@ssw0rd!123',
      role: 'client',
    },
  ];

  for (const userData of TEST_USERS) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [userData.email],
      });

      if (existingUsers.data.length > 0) {
        console.log(`⚠️  Utilisateur existe déjà: ${userData.email}`);
        continue;
      }

      // Créer l'utilisateur dans Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [userData.email],
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        publicMetadata: {
          role: userData.role,
        },
      });

      console.log(
        `✅ Utilisateur créé dans Clerk: ${userData.email} (ID: ${clerkUser.id})`
      );
    } catch (error) {
      console.error(`❌ Erreur création ${userData.email}:`, error);
    }
  }
}

async function main() {
  const action = process.argv[2];

  if (action === 'create') {
    await createTestUsersInClerk();
  } else if (action === 'sync') {
    await syncClerkUsers();
  } else {
    console.log('Usage:');
    console.log(
      '  npm run sync-clerk create  # Créer les utilisateurs de test dans Clerk'
    );
    console.log(
      '  npm run sync-clerk sync    # Synchroniser les utilisateurs Clerk vers la DB'
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
