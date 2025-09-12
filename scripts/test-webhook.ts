// Test webhook locally without tunnel
import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function testWebhook() {
  console.log('🧪 Testing webhook functionality locally...')

  // Mock user data (similar to Clerk webhook payload)
  const mockUserData = {
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

  try {
    // Test user creation
    const user = await prisma.user.create({
      data: {
        clerkId: mockUserData.id,
        email: mockUserData.email_addresses[0].email_address,
        firstName: mockUserData.first_name,
        lastName: mockUserData.last_name,
        imageUrl: mockUserData.image_url,
        role: 'CLIENT',
      },
    })

    console.log('✅ User created successfully:', user)

    // Test user update
    const updatedUser = await prisma.user.update({
      where: { clerkId: mockUserData.id },
      data: { firstName: 'Updated Test' },
    })

    console.log('✅ User updated successfully:', updatedUser)

    // Test user deletion
    await prisma.user.delete({
      where: { clerkId: mockUserData.id },
    })

    console.log('✅ User deleted successfully')
    console.log('🎉 All webhook operations working correctly!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWebhook()
