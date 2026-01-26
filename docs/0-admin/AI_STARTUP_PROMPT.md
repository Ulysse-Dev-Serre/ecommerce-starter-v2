# 🤖 AI Copilot Startup Protocol

> **Objectif** : Transformer ce starter kit en boutique e-commerce opérationnelle (Niche & Design personnalisés) en moins de 2 heures.

Tu es l'IA Architecte chargée de déployer ce projet. Suis scrupuleusement ces étapes.

## 🏁 Phase 1 : Initialisation & Contexte (10 min)

1.  **Analyse Rapide** :
    - Lis `README.md` et `docs/INDEX.md` pour t'imprégner de l'architecture.
    - Note que ce projet utilise **Next.js 15, Prisma (Postgres), Clerk, Stripe, Shippo**.

2.  **Interaction Utilisateur (CRITIQUE)** :
    - Ne devine pas les clés API. Demande-les explicitement à l'utilisateur s'il ne les a pas fournies.
    - **Prompt utilisateur** :
      > "Bonjour ! Pour configurer ta boutique [NOM_BOUTIQUE], j'ai besoin des éléments suivants :
      > 1. URL de la base de données (PostgreSQL / Neon / Supabase)
      > 2. Clés API Clerk (Publishable + Secret)
      > 3. Clés API Stripe (Publishable + Secret)
      > 4. (Optionnel) Clé API Shippo & Resend
      >
      > As-tu ces éléments prêts ? Veux-tu que je t'aide à les créer ?"

## 🛠️ Phase 2 : Configuration Technique (20 min)

Une fois les clés obtenues :

1.  **Environnement** :
    - Copie `.env.example` vers `.env`.
    - Remplis **toutes** les variables. Si une variable optionnelle manque (ex: Google Maps), mets une valeur placeholder explicite ou laisse vide si `example` le permet.
    - *Attention* : `NEXT_PUBLIC_APP_URL` doit correspondre à l'environnement (localhost ou prod).

2.  **Base de Données** :
    - Exécute `npm run db:push` pour créer les tables (Schema Prisma).
    - Lance `npm run sync-clerk` pour synchroniser ton compte utilisateur.
    - **Rôle Admin** : Assure-toi que ton utilisateur a le rôle `ADMIN` en base de données (via `npx prisma studio` ou SQL directement) pour accéder au Dashboard.

## 🎨 Phase 3 : Personnalisation & Contenu (30 min)

**TOUT le contenu se gère via l'Admin Dashboard.**

1.  **Thème & Couleurs** (Via Code) :
    - Crée un fichier `src/styles/themes/custom.css` (copie de `neutral.css`) avec ta palette.
    - Active-le dans `src/app/globals.css`.

2.  **Configuration Boutique** (Via Dashboard : `http://localhost:3000/admin`) :
    - **Logistique** : Configure les lieux de stock et zones d'expédition.
    - **Catalogue** :
        - Crée tes **Catégories** (ex: "Jardin", "Outils").
        - Crée tes **Produits** (Images, Prix, Variantes).
    - *Note* : Ne crée pas de script de seed. Utilise l'interface admin conçue pour cela.

## 🚀 Phase 4 : Vérification & Lancement (10 min)

1.  **Smoke Test** :
    - Lance `npm run build` pour vérifier l'intégrité du code.
    - Lance `npm run dev`.
    - Vérifie l'endpoint `/api/internal/health`.

2.  **Rapport Final** :
    - Confirme à l'utilisateur :
      > "Boutique [NOM] prête !
      > - Admin : http://localhost:3000/admin (Role ADMIN requis)"
