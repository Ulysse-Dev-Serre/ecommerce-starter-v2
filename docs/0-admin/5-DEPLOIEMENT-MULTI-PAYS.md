# 🌍 Déploiement Multi-Pays

Guide pour déployer la même boutique dans plusieurs pays avec un seul codebase.

---

## Architecture

```
1 Repo GitHub → N Projets Vercel → N Domaines

ecommerce-starter/
  src/lib/config/site.ts   ← Lit les ENV, zéro hardcoding
  .env                      ← Seul fichier qui change par pays
```

**Principe** : le code ne change jamais entre les instances. Seules les variables d'environnement différencient chaque déploiement.

---

## Déploiement Vercel

### Créer un projet par pays

| Projet Vercel | Domaine | Pays | Devise | Locales |
|:---|:---|:---|:---|:---|
| `boutique-ca` | `boutique.ca` | CA | CAD | fr,en |
| `boutique-us` | `boutique.com` | US | USD | en,es |
| `boutique-fr` | `boutique.fr` | FR | EUR | fr |
| `boutique-uk` | `boutique.co.uk` | GB | GBP | en |
| `boutique-mx` | `boutique.mx` | MX | USD | es,en |

Chaque projet Vercel pointe vers le **même** repo GitHub.

### Variables d'environnement par projet

#### 🇨🇦 Canada — `boutique-ca`

```env
NEXT_PUBLIC_SITE_NAME="Ma Boutique Canada"
NEXT_PUBLIC_SITE_URL=https://boutique.ca
NEXT_PUBLIC_CORS_ORIGIN=https://boutique.ca
NEXT_PUBLIC_COUNTRY=CA
NEXT_PUBLIC_CURRENCY=CAD
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_LOCALES=fr,en
ADMIN_EMAIL=admin@boutique.ca
ADMIN_LOCALE=fr
FROM_EMAIL="Ma Boutique <noreply@boutique.ca>"
STRIPE_AUTOMATIC_TAX=true

# Stripe Canada
STRIPE_SECRET_KEY=sk_live_xxx_ca
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx_ca
STRIPE_WEBHOOK_SECRET=whsec_xxx_ca

# Clerk (partagé ou séparé)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Base de données (partagée si même niche)
DATABASE_URL=postgresql://...
```

#### 🇺🇸 États-Unis — `boutique-us`

```env
NEXT_PUBLIC_SITE_NAME="My Shop USA"
NEXT_PUBLIC_SITE_URL=https://boutique.com
NEXT_PUBLIC_CORS_ORIGIN=https://boutique.com
NEXT_PUBLIC_COUNTRY=US
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_LOCALES=en,es
ADMIN_EMAIL=admin@boutique.com
ADMIN_LOCALE=en
FROM_EMAIL="My Shop <noreply@boutique.com>"
STRIPE_AUTOMATIC_TAX=true

# Stripe US (compte séparé)
STRIPE_SECRET_KEY=sk_live_xxx_us
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx_us
STRIPE_WEBHOOK_SECRET=whsec_xxx_us
```

#### 🇫🇷 France — `boutique-fr`

```env
NEXT_PUBLIC_SITE_NAME="Ma Boutique France"
NEXT_PUBLIC_SITE_URL=https://boutique.fr
NEXT_PUBLIC_CORS_ORIGIN=https://boutique.fr
NEXT_PUBLIC_COUNTRY=FR
NEXT_PUBLIC_CURRENCY=EUR
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_LOCALES=fr
ADMIN_EMAIL=admin@boutique.fr
ADMIN_LOCALE=fr
FROM_EMAIL="Ma Boutique <noreply@boutique.fr>"
STRIPE_AUTOMATIC_TAX=true
```

---

## Stratégie par service

### 🗄️ Base de données (PostgreSQL)

La base de données peut être **partagée ou séparée** :

| Scénario | Stratégie | Avantage |
|:---|:---|:---|
| Même niche, même stock | **Partagée** (`DATABASE_URL` identique) | Stock synchronisé entre les pays |
| Niches différentes | **Séparée** (`DATABASE_URL` distinct) | Isolation complète des données |
| Très gros volumes | **Read replicas** par région | Performance optimale |

Les structures existantes sont déjà prêtes pour le multi-pays :
- **`ProductVariantPricing`** : Prix par devise (CAD, USD, EUR...) pour chaque variante
- **`ProductTranslation`** : Traductions des produits dans chaque langue
- **`LogisticsLocation`** : Adresses d'expédition par pays

Chaque instance filtre automatiquement par devise et langue grâce aux variables `NEXT_PUBLIC_CURRENCY` et `NEXT_PUBLIC_LOCALES`.

### 🔐 Clerk (Authentification)

Deux approches possibles :

| Approche | Configuration | Cas d'usage |
|:---|:---|:---|
| **Un seul compte Clerk** | Même `CLERK_SECRET_KEY` partout | Pool d'utilisateurs unique, un client peut acheter dans tous les pays |
| **Comptes Clerk séparés** | `CLERK_SECRET_KEY` différent par pays | Isolation des données utilisateurs, **recommandé pour la conformité RGPD** si vous avez des marchés EU vs US |

**Recommandation** : Comptes séparés si vous opérez en Europe (RGPD exige que les données restent dans la juridiction).

### 💳 Stripe (Paiements)

**Chaque pays devrait avoir son propre compte Stripe** (ou utiliser Stripe Connect) :

- **Comptabilité** : Séparation claire des revenus par pays
- **Taxes** : Stripe Tax s'adapte automatiquement au pays du client
- **Devises** : Encaissement natif dans la devise locale (pas de frais de conversion)
- **Conformité** : Respect des régulations locales (TVA en Europe, Sales Tax aux US)

```
Projet boutique-ca → Stripe Canada (sk_live_xxx_ca)
Projet boutique-us → Stripe US     (sk_live_xxx_us)
Projet boutique-fr → Stripe France  (sk_live_xxx_fr)
```

### 📦 Shippo (Livraison)

**Un seul compte Shippo** fonctionne pour tous les pays, à condition de :

1. Configurer une **adresse d'expédition par pays** dans la base de données via les `LogisticsLocations`
2. Associer les bons transporteurs par région dans le Dashboard Shippo
3. Optionnel : filtrer les transporteurs par pays via `SHIPPING_PROVIDERS` dans le `.env`

```env
# Canada : UPS + Canada Post
SHIPPING_PROVIDERS=ups,canadapost

# US : UPS + USPS
SHIPPING_PROVIDERS=ups,usps

# France : Colissimo + DHL
SHIPPING_PROVIDERS=colissimo,dhl
```

### 🌐 Dictionnaires i18n (Traductions)

Si un pays nécessite une langue qui n'existe pas encore :

1. Créer le fichier de traduction : `src/lib/i18n/dictionaries/{locale}.json`
2. Copier la structure depuis `en.json` ou `fr.json`
3. Traduire les clés
4. Ajouter la locale dans le `.env` du pays : `NEXT_PUBLIC_LOCALES=es,en`

**Langues actuellement disponibles** : `en` (anglais), `fr` (français).

---

## Variables qui changent par pays

| Variable | Description | Exemple CA | Exemple US |
|:---|:---|:---|:---|
| `NEXT_PUBLIC_SITE_NAME` | Nom de la boutique | Ma Boutique | My Shop |
| `NEXT_PUBLIC_SITE_URL` | URL du site | https://boutique.ca | https://boutique.com |
| `NEXT_PUBLIC_COUNTRY` | Code pays ISO | CA | US |
| `NEXT_PUBLIC_CURRENCY` | Code devise ISO | CAD | USD |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Langue par défaut | fr | en |
| `NEXT_PUBLIC_LOCALES` | Langues supportées | fr,en | en,es |
| `ADMIN_EMAIL` | Email admin | admin@boutique.ca | admin@boutique.com |
| `ADMIN_LOCALE` | Langue emails admin | fr | en |
| `FROM_EMAIL` | Expéditeur emails | Boutique <noreply@b.ca> | Shop <noreply@b.com> |
| `STRIPE_SECRET_KEY` | Clé Stripe | sk_live_xxx_ca | sk_live_xxx_us |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook | whsec_xxx_ca | whsec_xxx_us |
| `SHIPPING_PROVIDERS` | Transporteurs | ups,canadapost | ups,usps |

---

## Ajouter un nouveau pays

### Temps estimé : ~15 minutes

1. **Vercel** : Créer un nouveau projet pointant vers le même repo
2. **Domaine** : Associer le domaine au projet Vercel
3. **Variables** : Copier les variables d'un pays existant et adapter
4. **Stripe** : Créer un compte Stripe pour le pays (ou Stripe Connect)
5. **Traductions** : Si nécessaire, ajouter un fichier de dictionnaire
6. **Webhook Stripe** : Configurer l'endpoint `https://domaine/api/webhooks/stripe`
7. **Webhook Clerk** : Si compte séparé, configurer `https://domaine/api/webhooks/clerk`
8. **Déployer** : Le push sur `main` déploie automatiquement toutes les instances

### Vérification post-déploiement

- [ ] Page d'accueil affiche le bon nom de boutique
- [ ] Produits affichés dans la bonne devise
- [ ] Langues disponibles correspondent au pays
- [ ] Checkout fonctionne avec Stripe Tax activé
- [ ] Emails envoyés dans la bonne langue
- [ ] Livraison propose les bons transporteurs

---

## FAQ

### Un client peut-il avoir un compte sur plusieurs pays ?
**Avec Clerk partagé** : Oui, même email = même compte partout.
**Avec Clerk séparé** : Non, il devra créer un compte par pays.

### Les stocks sont-ils synchronisés entre les pays ?
**Si même `DATABASE_URL`** : Oui, le stock est partagé en temps réel.
**Si `DATABASE_URL` séparé** : Non, chaque pays a son propre stock.

### Puis-je avoir des prix différents par pays ?
Oui. La table `ProductVariantPricing` supporte les prix par devise. Chaque instance filtre automatiquement par `NEXT_PUBLIC_CURRENCY`.

### Comment gérer les promotions par pays ?
Les promotions sont stockées en base de données. Avec une DB partagée, elles s'appliquent à tous les pays. Pour des promotions spécifiques par pays, ajoutez un champ `country` à la table des promotions.
