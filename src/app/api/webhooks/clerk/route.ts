// src/app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { PrismaClient } from '../../../../generated/prisma';

// Important: Créer une seule instance de Prisma
const prisma = new PrismaClient();

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  console.log('🔥🔥🔥 === WEBHOOK CLERK RECEIVED === 🔥🔥🔥');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🌍 Request URL:', req.url);
  console.log('📋 Request method:', req.method);

  try {
    // 1. Vérifier le secret
    console.log('🔐 Vérification du secret webhook...');
    if (!webhookSecret) {
      console.error('❌ CLERK_WEBHOOK_SECRET manquant dans .env');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    console.log('✅ Secret webhook présent');

    // 2. Récupérer les headers
    console.log('📋 Récupération des headers...');
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    console.log('📋 Headers Svix:', {
      svixId: svixId ? `présent (${svixId.substring(0, 10)}...)` : 'MANQUANT',
      svixTimestamp: svixTimestamp ? 'présent' : 'MANQUANT',
      svixSignature: svixSignature ? `présent (${svixSignature.substring(0, 20)}...)` : 'MANQUANT'
    });

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('❌ Headers Svix manquants');
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    // 3. Récupérer et parser le body
    console.log('📦 Récupération du payload...');
    let payload;
    let body;
    
    try {
      payload = await req.json();
      body = JSON.stringify(payload);
      console.log('✅ Payload parsé:', {
        type: payload.type,
        id: payload.data?.id,
        email: payload.data?.email_addresses?.[0]?.email_address
      });
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 4. Vérifier la signature
    console.log('🔐 Vérification de la signature...');
    const wh = new Webhook(webhookSecret);
    let evt;

    try {
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
      console.log('✅ Signature vérifiée avec succès');
    } catch (verifyError) {
      console.error('❌ Erreur de vérification signature:', verifyError);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 5. Traiter l'événement
    const eventType = (evt as any).type;
    const eventData = (evt as any).data;
    
    console.log('🎯 Traitement événement:', eventType);
    console.log('👤 Données utilisateur reçues:', {
      id: eventData.id,
      email: eventData.email_addresses?.[0]?.email_address,
      firstName: eventData.first_name,
      lastName: eventData.last_name,
      created_at: eventData.created_at,
      updated_at: eventData.updated_at
    });

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(eventData);
        break;

      case 'user.updated':
        await handleUserUpdated(eventData);
        break;

      case 'user.deleted':
        await handleUserDeleted(eventData);
        break;

      default:
        console.log(`⚠️ Événement non géré: ${eventType}`);
    }

    console.log('✅ Webhook traité avec succès');
    return NextResponse.json({ success: true, eventType });

  } catch (error) {
    console.error('❌ ERREUR GLOBALE WEBHOOK:', error);
    
    // Log détaillé de l'erreur
    if (error instanceof Error) {
      console.error('📝 Message erreur:', error.message);
      console.error('📚 Stack trace:', error.stack);
    }
    
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handler pour user.created
async function handleUserCreated(userData: any) {
  console.log('👤 === CRÉATION UTILISATEUR ===');
  console.log('📋 Données complètes:', JSON.stringify(userData, null, 2));
  
  try {
    // Validation des données
    if (!userData.id) {
      throw new Error('ID utilisateur manquant');
    }

    const email = userData.email_addresses?.[0]?.email_address;
    if (!email) {
      throw new Error('Email utilisateur manquant');
    }

    // Gestion du rôle
    const roleFromMetadata = userData.public_metadata?.role || 'CLIENT';
    const validRoles = ['CLIENT', 'ADMIN'];
    const role = validRoles.includes(roleFromMetadata) ? roleFromMetadata : 'CLIENT';
    
    console.log('💾 Création en base de données...');
    console.log('📊 Données à insérer:', {
      clerkId: userData.id,
      email: email,
      firstName: userData.first_name || null,
      lastName: userData.last_name || null,
      imageUrl: userData.image_url || null,
      role: role
    });

    const newUser = await prisma.user.create({
      data: {
        clerkId: userData.id,
        email: email,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        imageUrl: userData.image_url || null,
        role: role as any,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      },
    });
    
    console.log('✅ UTILISATEUR CRÉÉ EN DB:', {
      dbId: newUser.id,
      clerkId: newUser.clerkId,
      email: newUser.email,
      role: newUser.role
    });
    
  } catch (error) {
    console.error('❌ ERREUR CRÉATION UTILISATEUR:', error);
    if (error instanceof Error) {
      console.error('📝 Message:', error.message);
      console.error('📚 Stack:', error.stack);
    }
    throw error;
  }
}

// Handler pour user.updated
async function handleUserUpdated(userData: any) {
  console.log('🔄 === MISE À JOUR UTILISATEUR ===');
  console.log('📋 Données:', JSON.stringify(userData, null, 2));
  
  try {
    if (!userData.id) {
      throw new Error('ID utilisateur manquant');
    }

    const email = userData.email_addresses?.[0]?.email_address;
    if (!email) {
      throw new Error('Email utilisateur manquant');
    }

    const roleFromMetadata = userData.public_metadata?.role || 'CLIENT';
    const validRoles = ['CLIENT', 'ADMIN'];
    const role = validRoles.includes(roleFromMetadata) ? roleFromMetadata : 'CLIENT';
    
    console.log('💾 Mise à jour en base...');
    
    const updatedUser = await prisma.user.upsert({
      where: { clerkId: userData.id },
      update: {
        email: email,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        imageUrl: userData.image_url || null,
        role: role as any,
        updatedAt: new Date(userData.updated_at),
      },
      create: {
        clerkId: userData.id,
        email: email,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        imageUrl: userData.image_url || null,
        role: role as any,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      },
    });
    
    console.log('✅ UTILISATEUR MIS À JOUR:', updatedUser.id);
    
  } catch (error) {
    console.error('❌ ERREUR MISE À JOUR:', error);
    throw error;
  }
}

// Handler pour user.deleted
async function handleUserDeleted(userData: any) {
  console.log('🗑️ === SUPPRESSION UTILISATEUR ===');
  console.log('📋 ID à supprimer:', userData.id);
  
  try {
    if (!userData.id) {
      throw new Error('ID utilisateur manquant');
    }

    // Use deleteMany to avoid error if user doesn't exist
    const result = await prisma.user.deleteMany({
      where: { clerkId: userData.id },
    });
    
    if (result.count > 0) {
      console.log('✅ UTILISATEUR SUPPRIMÉ:', userData.id);
    } else {
      console.log('⚠️ Utilisateur déjà supprimé ou inexistant:', userData.id);
    }
    
  } catch (error) {
    console.error('❌ ERREUR SUPPRESSION:', error);
    // Don't throw error - just log it to prevent webhook failures
    console.log('🔄 Suppression ignorée - utilisateur probablement déjà supprimé');
  }
}
