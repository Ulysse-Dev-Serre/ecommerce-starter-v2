#  E-Commerce Starter V2

**Le starter kit ultime pour déployer des boutiques e-commerce haute performance en quelques jours.**

Ce projet n'est pas juste un "template", c'est une infrastructure **Multi-Tenant** pensée pour la scalabilité internationale et la gestion multi-marchés.

---

## Vision : Un Starter Universel

Le Starter a été conçu autour de quatre piliers fondamentaux :

1.  **Un Site = Un Pays / Une Devise** : Chaque instance cible un marché spécifique (ex: Canada en CAD, France en EUR) avec sa propre logique fiscale et logistique.
2.  **Centralisation Totale** : Une seule base de données Postgres pour tous vos déploiements. Les produits sont créés une seule fois et partagés entre tous vos sites.
3.  **Localisation Native** : Support bilingue (ex: FR/EN pour le Canada) avec des URLs propres et une gestion intelligente des dictionnaires.
4.  **Zéro Hardcoding** : Toute la logique métier est centralisée dans `site.ts`. Modifiez une ligne, et toute la boutique s'adapte.

---

##  Architecture des Données

*   **Produits Centralisés** : Traductions automatiques via `ProductTranslation`.
*   **Pricing Dynamique** : Stratégies de prix indépendantes par devise (ex: 100 CAD != 72 USD) via `ProductVariantPricing`.
*   **Logistique Réelle** : Calcul des frais de port en temps réel via l'intégration native de **Shippo**.
*   **Paiement Global** : Tunnel de paiement sécurisé avec **Stripe** (incluant Stripe Tax).

---

##  Démarrage Rapide

```bash
git clone [repo-url] my-shop
cd my-shop
npm install
cp .env.exemple .env
# Configurez Neon & Clerk dans le .env
npm run dev
```

---

##  Centre de Commandes (Documentation)

Ne vous perdez pas dans le code. Toute la puissance du Starter est documentée et organisée.

###  [L'INDEX COMPLET DES GUIDES](./docs/INDEX.md)

###  Le Cockpit Admin (Les 4 Piliers) :
1.  **[Configuration Initiale](./docs/0-admin/1-CONFIG-INITIALE.md)** : Votre .env, votre `site.ts` et votre premier accès Admin.
2.  **[Protocole IA](./docs/0-admin/2-AI-STARTUP-PROTOCOLE.md)** : Comment utiliser une IA pour transformer ce starter selon votre niche.
3.  **[Dashboard Admin](./docs/0-admin/3-DASHBOARD-ADMIN.md)** : Guide de gestion du catalogue, des stocks et des commandes.
4.  **[Lancement Prod](./docs/0-admin/4-LANCEMENT-PRODUCTION.md)** : La checklist ultime avant de passer en "Live".

---

## Stack Technique

*   **Frontend** : React 19 + Next.js 15 (App Router) + Tailwind CSS 4.
*   **Backend** : Service Layer (Business Logic isolée) + Prisma ORM.
*   **Auth** : Clerk (RBAC natif Admin/Client).
*   **Database** : PostgreSQL (Neon).
*   **Emails** : Resend (React Email).

---

##  Commandes Essentielles

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Lancer le serveur local |
| `npm run db:push` | Synchroniser le schéma Prisma |
| `npm run db:studio` | Interface visuelle pour la base de données |
| `npm run sync-clerk sync` | Synchroniser les utilisateurs Clerk → DB |
| `npm run test` | Lancer la suite de tests Vitest / Playwright |

---

**Licence** : MIT – Utilisation libre pour projets commerciaux.
**Support** : Consultez l'**[Index de la Documentation](./docs/INDEX.md)**.
