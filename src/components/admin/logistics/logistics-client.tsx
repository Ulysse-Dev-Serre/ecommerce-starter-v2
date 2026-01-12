'use client';

import { useState } from 'react';
import { Truck, MapPin, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AddLocationModal } from './add-location-modal';

interface LogisticsClientProps {
  suppliers: any[];
  locale: string;
}

export function LogisticsClient({ suppliers, locale }: LogisticsClientProps) {
  const t = useTranslations('admin.logistics');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('addLocation')}
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Truck className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {t('noLocations')}
          </h3>
          <p className="mt-2 text-sm text-gray-500">{t('noLocationsDesc')}</p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
              className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {supplier.name}
                    </h3>
                    <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      {supplier.type}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {/*  Show rudimentary address info if JSON */}
                  <p className="truncate">
                    {/* @ts-ignore - JSON field handling needs proper typing in component */}
                    {(supplier.address as any)?.street1 ||
                      t('addressUndefined')}
                  </p>
                  <p>
                    {/* @ts-ignore */}
                    {(supplier.address as any)?.city}, {/* @ts-ignore */}{' '}
                    {(supplier.address as any)?.country}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                <div className="flex justify-end gap-2 text-sm">
                  <button className="font-medium text-gray-900 hover:underline">
                    {t('edit')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddLocationModal
          onClose={() => setIsModalOpen(false)}
          locale={locale}
        />
      )}
    </div>
  );
}
