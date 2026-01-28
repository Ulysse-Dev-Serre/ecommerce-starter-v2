import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/core/db';
import { UserRole } from '@/generated/prisma';
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar';
import { AdminHeader } from '@/components/admin/layout/admin-header';
import '@/styles/themes/admin.css';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Disable static generation (requires DB & Auth)
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  // Check admin role
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { role: true },
  });

  if (!user || user.role !== UserRole.ADMIN) {
    redirect('/');
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <AdminHeader />

      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
