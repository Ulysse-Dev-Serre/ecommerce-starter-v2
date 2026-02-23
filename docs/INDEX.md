# Index Documentation - E-Commerce Starter V2

## Démarrage Rapide
```bash
npm run dev
npx prisma studio
```

| Document | Description | Priorité |
| :--- | :--- | :--- |
| **[README.md](../README.md)** | Guide démarrage et commandes essentielles | CRITIQUE |
| **[Setup](./1-foundations/setup.md)** | Configuration initiale environnement | CRITIQUE |

---

## Documentation par Catégories

### 0. Administration & Lancement
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[1. Config Initiale](./0-admin/1-CONFIG-INITIALE.md)** | .env, site.ts et premier Admin | JOUR 1 |
| **[2. Protocole IA](./0-admin/2-AI-STARTUP-PROTOCOLE.md)** | Personnalisation niche & design | Setup Visuel |
| **[3. Dashboard Admin](./0-admin/3-DASHBOARD-ADMIN.md)** | Gestion catalogue, stocks et ventes | Opérations |
| **[4. Lancement Prod](./0-admin/4-LANCEMENT-PRODUCTION.md)** | Checklist finale et Stripe Live | Go-Live |

### 1. Fondations & Architecture
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Architecture](./1-foundations/architecture.md)** | Structure complète projet + patterns | Architecture système |
| **[Roadmap](./1-foundations/Roadmap.md)** | Milestones et phases développement | Planification |
| **[Setup](./1-foundations/setup.md)** | Installation + variables environnement | Installation initiale |

### 2. Outils Développement & CI/CD
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Webhooks Testing](./2-development-tools/webhooks-testing.md)** | Guide centralisé Ngrok + Stripe + Clerk | Tests locaux |
| **[Logging](./2-development-tools/logging.md)** | Système logs structurés | Debug + monitoring |
| **[CI/CD](./2-development-tools/ci-cd.md)** | Pipeline d'intégration et déploiement | DevOps |
| **[Sécurité Headers](./2-development-tools/security-headers.md)** | Protection HTTP headers | Sécurité base |
| **[Google API](./2-development-tools/google-api.md)** | Config Maps & Places | Adresses |
| **[AI Guide](./2-development-tools/msg-ai.md)** | Instructions pour les assistants IA | IA |

### 3. Base de Données
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Maintenance & Prod](./3-database-stack/maintenance-and-production.md)** | Guide pro (Migrations vs Push) | Maintenance safely |
| **[Schéma DB](./3-database-stack/database-schema.md)** | Modèle de données Prisma | Structure SQL |
| **[Media Storage](./3-database-stack/MEDIA_STORAGE.md)** | Gestion des images et stockage | Cloudinary |

### 4. Authentification
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Workflow Authentification](./4-authentication/authentication-workflow.md)** | Flux Clerk ↔ Postgres (First Sign-in) | Compréhension login |

### 5. Système de Paiement (Stripe)
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Flux de Paiement](./5-payment-system/stripe-payment-flow.md)** | Tunnel de paiement et webhooks | Transactions |
| **[Configuration Taxes](./5-payment-system/stripe-tax-configuration.md)** | Stripe Tax & Automatisation | Fiscalité |
| **[Troubleshooting](./5-payment-system/stripe-troubleshooting.md)** | Résolution de problèmes Stripe | Debug |
| **[Quick Test](./5-payment-system/stripe-quick-test.md)** | Tester le flux de paiement (CLI/cURL) | Setup |

### 6. Expédition & Emails (Shippo / Resend)
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Overview Shippo](./6-shipping/overview.md)** | Intégration Shippo & Transporteurs | Logistique |
| **[Email Flow](./6-shipping/resend-email-flow.md)** | Flux d'envoi d'emails via Resend | Communication |
| **[Retours & Remboursements](./6-shipping/retours-remboursements.md)** | Gestion des étiquettes de retour | SAV |

### 7. API Reference
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Index API](./7-api/INDEX.md)** | Liste de toutes les routes API | Développement |
| **[Webhooks](./7-api/webhooks.md)** | Détails techniques des webhooks | Intégration |

### 8. Sécurité
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Overview](./8-securite/security-overview.md)** | Mesures globales et checklist prod | Vue d'ensemble |
| **[RBAC](./8-securite/RBAC.md)** | Gestion des rôles et permissions | Contrôle d'accès |
| **[Rate Limiting](./8-securite/rate-limiting.md)** | Limitation du nombre de requêtes | Protection API |
| **[Validation](./8-securite/zod-validation.md)** | Validation des schémas avec Zod | Intégrité des données |

### 9. Internationalisation (i18n)
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Architecture](./9-Language_internationalization/i18n-architecture.md)** | Structure bilingue et ajout de langues | Organisation i18n |

### 10. Frontend & UI
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Vibe Architecture](./10-frontend/01-architecture-vibe.md)** | Principes de design et expérience utilisateur | Design |
| **[Component Guide](./10-frontend/02-component-guide.md)** | Standard de création des composants | UI Standards |
| **[Theming](./10-frontend/theming.md)** | Couleurs, tokens et mode sombre | Apparence |

### 11. Marketing
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Pixels Marketing](./11-marketing/ajouter-pixels.md)** | Intégration Facebook/Google Pixels | Conversion |

### 12. Analytique
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Tracking Consent](./12-analytic/internal-tracking-consent.md)** | RGPD et cookies de tracking | Conformité |
| **[Testing Methodology](./12-analytic/testing-methodology.md)** | Guide pour tests A/B | Optimisation |

### 13. SEO
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[SEO Configuration](./13-SEO/seo-configuration.md)** | Paramètres techniques SEO | Indexation |
| **[SEO Strategy](./13-SEO/seo-strategy.md)** | Mots-clés et autorité | Visibilité |
| **[Indexing Policy](./13-SEO/indexing-policy.md)** | Politique d'indexation des pages | SEO |

### 14. Tests & QA
| Document | Contenu | Usage |
| :--- | :--- | :--- |
| **[Index Tests](./14-test/index-test.md)** | Stratégie globale de test | QA |
| **[Playwright](./14-test/playwright.md)** | Tests E2E automatisés | Parcours client |
| **[Vitest](./14-test/vitest.md)** | Tests unitaires | Fiabilité |

---

## Guides par Objectif

### Premier démarrage
1. [README.md](../README.md) - Vue d'ensemble
2. [Config Initiale](./0-admin/1-CONFIG-INITIALE.md) - Setup JOUR 1
3. [Protocole IA](./0-admin/2-AI-STARTUP-PROTOCOLE.md) - Design & Niche

### Compréhension architecture
1. [Architecture](./1-foundations/architecture.md) - Structure système
2. [Webhooks Testing](./2-development-tools/webhooks-testing.md) - Debug les services tiers
3. [Logging](./2-development-tools/logging.md) - Debug efficace

---

## Recherche Rapide

| Besoin | Document | Section |
| :--- | :--- | :--- |
| **Installation** | [Config Initiale](./0-admin/1-CONFIG-INITIALE.md) | Variables env |
| **Admin Panel** | [Dashboard Admin](./0-admin/3-DASHBOARD-ADMIN.md) | Dashboard |
| **Emails** | [Email Flow](./6-shipping/resend-email-flow.md) | Resend |
| **Traductions** | [i18n Architecture](./9-Language_internationalization/i18n-architecture.md) | Structure |
| **Sécurité** | [Security Overview](./8-securite/security-overview.md) | Mesures globales |

---

**Dernière mise à jour** : Février 2026
**Version documentation** : 2.7 (Admin, CI/CD and Email workflows added)
