# 🚀 Étape 1 : Configuration Initiale du Starter

Ce guide vous accompagne dans les premières minutes après le clonage du projet. L'objectif est de transformer ce code générique en une infrastructure prête à accueillir votre première boutique.

---

## 1. Environnement (.env)

Copiez le fichier `.env.exemple` à la racine vers un nouveau fichier nommé `.env`. Vous devez configurer ces trois piliers indispensables :

### A. Base de Données (Neon)
Créez un projet sur [Neon.com](https://neon.com) et récupérez votre chaîne de connexion PostgreSQL.
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### B. Authentification (Clerk)
Créez une application sur [Clerk.com](https://clerk.com). Récupérez vos clés et configurez les URLs de redirection.
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### C. Paiements (Stripe)
Créez un compte sur [Stripe.com](https://stripe.com) et récupérez vos clés de test.
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 2. Personnalisation du "Cerveau" (`site.ts`)

C'est l'étape la plus importante pour définir l'identité de votre boutique avant même de toucher au design. Tout se passe dans `src/lib/config/site.ts`.

Modifiez les constantes suivantes :

- **`SITE_NAME`** : Le nom de votre enseigne.
- **`SUPPORTED_LOCALES`** : ex: `['fr', 'en']` ou juste `['fr']`.
- **`DEFAULT_CURRENCY`** : La devise de votre pays cible (CAD, EUR, USD, etc.).
- **`STORE_ORIGIN_ADDRESS`** : L'adresse physique de votre boutique/entrepôt. Elle est utilisée pour calculer les frais de port réels via Shippo.

---

## 3. Initialisation de la Base de Données

Une fois le `.env` configuré, injectez la structure des tables dans votre base de données :

```bash
# Crée les tables dans PostgreSQL
npx prisma db push

# Génère le client de requête TypeScript
npx prisma generate
```

---

## 4. Création de votre accès Administrateur

Pour accéder au Dashboard (`/admin`), vous devez posséder un compte utilisateur avec le rôle `ADMIN`.

1. **Inscrivez-vous** sur votre boutique locale (via la page `/sign-up`).
2. **Promouvez-vous Admin** via Prisma Studio :
   ```bash
   npx prisma studio
   ```
3. Dans l'onglet **User**, trouvez votre email et changez le champ `role` de `CLIENT` vers **`ADMIN`**.
4. Enregistrez les modifications.

**Félicitations !** Vous pouvez maintenant vous connecter sur `http://localhost:3000/admin`.
