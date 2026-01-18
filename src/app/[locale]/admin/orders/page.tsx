'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, AlertCircle } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';

import { StatusBadge } from '@/components/admin/orders/status-badge';
import { OrderFilters } from '@/components/admin/orders/filters';

import { OrderStatus } from '@/generated/prisma';

interface Order {
  id: string;
  orderNumber: string;
  items: any[];
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  payments: any[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function OrdersContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params?.locale as string;

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Params state
  const page = searchParams.get('page') || '1';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = new URL(
          '/api/admin/orders',
          window.location.origin // Use window.location.origin for client-side fetch
        );
        apiUrl.searchParams.set('page', page);
        apiUrl.searchParams.set('limit', '20');
        if (status) apiUrl.searchParams.set('status', status);
        if (search) apiUrl.searchParams.set('search', search);

        const response = await fetch(apiUrl.toString());

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }

        const data = await response.json();
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, status, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 border border-red-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading orders
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and track customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters locale={locale} />

      {/* Orders table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[400px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Payment
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {!orders || orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items.length} item
                      {order.items.length > 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.user.firstName && order.user.lastName
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.totalAmount.toString()} {order.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.payments[0] && (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {order.payments[0].method}
                        </div>
                        <div className="text-gray-500">
                          {order.payments[0].externalId?.substring(0, 20)}...
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/${locale}/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> orders
          </div>
          <div className="flex gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              p => (
                <Link
                  key={p}
                  href={`?page=${p}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                  className={`px-4 py-2 rounded ${
                    p === pagination.page
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper avec Suspense pour gérer useSearchParams côté client
export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
