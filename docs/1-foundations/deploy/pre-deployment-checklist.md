# 🚀 Checklist pré-déploiement

Guide complet pour déployer une nouvelle boutique à partir du starter.

---

## 📋 Vue d'ensemble

Le starter supporte le déploiement **multi-région** : une même codebase peut être déployée plusieurs fois avec des configurations différentes.

### Architecture recommandée

```
ecommerce-starter-v2 (codebase)
        │
        ├── Boutique A - Canada (FR/EN + CAD)
        ├── Boutique A - USA (EN + USD)
        ├── Boutique B - Canada (FR/EN + CAD)
        └── Boutique B - USA (EN + USD)
```

- **Même niche** = même base de données (stock synchronisé)
- **Région différente** = configuration différente

---

## ✅ Étapes de déploiement

### 1. Cloner le projet

```bash
git clone [repo] ma-nouvelle-boutique
cd ma-nouvelle-boutique
npm install
```

### 2. Configurer la région

Créer le fichier `.env` à partir de `.env.example` et configurer :

#### 🇨🇦 Canada (FR/EN + CAD)

```env
# Région
NEXT_PUBLIC_REGION=canada
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_LOCALES=fr,en
NEXT_PUBLIC_CURRENCY=CAD

# Stripe (compte Stripe Canada)
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

#### 🇺🇸 États-Unis (EN + USD)

```env
# Région
NEXT_PUBLIC_REGION=usa
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_LOCALES=en
NEXT_PUBLIC_CURRENCY=USD

# Stripe (compte Stripe US)
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### 3. Configurer la base de données

```env
# Nouvelle boutique = nouvelle DB
DATABASE_URL=postgresql://user:pass@host:5432/boutique_irrigation

# Même boutique, autre région = même DB (stock synchronisé)
DATABASE_URL=postgresql://user:pass@host:5432/boutique_irrigation
```

```bash
npm run db:push    # Créer les tables
npm run db:seed    # Données de test (optionnel)
```

### 4. Configurer l'authentification (Clerk)

1. Créer une nouvelle application sur [clerk.com](https://clerk.com)
2. Configurer les variables :

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

3. Configurer le webhook Clerk → `/api/webhooks/clerk`

### 5. Configurer Stripe

1. Créer/sélectionner le compte Stripe pour la région
2. Configurer le webhook Stripe → `/api/webhooks/stripe`

```env
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Activer Stripe Tax (optionnel mais recommandé)

Pour que Stripe calcule automatiquement TPS/TVQ, HST, US sales tax :

1. Va sur https://dashboard.stripe.com/settings/tax
2. Configure l'adresse de ton entreprise
3. Entre ton numéro de taxe (TPS/TVQ pour le Québec)
4. Active dans ton `.env` :

```env
STRIPE_AUTOMATIC_TAX=true
```

**Sans cette config**, le checkout fonctionne mais les taxes sont à 0.

### 6. Personnaliser le thème

Modifier les variables CSS dans `src/app/globals.css` :

```css
:root {
  --primary: #your-brand-color;
  --primary-hover: #your-brand-color-dark;
}
```

### 7. Configurer le domaine

```env
NEXT_PUBLIC_APP_URL=https://ma-boutique.com
NEXT_PUBLIC_API_URL=https://ma-boutique.com
```

---

## 🔍 Vérifications avant mise en production

### Fonctionnalités

- [ ] Page d'accueil charge correctement
- [ ] Produits s'affichent dans la bonne devise
- [ ] Panier fonctionne (ajout, suppression, quantité)
- [ ] Checkout Stripe complète une transaction test
- [ ] Emails de confirmation sont envoyés
- [ ] Langues disponibles correspondent à la région

### Sécurité

- [ ] Variables d'environnement en mode `production`
- [ ] Webhooks Clerk et Stripe configurés
- [ ] Rate limiting activé
- [ ] HTTPS activé sur le domaine

### SEO

- [ ] Métadonnées configurées
- [ ] Sitemap généré
- [ ] robots.txt correct

---

## 📁 Résumé des variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXT_PUBLIC_REGION` | Région de déploiement | `canada` ou `usa` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Langue par défaut | `fr` ou `en` |
| `NEXT_PUBLIC_LOCALES` | Langues disponibles | `fr,en` ou `en` |
| `NEXT_PUBLIC_CURRENCY` | Devise | `CAD` ou `USD` |
| `DATABASE_URL` | Connexion PostgreSQL | `postgresql://...` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_live_...` |
| `CLERK_SECRET_KEY` | Clé secrète Clerk | `sk_live_...` |

---

## ⚠️ Note importante

Les variables `NEXT_PUBLIC_REGION`, `NEXT_PUBLIC_LOCALES`, `NEXT_PUBLIC_CURRENCY`, etc. **ne sont pas encore branchées dans le code**. Pour l'instant, le starter fonctionne en mode unifié (toutes les langues et devises activées). Ces variables seront implémentées lors de la phase de déploiement pour simplifier l'UX par région.

---

## 🔗 Ressources

- [Architecture du projet](../architecture.md)
- [Configuration i18n](../../2-Language_internationalization/language-config.md)
- [Thèmes CSS](../../3-development-tools/theming.md)
- [Dépannage Stripe](../../0-admin/TROUBLESHOOTING.md)
