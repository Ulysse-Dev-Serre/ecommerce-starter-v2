import { describe, it, expect, vi } from 'vitest';
import { getSystemHealth } from './health.service';
import * as usersService from '@/lib/services/users';

vi.mock('@/lib/services/users', () => ({
  getUserCount: vi.fn(),
}));

describe('HealthService', () => {
  it('should return healthy status when database is reachable', async () => {
    vi.mocked(usersService.getUserCount).mockResolvedValue(42);

    const health = await getSystemHealth();

    expect(health.status).toBe('healthy');
    expect(health.database.connected).toBe(true);
    expect(health.database.userCount).toBe(42);
    expect(health.timestamp).toBeDefined();
    expect(health.environment).toBeDefined();
    expect(health.version).toBeDefined();
  });

  it('should return unhealthy status when database check fails', async () => {
    vi.mocked(usersService.getUserCount).mockRejectedValue(
      new Error('DB Error')
    );

    const health = await getSystemHealth();

    expect(health.status).toBe('unhealthy');
    expect(health.database.connected).toBe(false);
    expect(health.database.userCount).toBe(0);
  });
});
