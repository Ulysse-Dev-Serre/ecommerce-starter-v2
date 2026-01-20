# 🚀 Checklist Pré-Production

Guide complet pour déployer et mettre en ligne une boutique.

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
STRIPE_WEBHOOK_SECRET=whsec_xxx
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
STRIPE_WEBHOOK_SECRET=whsec_xxx
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
```

### 4. Configurer l'authentification (Clerk)

1. Créer une nouvelle application sur [clerk.com](https://clerk.com)
2. Configurer les variables :

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=[REDACTED:webhook-secret]
CLERK_TEST_USER_ID=user_xxxxx
```

3. Configurer le webhook Clerk → `/api/webhooks/clerk`

### 5. Configurer Stripe

1. Créer/sélectionner le compte Stripe pour la région
2. Configurer le webhook Stripe → `/api/webhooks/stripe`

```env
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=[REDACTED:webhook-secret]
```

### 5. Configurer Shippo (Livraison)

1. Aller sur [Shippo Dashboard > Settings > API](https://apps.goshippo.com/settings/api)
2. Générer un **Live Token** (commence par `shippo_live_`)
3. Mettre à jour `.env` :

```env
SHIPPO_API_KEY=shippo_live_xxx
```

**Note importante :** En développement, nous utilisons la clé de test (`shippo_test_xxx`). N'oubliez pas de passer à la clé de production pour générer de vraies étiquettes valides chez les transporteurs (UPS, Canada Post, etc.).


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

Voir: [Guide des thèmes](../8-frontend/theming.md)

### 7. Configurer Analytics & Marketing (GTM/GA4)

Pour avoir des statistiques de vente et lancer des publicités (Facebook/Google Ads) :

1.  **Créer un compte Google Tag Manager (GTM)** :
    *   Aller sur [tagmanager.google.com](https://tagmanager.google.com)
    *   Créer un conteneur **Web**
    *   Récupérer l'ID `GTM-XXXXXX`
    *   Mettre à jour `.env` :
    ```env
    NEXT_PUBLIC_GTM_ID=GTM-XXXXXX
    ```

2.  **Créer un compte Google Analytics 4 (GA4)** :
    *   Aller sur [analytics.google.com](https://analytics.google.com)
    *   Créer une propriété (Devise: celle du site, Fuseau horaire: celui du site)
    *   Récupérer le **Measurement ID** (`G-XXXXXX`)

3.  **Lier les deux (Configuration One-Shot)** :
    *   Dans GTM > Balises > Nouvelle > **Google Analytics: Google Tag**
    *   Coller l'ID GA4 (`G-XXXXXX`)
    *   Déclencheur : **Initialization - All Pages**
    *   Publier le conteneur

### 8. Configurer le domaine et CORS

```env
NEXT_PUBLIC_APP_URL=https://ma-boutique.com
NEXT_PUBLIC_API_URL=https://ma-boutique.com
NEXT_PUBLIC_CORS_ORIGIN=https://ma-boutique.com
```

⚠️ **CORS_ORIGIN doit correspondre à votre domaine en production** (pas localhost)

### 9. Configurer Google Maps API (Restrictions)

Dans la console Google Cloud [Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials) :

- [ ] Modifiez les **Restrictions HTTP** de votre clé API.
- [ ] Supprimez `http://localhost:3000/*` (si présent en production).
- [ ] Ajoutez votre domaine réel : `https://votre-domaine.com/*`.

*Note: Sans cette étape, l'autocomplétion d'adresse pourrait échouer en production ou être vulnérable au vol de quota.*

---

## 🔑 Clés Stripe en mode Live

### ✅ Actions à faire

- [ ] Récupérer les clés **live** (et non test) depuis [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- [ ] Mettre à jour `.env` en production :
  ```bash
  STRIPE_SECRET_KEY=sk_live_...        # ⚠️ Plus sk_test_
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # ⚠️ Plus pk_test_
  ```
- [ ] Vérifier que `.env` est dans `.gitignore` (ne jamais commit les clés live)
- [ ] Configurer les variables d'environnement sur votre serveur (Vercel, AWS, etc.)

### ⚠️ Vérification

Vérifier dans les logs au démarrage :
```
[INFO] Stripe client initialized
mode: "live"  # ← Doit être "live", pas "test"
```

---

## 🪝 Webhook Stripe en production

### ✅ Actions à faire

- [ ] Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
- [ ] Créer un endpoint avec l'URL de production :
  ```
  https://votre-domaine.com/api/webhooks/stripe
  ```
- [ ] Sélectionner les événements à écouter :
  - ✅ `payment_intent.succeeded`
  - ✅ `payment_intent.payment_failed`
  - ✅ `checkout.session.completed`
  - ✅ `checkout.session.expired`
  - ✅ `charge.refunded` (si vous gérez les remboursements)

- [ ] Copier le **Signing secret** (whsec_...) affiché
- [ ] Mettre à jour `.env` en production :
  ```bash
  STRIPE_WEBHOOK_SECRET=whsec_...  # ⚠️ Nouveau secret, différent du test
  ```

### ⚠️ Vérification

Faire un paiement test en production et vérifier dans Stripe Dashboard > Webhooks que l'événement retourne **200 OK**.

---

## 🔒 Sécurité

### ✅ Vérifier les données sensibles

- [ ] **Aucune donnée de carte** stockée dans votre DB (Stripe s'en occupe)
- [ ] **Aucune clé secrète** dans les logs
- [ ] **Pas de données sensibles** exposées dans les API publiques
- [ ] **Variables d'environnement en mode `production`**
- [ ] **HTTPS activé** sur le domaine

### ⚠️ Vérification

```sql
-- Vérifier qu'aucune table ne contient des numéros de carte
SELECT * FROM payments WHERE external_id LIKE '%4242%';  -- Ne doit rien retourner
```

---

## 📊 Logging et monitoring

### ✅ Actions à faire

- [ ] Vérifier que tous les webhooks sont loggés dans `webhook_events`
- [ ] Vérifier que toutes les actions sont loggées dans `audit_logs`
- [ ] Configurer des alertes (Sentry, LogRocket, etc.) pour :
  - Webhooks échoués (`processed = false`)
  - Paiements échoués (`payment_intent.payment_failed`)
  - Erreurs 500 sur les routes Stripe

### ⚠️ Vérification

```sql
-- Vérifier les webhooks des dernières 24h
SELECT event_type, processed, COUNT(*) 
FROM webhook_events 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, processed;
```

---

## 🧪 Tests en production

### ✅ Vérifications fonctionnelles

- [ ] Page d'accueil charge correctement
- [ ] Produits s'affichent dans la bonne devise
- [ ] Panier fonctionne (ajout, suppression, quantité)
- [ ] Langues disponibles correspondent à la région
- [ ] Métadonnées configurées
- [ ] Sitemap généré
- [ ] robots.txt correct

### ✅ Faire des vrais tests avec de vraies cartes

⚠️ **Attention :** En mode live, les cartes de test (`4242 4242...`) ne fonctionnent plus.

**Option 1 : Utiliser votre propre carte**
- Faire un paiement de 0,50€ (montant minimal)
- Vérifier que la commande est créée
- Faire un remboursement immédiatement

**Option 2 : Mode test toujours activé temporairement**
- Garder les clés test le temps de valider tout le flow
- Passer en mode live seulement quand tout fonctionne

### ✅ Scénarios à tester

- [ ] Paiement réussi → Commande créée + stock décrémenté + webhook reçu
- [ ] Paiement refusé → Stock libéré + pas de commande créée
- [ ] Session expirée → Stock libéré
- [ ] Remboursement → Commande marquée REFUNDED + stock remonté (optionnel)

---

## 🌍 Conformité légale

### ✅ RGPD / CCPA

- [ ] **Politique de confidentialité** à jour (mentionner Stripe)
- [ ] **Conditions générales de vente** (CGV) incluant :
  - Politique de remboursement
  - Délais de livraison
  - Droit de rétractation (si applicable)
- [ ] **Consentement cookies** si vous trackez les paiements (Google Analytics, etc.)

### ✅ Sécurité des paiements

- [ ] **Certificat SSL/TLS** actif (HTTPS obligatoire)
- [ ] **Badge "Paiement sécurisé par Stripe"** sur la page checkout
- [ ] **Pas de stockage de numéros de carte** (c'est interdit par PCI-DSS)

---

## 💸 Configuration Stripe Dashboard

### ✅ Paramètres de compte

- [ ] **Nom de l'entreprise** configuré
- [ ] **Logo** uploadé (apparaît sur les reçus Stripe)
- [ ] **Email de support** configuré (pour les clients)
- [ ] **Devise par défaut** configurée (CAD, USD, EUR, etc.)

### ✅ Emails automatiques

- [ ] Activer les **emails de confirmation** Stripe (ou les vôtres)
- [ ] Activer les **reçus** automatiques

Aller dans : [Stripe Dashboard > Settings > Emails](https://dashboard.stripe.com/settings/emails)

---

## 📦 Gestion du stock

### ✅ Vérifier la logique de réservation

- [ ] Stock réservé lors de la création de session (`reservedStock++`)
- [ ] Stock décrémenté après paiement confirmé (`stock--`, `reservedStock--`)
- [ ] Stock libéré si paiement échoué ou session expirée (`reservedStock--`)

### ⚠️ Vérification

```sql
-- Vérifier qu'il n'y a pas de stock négatif
SELECT * FROM product_variant_inventory 
WHERE stock < 0 OR reserved_stock < 0;
```

---

## 🔄 Backup et rollback

### ✅ Actions à faire

- [ ] **Backup de la DB** avant le lancement
- [ ] **Plan de rollback** en cas de problème :
  - Comment revenir aux clés test rapidement ?
  - Comment désactiver temporairement les paiements ?
- [ ] **Monitoring des transactions** en temps réel (Stripe Dashboard)

---

## ✅ Checklist finale

Avant de lancer en production, vérifier que **tous** les éléments suivants sont faits :

### Configuration
- [ ] `.env` mis à jour avec variables de production
- [ ] **TEST_API_KEY et CLERK_TEST_USER_ID ABSENTS** du `.env` en production
- [ ] NEXT_PUBLIC_CORS_ORIGIN configuré avec votre domaine (pas localhost)
- [ ] Base de données configurée et migrée
- [ ] Clerk et Stripe configurés
- [ ] Webhooks configurés pour les deux services
- [ ] **Restrictions Google Maps** : Domaine réel ajouté et localhost supprimé (Console Google Cloud)

### Stripe
- [ ] Clés live configurées (`sk_live_`, `pk_live_`)
- [ ] Webhook configuré en production (whsec_...)
- [ ] Événements webhook sélectionnés
- [ ] Nom d'entreprise et logo dans Stripe Dashboard
- [ ] Emails de confirmation activés
- [ ] Stripe Tax activé (si applicable)

### Sécurité
- [ ] HTTPS activé sur le domaine
- [ ] Aucune donnée de carte stockée
- [ ] Variables sensibles en `.env` (jamais en code)
- [ ] `.gitignore` contient `.env`
- [ ] NODE_ENV=production sur le serveur

### Fonctionnalités
- [ ] Page d'accueil charge correctement
- [ ] Produits visibles dans la bonne devise
- [ ] Panier fonctionne
- [ ] Checkout complète une transaction
- [ ] Commande créée après webhook
- [ ] Stock décrémenté correctement

### Tests
- [ ] Paiement réussi testé en production
- [ ] Webhook reçu et commande créée
- [ ] Stock correctement géré
- [ ] Remboursement testé (optionnel)

### Légal
- [ ] Politique de confidentialité
- [ ] CGV avec politique de remboursement
- [ ] Badge "Paiement sécurisé par Stripe"

### Monitoring
- [ ] Logs actifs (webhook_events, audit_logs)
- [ ] Alertes configurées (Sentry, etc.)
- [ ] Backup DB fait

---

## 🚨 En cas de problème après lancement

1. **Désactiver temporairement les paiements** :
   - Commenter le bouton "Passer commande"
   - Ou rediriger vers une page "Maintenance"

2. **Revenir aux clés test** le temps de corriger

3. **Consulter** [Dépannage Stripe](./9-payment-system/TROUBLESHOOTING.md)

4. **Contacter le support Stripe** : [https://support.stripe.com](https://support.stripe.com)

---

## 📞 Support et ressources

- **Architecture du projet** : [Architecture](../1-foundations/architecture.md)
- **Configuration i18n** : [i18n](../2-Language_internationalization/language-config.md)
- **Thèmes CSS** : [Theming](../8-frontend/theming.md)
- **Dépannage Stripe** : [Troubleshooting](../9-payment-system/TROUBLESHOOTING.md)
- **Documentation Stripe** : [https://stripe.com/docs](https://stripe.com/docs)
- **Dashboard Stripe** : [https://dashboard.stripe.com](https://dashboard.stripe.com)
- **Support Stripe** : Disponible 24/7 en mode live
