# Guide de contribution - E-commerce Starter V2

## Vision du projet

Ce starter e-commerce vise à fournir une base technique moderne et adaptable pour créer des boutiques en ligne dans n'importe quel pays, secteur ou niche. L'accent est mis sur la flexibilité, la performance et la conformité internationale.

## Principes d'architecture

### 1. Adaptabilité avant tout
- **Multi-pays** : Support natif des devises, taxes et réglementations locales
- **Multilingue** : Structure i18n dès la conception, extensible à toute langue
- **Multi-secteurs** : Attributs produits flexibles pour tous types de commerce

### 2. Performance et SEO
- **SSR/ISR** avec Next.js pour un référencement optimal
- **Core Web Vitals** : LCP < 2.5s, CLS < 0.1, FID < 100ms
- **Optimisation images** : WebP, lazy loading, responsive

### 3. Sécurité by design
- **Zero-trust** : Validation côté serveur pour toutes les données
- **Headers sécurisés** : CSP, HSTS, protection XSS
- **Audit trail** : Traçabilité complète des actions sensibles

### 4. Maintenabilité
- **TypeScript strict** : Typage complet, pas de `any`
- **Tests automatisés** : Unitaires, intégration et E2E
- **Documentation** : Code auto-documenté et guides utilisateur

## Conventions de développement

### Structure des branches

```
main                    # Code de production
├── develop            # Branche d'intégration
├── feature/P1-issue-xx # Nouvelles fonctionnalités
├── bugfix/fix-xxx     # Corrections de bugs
├── hotfix/urgent-xxx  # Corrections urgentes production
└── release/vX.X.X     # Préparation des releases
```

#### Règles des branches
- **main** : Protégée, nécessite PR + review obligatoire
- **develop** : Branche d'intégration pour les features
- **feature/** : Créée à partir de `develop`, mergée dans `develop`
- **hotfix/** : Créée à partir de `main`, mergée dans `main` et `develop`

### Conventions de commit

Format : `type(scope): description`

#### Types autorisés
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation uniquement
- `style` : Formatage, espaces (pas de changement de code)
- `refactor` : Refactoring sans nouvelle fonctionnalité ni bug fix
- `perf` : Amélioration des performances
- `test` : Ajout ou modification de tests
- `chore` : Maintenance, configuration

#### Scopes suggérés
- `auth` : Authentification et autorisation
- `cart` : Fonctionnalités panier
- `checkout` : Processus de commande
- `admin` : Interface d'administration
- `api` : Endpoints API
- `db` : Base de données, migrations
- `i18n` : Internationalisation
- `seo` : Référencement
- `ui` : Interface utilisateur

#### Exemples
```bash
feat(cart): add guest cart functionality
fix(auth): resolve Clerk session persistence issue
docs(api): update product endpoints documentation
perf(db): optimize product search queries
test(checkout): add E2E payment flow tests
```

### Conventions de Pull Request

#### Titre de PR
Format : `[P0-P4] Type(scope): Description claire`

Exemples :
- `[P1] feat(cart): Guest cart with session persistence`
- `[P2] feat(i18n): Multi-language product catalog`
- `[P3] fix(admin): Product form validation errors`

#### Template de PR
```markdown
## Description
Description claire des changements apportés.

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Issue liée
Fixes #123

## Tests
- [ ] Tests unitaires ajoutés/modifiés
- [ ] Tests E2E validés
- [ ] Tests manuels effectués

## Checklist
- [ ] Code respecte les conventions ESLint/Prettier
- [ ] Types TypeScript complets
- [ ] Documentation mise à jour si nécessaire
- [ ] Pas de régression introduite
```

### Revue de code obligatoire

#### Critères d'approbation
1. **Fonctionnalité** : Le code fait ce qu'il doit faire
2. **Qualité** : Respect des conventions et bonnes pratiques
3. **Tests** : Couverture appropriée des nouveaux cas
4. **Performance** : Pas de dégradation notable
5. **Sécurité** : Validation des inputs, protection des données

#### Processus de review
1. **Auto-review** : L'auteur vérifie sa PR avant soumission
2. **Review par pairs** : Au moins 1 approbation requise
3. **Tests CI** : Tous les tests doivent passer
4. **Merge** : Squash and merge vers la branche cible

## Environnement de développement

### Prérequis
- Node.js 18+ et npm/yarn
- PostgreSQL 14+
- Git 2.30+

### Configuration initiale
```bash
# 1. Cloner et installer
git clone https://github.com/votre-org/ecommerce-starter-v2
cd ecommerce-starter-v2
npm install

# 2. Configuration environnement
cp .env.example .env.local
# Remplir les variables requises

# 3. Base de données
npx prisma migrate dev
npx prisma db seed

# 4. Lancement
npm run dev
```

### Scripts disponibles
```bash
npm run dev          # Développement avec hot-reload
npm run build        # Build de production
npm run start        # Démarrage production
npm run lint         # ESLint
npm run lint:fix     # ESLint avec correction auto
npm run format       # Prettier
npm run type-check   # Vérification TypeScript
npm run test         # Tests unitaires
npm run test:e2e     # Tests E2E Playwright
npm run db:migrate   # Migrations Prisma
npm run db:seed      # Données de test
```

## Standards de qualité

### Code
- **ESLint** : Configuration stricte, erreurs = échec CI
- **Prettier** : Formatage automatique, config dans `.prettierrc`
- **TypeScript** : Mode strict, pas de `any` sauf cas exceptionnels
- **Import order** : Groupés et triés automatiquement

### Tests
- **Couverture minimale** : 70% pour les services critiques
- **Tests E2E** : Parcours utilisateur complets
- **Tests d'API** : Tous les endpoints avec cas d'erreur

### Documentation
- **README** : Toujours à jour avec la configuration
- **CHANGELOG** : Respect de Semantic Versioning
- **Code comments** : Expliquer le "pourquoi", pas le "comment"
- **API docs** : Endpoints documentés avec exemples

## Workflow de release

### Versioning (Semantic Versioning)
- **MAJOR** (1.0.0) : Breaking changes
- **MINOR** (0.1.0) : Nouvelles fonctionnalités compatibles
- **PATCH** (0.0.1) : Bug fixes compatibles

### Process de release
1. **Feature freeze** : Arrêt des nouvelles fonctionnalités
2. **Tests complets** : E2E, performance, sécurité
3. **Documentation** : Mise à jour CHANGELOG et guides
4. **Tag release** : `git tag v1.0.0`
5. **Deploy staging** : Validation finale
6. **Deploy production** : Avec rollback plan

## Support et communication

### Canaux
- **GitHub Issues** : Bugs, demandes de fonctionnalités
- **GitHub Discussions** : Questions, idées, aide
- **Pull Requests** : Reviews et discussions techniques

### Reporting de bugs
Template obligatoire avec :
- **Environnement** : OS, navigateur, versions
- **Étapes de reproduction** : Détaillées et reproductibles  
- **Résultat attendu vs obtenu**
- **Screenshots/logs** si applicable

### Demandes de fonctionnalités
- **Contexte business** : Pourquoi cette fonctionnalité ?
- **Cas d'usage** : Qui l'utilisera et comment ?
- **Spécifications** : Comportement attendu détaillé
- **Critères d'acceptation** : Comment valider l'implémentation

## Contribution externe

Nous accueillons les contributions ! Processus :

1. **Fork** du repository
2. **Créer une branche** feature/votre-fonctionnalité
3. **Développer** en respectant les conventions
4. **Tester** localement
5. **Soumettre une PR** avec description complète

### Première contribution
- Consulter les issues labellées `good-first-issue`
- Lire entièrement ce guide
- Configurer l'environnement local
- Commencer par des contributions mineures (docs, tests)

---

**Merci de contribuer à ce projet !** Votre respect de ces conventions aide à maintenir la qualité et la cohérence du codebase.