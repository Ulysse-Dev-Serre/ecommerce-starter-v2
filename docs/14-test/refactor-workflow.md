# Workflow de Refactorisation & Tests (Standard)

Ce document définit l'ordre rigoureux à suivre pour refactoriser une route API et lui ajouter des tests unitaires Vitest. Ce cycle garantit une logique métier isolée, validée et testable.

## 🔄 Le Cycle de Refactorisation (Les 4 Étapes)

### 1. Validation (`src/lib/validators/`)
Définir le schéma **Zod** qui valide les données entrantes.
- **Pourquoi ?** Pour garantir que le service reçoit des données propres.
- **Fichier :** `nom-module.ts`

### 2. Service (`src/lib/services/`)
Extraire la logique métier de la route vers une classe de service statique.
- **Pourquoi ?** Pour rendre la logique réutilisable et testable sans dépendre de HTTP.
- **Fichier :** `nom-service.service.ts`

### 3. Test Unitaire (`src/lib/services/`)
Créer le fichier de test Vitest juste à côté du service (**Co-location**).
- **Pourquoi ?** Pour valider chaque règle métier avec des mocks (sans toucher à la DB réelle).
- **Fichier :** `nom-service.test.ts`
- **Commande :** `npx vitest src/lib/services/chemin/vers/le.test.ts`

### 4. Refactorisation de la Route (`src/app/api/`)
Simplifier la route pour qu'elle ne soit plus qu'une "boîte aux lettres".
- **Action :** Appeler le validateur, puis appeler le service.
- **Fichier :** `route.ts`

---

## 💡 Exemple concret (Analytics)

1.  **Validator** : `src/lib/validators/analytics.ts` (Zod schema)
2.  **Service** : `src/lib/services/analytics/analytics.service.ts` (DB create logic)
3.  **Unit Test** : `src/lib/services/analytics/analytics.test.ts` (Mock Prisma & Test errors)
4.  **Route** : `src/app/api/tracking/events/route.ts` (Delegate to Service)

## 🚀 Vérification Finale
Une fois le cycle terminé, effectuer un test d'intégration rapide (ex: `curl`) pour s'assurer que le tunnel complet (API -> Service -> DB) fonctionne toujours.
