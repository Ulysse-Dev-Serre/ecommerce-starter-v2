# 🎯 Quiz Stripe - Testez vos connaissances

## Instructions

Pour chaque question, trouvez la bonne réponse. Les solutions sont à la fin.

---

## Questions

### 1. Quel fichier contient la fonction qui crée une session de paiement Stripe ?

A) `src/app/api/checkout/create-session/route.ts`  
B) `src/lib/stripe/checkout.ts`  
C) `src/lib/stripe/webhooks.ts`  
D) `src/app/[locale]/cart/cart-client.tsx`

---

### 2. Que fait le bouton "Passer commande" quand on clique dessus ?

A) Il crée directement la commande dans la base de données  
B) Il appelle Stripe pour créer une session et redirige vers la page de paiement  
C) Il envoie un email de confirmation  
D) Il décrémente le stock immédiatement  

---

### 3. Quelle carte de test permet de simuler un paiement réussi ?

A) `4000 0000 0000 0002`  
B) `4242 4242 4242 4242`  
C) `4000 0025 0000 3155`  
D) `5555 5555 5555 4444`  

---

### 4. Pourquoi utilise-t-on les webhooks au lieu de créer la commande sur la page `/checkout/success` ?

A) C'est plus rapide  
B) C'est plus joli visuellement  
C) Le client peut manipuler l'URL, mais le webhook vient directement de Stripe de façon sécurisée  
D) Stripe impose d'utiliser les webhooks  

---

### 5. Quel endpoint reçoit les webhooks de Stripe ?

A) `GET /api/checkout/success`  
B) `POST /api/webhooks/stripe`  
C) `POST /api/checkout/create-session`  
D) `GET /api/orders/[orderId]`  

---

### 6. Comment vérifie-t-on qu'un webhook vient vraiment de Stripe ?

A) On vérifie l'adresse IP  
B) On vérifie la signature cryptographique avec `STRIPE_WEBHOOK_SECRET`  
C) On vérifie le user-agent  
D) On appelle l'API Stripe pour confirmer  

---

### 7. Que contient le dossier `lib/` en général ?

A) Les composants React  
B) Les pages frontend  
C) La logique métier réutilisable (services, utilitaires)  
D) Les images et assets  

---

### 8. Quelle est la différence entre `lib/stripe/checkout.ts` et les hooks React comme `useState` ?

A) Aucune différence, c'est pareil  
B) `lib/` s'exécute côté serveur (backend), les hooks côté navigateur (frontend)  
C) `lib/` est plus rapide  
D) Les hooks sont pour TypeScript uniquement  

---

### 9. Quand réserve-t-on le stock (`reservedStock++`) ?

A) Quand le client ajoute au panier  
B) Quand on crée la session Stripe (avant le paiement)  
C) Après le paiement confirmé  
D) Jamais, on décrémente directement  

---

### 10. Quand décrémente-t-on le stock (`stock--`) ?

A) Quand le client clique sur "Passer commande"  
B) Quand la session Stripe est créée  
C) Quand le webhook confirme que le paiement a réussi  
D) Quand le client arrive sur `/checkout/success`  

---

### 11. Qu'est-ce que l'idempotence dans le contexte des webhooks ?

A) La capacité de traiter les webhooks rapidement  
B) S'assurer qu'on ne crée pas 2 commandes si Stripe envoie le même webhook plusieurs fois  
C) Crypter les webhooks  
D) Valider les webhooks  

---

### 12. Quel fichier contient la logique pour traiter un paiement confirmé par Stripe ?

A) `src/lib/stripe/checkout.ts`  
B) `src/lib/stripe/webhooks.ts`  
C) `src/app/api/checkout/create-session/route.ts`  
D) `src/components/cart/product-actions.tsx`  

---

### 13. Quels sont les 3 niveaux de sécurité mentionnés dans la documentation ?

A) Firewall, Antivirus, VPN  
B) Authentification, Protection, Traçabilité  
C) HTTPS, Cookies, Sessions  
D) Encryption, Backup, Monitoring  

---

### 14. Que se passe-t-il si un paiement échoue ?

A) Rien, on ignore  
B) On crée quand même la commande  
C) Le webhook `payment_intent.payment_failed` libère le stock réservé  
D) On envoie un email à l'admin  

---

### 15. Où sont loggés tous les événements webhooks reçus ?

A) Dans la console du navigateur  
B) Dans le fichier `.env`  
C) Dans la table `WebhookEvent` de la base de données  
D) Dans Stripe Dashboard uniquement  

---

## ✅ Réponses

<details>
<summary>Cliquez pour voir les réponses</summary>

### 1. **B** - `src/lib/stripe/checkout.ts`
La route API appelle cette fonction, mais la logique métier est dans `lib/stripe/checkout.ts`.

### 2. **B** - Il appelle Stripe pour créer une session et redirige vers la page de paiement
Le frontend appelle `POST /api/checkout/create-session` qui retourne une URL Stripe.

### 3. **B** - `4242 4242 4242 4242`
C'est la carte de test Stripe pour simuler un paiement réussi.

### 4. **C** - Le client peut manipuler l'URL, mais le webhook vient directement de Stripe de façon sécurisée
Les webhooks sont la source de vérité, pas les redirections frontend.

### 5. **B** - `POST /api/webhooks/stripe`
C'est l'endpoint qui écoute les événements Stripe.

### 6. **B** - On vérifie la signature cryptographique avec `STRIPE_WEBHOOK_SECRET`
Stripe signe chaque webhook avec une clé secrète, on vérifie cette signature.

### 7. **C** - La logique métier réutilisable (services, utilitaires)
C'est le "cerveau" de l'application : connexions DB, calculs, etc.

### 8. **B** - `lib/` s'exécute côté serveur (backend), les hooks côté navigateur (frontend)
`lib/` est sécurisé et invisible au client, les hooks sont publics dans le navigateur.

### 9. **B** - Quand on crée la session Stripe (avant le paiement)
On réserve le stock pour que personne d'autre ne puisse l'acheter pendant le paiement.

### 10. **C** - Quand le webhook confirme que le paiement a réussi
On attend la confirmation officielle de Stripe avant de décrémenter.

### 11. **B** - S'assurer qu'on ne crée pas 2 commandes si Stripe envoie le même webhook plusieurs fois
On utilise `payloadHash` pour détecter les doublons.

### 12. **B** - `src/lib/stripe/webhooks.ts`
C'est là qu'on traite `payment_intent.succeeded` et qu'on crée la commande.

### 13. **B** - Authentification, Protection, Traçabilité
Validation signature, rate limiting, et logs complets.

### 14. **C** - Le webhook `payment_intent.payment_failed` libère le stock réservé
On libère le stock pour que d'autres clients puissent acheter.

### 15. **C** - Dans la table `WebhookEvent` de la base de données
Chaque webhook est enregistré avec son hash, date, type, et statut de traitement.

</details>

---

## 🎓 Barème

- **13-15 bonnes réponses** : Expert Stripe ! 🏆
- **10-12 bonnes réponses** : Très bon niveau ! 👍
- **7-9 bonnes réponses** : Bon niveau, relisez la doc 📚
- **< 7 bonnes réponses** : Relisez ARCHITECTURE.md et SECURITY.md 🔄
