'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { PresetForm } from '@/components/PresetForm';
import { PresetList } from '@/components/PresetList';
import type { Preset, PlacementConfig } from '@/types';

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/presets');
      if (!response.ok) throw new Error('Failed to load presets');
      const data = await response.json();
      setPresets(data.presets || []);
    } catch (err) {
      console.error('Error loading presets:', err);
      setError('Failed to load presets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPreset(null);
    setShowForm(true);
  };

  const handleEdit = (preset: Preset) => {
    setEditingPreset(preset);
    setShowForm(true);
  };

  const handleSave = async (presetData: {
    name: string;
    blueprint_id: number;
    print_provider_id: number;
    placements: Record<string, PlacementConfig>;
  }) => {
    try {
      if (editingPreset) {
        // Update existing preset
        const response = await fetch('/api/presets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPreset.id,
            ...presetData,
          }),
        });

        if (!response.ok) throw new Error('Failed to update preset');
      } else {
        // Create new preset
        const response = await fetch('/api/presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(presetData),
        });

        if (!response.ok) throw new Error('Failed to create preset');
      }

      // Reload presets and close form
      await loadPresets();
      setShowForm(false);
      setEditingPreset(null);
    } catch (err) {
      console.error('Error saving preset:', err);
      throw err; // Let PresetForm handle the error display
    }
  };

  const handleDelete = async (presetId: string) => {
    const response = await fetch(`/api/presets?id=${presetId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete preset');

    // Reload presets
    await loadPresets();
  };


  const handleCancel = () => {
    setShowForm(false);
    setEditingPreset(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/profile" className="hover:text-blue-600">
              Profile
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Presets</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Presets
              </h1>
              <p className="text-gray-600">
                Save and manage your design placement configurations
              </p>
            </div>
            
            {!showForm && (
              <Button
                variant="primary"
                onClick={handleCreateNew}
              >
                + New Preset
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {showForm ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingPreset ? 'Edit Preset' : 'Create New Preset'}
              </h2>
              <PresetForm
                preset={editingPreset}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading presets...</p>
            </div>
          ) : (
            <PresetList
              presets={presets}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

