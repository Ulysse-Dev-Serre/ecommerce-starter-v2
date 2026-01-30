/**
 * Barrel export pour l'intégration Shippo
 * Fournit une interface unifiée pour toutes les fonctionnalités Shippo
 */

// Export client functions
export {
  getShippingRates,
  getReturnShippingRates,
  createTransaction,
  default as shippo,
} from './client';

// Export types
export type {
  Address,
  Parcel,
  CustomsItem,
  CustomsDeclaration,
  ShippingRate,
  Transaction,
} from './types';
