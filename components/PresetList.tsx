'use client';

import { useState } from 'react';
import type { Preset } from '@/types';

interface PresetListProps {
  presets: Preset[];
  onEdit: (preset: Preset) => void;
  onDelete: (presetId: string) => Promise<void>;
}

export function PresetList({ presets, onEdit, onDelete }: PresetListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    setDeletingId(presetId);
    try {
      await onDelete(presetId);
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlacementCount = (placements: Record<string, unknown>) => {
    return Object.keys(placements || {}).length;
  };

  if (presets.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No presets yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create your first preset to save design placement settings and reuse them in the import wizard
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {presets.map((preset) => (
        <div
          key={preset.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                📦 {preset.name}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Blueprint ID:</span> {preset.blueprint_id}
                </p>
                <p>
                  <span className="font-medium">Print Provider ID:</span> {preset.print_provider_id}
                </p>
                <p>
                  <span className="font-medium">Placements:</span>{' '}
                  {getPlacementCount(preset.placements)} configured
                </p>
                <p className="text-gray-500">
                  Created: {formatDate(preset.created_at)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(preset)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(preset.id)}
                disabled={deletingId === preset.id}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === preset.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

