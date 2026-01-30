import { PaymentMethod, PaymentStatus } from '@/generated/prisma';
import Stripe from 'stripe';
import { CheckoutCurrency, CheckoutItem } from './checkout';

/**
 * Types centralisés pour le domaine Payment
 * Utilisés par les services de paiement, refunds et enregistrements
 */

// ==================== Types de Base ====================

/**
 * Montant avec devise
 */
export interface MoneyAmount {
  amount: number;
  currency: string;
}

/**
 * Informations de paiement externe (Stripe, etc.)
 */
export interface ExternalPaymentInfo {
  externalId: string;
  provider: 'STRIPE' | 'PAYPAL' | 'OTHER';
  status: string;
  rawData?: any;
}

// ==================== Inputs (Paramètres) ====================

/**
 * Données pour créer un enregistrement de paiement en DB
 */
export interface CreatePaymentRecordInput {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  externalId: string;
  status: PaymentStatus;
  transactionData?: any;
}

/**
 * Paramètres pour mettre à jour le statut d'un paiement
 */
export interface UpdatePaymentStatusInput {
  externalId: string;
  status: PaymentStatus;
  failureReason?: string;
}

/**
 * Paramètres pour initier un remboursement
 */
export interface RefundInput {
  orderId: string;
  amount?: number; // Si non spécifié = remboursement complet
  reason?: string;
  requestedBy?: string; // userId de l'admin qui demande le refund
}

/**
 * Paramètres pour mettre à jour le statut d'une commande
 * (utilisé dans le contexte des refunds)
 */
export interface UpdateOrderStatusInput {
  orderId: string;
  status: string;
  comment?: string;
  userId?: string;
}

/**
 * Paramètres pour créer un PaymentIntent (checkout custom)
 * Réutilise les types de checkout pour la cohérence
 */
export interface PaymentIntentInput {
  items: CheckoutItem[];
  currency: CheckoutCurrency;
  userId?: string;
  cartId?: string;
  anonymousId?: string;
  metadata?: Record<string, string>;
}

// ==================== Outputs (Résultats) ====================

/**
 * Projection d'un paiement enregistré en DB
 */
export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  externalId: string;
  failureReason?: string | null;
  processedAt: Date;
  createdAt: Date;
}

/**
 * Résultat d'un remboursement
 */
export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  failureReason?: string;
  processedAt: Date;
}

/**
 * Statistiques de paiement pour un ordre
 */
export interface PaymentStats {
  orderId: string;
  totalPaid: number;
  totalRefunded: number;
  netAmount: number;
  currency: string;
  paymentCount: number;
  refundCount: number;
}

/**
 * Résultat de création de PaymentIntent
 */
export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Projection enrichie d'un paiement avec infos commande
 */
export interface PaymentWithOrder {
  payment: PaymentRecord;
  orderNumber: string;
  customerEmail?: string;
  orderTotal: number;
}
