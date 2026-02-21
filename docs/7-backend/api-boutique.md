# 🛒 API Boutique (Public/Client)

Ce document centralise tous les points d'entrée destinés aux clients et visiteurs.

---

## 🛍️ Produits & Catalogue
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/products` | Liste les produits actifs (avec filtres/pagination) | `src/app/api/products/route.ts` |
| **GET** | `/api/products/[id]` | Détails d'un produit (Slug ou UUID) + Variantes | `src/app/api/products/[id]/route.ts` |

---

## 🛒 Panier (Cart)
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/cart` | Récupère ou crée le panier actif (Cookie/Session) | `src/app/api/cart/route.ts` |
| **POST** | `/api/cart/lines` | Ajoute un produit (variantId) au panier | `src/app/api/cart/lines/route.ts` |
| **PUT** | `/api/cart/lines/[id]` | Modifie la quantité d'une ligne | `src/app/api/cart/lines/[id]/route.ts` |
| **DELETE** | `/api/cart/lines/[id]` | Supprime une ligne du panier | `src/app/api/cart/lines/[id]/route.ts` |
| **GET** | `/api/cart/calculate` | Calcule les totaux (taxes, sous-total) | `src/app/api/cart/calculate/route.ts` |
| **POST** | `/api/cart/merge` | Fusionne le panier invité vers le panier client | `src/app/api/cart/merge/route.ts` |

---

## 💳 Checkout & Paiement
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/checkout/create-intent` | Initialise le paiement (Stripe Intent) + Réserve stock | `src/app/api/checkout/create-intent/route.ts` |
| **POST** | `/api/checkout/update-intent` | Applique frais livraison + adresse sur l'intent | `src/app/api/checkout/update-intent/route.ts` |
| **POST** | `/api/shipping/rates` | Calcule les tarifs transporteurs (Shippo) | `src/app/api/shipping/rates/route.ts` |

---

## 📦 Commandes & Suivi
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/orders` | Liste l'historique de mes commandes | `src/app/api/orders/route.ts` |
| **GET** | `/api/orders/[id]` | Détails d'une commande spécifique | `src/app/api/orders/[id]/route.ts` |
| **GET** | `/api/orders/verify` | Vérifie la création de commande après Stripe | `src/app/api/orders/verify/route.ts` |
| **POST** | `/api/orders/refund-request` | Demande de remboursement client | `src/app/api/orders/refund-request/route.ts` |
| **POST** | `/api/tracking/events` | Log d'événements de tracking/analytics | `src/app/api/tracking/events/route.ts` |

---

## 🛡️ Webhooks (Intégrations)
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/webhooks/clerk` | Sync utilisateurs Clerk | `src/app/api/webhooks/clerk/route.ts` |
| **POST** | `/api/webhooks/stripe` | Réception paiement Stripe | `src/app/api/webhooks/stripe/route.ts` |
| **GET** | `/api/webhooks/stripe/status` | Rapport d'état des webhooks Stripe | `src/app/api/webhooks/stripe/status/route.ts` |
| **POST** | `/api/webhooks/shippo` | Suivi et mise à jour de livraison | `src/app/api/webhooks/shippo/route.ts` |

---

## ⚙️ Système & Santé
| Méthode | Endpoint | Description | Fichier |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/internal/health` | État de santé de l'application | `src/app/api/internal/health/route.ts` |
| **GET** | `/api/internal/cleanup-analytics` | Tâche de nettoyage des analytics | `src/app/api/internal/cleanup-analytics/route.ts` |
| **GET** | `/api/users` | (Check Session) Récupère profil user courant | `src/app/api/users/route.ts` |
