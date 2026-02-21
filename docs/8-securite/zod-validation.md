# 🛡️ Validation des Données (Zod)

Ce document détaille l'utilisation de **Zod** comme couche de défense impénétrable pour garantir l'intégrité de la base de données et la stabilité de l'application.

---

## 1. Philosophie de "Défense en Profondeur"

Alors que le **RBAC** vérifie *qui* a le droit d'agir, **Zod** vérifie *quoi* est envoyé au serveur. Il s'agit de la dernière barrière avant que les données n'atteignent nos services métier et la base de données.

### Pourquoi Zod est indispensable :

| Risque métier | Protection Zod | Résultat |
| :--- | :--- | :--- |
| **Vente à perte** | `z.number().positive()` | Rejet de tout prix négatif ou nul. |
| **Bug Inventaire** | `z.number().int().min(0)` | Rejet des stocks décimaux ou négatifs. |
| **URL Cassée** | `z.regex(/^[a-z0-9-]+$/)` | Garantie que les slugs sont valides pour le SEO. |
| **Data Corrompue** | `z.string().min(1)` | Empêche la création d'objets vides ou incomplets. |

---

## 2. Domaines de Validation

Le système de validation est organisé par domaine fonctionnel dans `src/lib/validators/`. Chaque action critique possède son propre contrat technique :

- **📦 Catalogue** : Validation des prix, des poids (pour le shipping), des dimensions et des traductions multilingues.
- **🛒 Panier** : Vérification des types de variantes et des quantités cohérentes (entiers positifs).
- **💳 Checkout** : Validation des adresses (format code postal, pays ISO) et des devises autorisées.
- **🚚 Logistique** : Conformité des données envoyées à Shippo pour éviter les erreurs de calcul de tarifs.
- **👤 Utilisateurs** : Validation des emails et des rôles lors des promotions Admin.

---

## 3. Workflow de Traitement

Le pipeline de sécurité s'exécute dans cet ordre strict pour chaque requête entrante :

1.  **Limitation** (`withRateLimit`) : On bloque les attaques par force brute.
2.  **Identité** (`withAuth`) : On vérifie que l'utilisateur est bien celui qu'il prétend être.
3.  **Contrat technique** (**Zod**) : On s'assure que les données sont saines.
4.  **Logique Métier** : Le service s'exécute en toute confiance, sachant que la donnée est valide.

---

## 4. Gestion des Erreurs

En cas de non-conformité, le serveur rejette la requête avec un code **HTTP 400 (Bad Request)**.
- **Transparence** : Le serveur retourne une liste précise des champs invalides et la raison du rejet.
- **Logging** : Chaque erreur de validation est logguée (`AppError`) pour permettre de détecter des anomalies ou des tentatives d'exploitation de failles (Injections).

---

## 5. Maintenance des Contrats

Tous les schémas de validation sont centralisés dans le dossier `src/lib/validators/`. Toute modification d'un modèle de données (Prisma) doit être répercutée dans le schéma Zod correspondant pour maintenir une protection à 100%.
