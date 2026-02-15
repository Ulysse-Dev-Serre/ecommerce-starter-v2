---
description: Exécuter des tests Playwright E2E avec nettoyage automatique de l'environnement
---

Ce workflow garantit que l'environnement est propre avant de lancer des tests Playwright, évitant les blocages sur le port 3000 ou les navigateurs fantômes.

// turbo-all
1. Nettoyer les processus bloquants :
   - Vérifier et tuer tout processus sur le port 3000 : `fuser -k 3000/tcp || true`
   - Tuer les anciens processus Playwright : `pkill -f playwright || true`
   - Tuer les instances de navigateur résiduelles : `pkill -f "chromium" || true`

2. Attendre 2 secondes pour la libération complète du port : `sleep 2`

3. Exécuter la suite complète de validation :
   - Commande : `npx playwright test src/tests/e2e/auth.setup.ts src/tests/e2e/admin/dashboard.spec.ts src/tests/e2e/admin/product-crud.spec.ts --workers=1 --project=chromium`

*Note : Adaptez l'étape 3 pour lancer d'autres tests spécifiques selon la phase de refactorisation en cours.*
