import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!latestOrder) {
    console.log('No orders found.');
    return;
  }

  console.log('--- Latest Order Verification ---');
  console.log('Order Number:', latestOrder.orderNumber);
  console.log('Order Email:', latestOrder.orderEmail);
  console.log(
    'Shipping Address JSON:',
    JSON.stringify(latestOrder.shippingAddress, null, 2)
  );
  console.log(
    'Billing Address JSON:',
    JSON.stringify(latestOrder.billingAddress, null, 2)
  );

  const shippingAddr = latestOrder.shippingAddress as any;
  const billingAddr = latestOrder.billingAddress as any;

  if (shippingAddr.email) {
    console.log('❌ FAIL: Shipping Address still contains email.');
  } else {
    console.log('✅ PASS: Shipping Address is clean of email.');
  }

  if (billingAddr.email) {
    console.log('❌ FAIL: Billing Address still contains email.');
  } else {
    console.log('✅ PASS: Billing Address is clean of email.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
