import { OrderStatus, Language } from '@/generated/prisma';
import { CartProjection } from '../cart';
import Stripe from 'stripe';

/**
 * Input pour la création d'une commande depuis un panier
 */
export interface CreateOrderFromCartInput {
  cart: CartProjection;
  userId: string;
  paymentIntent: Stripe.PaymentIntent;
  shippingAddress?: any;
  billingAddress?: any;
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
  userId: string;
  status: OrderStatus;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: any;
  billingAddress: any;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  payments: OrderPayment[];
  shipments: OrderShipment[];
}

/**
 * Item de commande
 */
export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productId: string | null;
  productSnapshot: any;
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
  transactionData: any;
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
