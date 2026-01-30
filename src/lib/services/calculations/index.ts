/**
 * Barrel export pour le domaine Calculation
 * Fournit une interface unifiée pour tous les calculs financiers et validations
 */

// Math Utilities - Arrondis financiers
export * from './math-utils.service';

// Cart Calculation - Calculs totaux et sérialisation
export * from './cart-calculation.service';

// Cart Validation - Éligibilité checkout
export * from './cart-validation.service';

// Re-export des types
export type {
  Currency,
  CalculatedLineItem,
  CartCalculation,
  CartValidationResult,
  SerializedCartCalculation,
} from '@/lib/types/domain/calculation';
