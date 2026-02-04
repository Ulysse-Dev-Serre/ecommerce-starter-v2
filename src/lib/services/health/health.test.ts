import { describe, it, expect, vi } from 'vitest';
import { getSystemHealth } from '@/lib/services/health/health.service';
import { getUserCount } from '@/lib/services/users';

// Mock dependencies
vi.mock('@/lib/services/users', () => ({
  getUserCount: vi.fn(),
}));

describe('HealthService', () => {
  it('should return healthy status when database check passes', async () => {
    // Setup mock
    vi.mocked(getUserCount).mockResolvedValue(5);

    // Execute
    const result = await getSystemHealth();

    // Verify
    expect(result.status).toBe('healthy');
    expect(result.database.connected).toBe(true);
    expect(result.database.userCount).toBe(5);
    expect(result.timestamp).toBeDefined();
    expect(result.version).toBeDefined();
  });

  it('should return unhealthy status when database check fails', async () => {
    // Setup mock to fail
    vi.mocked(getUserCount).mockRejectedValue(
      new Error('DB Connection failed')
    );

    // Execute
    const result = await getSystemHealth();

    // Verify
    expect(result.status).toBe('unhealthy');
    expect(result.database.connected).toBe(false);
    expect(result.database.userCount).toBe(0);
  });
});
