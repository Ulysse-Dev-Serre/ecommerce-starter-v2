import { Prisma } from '@/generated/prisma';
type JsonValue = Prisma.JsonValue;

import { Supplier } from '@/generated/prisma';

import { Address } from './order';

/**
 * Interface pour un fournisseur (Supplier) avec les types du domaine
 */
export interface AdminSupplier
  extends Omit<
    Supplier,
    'minimumOrderAmount' | 'address' | 'createdAt' | 'updatedAt'
  > {
  minimumOrderAmount: number | null;
  address: Address | JsonValue;
  createdAt: string;
  updatedAt: string;
}
