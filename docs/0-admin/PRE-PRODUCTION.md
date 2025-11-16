# 🚀 Checklist Pré-Production Stripe

## Avant de mettre en ligne votre site avec paiements Stripe

---

## 🔑 1. Clés Stripe en mode Live

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

## 🪝 2. Webhook en production

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

## 🔒 3. Sécurité

### ✅ Supprimer tous les bypass de développement

- [ ] **Clerk authentication** : Supprimer les bypass de test
  ```typescript
  // ❌ Retirer ce code en production
  if (process.env.NODE_ENV === 'development' && testApiKey) {
    return mockUser;
  }
  ```

- [ ] **Rate limiting** : Vérifier qu'il est actif
  ```typescript
  // ✅ Doit être présent
  export const POST = withError(
    withRateLimit(createCheckoutSessionHandler, RateLimits.PUBLIC)
  );
  ```

- [ ] **RBAC complet** : Vérifier que seuls les admins peuvent :
  - Voir tous les paiements
  - Faire des remboursements
  - Accéder aux webhooks manuellement

### ✅ Vérifier les données sensibles

- [ ] **Aucune donnée de carte** stockée dans votre DB (Stripe s'en occupe)
- [ ] **Aucune clé secrète** dans les logs
- [ ] **Pas de données sensibles** exposées dans les API publiques

### ⚠️ Vérification

```sql
-- Vérifier qu'aucune table ne contient des numéros de carte
SELECT * FROM payments WHERE external_id LIKE '%4242%';  -- Ne doit rien retourner
```

---

## 📊 4. Logging et monitoring

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

## 🧪 5. Tests en production

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

## 🌍 6. Conformité légale

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

### ⚠️ Vérification

- Vérifier que votre site est en HTTPS : `https://votre-domaine.com`
- Vérifier que Stripe apparaît sur la page de paiement

---

## 💸 7. Configuration Stripe Dashboard

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

## 📦 8. Gestion du stock

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

## 🔄 9. Backup et rollback

### ✅ Actions à faire

- [ ] **Backup de la DB** avant le lancement
- [ ] **Plan de rollback** en cas de problème :
  - Comment revenir aux clés test rapidement ?
  - Comment désactiver temporairement les paiements ?
- [ ] **Monitoring des transactions** en temps réel (Stripe Dashboard)

---

## ✅ Checklist finale

Avant de lancer en production, vérifier que **tous** les éléments suivants sont faits :

### Stripe
- [ ] Clés live configurées (`sk_live_`, `pk_live_`)
- [ ] Webhook configuré en production (whsec_...)
- [ ] Événements webhook sélectionnés
- [ ] Nom d'entreprise et logo dans Stripe Dashboard
- [ ] Emails de confirmation activés

### Sécurité
- [ ] Bypass de dev supprimés (Clerk, rate limiting, etc.)
- [ ] HTTPS activé sur le domaine
- [ ] Aucune donnée de carte stockée
- [ ] RBAC complet pour les admins

### Tests
- [ ] Paiement réussi testé en production
- [ ] Webhook reçu et commande créée
- [ ] Stock correctement géré
- [ ] Remboursement testé (optionnel)

### Légal
- [ ] Politique de confidentialité
- [ ] CGV avec politique de remboursement
- [ ] Consentement cookies (si applicable)

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

3. **Consulter** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

4. **Contacter le support Stripe** : [https://support.stripe.com](https://support.stripe.com)

---

## 📞 Support

- **Documentation Stripe** : [https://stripe.com/docs](https://stripe.com/docs)
- **Dashboard Stripe** : [https://dashboard.stripe.com](https://dashboard.stripe.com)
- **Support Stripe** : Disponible 24/7 en mode live
