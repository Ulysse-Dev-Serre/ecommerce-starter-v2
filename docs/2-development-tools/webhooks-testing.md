# 🛜 Guide de Test des Webhooks (Local)

Ce guide centralise la procédure pour tester les services tiers qui communiquent avec notre application (Stripe, Clerk, Shippo) pendant le développement local.

---

## 1. 🚇 Tunneling avec Ngrok
Pour recevoir des webhooks sur votre machine locale, vous devez exposer votre serveur au web via une URL sécurisée (HTTPS).

### Installation & Lancement
1. **Lancer l'application** : `npm run dev` (tourne sur `http://localhost:3000`).
2. **Exposer le port** : Dans un nouveau terminal, lancez :
   ```bash
   ngrok http 3000
   ```
3. **Récupérer l'URL** : Copiez l'URL de transfert (ex: `https://abcd-123.ngrok-free.app`).

> ⚠️ **Note (Version Gratuite)** : L'URL change à chaque redémarrage de Ngrok. Pensez à mettre à jour vos endpoints dans les dashboards tiers à chaque session de développement.

---

## 2. Configuration par Service

### 🆔 Clerk (Authentification & Sync Users)
1. **Dashboard** : [Webhooks Clerk](https://dashboard.clerk.com/last-active?path=webhooks)
2. **Endpoint** : `URL_NGROK/api/webhooks/clerk`
3. **Événements** : `user.created`, `user.updated`, `user.deleted`
4. **Variable .env** : Copiez le "Signing Secret" dans `CLERK_WEBHOOK_SECRET`.
5. **Test** : Créez un utilisateur sur votre site local et vérifiez sa présence immédiate dans votre base de données via `npm run db:studio`.

### 💳 Stripe (Paiements)
1. **Dashboard** : [Webhooks Stripe (Test)](https://dashboard.stripe.com/test/webhooks)
2. **Endpoint** : `URL_NGROK/api/webhooks/stripe`
3. **Événements** : `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. **Variable .env** : Copiez le "Signing Secret" (`whsec_...`) dans `STRIPE_WEBHOOK_SECRET`.
5. **CLI (Alternative)** : Vous pouvez aussi utiliser `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

### 📦 Shippo (Livraison & Suivi)
1. **Dashboard** : [Webhooks Shippo](https://app.goshippo.com/settings/webhooks)
2. **Endpoint** : `URL_NGROK/api/webhooks/shippo?token=VOTRE_SECRET`
3. **Événements** : `track_updated`
4. **Variable .env** : Le paramètre `token` dans l'URL doit correspondre à `SHIPPO_WEBHOOK_SECRET`.
5. **Test** : Utilisez le bouton "Test Webhook" dans le dashboard Shippo pour envoyer un payload de démonstration.

---

## 3. Outils de Debugging
Notre starter inclut des outils pour faciliter le suivi des événements :

1. **Table WebhookEvent** : Tous les webhooks reçus sont loggés en base de données pour audit (via Prisma).
2. **API de Status** : `GET /api/webhooks/stripe/status` permet de voir les derniers événements Stripe traités.
3. **Logs Serveur** : Les logs détaillés s'affichent dans votre terminal `npm run dev` grâce à Pino.

---

## 🔗 Références
- **Guide Ngrok détaillé** : [Site officiel ngrok.com](https://ngrok.com/)
- **Documentation API Webhooks** : [Fichier /docs/7-api/webhooks.md](../7-api/webhooks.md)
