Synchronisation en temps réel (méthode personnelle Linux)**

Cette étape utilise **ngrok** pour exposer votre serveur local et permettre la synchronisation automatique entre Clerk et PostgreSQL lors de la création d'utilisateurs via la navbar frontend. Cela simule le comportement réel de l'application déployée.

### **Principe de fonctionnement :**
1. **ngrok** expose votre serveur local (`localhost:3000`) avec une URL publique
2. Cette URL est configurée comme **webhook endpoint** dans Clerk
3. Lorsqu'un utilisateur est créé/modifié dans Clerk, un webhook est envoyé à votre application
4. Votre application synchronise automatiquement les données avec PostgreSQL

### **Installation et configuration :**
```bash
# Installation ngrok (Linux)
sudo snap install ngrok

# Configuration avec votre token
ngrok config add-authtoken YOUR_TOKEN

# Exposition du serveur local
ngrok http 3000
```

### **Résultat attendu :**
- ✅ Création d'utilisateur via navbar → Synchronisation automatique en base
- ✅ Test des webhooks en environnement de développement
- ✅ Comportement identique à la production

### **Alternative Windows :** 
Déployez le site sur Vercel pour obtenir une URL publique.

📖 **Documentation complète :** [clerk-postgres-sync.md](4-database-stack/clerk-postgres-sync.md) 