# ⚖️ Limitation de Taux (Rate Limiting)

Cette documentation détaille la stratégie de protection de l'API contre les abus, le spam et les attaques par déni de service (DoS).

---

## 1. Stratégie de Protection

Le système de limitation est appliqué de manière granulaire selon la sensibilité de l'endpoint. Chaque identifiant (Utilisateur connecté ou Adresse IP) possède un "budget" de requêtes par fenêtre de temps.

### Table des Limites
| Profil | Limite | Fenêtre | Cible |
| :--- | :--- | :--- | :--- |
| **PUBLIC** | 60 req | 1 min | Consultation catalogue, pages statiques. |
| **CART_WRITE** | 50 req | 1 min | Ajouts et modifications du panier. |
| **ADMIN** | 30 req | 1 min | Gestion du catalogue et des utilisateurs. |
| **WEBHOOK** | 100 req | 1 min | Entrées Clerk, Stripe et Shippo. |
| **STRICT** | 5 req | 15 min | Actions sensibles (Login, Paiement). |

---

## 2. Identification de la Source

Pour garantir une application juste de ces limites, le système identifie les appelants selon une hiérarchie stricte :

1.  **Utilisateur Connecté** : Identifié par son `clerkId`. C'est l'identifiant le plus précis.
2.  **Visiteur Anonyme** : Identifié par son adresse IP (récupérée via les headers `x-forwarded-for` ou `x-real-ip`).

---

## 3. Comportement en cas de Dépassement

Lorsqu'un utilisateur dépasse son quota, le serveur rejette immédiatement la requête avec un code **HTTP 429 (Too Many Requests)**.

### Informations fournies au client :
- **Headers de réponse** : Le client reçoit des en-têtes standard (`X-RateLimit-Limit`, `X-RateLimit-Remaining`) lui permettant d'ajuster son rythme.
- **Délai d'attente** : La réponse inclut un champ `retryAfter` indiquant le nombre de secondes à attendre avant la prochaine tentative autorisée.

---

## 4. Architecture et Stockage

Le système est conçu pour évoluer selon l'environnement de déploiement :

-   **Développement / Test** : Stockage en mémoire locale (rapide, mais perdu au redémarrage).
-   **Production** : Utilisation d'un stockage distribué (**Redis via Upstash**) pour partager les limites entre toutes les instances du serveur et garantir une persistance totale.

---

## 5. Surveillance et Alertes

Toute violation de limite est enregistrée dans le système de logs pour analyse ultérieure.

- **Warning Automatique** : Généré dès qu'un identifiant atteint 100% de sa limite.
- **Critères d'Alerte** : Une surveillance est active si une adresse IP unique dépasse un seuil anormal de rejets (signe potentiel d'une attaque par force brute ou d'un bot malveillant).

---

## 6. Bonnes Pratiques
- **Adapter les limites** : Les seuils sont régulièrement revus pour ne jamais bloquer un utilisateur réel en navigation normale.
- **Priorité aux Webhooks** : Les services tiers (Stripe, Clerk) ont des quotas plus larges pour éviter toute rupture de synchronisation.
