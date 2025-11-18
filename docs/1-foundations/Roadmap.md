# 🗂 Roadmap Ecommerce Starter V2 — Milestones & Issues

---

## 📌 P0 – Fondations & CI/CD — 100% ✅

**Ordre chronologique réel d'implémentation :**

1. ✅ Définir la vision MVP & règles de contribution
2. ✅ Gestion des environnements & secrets (local/dev/prod)
3. ✅ Schéma base de données v2 (catalogue, variantes, prix, stock)
4. ✅ Pipeline Prisma (migrations & seed minimal)
5. ✅ Choix Clerk & politique de sessions
6. ✅ Navbar avec authentification Clerk
7. ✅ Headers de sécurité HTTP & CORS basiques
8. ✅ i18n structurel : schéma d'URL & locales (FR/EN)
9. ✅ Observabilité de base : logging structuré
10. ✅ Qualité & CI/CD minimale (lint, typecheck, build) 

---

## 📌 P1 – E-commerce Core (Backend API + Admin) — 85% ✅

**Ordre chronologique réel d'implémentation :**

1. ✅ Finaliser le modèle Utilisateur & Rôles (user/admin) et synchroniser Clerk avec la base de données
2. ✅ API Produits (liste, détail par slug) - GET public + CRUD admin
3. ⚠️ Dashboard admin minimal (à vérifier)
4. ⚠️ CRUD Produits et Catégories (admin) (à vérifier)
5. ⚠️ Panier invité (ajout/mise à jour/suppression) (à vérifier)
6. ⚠️ Fusion panier invité → utilisateur à la connexion (à vérifier)
7. ⚠️ Calcul totaux panier (prix, taxes placeholder, remises simples) (partiellement - checkbox logging manquant)
8. ⚠️ Pages publiques : Accueil, Catégorie, Produit, Panier, Checkout (à vérifier)
9. ⚠️ Intégration Stripe Payment Element (client) & Intent serveur (à vérifier)
10. ⚠️ Webhook Stripe (signature + idempotence) & création de commande (à vérifier)
11. ⚠️ Modèle Commande & états (créée, payée, annulée) (à vérifier)
12. ⚠️ Webhooks Stripe sécurisés (à vérifier)
13. ⚠️ Gestion des Commandes (admin) (à vérifier)
14. ⚠️ Admin minimal : lecture Commandes + CRUD Catégories/Produits (à vérifier)

### ❌ Non complété en P1
- [ ] Envoyer emails transactionnels (confirmation commande) → **Reporté P3**

---

## 📌 P2 – i18n & SEO

**Note** : Tables de traduction déjà créées en base (ProductTranslation, CategoryTranslation).

51. ✅ Créer tables de traduction pour produits & catégories (fait en P1.5)
52. Gérer slugs localisés par langue
53. Ajouter balises `<html lang>` et `hreflang` SEO
54. Générer sitemap bilingue dynamique
55. Localiser metadata (title, description) et données structurées
56. Localiser formats (prix, devises, dates)
57. Traduire emails transactionnels FR/EN
58. Traduire pages d'erreur (404, 500)
59. Mettre en place redirections et canonical pour migration SEO
60. Configurer Google Search Console FR/EN

---

## 📌 P3 – Admin & Sécurité avancée

**Note** : Dashboard admin et CRUD déjà créés en P1.5. Focus sur sécurité avancée.

### ✅ Déjà fait (P1.5)
- ✅ Dashboard admin UI complet
- ✅ CRUD produits, catégories, commandes
- ✅ RBAC sur toutes routes admin (`withAdmin()`)
- ✅ Sécuriser webhooks Stripe (signatures vérifiées)
- ✅ Upload médias sécurisé (RBAC admin)

### À faire
61. Ajouter journaux d'activité admin (AuditLog dans schema, à implémenter)
62. Mettre en place 2FA pour les comptes admin
63. Activer headers HTTP stricts (CSP, HSTS, etc.)
64. Implémenter rate limiting avancé + WAF simple
65. Chiffrer données sensibles (ex: adresses)
66. Mettre en place sauvegardes et restaurations automatiques
67. Faire tests de pénétration internes (checklist OWASP)
68. Politique de gestion des secrets (rotation, vault)
69. Envoyer emails transactionnels (reporté de P1)
70. API CRUD Catégories complète (actuellement GET seulement)

---

## 📌 P4 – Qualité, Observabilité & Légal

### ✅ Déjà fait
- ✅ Health checks API (`/api/internal/health`)
- ✅ Documentation développeurs (docs/ structure complète)

### À faire
71. Écrire tests unitaires (Jest) pour modèles et services
72. Écrire tests E2E (Playwright) pour parcours d'achat  
    → Tests automatisés 401/403 pour routes protégées
73. Audit accessibilité (WCAG 2.2 AA)
74. Optimiser Core Web Vitals (LCP, CLS, FID)
75. Mettre en place monitoring erreurs (Sentry/Logtail)
76. Documenter l'API (OpenAPI/Swagger)
77. Intégrer analytics (GA4 ou Plausible) + events e-commerce
78. Rédiger politique de confidentialité (Québec + RGPD)
79. Rédiger conditions d'utilisation et mentions légales
80. Mettre en place gestion des retours (RMA process)
81. Créer process post-mortem et qualité continue avant release

---

## 📌 P5 – Gestionnaire de Fournisseurs Externe

[Suite du roadmap P5 inchangée...]
