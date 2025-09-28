# Webhooks - Vue d'ensemble

Les webhooks permettent aux services externes d'envoyer automatiquement des données vers votre application quand des événements se produisent.

---

## 🔗 **Webhooks actuellement configurés**

### **👥 Clerk - Gestion des utilisateurs**

**🎯 Fonction :** Synchronise automatiquement les utilisateurs entre Clerk et la base de données PostgreSQL

**⚡ Événements gérés :**

- ✅ **Utilisateur créé** → Ajout automatique en base
- ✅ **Utilisateur modifié** → Mise à jour automatique en base
- ✅ **Utilisateur supprimé** → Suppression automatique en base

**🛠️ Endpoint :** `/api/webhooks/clerk`

**📚 Configuration complète :** Voir [Synchronisation Clerk ↔ PostgreSQL](../4-database-stack/clerk-postgres-sync.md) pour les détails techniques (ngrok, configuration Clerk Dashboard, tests)

---

## 🔮 **Webhooks futurs prévus**

### **💳 Stripe - Gestion des paiements**

_À configurer plus tard_

**🎯 Fonction :** Gestion automatique des paiements et commandes  
**⚡ Événements prévus :**

- `payment_intent.succeeded` → Marquer commande comme payée
- `payment_intent.failed` → Annuler commande
- `invoice.payment_succeeded` → Activer abonnement

**🛠️ Endpoint futur :** `/api/webhooks/stripe`

---

### **📧 Emails - Suivi de livraison**

_À configurer plus tard_

**🎯 Fonction :** Tracking des emails envoyés (confirmations, notifications)  
**⚡ Événements prévus :**

- `delivered` → Log email livré avec succès
- `bounced` → Marquer adresse email invalide
- `opened` → Analytics d'ouverture

**🛠️ Endpoint futur :** `/api/webhooks/email`

---

### **📦 Livraison - Suivi de colis**

_À configurer plus tard_

**🎯 Fonction :** Mise à jour automatique du statut des livraisons  
**⚡ Événements prévus :**

- `package.in_transit` → Mettre à jour statut commande
- `package.delivered` → Notifier client et clôturer commande
- `package.exception` → Gérer les problèmes de livraison

**🛠️ Endpoint futur :** `/api/webhooks/shipping`

---

## 🎯 **Différence : Webhooks vs Actions internes**

### **🌐 Webhooks (Services externes → Votre app)**

- **Clerk** vous informe : "Un utilisateur s'est inscrit"
- **Stripe** vous informe : "Un paiement a été réussi"
- **Transporteur** vous informe : "Le colis est livré"

### **🏠 Actions internes (Votre interface → Votre base)**

- Admin ajoute un produit → Direct vers PostgreSQL
- Client ajoute au panier → Direct vers PostgreSQL
- Modification des stocks → Direct vers PostgreSQL

**En résumé :** Webhook = "On me parle", Action interne = "Je fais moi-même"

---

## 🔍 **Debugging et monitoring**

### **📊 Logs disponibles**

Tous les webhooks génèrent des logs détaillés pour le monitoring et le debugging :

```bash
# Voir les logs en temps réel
npm run dev

# Les webhooks apparaissent avec des détails complets :
# - Événement reçu
# - Données synchronisées
# - Erreurs éventuelles
```

### **🛠️ Outils de test**

- **ngrok** pour exposer localhost en développement
- **Clerk Dashboard** pour déclencher des événements test
- **Scripts de test** pour créer des utilisateurs factices

**📚 Détails techniques :** Voir [Configuration Clerk](../4-database-stack/clerk-postgres-sync.md)
