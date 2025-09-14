# Configuration Initiale

## 🚀 **Installation**

```bash
npm install
```

## ⚙️ **Configuration Automatique**

```bash
# Configuration complète en une commande
npm run dev:setup
```

**Ce que fait `dev:setup` :**
1. `npm run db:push` - Synchronise schéma Prisma
2. `npm run sync-clerk create` - Crée comptes test Clerk  
3. `npm run db:seed` - Ajoute données exemple

## 📝 **Variables d'environnement**

Créer `.env` :

```env
# Variables d'environnement pour l'application
DATABASE_URL=
#NEXT_PUBLIC_CORS_ORIGIN = http://localhost:3000
NEXT_PUBLIC_CORS_ORIGIN = https://www.mon-ecommerce.com


# Variables d'environnement de Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
    # cle donnée dans webhooks de clerk - qui est lui connecter au url que ngrock renvoie pour le webhook
CLERK_WEBHOOK_SECRET=

# Variables d'environnement pour le paiement
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Variables d'environnement pour l'envoi d'e-mails
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=
```

## ✅ **Validation Installation**

```bash
# Démarrer l'application
npm run dev
```

**Prochaine étape** → [**Clerk ↔ PostgreSQL Synchronisation**](../4-database-stack/clerk-postgres-sync.md) 