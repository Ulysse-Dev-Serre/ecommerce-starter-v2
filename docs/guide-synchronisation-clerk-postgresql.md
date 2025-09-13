# Guide de Synchronisation Clerk ↔ PostgreSQL

## 🎯 Vue d'ensemble

Ce guide explique comment configurer la synchronisation en temps réel entre l'authentification Clerk et votre base de données PostgreSQL via des webhooks.

## 📋 Prérequis

- ✅ Application Next.js configurée
- ✅ Clerk installé et configuré
- ✅ Base de données PostgreSQL (Neon) configurée
- ✅ Prisma configuré avec le modèle User
- ✅ Variables d'environnement définies

## 🔧 Variables d'environnement requises

Dans votre fichier `.env.local` :

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # À configurer plus tard

# Base de données
DATABASE_URL="postgresql://..."
```

---

## 🚀 Configuration Étape par Étape

### Étape 1 : Préparer l'environnement de développement

#### Terminal 1 : Démarrer Next.js
```bash
cd /votre/projet
npm run dev
```

**Résultat attendu :**
```
✓ Ready in 1243ms
- Local:        http://localhost:3000
```

#### Terminal 2 : Tester la connexion à la base de données
```bash
curl http://localhost:3000/api/test-db
```

**Résultat attendu :**
```json
{
  "status": "success",
  "message": "Database connection successful",
  "data": {
    "connected": true,
    "userCount": 3,
    "timestamp": "2025-01-XX...",
    "databaseUrl": "✅ Set"
  }
}
```

---

### Étape 2 : Configurer ngrok

#### Installation et configuration

1. **Créer un compte ngrok** (gratuit) : https://dashboard.ngrok.com/signup

2. **Récupérer votre token d'authentification** : https://dashboard.ngrok.com/get-started/your-authtoken

3. **Installer le token** :
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

4. **Démarrer le tunnel** (Terminal 3) :
   ```bash
   ngrok http 3000
   ```

**Résultat attendu :**
```
Session Status                online
Account                       votre@email.com (Plan: Free)
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

⚠️ **Important** : Notez l'URL `https://abc123.ngrok-free.app` - vous en aurez besoin !

#### Test du tunnel
```bash
curl https://votre-url-ngrok.ngrok-free.app/api/test-db
```

---

### Étape 3 : Configurer le Dashboard Clerk

#### Accéder au dashboard
1. Aller sur : https://dashboard.clerk.com/
2. Sélectionner votre projet
3. Naviguer vers **"Webhooks"** dans la barre latérale

#### Ajouter un endpoint webhook

1. **Cliquer sur "Add Endpoint"**

2. **Configurer l'endpoint** :
   - **URL** : `https://votre-url-ngrok.ngrok-free.app/api/webhooks/clerk`
   - **Description** : `Synchronisation PostgreSQL`

3. **Sélectionner les événements** :
   - ✅ `user.created`
   - ✅ `user.updated` 
   - ✅ `user.deleted`

4. **Définir le statut** : `Active`

5. **Cliquer sur "Create"**

#### Récupérer le secret de signature

1. **Cliquer sur votre webhook** nouvellement créé
2. **Copier le "Signing Secret"** (commence par `whsec_`)
3. **Ajouter à `.env`** :
   ```env
   CLERK_WEBHOOK_SECRET=whsec_votre_secret_ici
   ```

#### Redémarrer Next.js
```bash
# Arrêter avec Ctrl+C puis redémarrer
npm run dev
```

---

### Étape 4 : Tester la configuration

#### Test 1 : Vérifier que l'endpoint webhook est accessible
```bash
curl -X POST https://votre-url-ngrok.ngrok-free.app/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Résultat attendu :**
```json
{"error": "Missing svix headers"}
```
✅ **C'est normal !** Cela signifie que l'endpoint fonctionne.

#### Test 2 : Vérifier la configuration Clerk

Dans le Dashboard Clerk :
1. Aller dans **Webhooks**
2. Cliquer sur votre endpoint
3. Vérifier que le statut est **"Active"**
4. L'URL doit être correcte avec `/api/webhooks/clerk`

---

### Étape 5 : Test de synchronisation complet

#### Surveillance des logs

**Terminal 1 (Next.js)** - Vous devriez voir :
```
🔥🔥🔥 === WEBHOOK CLERK RECEIVED === 🔥🔥🔥
⏰ Timestamp: 2025-XX-XX...
🎯 Traitement événement: user.created
✅ UTILISATEUR CRÉÉ EN DB: {
  dbId: 'xxx',
  clerkId: 'user_xxx',
  email: 'test@example.com',
  role: 'CLIENT'
}
✅ Webhook traité avec succès
POST /api/webhooks/clerk 200 in XXXms
```

**Terminal 3 (ngrok)** - Vous devriez voir :
```
POST /api/webhooks/clerk       200 OK
```

#### Créer un nouvel utilisateur

1. **Aller sur votre application** : http://localhost:3000
2. **Cliquer sur "Se connecter"** ou le bouton d'authentification
3. **Choisir "Continuer avec Google"**
4. **Créer un nouveau compte** ou se connecter avec un compte existant

#### Vérifier la synchronisation

**Vérifier les logs** dans Terminal 1 - vous devriez voir la séquence complète :
- Réception du webhook
- Vérification de la signature  
- Traitement de l'événement `user.created`
- Création de l'utilisateur en base de données
- Réponse 200 OK

**Vérifier la base de données** :
```bash
curl http://localhost:3000/api/test-db
```

Le `userCount` devrait avoir augmenté de 1.

Sinon juste comparé les user dans clerk et ceux dans postgress sur neon

---

## 🐛 Résolution de problèmes

### Problème : Erreur 500 dans ngrok

**Symptômes :**
```
POST /api/webhooks/clerk       500 Internal Server Error
```

**Solutions :**
1. **Vérifier les logs Next.js** dans Terminal 1
2. **Vérifier le secret webhook** dans `.env.local`
3. **Redémarrer Next.js** après modification des variables d'environnement

### Problème : "Missing svix headers"

**Symptômes :**
```json
{"error": "Missing svix headers"}
```

**Causes possibles :**
1. URL incorrecte dans Clerk Dashboard
2. ngrok n'est pas démarré
3. Next.js n'est pas démarré

### Problème : Webhook non déclenché

**Solutions :**
1. **Vérifier l'URL ngrok** dans Clerk Dashboard
2. **Tester l'endpoint** manuellement avec curl
3. **Vérifier les événements sélectionnés** dans Clerk
4. **Consulter les logs Clerk** : Dashboard > Webhooks > Votre endpoint > Attempts

### Problème : "Unique constraint failed on email"

**Cause :** Tentative de création d'un utilisateur déjà existant

**Solution :** C'est normal ! Clerk peut envoyer plusieurs événements. L'erreur est gérée et l'utilisateur existe déjà.

---

## 📊 Critères de succès

✅ **Création d'utilisateur** : Nouveaux utilisateurs Clerk apparaissent automatiquement dans PostgreSQL  
✅ **Mise à jour d'utilisateur** : Modifications du profil synchronisées  
✅ **Suppression d'utilisateur** : Utilisateurs supprimés retirés de la base  
✅ **Gestion d'erreurs** : Webhooks échoués sont loggés et gérés  
✅ **Synchronisation temps réel** : Changements se produisent en quelques secondes

## 📝 Logs et surveillance

### Surveiller l'activité des webhooks

1. **Console Next.js** : Logs de traitement en temps réel
2. **Dashboard Clerk** : Statut de livraison et tentatives de retry
3. **Base de données** : Table `webhook_events` pour l'historique

### Consulter l'historique des webhooks

```sql
-- Vérifier les événements webhooks récents
SELECT * FROM webhook_events 
WHERE source = 'clerk' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔄 Workflow de développement

### Pour un usage quotidien

```bash
# Terminal 1 : Démarrer Next.js
npm run dev

# Terminal 2 : Démarrer ngrok (garder la même URL)
ngrok http 3000

# Terminal 3 : Tests et surveillance
curl http://localhost:3000/api/test-db
```

### Pour tester les modifications

1. **Modifier le code** webhook (`src/app/api/webhooks/clerk/route.ts`)
2. **Sauvegarder** (Next.js se recharge automatiquement)
3. **Créer/modifier un utilisateur** dans l'application
4. **Observer les logs** dans Terminal 1
5. **Vérifier la base de données** si nécessaire

---

## 🎉 Félicitations !

Votre synchronisation Clerk ↔ PostgreSQL est maintenant opérationnelle !

Les utilisateurs créés via l'interface Clerk seront automatiquement synchronisés avec votre base de données PostgreSQL en temps réel.

**Prochaines étapes suggérées :**
- Configurer la synchronisation sur votre environnement de production
- Ajouter des champs personnalisés au modèle User
- Implémenter la synchronisation des métadonnées utilisateur
