# 🗂 Roadmap Ecommerce Starter V2 — Milestones & Issues

---

## 📌 P0 – Fondations & CI/CD

1. Définir la vision MVP et règles d’équipe
2. Configurer les environnements et secrets (local/dev/prod)
3. Choisir et configurer l’authentification (clerk, sessions)
4. Mettre en place headers de sécurité HTTP et CORS basiques
5. Implémenter rate limiting minimal sur API sensibles
6. Concevoir le schéma initial de la base de données (Prisma)
7. Configurer pipeline Prisma (migrations + seeds)
8. Définir stratégie i18n structurelle (locales, URLs `/fr` `/en`)
9. Mettre en place logging structuré et observabilité minimale
10. Créer pipeline CI/CD (lint, typecheck, build)

---

## 📌 P1 – E-commerce core

11. Implémenter l’inscription et connexion avec NextAuth
12. Mettre en place rôles utilisateur de base (user/admin)
13. Créer API Produits (CRUD + listing)
14. Créer API Catégories (CRUD + listing)
15. Implémenter gestion du panier invité et utilisateur
16. Calcul des totaux panier (taxes simples, frais fixes)
17. Intégrer Stripe Checkout (paiement simple)
18. Gérer webhooks Stripe (paiement réussi/échoué)
19. Modéliser et créer la table Commandes
20. Créer pages publiques : accueil, catalogue, produit
21. Créer pages panier et checkout côté frontend
22. Envoyer emails transactionnels (confirmation commande)
23. Créer un admin minimal (produits, catégories, commandes)

---

## 📌 P2 – i18n & SEO

24. Configurer Next.js i18n routing (FR/EN, fallback)
25. Créer tables ou champs de traduction pour produits & catégories
26. Gérer slugs localisés par langue
27. Ajouter balises `<html lang>` et `hreflang` SEO
28. Générer sitemap bilingue dynamique
29. Localiser metadata (title, description) et données structurées
30. Localiser formats (prix, devises, dates)
31. Traduire emails transactionnels FR/EN
32. Traduire pages d’erreur (404, 500)
33. Mettre en place redirections et canonical pour migration SEO
34. Configurer Google Search Console FR/EN

---

## 📌 P3 – Admin & Sécurité avancée

35. Implémenter RBAC (Role-Based Access Control)
36. Construire dashboard admin (UI minimal)
37. CRUD avancé pour produits, catégories, utilisateurs
38. Liste des commandes + états (pending, paid, shipped, cancelled)
39. Ajouter journaux d’activité admin (qui fait quoi)
40. Mettre en place 2FA pour les comptes admin
41. Sécuriser webhooks Stripe (signatures + retries)
42. Activer headers HTTP stricts (CSP, HSTS, etc.)
43. Implémenter rate limiting avancé + WAF simple
44. Chiffrer données sensibles (ex: adresses)
45. Mettre en place sauvegardes et restaurations automatiques
46. Sécuriser l’upload des médias (images produits)
47. Faire tests de pénétration internes (checklist OWASP)
48. Politique de gestion des secrets (rotation, vault)

---

## 📌 P4 – Qualité, Observabilité & Légal

49. Écrire tests unitaires (Jest) pour modèles et services
50. Écrire tests E2E (Playwright) pour parcours d’achat
51. Audit accessibilité (WCAG 2.2 AA)
52. Optimiser Core Web Vitals (LCP, CLS, FID)
53. Mettre en place monitoring erreurs (Sentry/Logtail)
54. Mettre en place health checks API
55. Documenter l’API (OpenAPI/Swagger)
56. Rédiger documentation développeurs (README, guides)
57. Intégrer analytics (GA4 ou Plausible) + events e-commerce
58. Rédiger politique de confidentialité (Québec + RGPD)
59. Rédiger conditions d’utilisation et mentions légales
60. Mettre en place gestion des retours (RMA process)
61. Créer process post-mortem et qualité continue avant release
