/**
 * Filtres de base pour les listes
 */
export interface BaseFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filtres avec filtres de date
 */
export interface DateFilters {
  createdAfter?: Date | string;
  createdBefore?: Date | string;
  updatedAfter?: Date | string;
  updatedBefore?: Date | string;
}

/**
 * Filtres combinés (base + dates)
 */
export type CommonFilters = BaseFilters & Partial<DateFilters>;
