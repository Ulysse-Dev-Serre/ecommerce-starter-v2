'use client';

import Image from 'next/image';
import { Upload, GripVertical, Trash2, ImageIcon } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MediaItem {
  id: string;
  url: string;
  isPrimary: boolean;
  alt?: string;
  sortOrder: number;
}

interface SortableMediaItemProps {
  item: MediaItem;
  onDelete: (id: string) => void;
  labels: {
    primary: string;
    delete: string;
  };
}

function SortableMediaItem({ item, onDelete, labels }: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white ${
        isDragging ? 'z-50 shadow-2xl' : ''
      }`}
    >
      <Image
        src={item.url}
        alt={item.alt || 'Product image'}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      {item.isPrimary && (
        <div className="absolute left-2 top-2 z-10 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-sm">
          {labels.primary}
        </div>
      )}
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-2 left-2 z-10 cursor-grab rounded bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="absolute right-2 top-2 z-10 rounded bg-red-600/90 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700"
        title={labels.delete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ProductMediaManagerProps {
  media: MediaItem[];
  productId?: string;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDragEnd: (event: DragEndEvent) => Promise<void>;
  uploading: boolean;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function ProductMediaManager({
  media,
  productId,
  onUpload,
  onDelete,
  onDragEnd,
  uploading,
  t,
  tc,
}: ProductMediaManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!productId) {
    return (
      <div className="admin-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('productMedia')}
        </h2>
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50/50">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">{t('uploadAfterSave')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('productMedia')}
        </h2>
        <label className="admin-btn-secondary cursor-pointer gap-2">
          <Upload className="h-4 w-4" />
          {uploading ? tc('uploading') : tc('upload')}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <SortableContext
            items={media.map(m => m.id)}
            strategy={rectSortingStrategy}
          >
            {media.map(item => (
              <SortableMediaItem
                key={item.id}
                item={item}
                onDelete={onDelete}
                labels={{
                  primary: t('primary'),
                  delete: tc('delete'),
                }}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {media.length === 0 && !uploading && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50/50">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">{t('noMediaYet')}</p>
        </div>
      )}
    </div>
  );
}
