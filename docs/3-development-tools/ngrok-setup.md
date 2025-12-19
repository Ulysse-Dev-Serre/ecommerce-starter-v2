# 🚇 Guide de Configuration Ngrok

Ngrok est un outil indispensable pour le développement de webhooks (Stripe, Clerk, Shippo) en local. Il permet d'exposer votre serveur local (localhost:3000) sur une URL publique sécurisée (https).

## 📥 Installation

### Sur Linux (Via Snap)

```bash
sudo snap install ngrok
```

### via NPM (Alternative)

```bash
npm install -g ngrok
```

## 🔑 Configuration Initiale

1.  **Créer un compte** : Rendez-vous sur [ngrok.com](https://ngrok.com/) et créez un compte gratuit.
2.  **Récupérer le Token** : Dans votre dashboard Ngrok, copiez votre "Authtoken".
3.  **Configurer localement** :

```bash
# Remplacez YOUR_TOKEN par le token fourni dans votre dashboard
ngrok config add-authtoken YOUR_TOKEN
```

## 🚀 Utilisation Courante

### Exposer le serveur de développement

Pour exposer votre site Next.js (qui tourne généralement sur le port 3000) :

```bash
ngrok http 3000
```

**Résultat :** Ngrok va afficher une interface dans le terminal. Cherchez la ligne `Forwarding`.
Exemple : `https://a1b2-88-123-456-78.ngrok-free.app` -> `http://localhost:3000`

C'est cette URL en `https` que vous devrez fournir aux services tiers (Stripe, Clerk, etc.).

### Bonnes Pratiques

*   **Ne jamais commiter votre Authtoken**.
*   **Les URLs changent** à chaque redémarrage de ngrok (version gratuite). Pensez à mettre à jour vos webhooks dans les dashboards (Stripe/Clerk) à chaque session de dev.
