# 🗂 Roadmap Ecommerce Starter V2 — Milestones & Issues

---

## 📌 P0 – Fondations & CI/CD

1. ✅Définir la vision MVP ✅
2. ✅Configurer les environnements et secrets (local/dev/prod) 
3. ✅Choisir et configurer l'authentification (clerk) 
4. ✅Mettre en place headers de sécurité HTTP et CORS basiques 
5. ✅Synchroniser Clerk avec la base de données PostgreSQL (webhooks) 
6. ✅Concevoir le schéma initial de la base de données (Prisma) 
7. ✅Configurer pipeline Prisma (migrations + seeds utilisateur) 
8. ✅ Mettre en place rôles utilisateur de base (user/admin)
9. ✅Mettre en place logging structuré et observabilité minimale 
10. ✅Concevoir traduction i18n de base (locales, URLs `/fr` `/en`) 
11. ✅Créer pipeline CI/CD (lint, typecheck, build) 

---

## 📌 P1 – E-commerce core

13. ✅ Créer API Produits (liste, détail par slug) - **GET seulement**
14. ✅ Créer API Catégories (arborescence, détail, breadcrumbs) - **GET seulement**
15. ✅ Implémenter RBAC (Role-Based Access Control) - **Base créée** (middlewares `withAuth`, `withAdmin`)

15.5. ✅ Créer UI minimal pour test


16. ✅ Implémenter gestion du panier invité et utilisateur
17. Calcul des totaux panier (taxes simples, frais fixes)
18. Intégrer Stripe Checkout (paiement simple)
19. Gérer webhooks Stripe (paiement réussi/échoué)
20. Modéliser et créer la table Commandes (API création + liste utilisateur)

21. 🔒 **RBAC - Sécuriser panier, paiement et commandes**
    - Appliquer `withAuth()` sur routes panier utilisateur
    - Appliquer `withAuth()` sur création session checkout Stripe
    - Appliquer `withAuth()` sur GET/POST commandes utilisateur
    - Appliquer `withAdmin()` sur liste globale des commandes

22. Créer pages publiques : accueil, catalogue, produit
23. Créer pages panier et checkout côté frontend
24. Envoyer emails transactionnels (confirmation commande)

25. Créer un admin minimal (produits, catégories, commandes)
26. Créer API CRUD complète Produits (POST/PUT/DELETE)
27. Créer API CRUD complète Catégories (POST/PUT/DELETE)

28. 🔒 **RBAC - Sécuriser admin dashboard et CRUD**
    - Protéger toutes les pages `/admin/*` avec middleware Next.js
    - Masquer liens admin dans navigation selon rôle
    - Appliquer `withAdmin()` sur POST/PUT/DELETE produits
    - Appliquer `withAdmin()` sur POST/PUT/DELETE catégories

29. Vérifier i18n routing (FR/EN, fallback) pour nouveaux ajouts
30. Implémenter rate limiting minimal sur API sensibles

---

## 📌 P2 – i18n & SEO

25. Créer tables ou champs de traduction pour produits & catégories
26. Gérer slugs localisés par langue
27. Ajouter balises `<html lang>` et `hreflang` SEO
28. Générer sitemap bilingue dynamique
29. Localiser metadata (title, description) et données structurées
30. Localiser formats (prix, devises, dates)
31. Traduire emails transactionnels FR/EN
32. Traduire pages d'erreur (404, 500)
33. Mettre en place redirections et canonical pour migration SEO
34. Configurer Google Search Console FR/EN

---

## 📌 P3 – Admin & Sécurité avancée

36. Construire dashboard admin (UI minimal)  
    → 🔒 **RBAC:** Protéger page `/admin/dashboard` avec middleware
37. CRUD avancé pour produits, catégories, utilisateurs  
    → 🔒 **RBAC:** Toutes les routes CRUD admin protégées par `withAdmin()`
38. Liste des commandes + états (pending, paid, shipped, cancelled)  
    → 🔒 **RBAC:** `withAdmin()` pour liste globale, vérifier ownership pour clients
39. Ajouter journaux d'activité admin (qui fait quoi)  
    → 🔒 **RBAC:** Logs d'audit automatiques dans middlewares auth
40. Mettre en place 2FA pour les comptes admin
41. Sécuriser webhooks Stripe (signatures + retries)
42. Activer headers HTTP stricts (CSP, HSTS, etc.)
43. Implémenter rate limiting avancé + WAF simple
44. Chiffrer données sensibles (ex: adresses)
45. Mettre en place sauvegardes et restaurations automatiques
46. Sécuriser l'upload des médias (images produits)  
    → 🔒 **RBAC:** `withAdmin()` sur routes upload/delete médias
47. Faire tests de pénétration internes (checklist OWASP)
48. Politique de gestion des secrets (rotation, vault)

---

## 📌 P4 – Qualité, Observabilité & Légal

49. Écrire tests unitaires (Jest) pour modèles et services
50. Écrire tests E2E (Playwright) pour parcours d'achat  
    → 🔒 **RBAC:** Tests automatisés 401/403 pour routes protégées
51. Audit accessibilité (WCAG 2.2 AA)
52. Optimiser Core Web Vitals (LCP, CLS, FID)
53. Mettre en place monitoring erreurs (Sentry/Logtail)
54. Mettre en place health checks API
55. Documenter l'API (OpenAPI/Swagger)
56. Rédiger documentation développeurs (README, guides)
57. Intégrer analytics (GA4 ou Plausible) + events e-commerce
58. Rédiger politique de confidentialité (Québec + RGPD)
59. Rédiger conditions d'utilisation et mentions légales
60. Mettre en place gestion des retours (RMA process)
61. Créer process post-mortem et qualité continue avant release

---

## 📌 P5 – Gestionnaire de Fournisseurs Externe

[Suite du roadmap P5 inchangée...]
