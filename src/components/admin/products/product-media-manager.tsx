'use client';

import Image from 'next/image';
import {
  Upload,
  GripVertical,
  Trash2,
  ImageIcon,
  Edit2,
  X,
} from 'lucide-react';
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
import { useState } from 'react';
import { updateMediaMetadataAction } from '@/lib/actions/products';

interface MediaItem {
  id: string;
  url: string;
  isPrimary: boolean;
  alt?: string | null;
  title?: string | null;
  sortOrder: number;
}

interface SortableMediaItemProps {
  item: MediaItem;
  onDelete: (id: string) => void;
  onEdit: (item: MediaItem) => void;
  labels: {
    primary: string;
    delete: string;
    edit: string;
  };
}

function SortableMediaItem({
  item,
  onDelete,
  onEdit,
  labels,
}: SortableMediaItemProps) {
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
      className={`group relative aspect-square overflow-hidden admin-card p-0 ${isDragging ? 'z-50 shadow-2xl ring-2 ring-primary' : ''}`}
    >
      <Image
        src={item.url}
        alt={item.alt || 'Product image'}
        fill
        className="object-cover transition-transform group-hover:scale-105"
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      {item.isPrimary && (
        <div className="absolute left-2 top-2 z-10 admin-badge-success shadow-sm">
          {labels.primary}
        </div>
      )}
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-2 left-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 admin-icon-btn-glass cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="absolute right-2 top-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="admin-icon-btn-glass"
          title={labels.edit}
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="admin-icon-btn-danger shadow-sm"
          title={labels.delete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
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
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState({ alt: '', title: '' });
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEditClick = (item: MediaItem) => {
    setEditingItem(item);
    setEditForm({ alt: item.alt || '', title: item.title || '' });
  };

  const handleSaveMetadata = async () => {
    if (!editingItem) return;

    try {
      setIsSaving(true);
      const result = await updateMediaMetadataAction(editingItem.id, editForm);

      if (result.success) {
        setEditingItem(null);
        // Refresh handled by Revalidate in action
      } else {
        alert('Failed to update media: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (!productId) {
    return (
      <div className="admin-card">
        <h2 className="admin-section-title">{t('productMedia')}</h2>
        <div className="admin-empty-state">
          <ImageIcon className="mx-auto h-12 w-12 admin-text-subtle" />
          <p className="mt-2 text-sm admin-text-subtle">
            {t('uploadAfterSave')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="admin-section-title">{t('productMedia')}</h2>
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
                  onEdit={handleEditClick}
                  labels={{
                    primary: t('primary'),
                    delete: tc('delete'),
                    edit: tc('edit'),
                  }}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>

        {media.length === 0 && !uploading && (
          <div className="admin-empty-state">
            <ImageIcon className="mx-auto h-12 w-12 admin-text-subtle" />
            <p className="mt-2 text-sm admin-text-subtle">{t('noMediaYet')}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="admin-overlay">
          <div className="admin-modal-content">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold admin-text-main">
                {tc('edit')} Media SEO
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="admin-text-subtle hover:admin-text-main"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex justify-center">
              <div className="relative h-40 w-40 overflow-hidden rounded-md border admin-border-subtle">
                <Image
                  src={editingItem.url}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="admin-label mb-1">
                  Alt Text (SEO description)
                </label>
                <input
                  type="text"
                  value={editForm.alt}
                  onChange={e =>
                    setEditForm(prev => ({ ...prev, alt: e.target.value }))
                  }
                  className="admin-input"
                  placeholder="Describe image for SEO..."
                />
              </div>
              <div>
                <label className="admin-label mb-1">Title (Hover text)</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e =>
                    setEditForm(prev => ({ ...prev, title: e.target.value }))
                  }
                  className="admin-input"
                  placeholder="Image title..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="admin-btn-secondary"
                disabled={isSaving}
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleSaveMetadata}
                className="admin-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? tc('saving') : tc('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
