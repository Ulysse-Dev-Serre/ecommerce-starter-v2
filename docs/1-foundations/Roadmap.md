# 🗂 Roadmap Ecommerce Starter V2 — Milestones & Issues

---

## 📌 P0 – Fondations & CI/CD — 100% ✅

**Issues Réalisées :**
- [x] **Issue 1** : Définir la vision MVP & règles de contribution
- [x] **Issue 2** : Gestion des environnements & secrets (local/dev/prod)
- [x] **Issue 3** : Schéma base de données v2 (catalogue, variantes, prix, stock)
- [x] **Issue 4** : Pipeline Prisma (migrations & seed minimal)
- [x] **Issue 5** : Choix Clerk & politique de sessions
- [x] **Issue 6** : Navbar avec authentification Clerk
- [x] **Issue 7** : Headers de sécurité HTTP & CORS basiques
- [x] **Issue 8** : i18n structurel : schéma d'URL & locales (FR/EN)
- [x] **Issue 9** : Observabilité de base : logging structuré
- [x] **Issue 10** : Qualité & CI/CD minimale (lint, typecheck, build)

---

## 📌 P1 – E-commerce Core (Backend API + Admin) — 100% ✅

**Issues Réalisées :**
- [x] **Issue 11** : Finaliser le modèle Utilisateur & Rôles
- [x] **Issue 12** : API Produits (liste, détail par slug)
- [x] **Issue 13** : Dashboard admin minimal
- [x] **Issue 14** : CRUD Produits et Catégories (admin)
- [x] **Issue 15** : Panier invité (ajout/mise à jour/suppression invité)
- [x] **Issue 16** : Fusion panier invité → utilisateur à la connexion
- [x] **Issue 17** : Calcul totaux panier (prix, taxes placeholder, remises simples)
- [x] **Issue 18** : Pages publiques : Accueil, Catégorie, Produit, Panier, Checkout
- [x] **Issue 19** : Intégration Stripe Payment Element (client) & Intent serveur
- [x] **Issue 20** : Webhook Stripe (signature + idempotence) & création de commande
- [x] **Issue 21** : Modèle Commande & états (créée, payée, annulée)
- [x] **Issue 22** : Webhooks Stripe sécurisés (Order status update)
- [x] **Issue 23** : Gestion des Commandes (admin) : Liste & Détail

---

## 🚀 P2 – Launch Readiness (Logistics & Legal) — CRITIQUE

**Objectif :** Rendre le site opérationnel pour une vraDeveloper: Reload Windowie vente et une vraie livraison (MVP Launch).

**Issues à faire :**
- [x] **Issue 24** : Intégration Shippo (Calcul & Labels)
- [x] **Issue 25** : Emails Transactionnels (Resend/React-Email)
- [x] **Issue 26** : Marketing Pixels (GA4, FB, TikTok) & Cookie Consent
- [x] **Issue 27** : Pages Légales & Contenu Statique
- [x] **Issue 28** : Stripe Tax Configuration (Voir [Documentation & Limitation](../9-payment-system/stripe-tax-configuration.md)) 
- [x] **Issue 29** : Pages d'erreur Custom (404/500)
- [x] **Issue 30** : Premier Déploiement Vercel (Production)
- [x] **Issue 31** : Gestion des retours et remboursements

---

## 📌 P3 – Post-Launch (Admin, SEO & Sécurité)

**Objectif :** Améliorer l'administration, le référencement et durcir la sécurité.

**Issues à faire :**
- [x] **Issue 32** : Optimisation UX : Autocomplétion d'adresse (Google Places API) pour Shippo
- [x] **Issue 33** : Admin Panel Avancé (Customers, Analytics)
- [x] **Issue 34** : SEO international : hreflang et x-default
- [ ] **Issue 35** : Canonical & facettes : éviter la duplication
- [x] **Issue 36** : Sitemap(s) multilingues & robots.txt
- [ ] **Issue 37** : Métadonnées dynamiques & Open Graph multilingues
- [ ] **Issue 38** : Données structurées (Schema.org) bilingues
- [ ] **Issue 39** : Formats localisés (monnaies, dates, unités)
- [ ] **Issue 40** : Migration & redirections 301
- [ ] **Issue 41** : Politique d’indexation & Liens internes
- [ ] **Issue 42** : Mise en place Google Search Console & vérifications i18n
- [ ] **Issue 43** : Sécurité & Durcissement (Checklist consolidée)
- [ ] **Issue 44** : Admin : Gestion complète des Catégories (CRUD)
- [ ] **Issue 45** : Hardening UX : Notifications détaillées en cas de panne de services tiers (Stripe/Shippo down)

---

## 📌 P4 – Qualité & Futur (Backlog)

**Issues de Suivi (Long terme) :**
- [ ] **Suivi Continu** : Sécurité Applicative & Rate Limiting (Issue #5)
- [ ] **Suivi Continu** : Documentation développeur & contributeurs (Issue #64)
- [ ] **Suivi Continu** : Implémentation RBAC (Issue #73)

**Backlog Profond :**
- [ ] Test de pénétration
- [ ] Tests Unitaires & E2E
- [ ] Audit Accessibilité (WCAG)
- [ ] Documentation API (OpenAPI)
- [ ] Monitoring Sentry/Logtail

---

## 📌 P5 – Gestionnaire de Fournisseurs Externe

### Module de Gestion Avancée (Futur)
- [ ] **Modèle :** Table `Supplier` et `PurchaseOrder`
- [ ] **Stock :** Réception de marchandise et mise à jour
- [ ] **Dashboards :** Alertes stock bas et performance fournisseur
