# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Structure de base du projet avec Next.js 14 et TypeScript
- Configuration ESLint et Prettier
- Schéma Prisma pour e-commerce avec support Clerk
- Architecture de documentation dans `/docs`
- Guide de contribution avec conventions Git et code

### Planifié

- Phase P0 : Fondations techniques et sécurité
- Phase P1 : Authentification, catalogue, panier et paiement
- Phase P2 : Internationalisation et SEO
- Phase P3 : Interface admin et sécurité avancée
- Phase P4 : Monitoring, légal et optimisations finales

## [0.1.0] - 2024-XX-XX (Version initiale prévue)

### Ajouté

- Configuration initiale du starter e-commerce
- Documentation du périmètre MVP
- Règles de contribution et conventions d'équipe

---

## Règles de versioning (Semantic Versioning)

Ce projet suit le [Semantic Versioning](https://semver.org/) avec le format `MAJOR.MINOR.PATCH` :

### MAJOR (X.0.0)

Changements **incompatibles** avec les versions précédentes :

- Modifications du schéma de base de données non rétrocompatibles
- Changements d'API qui cassent les intégrations existantes
- Suppression de fonctionnalités publiques
- Modifications majeures d'architecture

**Exemples :**

- Migration d'un système d'auth à un autre (NextAuth → Clerk)
- Changement de structure des APIs `/api/v1/` → `/api/v2/`
- Refonte complète du modèle de données

### MINOR (x.Y.0)

Nouvelles fonctionnalités **compatibles** :

- Nouvelles fonctionnalités e-commerce
- Nouveaux endpoints API
- Support de nouvelles langues/devises
- Améliorations UX sans breaking changes

**Exemples :**

- Ajout du support multilingue (P2)
- Nouvelle interface admin (P3)
- Système de coupons et promotions
- Intégration de nouveaux moyens de paiement

### PATCH (x.y.Z)

Corrections de bugs **compatibles** :

- Corrections de sécurité
- Corrections de bugs fonctionnels
- Améliorations de performance
- Mises à jour de documentation

**Exemples :**

- Correction d'un bug de calcul de taxes
- Fix de validation de formulaire
- Amélioration des performances de requêtes DB
- Correction de traductions manquantes

## Conventions de release

### Pre-release et versions de développement

- `X.Y.Z-alpha.N` : Versions très précoces, instables
- `X.Y.Z-beta.N` : Versions de test, fonctionnalités complètes mais potentiellement buggées
- `X.Y.Z-rc.N` : Release candidates, prêtes sauf bugs critiques

### Branches et tags

- **main** : Dernière version stable (production)
- **develop** : Version en développement
- **Tags** : `v1.0.0`, `v1.1.0`, etc.

### Cycle de release

#### Phase P0 → v0.1.0 (Fondations)

- Configuration sécurisée
- Base de données et migrations
- CI/CD et qualité code

#### Phase P1 → v0.2.0 (MVP E-commerce)

- Authentification Clerk
- Catalogue produits
- Panier et checkout
- Paiement Stripe

#### Phase P2 → v0.3.0 (International)

- Support multilingue complet
- SEO optimisé
- Sitemaps et hreflang

#### Phase P3 → v0.4.0 (Administration)

- Interface admin complète
- Sécurité renforcée
- Tests E2E

#### Phase P4 → v1.0.0 (Production Ready)

- Monitoring et observabilité
- Conformité légale
- Documentation complète
- Performance optimisée

### Migration vers v1.0.0

La version 1.0.0 sera publiée quand :

- ✅ Toutes les fonctionnalités P1-P4 sont terminées
- ✅ Tests E2E couvrent tous les parcours critiques
- ✅ Documentation complète (utilisateur et développeur)
- ✅ Performance validée (Core Web Vitals)
- ✅ Sécurité auditée
- ✅ Conformité légale (RGPD, taxes, mentions)

## Format des entrées de changelog

### Structure recommandée

```markdown
## [Version] - YYYY-MM-DD

### Ajouté

- Nouvelles fonctionnalités pour utilisateurs finaux
- Nouveaux endpoints API
- Nouvelles configurations

### Modifié

- Changements sur fonctionnalités existantes
- Améliorations UX/UI
- Mises à jour de dépendances

### Déprécié

- Fonctionnalités qui seront supprimées dans futures versions
- APIs anciennes maintenues pour compatibilité

### Supprimé

- Fonctionnalités retirées
- APIs supprimées
- Configurations obsolètes

### Corrigé

- Corrections de bugs
- Corrections de sécurité
- Corrections de performance

### Sécurité

- Corrections de vulnérabilités
- Améliorations sécuritaires
- Mises à jour de dépendances critiques
```

### Exemples d'entrées

#### Fonctionnalité e-commerce

```markdown
### Ajouté

- Support des paniers invités avec persistance cookie (#123)
- Calcul automatique des taxes GST/QST pour le Canada (#124)
- Interface admin pour gestion des produits (#125)
```

#### Correction de bug

```markdown
### Corrigé

- Correction du bug de double débit lors du paiement Stripe (#126)
- Fix de la validation email dans le formulaire d'inscription (#127)
```

#### Changement technique

```markdown
### Modifié

- Migration de NextAuth vers Clerk pour l'authentification (#128)
- Optimisation des requêtes produits (réduction 40% temps de réponse) (#129)
```

## Automatisation

### Scripts de release

```bash
# Mise à jour version et tag
npm run release:patch   # 1.0.0 → 1.0.1
npm run release:minor   # 1.0.0 → 1.1.0
npm run release:major   # 1.0.0 → 2.0.0
```

### CI/CD Integration

- **Pull Request** : Validation que CHANGELOG est mis à jour
- **Release** : Génération automatique des notes de version depuis CHANGELOG
- **Deploy** : Version déployée corrélée avec tag Git

---

**Note** : Ce changelog sera maintenu manuellement lors de chaque release et servira de source de vérité pour communiquer les changements aux utilisateurs et développeurs.
