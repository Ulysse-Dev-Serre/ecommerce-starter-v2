import { Supplier } from '@/generated/prisma';

import { Address } from './order';

/**
 * Interface pour un fournisseur (Supplier) avec les types du domaine
 * On surcharge certains champs pour utiliser des types sérialisables (string/number)
 * pour faciliter l'utilisation dans les composants React Server/Client.
 */
export interface AdminSupplier
  extends Omit<Supplier, 'minimumOrderAmount' | 'createdAt' | 'updatedAt'> {
  minimumOrderAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour un entrepôt ou lieu d'expédition
 */
export interface LogisticsLocation {
  id: string;
  name: string;
  address: Address;
  isDefault: boolean;
}

/**
 * Type pour les dimensions d'un colis
 */
export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

/**
 * Type pour le poids d'un colis
 */
export interface PackageWeight {
  value: number;
  unit: 'kg' | 'lb' | 'oz' | 'g';
}

/**
 * Données nécessaires pour l'exportation (Douanes)
 */
export interface CustomsData {
  description: string;
  hsCode: string;
  originCountry: string;
  valueAmount: number;
  valueCurrency: string;
}
