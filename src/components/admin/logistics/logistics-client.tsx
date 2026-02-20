'use client';

import { useState } from 'react';

import { Truck, MapPin, Plus, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { deleteLogisticsLocation } from '@/lib/client/admin/logistics';
import { AdminSupplier } from '@/lib/types/domain/logistics';
import { Address } from '@/lib/types/domain/order';

import { AddLocationModal } from './add-location-modal';

interface LogisticsClientProps {
  suppliers: AdminSupplier[];
  locale: string;
}

export function LogisticsClient({ suppliers, locale }: LogisticsClientProps) {
  const router = useRouter();
  const t = useTranslations('admin.logistics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AdminSupplier | null>(
    null
  );

  const handleEdit = (supplier: AdminSupplier) => {
    setEditingLocation(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t('deleteConfirm', { name }))) {
      try {
        await deleteLogisticsLocation(id);
        router.refresh();
      } catch (err) {
        console.error(err);
        alert(t('deleteError'));
      }
    }
  };

  const closeModal = () => {
    setEditingLocation(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">{t('title')}</h1>
          <p className="admin-page-subtitle">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="admin-btn-primary"
        >
          <Plus className="h-4 w-4" />
          {t('addLocation')}
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Truck className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {t('noLocations')}
          </h3>
          <p className="mt-2 text-sm admin-text-subtle">
            {t('noLocationsDesc')}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="admin-btn-secondary"
            >
              <Plus className="h-4 w-4" />
              {t('createFirst')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map(supplier => (
            <div
              key={supplier.id}
              className="admin-card overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-grow">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {supplier.name}
                    </h3>
                    <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider">
                      {supplier.type}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm admin-text-subtle">
                  <p className="truncate">
                    {(supplier.address as unknown as Address)?.street1 ||
                      t('addressUndefined')}
                  </p>
                  <p>
                    {(supplier.address as unknown as Address)?.city},{' '}
                    {(supplier.address as unknown as Address)?.country}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 mt-auto">
                <div className="flex justify-end gap-3 text-sm font-medium">
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="admin-link flex items-center gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id, supplier.name)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddLocationModal
          onClose={closeModal}
          locale={locale}
          initialData={editingLocation}
        />
      )}
    </div>
  );
}
