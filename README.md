# E-Commerce Starter V2

## Vision 
architecture Multi-Tenant (isolée)

**Starter e-commerce universel, flexible et prêt à l'emploi** pour lancer rapidement des boutiques en ligne dans n'importe quelle niche et pays.

### Philosophie

Base technique solide et modulaire pour déployer des **boutiques dédiées** par marché :

- **Un Site = Un Pays** : Chaque déploiement cible un marché spécifique avec sa propre devise et configuration fiscale.
- **Architecture Duplicable** : Le même code source peut propulser `mon-shop.ca` (CAD) et `mon-shop.fr` (EUR) simplement en changeant la configuration.
- **Multi-niches** : Animaux, plantes, jouets, vêtements, électronique...
- **Multi-langues** : Support bilingue (ex: FR/EN au Canada) mais devises fixes par instance.
- **Déploiement rapide** : De l'idée à la boutique en ligne en quelques jours.

---

## Démarrage rapide

```bash
git clone [repo]
cd ecommerce-starter-v2
npm install
cp .env.exemple .env
# Éditer .env avec les clés (Neon + Clerk)
npm run dev
```

**Prêt en 5 minutes** -> [Guide installation détaillé](docs/setup.md)

---

## Fonctionnalités incluses

### E-commerce complet

- Catalogue produits avec variantes
- Panier intelligent (invité + connecté)
- Checkout sécurisé Stripe
- Gestion commandes et emails automatiques

### International par design

- **Architecture Multi-Marchés** : Conçu pour gérer des déploiements distincts (ex: USA vs Canada).
- **URLs bilingues** : `/fr/` et `/en/` gérés nativement pour les pays bilingues.
- **Localisation Statique** : Calculs de taxes et expédition calibrés pour le pays de l'instance.

### Production-ready

- Authentification robuste (Clerk)
- Sécurité avancée (rate limiting, CSRF, XSS)
- Monitoring et logs structurés
- Tests automatisés

### Personnalisation rapide

- Système de thèmes CSS en quelques clics
- Configuration par variables d'environnement
- Architecture modulaire extensible

**Exemples** : Boutique de plantes, accessoires pour chiens, jouets éducatifs

---

## Stack technique

- **Frontend** : Next.js 15 + TypeScript + Tailwind CSS
- **Backend** : Next.js API Routes + Prisma ORM
- **Base de données** : PostgreSQL
- **Auth** : Clerk
- **Paiements** : Stripe
- **Traductions** : next-intl (FR/EN)
- **Déploiement** : Vercel/Railway/DigitalOcean
- **Données** : Base de données PostgreSQL centralisée (Neon)

### Architecture des Données

- **Base de Données Unique** : Tous les sites/pays se connectent à la même base de données.
- **Produits Centralisés** : Les produits sont définis une seule fois avec des traductions (`ProductTranslation`) pour chaque langue.
- **Prix Multi-Devises** : Chaque variante a des prix spécifiques par devise (`ProductVariantPricing`), permettant des stratégies de prix indépendantes par marché (ex: 100 CAD != 72 USD).

---

## Commandes essentielles

```bash
# Développement
npm run dev              # Démarrer l'app (localhost:3000)
npm run db:studio        # Interface database (localhost:5555)

# Base de données
npm run db:push          # Synchroniser schéma Prisma
npm run db:seed          # Données de test
npm run sync-clerk       # Synchroniser utilisateurs Clerk

# Qualité
npm run lint             # ESLint + correction auto
npm run test             # Tests Jest
npm run build            # Build production
```

---

## Documentation

### Premier démarrage

- **[Installation & Setup](docs/setup.md)** - Guide complet étape par étape
- **[Clerk ↔ PostgreSQL](docs/4-database-stack/clerk-postgres-sync.md)** - Synchronisation utilisateurs

### Compréhension du projet

- **[Navigation documentation](docs/INDEX.md)** - Table des matières
- **[Architecture](docs/1-foundations/architecture.md)** - Structure technique complète
- **[Roadmap](docs/1-foundations/Roadmap.md)** - Évolution et milestones

### Guides techniques

- **[Architecture i18n](docs/2-Language_internationalization/i18n-architecture.md)** - Ajouter des langues
- **[Thèmes CSS](docs/8-frontend/theming.md)** - Personnaliser l'apparence
- **[Logging & Debug](docs/3-development-tools/logging.md)** - Monitoring avancé

---

## Objectifs du starter

### Pour l'entreprise

- **Time-to-market** : Boutique en 1 semaine au lieu de 6 mois
- **Coûts réduits** : Base technique éprouvée
- **Scalabilité** : Architecture pensée pour grandir

### Pour le développement

- **Code quality** : TypeScript, tests, documentation
- **Maintenabilité** : Architecture modulaire
- **Extensibilité** : APIs bien définies

### Pour les projets clients

- **Réutilisabilité** : Base pour plusieurs projets e-commerce
- **Personnalisation** : Thèmes par client
- **Support** : Documentation complète

---

## 🚛 Logistique & Origine

Le starter suit une politique de **0 Fallback** pour garantir la validité des tarifs.
- **Source Primaire** : L'adresse globale définie dans `src/lib/config/site.ts` (`STORE_ORIGIN_ADDRESS`).
- **Source Secondaire (Fallback)** : En cas d'adresse globale non configurée, le système tente de résoudre l'origine via le produit lui-même (champ `shippingOrigin` en base de données).
- **Échec critique** : Si aucune adresse n'est résolue, l'opération s'arrête pour éviter toute erreur d'étiquetage.

---

## Licence

MIT License - Utilisation libre pour projets commerciaux.

---

**Besoin d'aide ?** Consulter la [navigation documentation](docs/INDEX.md) ou créer une issue.
