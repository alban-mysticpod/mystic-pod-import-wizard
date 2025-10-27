'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import type { Preset, PlacementConfig } from '@/types';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    blueprint_id: number;
    print_provider_id: number;
    placements: Record<string, PlacementConfig>;
  }) => Promise<void>;
  preset?: Preset | null;
}

export function PresetModal({ isOpen, onClose, onSave, preset }: PresetModalProps) {
  const [name, setName] = useState('');
  const [blueprintId, setBlueprintId] = useState('');
  const [printProviderId, setPrintProviderId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setBlueprintId(preset.blueprint_id.toString());
      setPrintProviderId(preset.print_provider_id.toString());
    } else {
      setName('');
      setBlueprintId('');
      setPrintProviderId('');
    }
    setError('');
  }, [preset, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Preset name is required');
      return;
    }

    if (!blueprintId || !printProviderId) {
      setError('Blueprint ID and Print Provider ID are required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        blueprint_id: parseInt(blueprintId),
        print_provider_id: parseInt(printProviderId),
        placements: {}, // TODO: Add placement configuration UI
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {preset ? 'Edit Preset' : 'Create New Preset'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Preset Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Collection T-Shirt"
                required
              />

              <Input
                label="Blueprint ID"
                type="number"
                value={blueprintId}
                onChange={(e) => setBlueprintId(e.target.value)}
                placeholder="e.g., 3"
                helperText="The Printify blueprint ID for this product type"
                required
              />

              <Input
                label="Print Provider ID"
                type="number"
                value={printProviderId}
                onChange={(e) => setPrintProviderId(e.target.value)}
                placeholder="e.g., 99"
                helperText="The Printify print provider ID"
                required
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After creating this preset, you can configure detailed placement settings 
                  when using it in the import wizard.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
              >
                {preset ? 'Save Changes' : 'Create Preset'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

