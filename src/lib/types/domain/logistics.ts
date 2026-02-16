import { Supplier } from '@/generated/prisma';
import { Address } from './order';
import { JsonValue } from '@prisma/client/runtime/library';

/**
 * Interface pour un fournisseur (Supplier) avec les types du domaine
 */
export interface AdminSupplier
  extends Omit<Supplier, 'minimumOrderAmount' | 'address'> {
  minimumOrderAmount: number;
  address: Address | JsonValue;
}
