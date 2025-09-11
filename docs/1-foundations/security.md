### Sécurité - Headers HTTP

Ce document décrit les headers HTTP de sécurité implémentés dans le projet pour garantir une protection de base contre les vulnérabilités courantes. La configuration est gérée de manière centralisée dans le fichier `next.config.ts`.

#### Headers de sécurité activés

Les headers suivants sont appliqués à toutes les réponses du serveur pour protéger le site :

* **`X-Frame-Options`**: Défini à `SAMEORIGIN`. Empêche le site d'être embarqué dans une `<iframe>` sur un domaine externe, protégeant contre le **clic-jacking**.
* **`X-Content-Type-Options`**: Défini à `nosniff`. Empêche le navigateur d'exécuter des fichiers de manière incorrecte, ce qui protège contre le **sniffing de types MIME**.
* **`Referrer-Policy`**: Défini à `strict-origin-when-cross-origin`. Contrôle la quantité d'informations de la page précédente qui est envoyée aux sites externes, protégeant la vie privée des utilisateurs.
* **`Strict-Transport-Security` (HSTS)**: Défini à `max-age=63072000; includeSubDomains; preload`. Force le navigateur à toujours utiliser le protocole **HTTPS** pour les futures connexions, protégeant contre les attaques de type "man-in-the-middle".

#### Configuration par environnement (CORS)

La politique de partage de ressources entre origines (`CORS`) est gérée de manière flexible à l'aide d'une variable d'environnement pour s'adapter à chaque environnement de déploiement.

* **En production** : La variable d'environnement `NEXT_PUBLIC_CORS_ORIGIN` doit être définie avec l'URL de votre domaine (ex. : `https://www.mon-ecommerce.com`). Cela garantit que seul votre site est autorisé à interagir avec les API.
* **En développement** : Par défaut, la valeur revient à `*`, ce qui permet un accès facile et sans restriction depuis votre machine locale.

**Exemple dans le fichier `.env`** :
## NEXT_PUBLIC_CORS_ORIGIN=https://www.mon-ecommerce.com

---

#### Plan de durcissement (Phase 2)

Pour renforcer davantage la sécurité, un plan d'action est prévu pour la **Phase 2**. Nous implémenterons un **Content Security Policy (CSP)** strict. Cette politique permettra de définir et de limiter les sources de contenu approuvées (scripts, styles, images), bloquant ainsi les attaques par injection de scripts malveillants (XSS).