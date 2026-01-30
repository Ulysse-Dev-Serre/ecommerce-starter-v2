/**
 * Barrel export pour les services Inventory
 * Point d'entrée centralisé pour tous les services de gestion du stock
 */

// Stock Check - Vérifications de disponibilité
export * from './stock-check.service';

// Stock Reserve - Réservations temporaires
export * from './stock-reserve.service';

// Stock Operations - Incréments et décréments
export * from './stock-operations.service';

// Re-export des types pour faciliter l'import
export type {
  StockItem,
  ReserveStockInput,
} from '@/lib/types/domain/inventory';
