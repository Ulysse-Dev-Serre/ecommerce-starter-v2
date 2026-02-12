# 📋 API Documentation - Index

Documentation légère et lisible des endpoints e-commerce.

**Objectif**: Comprendre rapidement quels endpoints existent, leur rôle et où les trouver.

---

## 📚 Fichiers par domaine

### Public/Client
- **[products.md](products.md)** - Catalogue (GET liste, détail)
- **[cart.md](cart.md)** - Panier (CRUD items, calcul, fusion)
- **[orders.md](orders.md)** - Mes commandes (GET liste, détail, verify)
- **[checkout.md](checkout.md)** - Paiement Stripe (créer session, succès)

### Admin
- **[admin.md](admin.md)** - Index des endpoints admin (table des matières)
- **[products.md](products.md)** (sections admin) - Produits, variantes, attributs
- **[orders.md](orders.md)** (sections admin) - Gestion commandes
- **[media.md](media.md)** - Images/vidéos (upload, delete, reorder)

### Utilisateurs & Intégrations
- **[users.md](users.md)** - Gestion utilisateurs
- **[webhooks.md](webhooks.md)** - Clerk, Stripe webhooks
- **[internal.md](internal.md)** - Health check

---

## 🔐 Authentification & Protection

### Sans auth
- Public: GET products
- Internal: Health check

### Avec auth (Client)
- GET cart, POST cart lines
- GET orders

### Admin uniquement
- POST/PUT/DELETE products, variants, attributes
- Gestion commandes, médias

Tous les endpoints admin utilisent: `withError → withAdmin → withRateLimit`

---

## 🗺️ Architecture globale

```
Request
  ↓
Route Handler (src/app/api/...)
  ↓
Validation (Zod schemas)
  ↓
Auth Middleware (withAuth/withAdmin)
  ↓
Service Layer (lib/services/*.ts)
  ↓
Database (Prisma ORM)
  ↓
Response JSON
```

---

## 📊 Statistiques

- **Total endpoints**: 45+
- **Fichiers**: 8
- **Catégories**: Public (7), Admin (24), Webhooks (3), Internal (1)
- **Auth levels**: Public, Client, Admin
- **Devises**: CAD, USD

---

## 🔍 Recherche rapide

Cherche un endpoint spécifique? Utilise:
1. `Ctrl+F` dans ce fichier pour trouver la catégorie
2. Ouvre le fichier .md correspondant
3. Cherche l'endpoint exact

**Exemple**: Chercher GET /api/admin/orders
→ Voir [orders.md](orders.md) section "Admin"

---

## ⚡ Quick Links

- Créer un produit? → [products.md](products.md) `POST /api/admin/products`
- Ajouter au panier? → [cart.md](cart.md) `POST /api/cart/lines`
- Payer? → [checkout.md](checkout.md) `POST /api/checkout/create-intent`
- Voir mes commandes? → [orders.md](orders.md) `GET /api/orders`
- Upload image? → [media.md](media.md) `POST /api/admin/media/upload`

---

## 🏗️ Architecture des devises (Mono-devise)

Le projet utilise `SITE_CURRENCY` (défini dans `src/lib/config/site.ts`) comme devise de référence. 
- Bien que la base de données supporte plusieurs devises, le flux de paiement et les calculs privilégient la devise par défaut du site.
- La plupart des APIs acceptent une `currency` optionnelle mais utilisent `SITE_CURRENCY` par défaut.

---

## 🛠️ Ressources connexes

- **Sécurité**: `docs/7-securite/RBAC.md`, `rate-limiting.md`, `zod-validation.md`
- **Database**: `docs/4-database-stack/database_shema.md`
- **Paiements**: `docs/9-payment-system/`
- **Frontend**: `docs/8-frontend/`
