import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const RETENTION_DAYS = 14;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  console.log(
    `--- NETTOYAGE DES ANALYTICS (Rétention: ${RETENTION_DAYS} jours) ---`
  );
  console.log(
    `Suppression des événements antérieurs au : ${cutoffDate.toISOString()}`
  );

  try {
    const deleted = await prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Succès : ${deleted.count} événements supprimés.`);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage :', error);
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
