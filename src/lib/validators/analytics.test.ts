import { describe, it, expect } from 'vitest';
import { analyticsEventSchema } from './analytics';

describe('Analytics Validator', () => {
  it('should accept a valid minimal event', () => {
    const validData = { eventType: 'page_view' };
    const result = analyticsEventSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept an event with all optional fields', () => {
    const fullData = {
      eventType: 'click',
      eventName: 'checkout_button',
      path: '/cart',
      anonymousId: 'anon-123',
      metadata: { debug: 'true', source: 'mobile' },
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'summer_sale',
    };
    const result = analyticsEventSchema.safeParse(fullData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.utmSource).toBe('google');
    }
  });

  it('should reject an event without eventType', () => {
    const invalidData = { eventName: 'test' };
    const result = analyticsEventSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod renvoie un code d'erreur spécifique si le champ est manquant (undefined)
      expect(result.error.issues[0].code).toBe('invalid_type');
    }
  });

  it('should reject an empty eventType string with custom message', () => {
    const invalidData = { eventType: '' };
    const result = analyticsEventSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Type d'événement requis");
    }
  });
});
