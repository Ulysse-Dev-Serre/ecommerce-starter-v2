import { PrismaClient } from '../../../generated/prisma'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test database connection by counting users
    const userCount = await prisma.user.count()
    
    // Get database info
    const databaseInfo = {
      connected: true,
      userCount,
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    }

    console.log('✅ Database connection test successful:', databaseInfo)

    return Response.json({
      status: 'success',
      message: 'Database connection successful',
      data: databaseInfo,
    })
  } catch (error) {
    console.error('❌ Database connection test failed:', error)

    return Response.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
