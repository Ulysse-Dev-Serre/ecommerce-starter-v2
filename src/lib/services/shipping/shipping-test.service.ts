import {
  SITE_CURRENCY,
  SHIPPING_TEST_ZIP,
  ENABLE_SHIPPING_TEST_MODE,
} from '@/lib/config/site';
import { logger } from '@/lib/core/logger';
import { ShippingRate, Address } from '@/lib/integrations/shippo';

/**
 * Service dédié aux scénarios de test pour la logistique.
 * Centralise les bypass et les injections de tarifs fictifs.
 */
export class ShippingTestService {
  /**
   * Vérifie si une adresse doit déclencher un comportement de test.
   */
  static isTestAddress(address: Address): boolean {
    if (!ENABLE_SHIPPING_TEST_MODE) return false;
    return address.zip.toUpperCase() === SHIPPING_TEST_ZIP;
  }

  /**
   * Génère les tarifs fictifs pour les tests.
   */
  static getTestRates(): ShippingRate[] {
    logger.info({ zip: SHIPPING_TEST_ZIP }, 'Generating test shipping rates');

    return [
      {
        amount: '1.00',
        currency: SITE_CURRENCY,
        provider: 'TEST_CARRIER',
        object_id: 'test_1_dlr',
        servicelevel: {
          name: 'Test $1 Delivery',
          token: 'test_1_dlr',
        },
        displayName: 'Test $1 Delivery',
        displayTime: 'Instant',
      } as ShippingRate,
    ];
  }
}
