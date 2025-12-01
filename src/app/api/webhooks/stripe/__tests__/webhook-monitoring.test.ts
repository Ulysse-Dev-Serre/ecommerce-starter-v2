import { NextRequest } from 'next/server';

import { prisma } from '../../../../../lib/db/prisma';

jest.mock('../../../../../lib/db/prisma', () => ({
  prisma: {
    webhookEvent: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Webhook Monitoring Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/webhooks/stripe/status', () => {
    it('should return webhook statistics', async () => {
      // Mock data
      (prisma.webhookEvent.count as jest.Mock)
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(990) // processed
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(10) // failedWithRetries
        .mockResolvedValueOnce(5); // maxRetriesReached

      (prisma.webhookEvent.groupBy as jest.Mock).mockResolvedValue([
        { eventType: 'checkout.session.completed', _count: 700 },
        { eventType: 'payment_intent.succeeded', _count: 200 },
        { eventType: 'payment_intent.payment_failed', _count: 100 },
      ]);

      (prisma.webhookEvent.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'webhook_1',
          eventId: 'evt_test_1',
          eventType: 'payment_intent.succeeded',
          retryCount: 2,
          lastError: 'Variant not found',
          createdAt: new Date('2024-11-30T10:00:00Z'),
        },
        {
          id: 'webhook_2',
          eventId: 'evt_test_2',
          eventType: 'checkout.session.completed',
          retryCount: 3,
          lastError: 'Order creation failed',
          createdAt: new Date('2024-11-30T09:00:00Z'),
        },
      ]);

      const request = new NextRequest(
        'http://localhost/api/webhooks/stripe/status',
        {
          method: 'GET',
        }
      );

      const { GET } = await import('../status/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify structure
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('eventTypeBreakdown');
      expect(data).toHaveProperty('recentFailures');

      // Verify summary
      expect(data.summary).toEqual({
        total: 1000,
        processed: 990,
        pending: 5,
        failedWithRetries: 10,
        maxRetriesReached: 5,
        successRate: '99.00%',
      });

      // Verify event breakdown
      expect(data.eventTypeBreakdown).toHaveLength(3);
      expect(data.eventTypeBreakdown[0]).toEqual({
        type: 'checkout.session.completed',
        count: 700,
      });

      // Verify recent failures
      expect(data.recentFailures).toHaveLength(2);
      expect(data.recentFailures[0]).toEqual({
        id: 'webhook_1',
        eventId: 'evt_test_1',
        eventType: 'payment_intent.succeeded',
        retryCount: 2,
        lastError: 'Variant not found',
        createdAt: new Date('2024-11-30T10:00:00Z'),
      });
    });

    it('should handle zero total events', async () => {
      (prisma.webhookEvent.count as jest.Mock).mockResolvedValue(0);
      (prisma.webhookEvent.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.webhookEvent.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/webhooks/stripe/status',
        {
          method: 'GET',
        }
      );

      const { GET } = await import('../status/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.summary.total).toBe(0);
      expect(data.summary.successRate).toBe('N/A');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.webhookEvent.count as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost/api/webhooks/stripe/status',
        {
          method: 'GET',
        }
      );

      const { GET } = await import('../status/route');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Database connection failed');
    });

    it('should return correct success rate calculation', async () => {
      // Test case: 75 processed out of 100
      (prisma.webhookEvent.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75) // processed
        .mockResolvedValueOnce(20) // pending
        .mockResolvedValueOnce(5) // failedWithRetries
        .mockResolvedValueOnce(0); // maxRetriesReached

      (prisma.webhookEvent.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.webhookEvent.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/webhooks/stripe/status',
        {
          method: 'GET',
        }
      );

      const { GET } = await import('../status/route');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.summary.successRate).toBe('75.00%');
    });
  });
});
