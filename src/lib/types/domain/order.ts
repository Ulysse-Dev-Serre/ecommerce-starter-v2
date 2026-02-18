import { OrderStatus, Language, Shipment } from '@/generated/prisma';
import { CartProjection } from './cart';
import Stripe from 'stripe';
import { JsonValue } from '@prisma/client/runtime/library';

/**
 * Interface pour les adresses (Shipping/Billing)
 */
export interface Address {
  name: string;
  firstName?: string;
  lastName?: string;
  street1: string;
  street2?: string;
  line1?: string;
  line2?: string;
  city: string;
  state: string;
  postalCode?: string;
  postal_code?: string;
  zip?: string;
  country: string;
  phone?: string;
  email?: string;
}

/**
 * Input pour la création d'une commande depuis un panier
 */
export interface CreateOrderFromCartInput {
  cart: CartProjection;
  userId?: string | null;
  orderEmail?: string | null;
  paymentIntent: Stripe.PaymentIntent;
  shippingAddress?: Address;
  billingAddress?: Address;
}

/**
 * Données enrichies d'une commande pour affichage détaillé
 */
export interface OrderDetailsWithData {
  order: OrderWithIncludes;
  productData: Record<
    string,
    {
      image?: string;
      slug: string;
      name?: string;
    }
  >;
}

/**
 * Commande avec relations complètes (items, payments, shipments)
 */
export interface OrderWithIncludes {
  id: string;
  orderNumber: string;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    clerkId?: string;
  } | null;
  orderEmail?: string | null;
  status: OrderStatus;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress: Address;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  payments: OrderPayment[];
  shipments: Shipment[];
}

/**
 * Item de commande
 */
export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string | null;
  productId: string | null;
  productSnapshot:
    | {
        name: string;
        sku: string;
        image?: string;
      }
    | JsonValue;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

/**
 * Paiement de commande
 */
export interface OrderPayment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  externalId: string | null;
  status: string;
  transactionData: Stripe.PaymentIntent | JsonValue;
  processedAt: Date | null;
}

/**
 * Expédition de commande
 */
export interface OrderShipment {
  id: string;
  orderId: string;
  carrier: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  shippoRateId: string | null;
  shippoTransactionId: string | null;
  labelUrl: string | null;
}

/**
 * Options de liste pour les commandes utilisateur
 */
export interface OrderListOptions {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  orderBy?: 'createdAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Input pour mettre à jour le statut d'une commande
 */
export interface UpdateStatusInput {
  orderId: string;
  status: OrderStatus;
  comment?: string;
  userId?: string;
}

/**
 * Données pour génération d'étiquette de retour
 */
export interface ReturnLabelData {
  orderId: string;
  isPreview?: boolean;
}

/**
 * Projection minimale pour SEO/Metadata
 */
export interface OrderMetadata {
  orderNumber: string;
}
