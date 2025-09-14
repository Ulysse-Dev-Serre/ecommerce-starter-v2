/**
 * Mock data for testing
 * Centralized location for all test data
 */

const mockUser = {
  clerkId: 'test_clerk_id_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  imageUrl: 'https://example.com/avatar.jpg',
  role: 'CLIENT'
};

const mockClerkWebhookPayload = {
  type: 'user.created',
  data: {
    id: 'test_clerk_id_123',
    email_addresses: [{
      id: 'email_1',
      email_address: 'test@example.com'
    }],
    primary_email_address_id: 'email_1',
    first_name: 'Test',
    last_name: 'User',
    image_url: 'https://example.com/avatar.jpg'
  }
};

const mockClerkUpdatePayload = {
  type: 'user.updated',
  data: {
    id: 'test_clerk_id_123',
    email_addresses: [{
      id: 'email_1',
      email_address: 'updated@example.com'
    }],
    primary_email_address_id: 'email_1',
    first_name: 'Updated',
    last_name: 'User',
    image_url: 'https://example.com/new-avatar.jpg'
  }
};

const mockClerkDeletePayload = {
  type: 'user.deleted',
  data: {
    id: 'test_clerk_id_123'
  }
};

module.exports = {
  mockUser,
  mockClerkWebhookPayload,
  mockClerkUpdatePayload,
  mockClerkDeletePayload
};
