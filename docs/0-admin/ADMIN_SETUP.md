# Admin Dashboard - Documentation

## Architecture

### Structure des dossiers

```
src/
├── app/[locale]/admin/
│   ├── layout.tsx              # Layout protégé (vérification rôle ADMIN)
│   ├── page.tsx                # Dashboard principal avec statistiques
│   ├── products/page.tsx       # Gestion des produits
│   ├── orders/page.tsx         # Gestion des commandes
│   ├── customers/page.tsx      # Gestion des clients
│   ├── categories/page.tsx     # Gestion des catégories
│   ├── analytics/page.tsx      # Tableau de bord analytique
│   ├── content/page.tsx        # Gestion du contenu
│   └── settings/page.tsx       # Paramètres
│
└── components/admin/layout/
    ├── admin-sidebar.tsx       # Navigation latérale
    └── admin-header.tsx        # En-tête avec UserButton
```

## Sécurité

Toutes les routes sous `/admin` sont protégées automatiquement par le layout :

1. Vérification de l'authentification Clerk
2. Vérification du rôle ADMIN dans la base de données
3. Redirection automatique si non autorisé

```typescript
// Flux de sécurité
const { userId: clerkId } = await auth();
if (!clerkId) redirect('/sign-in');

const user = await prisma.user.findUnique({
  where: { clerkId },
  select: { role: true },
});

if (!user || user.role !== UserRole.ADMIN) {
  redirect('/');
}
```

## Composants principaux

### AdminLayout
- Vérification de l'authentification et du rôle
- Structure générale (sidebar + header + content)
- Protection de toutes les sous-routes

### AdminSidebar
Navigation avec 8 sections :
- Dashboard : Vue d'ensemble avec statistiques
- Products : Gestion des produits
- Orders : Gestion des commandes
- Customers : Gestion des clients
- Categories : Gestion des catégories
- Analytics : Tableaux de bord analytiques
- Content : Gestion du contenu
- Settings : Paramètres du site

### AdminHeader
- Titre de bienvenue
- Badge notifications
- UserButton Clerk pour la gestion du compte

## Design

**Technologies :**
- Tailwind CSS pour le styling
- Lucide React pour les icônes
- Clerk pour l'authentification
- Prisma pour la base de données

**Palette de couleurs :**
- Background : `bg-gray-50`
- Cards : `bg-white` avec bordure grise
- Sidebar active : `bg-gray-900 text-white`
- Sidebar hover : `bg-gray-100`

**Responsive :**
- Desktop : Sidebar fixe de 256px
- Mobile : Structure prête pour un menu hamburger
- Grids adaptatifs selon la taille d'écran

## Utilisation

### Créer un utilisateur admin

**Option 1 - Prisma Studio (recommandé) :**
```bash
npx prisma studio
```
Modifier le champ `role` de `CLIENT` à `ADMIN`

**Option 2 - SQL direct :**
```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'votre-email@example.com';
```

### Accéder au dashboard

```
http://localhost:3000/fr/admin
http://localhost:3000/en/admin
```

## Extension

### Ajouter une nouvelle section

1. Créer la page :
```typescript
// src/app/[locale]/admin/nouvelle-section/page.tsx
export default function NouvelleSectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nouvelle Section</h1>
        <p className="mt-2 text-sm text-gray-600">Description</p>
      </div>
      {/* Contenu */}
    </div>
  );
}
```

2. Ajouter au menu :
```typescript
// src/components/admin/layout/admin-sidebar.tsx
const menuItems = [
  // ... existants
  {
    title: 'Nouvelle Section',
    href: '/admin/nouvelle-section',
    icon: IconName,
  },
];
```

### Structure CRUD recommandée

```
admin/[section]/
├── page.tsx              # Liste
├── new/page.tsx          # Création
└── [id]/edit/page.tsx    # Édition
```

## État actuel

**Implémenté :**
- Architecture complète
- Protection des routes
- Navigation fonctionnelle
- Dashboard avec statistiques (données mock)
- Pages placeholder pour toutes les sections

**À implémenter :**
- CRUD complet pour chaque section
- Analytics avec vrais graphiques
- Notifications fonctionnelles
- Menu mobile responsive
- Recherche et filtres
- Pagination

## Intégration

Le dashboard s'intègre avec votre infrastructure existante :
- Utilise `withAuth.ts` pour la vérification du rôle
- Utilise Prisma client existant
- Utilise Clerk pour l'authentification
- Aucune modification du code existant nécessaire
- Aucune nouvelle dépendance requise

## Bonnes pratiques

- Toujours vérifier le rôle côté serveur
- Utiliser les Server Components par défaut
- Fournir un feedback visuel pour les actions
- Tester le responsive sur tous les appareils
- Utiliser les attributs ARIA pour l'accessibilité




