import { PrismaClient } from '../src/generated/prisma/index.js';

async function getAdminId() {
  const prisma = new PrismaClient();
  
  const admin = await prisma.user.findFirst({ 
    where: { role: 'ADMIN' },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true
    }
  });
  
  if (admin) {
    console.log('✅ Admin trouvé:');
    console.log(JSON.stringify(admin, null, 2));
  } else {
    console.log('❌ Aucun admin trouvé en base');
  }
  
  await prisma.$disconnect();
}

getAdminId();
