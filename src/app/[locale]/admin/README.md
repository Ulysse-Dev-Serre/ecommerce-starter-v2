# Admin Dashboard

## Quick Start

### Accès

URL : `/[locale]/admin` (ex: `/fr/admin` ou `/en/admin`)

**Prérequis :**
- Compte utilisateur créé via Clerk
- Rôle `ADMIN` dans la base de données

### Créer un utilisateur admin

1. **Via Prisma Studio :**
```bash
npx prisma studio
```
Puis modifier le champ `role` de `CLIENT` à `ADMIN` pour votre utilisateur.

2. **Via SQL direct :**
```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'votre-email@example.com';
```

## Structure

```
admin/
├── layout.tsx           # Layout principal avec protection
├── page.tsx             # Dashboard (statistiques)
├── products/            # Gestion produits
├── orders/              # Gestion commandes
├── customers/           # Gestion clients
├── categories/          # Gestion catégories
├── analytics/           # Analytics
├── content/             # Gestion contenu
└── settings/            # Paramètres
```

## Sécurité

La sécurité est gérée au niveau du `layout.tsx` :

1. Vérification authentification Clerk
2. Vérification du rôle `ADMIN` en base de données
3. Redirection automatique si non autorisé

**Aucune vérification côté client n'est nécessaire** - toutes les pages enfants sont automatiquement protégées.

## Développement

### Ajouter une nouvelle page

1. Créer le fichier : `src/app/[locale]/admin/ma-page/page.tsx`
2. Ajouter l'entrée dans la sidebar : `src/components/admin/layout/admin-sidebar.tsx`

### Template de page

```typescript
export default function MaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Titre</h1>
        <p className="mt-2 text-sm text-gray-600">Description</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* Contenu */}
      </div>
    </div>
  );
}
```

## Documentation complète

Voir : `docs/8-frontend.md`
