import { prisma } from '../src/lib/core/db';

async function main() {
  console.log('--- EXAMEN DE LA TABLE analytics_events ---');

  const totalCount = await prisma.analyticsEvent.count();
  console.log(`Nombre total de lignes : ${totalCount}`);

  const earliest = await prisma.analyticsEvent.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  const latest = await prisma.analyticsEvent.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Date du premier enregistrement : ${earliest?.createdAt}`);
  console.log(`Date du dernier enregistrement  : ${latest?.createdAt}`);

  console.log("\n--- RÉPARTITION PAR TYPE D'ÉVÉNEMENT ---");
  const eventTypes = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        eventType: 'desc',
      },
    },
  });

  eventTypes.forEach(et => {
    console.log(`${et.eventType.padEnd(20)} : ${et._count._all}`);
  });

  console.log('\n--- 10 DERNIERS ÉVÉNEMENTS ---');
  const samples = await prisma.analyticsEvent.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  samples.forEach(s => {
    console.log(
      `[${s.createdAt.toISOString()}] ${s.eventType.padEnd(15)} | Path: ${s.path || 'N/A'}`
    );
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
