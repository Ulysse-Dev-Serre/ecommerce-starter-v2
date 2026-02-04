import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUTMFromURL, getOrSetAnonymousId } from './analytics';
import { getCookie, setCookie } from './cookies';

// Mock the cookies module
vi.mock('./cookies', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

describe('Client Analytics Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear window location mocks if any
  });

  describe('getUTMFromURL', () => {
    it('should return empty object if no UTM params are present', () => {
      // Mock window.location
      const originalLocation = window.location;
      vi.stubGlobal('location', { search: '' });

      const result = getUTMFromURL();
      expect(result).toEqual({});

      vi.unstubAllGlobals();
    });

    it('should parse UTM parameters correctly', () => {
      vi.stubGlobal('location', {
        search: '?utm_source=tiktok&utm_medium=social&utm_campaign=summer_sale',
      });

      const result = getUTMFromURL();
      expect(result.utmSource).toBe('tiktok');
      expect(result.utmMedium).toBe('social');
      expect(result.utmCampaign).toBe('summer_sale');

      vi.unstubAllGlobals();
    });
  });

  describe('getOrSetAnonymousId', () => {
    it('should return existing ID from cookies if present', () => {
      vi.mocked(getCookie).mockReturnValue('existing-id');

      const result = getOrSetAnonymousId();
      expect(result).toBe('existing-id');
      expect(setCookie).not.toHaveBeenCalled();
    });

    it('should generate and save new ID if cookie is missing', () => {
      vi.mocked(getCookie).mockReturnValue(
        undefined as unknown as string | null
      );

      const result = getOrSetAnonymousId();
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(10);
      expect(setCookie).toHaveBeenCalledWith(
        'analytics_anon_id',
        expect.any(String),
        365
      );
    });
  });
});
