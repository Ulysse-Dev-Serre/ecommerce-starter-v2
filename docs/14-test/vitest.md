# Intégration de Vitest (Tests Unitaires & Métier)

Vitest est le framework de tests moderne utilisé dans ce projet. Il remplace Jest pour sa rapidité et son intégration native avec TypeScript et Vite.

## 1. Pourquoi Vitest ?

- **Vitesse** : Pas de compilation lourde, démarrage instantané.
- **TypeScript Native** : Supporte les alias (`@/*`) et les décorateurs sans configuration complexe.
- **Compatibilité** : API compatible avec Jest (`describe`, `it`, `expect`), ce qui facilite la transition.

## 2. Architecture de Test (Le Pattern "Senior")

Pour rendre le code testable, nous suivons une architecture à trois couches :

1.  **Repository** : Isole les appels à la base de données (Prisma).
2.  **Service** : Contient la logique métier (calculs, validations, règles de gestion).
3.  **API Route** : Simple porte d'entrée qui délègue tout au service.

> [!TIP]
> **Règle d'or** : On ne teste pas les fichiers `route.ts` directement avec Vitest. On teste les **Services** qui contiennent la logique.

## 3. Procédure d'Intégration d'un Nouveau Test

### Étape 1 : Localisation (Co-location)
Placez vos fichiers de test directement à côté du code source avec l'extension `.test.ts`.
- `src/lib/services/orders/order-management.service.ts`
- `src/lib/services/orders/order-management.test.ts` (Nouveau test)

### Étape 2 : Mocking des Dépendances
Utilisez `vi.mock()` pour isoler la fonction que vous testez. Si vous testez un **Service**, vous devez mocker le **Repository**.

```typescript
import { vi, describe, it, expect } from 'vitest';
import { myService } from './my.service';
import { myRepository } from '@/lib/repositories/my.repository';

// Mock du repository pour ne pas toucher à la vraie DB
vi.mock('@/lib/repositories/my.repository', () => ({
  myRepository: {
    findById: vi.fn(),
  },
}));
```

### Étape 3 : Écriture de la Règle Métier
Concentrez-vous sur les règles "Vrai ou Faux" et les erreurs attendues.

```typescript
it('devrait bloquer une action si la condition X n\'est pas remplie', async () => {
  // 1. Setup (données simulées)
  vi.mocked(myRepository.findById).mockResolvedValue({ status: 'CLOSED' });

  // 2. Action
  const promise = myService.performAction('id_1');

  // 3. Assertion (Vérification)
  await expect(promise).rejects.toThrow('Action impossible sur un élément fermé');
});
```

## 4. Configuration Globale

- **`vitest.config.ts`** : Gère les alias `@/` et l'environnement `jsdom`.
- **`src/tests/setup.ts`** : Charge les variables d'environnement (`.env`) et définit les mocks globaux (Prisma).

## 5. Commandes Utiles

| Commande | Description |
| :--- | :--- |
| `npm run test:unit` | Lance tous les tests une seule fois. |
| `npm run test:unit:watch` | Lance les tests en mode interactif (relance au changement). |
| `npx vitest run my.test.ts` | Lance un fichier de test spécifique. |

---

> [!IMPORTANT]
> **Productivité** : La co-location des tests accélère le développement car la logique et sa validation sont toujours côte à côte.
