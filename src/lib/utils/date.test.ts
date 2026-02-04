import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format a Date object correctly in French', () => {
      const date = new Date('2024-05-15T12:00:00Z');
      const result = formatDate(date, 'fr');
      // Format long: "15 mai 2024"
      expect(result).toContain('15 mai 2024');
    });

    it('should handle ISO string dates', () => {
      const result = formatDate('2024-12-25T12:00:00Z', 'en');
      expect(result).toContain('December 25, 2024');
    });

    it('should return empty string for null or invalid dates', () => {
      expect(formatDate(null as any, 'en')).toBe('');
      expect(formatDate('invalid-date', 'en')).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('should include time in the formatted string', () => {
      const date = new Date('2024-05-15T14:30:00Z');
      const result = formatDateTime(date, 'en');
      expect(result).toContain('May 15, 2024');
      // L'heure peut varier selon la timezone locale du runner, on vérifie juste la présence de chiffres
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
