# 🛡️ En-têtes de Sécurité (HTTP Headers)

Ce document détaille la configuration des en-têtes HTTP appliqués pour protéger les utilisateurs et votre boutique contre les vecteurs d'attaque web classiques.

---

## 1. Protections Fondamentales

Le serveur injecte systématiquement un ensemble d'en-têtes de sécurité sur chaque requête pour renforcer le comportement du navigateur :

| En-tête | Rôle | bénéfice |
| :--- | :--- | :--- |
| **X-Frame-Options** | SAMEORIGIN | **Anti-Clickjacking** : Empêche l'affichage du site dans une iframe malveillante. |
| **X-Content-Type** | nosniff | **Anti-MIME Sniffing** : Force le navigateur à respecter le type de contenu déclaré. |
| **Referrer-Policy** | strict-origin | Protège la confidentialité des URLs lors du passage vers un site tiers. |
| **HSTS** | Strict-Transport | **Force HTTPS** : Garantit que toutes les connexions se font exclusivement en SSL. |

---

## 2. Content Security Policy (CSP)

Nous appliquons une politique stricte (Whitelist) qui bloque par défaut toute ressource externe non autorisée. Cela neutralise la majorité des attaques par injection de scripts (XSS).

### Services Tiers Autorisés
- **Paiements** : Stripe (`js.stripe.com`, `api.stripe.com`).
- **Authentification** : Clerk (`clerk.com`, `*.clerk.accounts.dev`).
- **Cartographie** : Google Maps API.
- **Logistique** : Shippo API.
- **Analytics** : Google Tag Manager, Vercel Vitals.
- **Médias** : Cloudinary (Images produits).

---

## 3. Politique CORS (Cross-Origin Resource Sharing)

La gestion des partages de ressources est dynamique pour sécuriser les appels API :

- **En Développement** : Ouvert pour faciliter le travail local.
- **En Production** : Restriction stricte au domaine défini dans la variable d'environnement `NEXT_PUBLIC_CORS_ORIGIN`. Toute requête provenant d'un domaine inconnu est rejetée par le serveur.

---

## 4. Maintenance Technique

- **Configuration** : Les en-têtes sont centralisés dans le fichier de configuration racine de Next.js (`next.config.ts`).
- **Monitoring** : La conformité peut être auditée via des outils standards comme **Mozilla Observatory** ou **SecurityHeaders.com**. Un grade **A** est visé pour la production.
