/**
 * Types centralisés pour le domaine Inventory
 * Utilisés par les services de gestion du stock
 */

// ==================== Types de Base ====================

/**
 * Item avec quantité pour opérations stock
 */
export interface StockItem {
  variantId: string;
  quantity: number;
}

// ==================== Inputs (Paramètres) ====================

/**
 * @deprecated Use StockItem instead
 * Kept for backwards compatibility
 */
export type ReserveStockInput = StockItem;

/**
 * Paramètres pour vérifier la disponibilité du stock
 */
export interface CheckStockInput {
  variantId: string;
  quantity: number;
}

/**
 * Paramètres pour réserver du stock
 */
export interface ReserveStockParams {
  items: StockItem[];
}

/**
 * Paramètres pour libérer du stock réservé
 */
export interface ReleaseStockParams {
  items: StockItem[];
}

/**
 * Paramètres pour décrémenter le stock
 */
export interface DecrementStockParams {
  items: StockItem[];
}

/**
 * Paramètres pour incrémenter le stock (refund)
 */
export interface IncrementStockParams {
  items: StockItem[];
}

// ==================== Outputs (Résultats) ====================

/**
 * Résultat de vérification de disponibilité stock
 */
export interface StockAvailability {
  available: boolean;
  availableStock: number;
}

/**
 * Informations d'inventaire pour une variante
 */
export interface InventoryInfo {
  variantId: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number | null;
}

/**
 * Statut du stock
 */
export type StockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'BACKORDER_AVAILABLE';

/**
 * Résultat enrichi de disponibilité
 */
export interface StockAvailabilityDetailed extends StockAvailability {
  status: StockStatus;
  message?: string;
}
