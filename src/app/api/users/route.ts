// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('📋 Récupération de tous les utilisateurs...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ ${users.length} utilisateurs trouvés`);
    
    return NextResponse.json({ 
      success: true,
      count: users.length,
      users 
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}