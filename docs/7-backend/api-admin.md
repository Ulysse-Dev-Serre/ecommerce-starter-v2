# 👔 API Admin (Gestion & Backend)

Ce document répertorie tous les points d'entrée destinés au panneau d'administration.

---

## 📦 Catalogue Produits
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/products` | Liste les produits (incl. brouillons) | `src/app/api/admin/products/route.ts` |
| **POST** | `/api/admin/products` | Création d'un nouveau produit | `src/app/api/admin/products/route.ts` |
| **GET** | `/api/admin/products/[id]` | Détails produit admin | `src/app/api/admin/products/[id]/route.ts` |
| **PUT** | `/api/admin/products/[id]` | Mise à jour d'un produit | `src/app/api/admin/products/[id]/route.ts` |
| **DELETE** | `/api/admin/products/[id]` | Suppression d'un produit | `src/app/api/admin/products/[id]/route.ts` |
| **PUT** | `/api/admin/products/reorder` | Tri des produits de la boutique | `src/app/api/admin/products/reorder/route.ts` |

---

## 🎨 Variantes & Attributs
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/products/[id]/variants` | Liste les variantes d'un produit | `src/app/api/admin/products/[id]/variants/route.ts` |
| **POST** | `/api/admin/products/[id]/variants` | Génération de variantes | `src/app/api/admin/products/[id]/variants/route.ts` |
| **POST** | `/api/admin/products/[id]/variants/simple` | Création de variante simplifiée | `src/app/api/admin/products/[id]/variants/simple/route.ts` |
| **GET** | `/api/admin/products/[id]/variants/[vId]` | Détails d'une variante spécifique | `src/app/api/admin/products/[id]/variants/[variantId]/route.ts` |
| **PUT** | `/api/admin/products/[id]/variants/[vId]` | Mise à jour d'une variante | `src/app/api/admin/products/[id]/variants/[variantId]/route.ts` |
| **DELETE** | `/api/admin/products/[id]/variants/[vId]` | Suppression d'une variante | `src/app/api/admin/products/[id]/variants/[variantId]/route.ts` |
| **GET** | `/api/admin/attributes` | Liste les attributs (Couleur, etc.) | `src/app/api/admin/attributes/route.ts` |
| **POST** | `/api/admin/attributes` | Création d'un attribut | `src/app/api/admin/attributes/route.ts` |
| **POST** | `/api/admin/attributes/[id]/values` | Ajout de valeurs à un attribut | `src/app/api/admin/attributes/[id]/values/route.ts` |

---

## 💰 Commandes & Logistique
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/orders` | Liste toutes les ventes | `src/app/api/admin/orders/route.ts` |
| **GET** | `/api/admin/orders/[id]` | Vue détaillée (Paiements, Clients) | `src/app/api/admin/orders/[id]/route.ts` |
| **PATCH** | `/api/admin/orders/[id]` | Change le statut général | `src/app/api/admin/orders/[id]/route.ts` |
| **GET** | `/api/admin/orders/[id]/purchase-label` | Devis pour étiquette Shippo | `src/app/api/admin/orders/[id]/purchase-label/route.ts` |
| **POST** | `/api/admin/orders/[id]/purchase-label` | Achat définitif étiquette Shippo | `src/app/api/admin/orders/[id]/purchase-label/route.ts` |
| **POST** | `/api/admin/orders/[id]/return-label` | Génération étiquette retour | `src/app/api/admin/orders/[id]/return-label/route.ts` |

---

## 📂 Médias & Stockage (S3/Local)
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/media` | Bibliothèque de médias | `src/app/api/admin/media/route.ts` |
| **POST** | `/api/admin/media/upload` | Upload fichier (Multiformat) | `src/app/api/admin/media/upload/route.ts` |
| **DELETE** | `/api/admin/media/[id]` | Suppression physique et DB | `src/app/api/admin/media/[id]/route.ts` |
| **PUT** | `/api/admin/media/reorder` | Tri des images produit | `src/app/api/admin/media/reorder/route.ts` |

---

## 👥 Utilisateurs
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/users` | Annuaire des utilisateurs | `src/app/api/users/route.ts` |
| **POST** | `/api/users/[id]/promote` | Changement de rôle (Admin/Client) | `src/app/api/users/[id]/promote/route.ts` |
