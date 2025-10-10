'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import type { Blueprint, PrintProvider, PrintArea, Preset, PlacementConfig } from '@/types';

interface PresetFormProps {
  preset?: Preset | null;
  onSave: (presetData: {
    name: string;
    blueprint_id: number;
    print_provider_id: number;
    placements: Record<string, PlacementConfig>;
  }) => Promise<void>;
  onCancel: () => void;
}

export function PresetForm({ preset, onSave, onCancel }: PresetFormProps) {
  const [name, setName] = useState(preset?.name || '');
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<number | null>(
    preset?.blueprint_id || null
  );
  const [printProviders, setPrintProviders] = useState<PrintProvider[]>([]);
  const [selectedPrintProviderId, setSelectedPrintProviderId] = useState<number | null>(
    preset?.print_provider_id || null
  );
  const [printAreas, setPrintAreas] = useState<PrintArea[]>([]);
  const [placements, setPlacements] = useState<Record<string, PlacementConfig>>(
    preset?.placements || {}
  );

  const [isLoadingBlueprints, setIsLoadingBlueprints] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load blueprints on mount
  useEffect(() => {
    const loadBlueprints = async () => {
      setIsLoadingBlueprints(true);
      try {
        const response = await fetch('/api/blueprints?provider=printify');
        if (!response.ok) throw new Error('Failed to load blueprints');
        const data = await response.json();
        setBlueprints(data.blueprints || []);
      } catch (err) {
        console.error('Error loading blueprints:', err);
        setError('Failed to load blueprints');
      } finally {
        setIsLoadingBlueprints(false);
      }
    };

    loadBlueprints();
  }, []);

  // Load print providers when blueprint is selected
  useEffect(() => {
    if (!selectedBlueprintId) {
      setPrintProviders([]);
      setSelectedPrintProviderId(null);
      return;
    }

    const loadPrintProviders = async () => {
      setIsLoadingProviders(true);
      try {
        const response = await fetch(`/api/print-providers?blueprint_id=${selectedBlueprintId}`);
        if (!response.ok) throw new Error('Failed to load print providers');
        const data = await response.json();
        setPrintProviders(data.printProviders || []);
      } catch (err) {
        console.error('Error loading print providers:', err);
        setError('Failed to load print providers');
      } finally {
        setIsLoadingProviders(false);
      }
    };

    loadPrintProviders();
  }, [selectedBlueprintId]);

  // Load print areas when print provider is selected
  useEffect(() => {
    if (!selectedPrintProviderId) {
      setPrintAreas([]);
      setPlacements({});
      return;
    }

    const loadPrintAreas = async () => {
      setIsLoadingAreas(true);
      try {
        const response = await fetch(`/api/print-areas?print_provider_id=${selectedPrintProviderId}`);
        if (!response.ok) throw new Error('Failed to load print areas');
        const data = await response.json();
        const areas = data.printAreas || [];
        setPrintAreas(areas);

        // Initialize placements with default values (max dimensions, 0,0 position)
        // Only for areas that don't already have placements
        setPlacements(prev => {
          const newPlacements: Record<string, PlacementConfig> = { ...prev };
          areas.forEach((area: PrintArea) => {
            if (!newPlacements[area.name]) {
              newPlacements[area.name] = {
                width: area.width,
                height: area.height,
                x: 0,
                y: 0,
              };
            }
          });
          return newPlacements;
        });
      } catch (err) {
        console.error('Error loading print areas:', err);
        setError('Failed to load print areas');
      } finally {
        setIsLoadingAreas(false);
      }
    };

    loadPrintAreas();
  }, [selectedPrintProviderId]);

  const handlePlacementChange = (
    areaName: string,
    field: keyof PlacementConfig,
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setPlacements(prev => ({
      ...prev,
      [areaName]: {
        ...prev[areaName],
        [field]: numValue,
      },
    }));
  };

  const handleRemovePlacement = (areaName: string) => {
    setPlacements(prev => {
      const newPlacements = { ...prev };
      delete newPlacements[areaName];
      return newPlacements;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Preset name is required');
      return;
    }

    if (!selectedBlueprintId) {
      setError('Please select a blueprint');
      return;
    }

    if (!selectedPrintProviderId) {
      setError('Please select a print provider');
      return;
    }

    if (Object.keys(placements).length === 0) {
      setError('Please configure at least one placement');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        blueprint_id: selectedBlueprintId,
        print_provider_id: selectedPrintProviderId,
        placements,
      });
    } catch (err) {
      console.error('Error saving preset:', err);
      setError('Failed to save preset');
    } finally {
      setIsSaving(false);
    }
  };

  const getMaxDimensions = (areaName: string) => {
    const area = printAreas.find(a => a.name === areaName);
    return area ? { maxWidth: area.width, maxHeight: area.height } : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        <Input
          label="Preset Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., T-Shirt Front & Back"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blueprint <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBlueprintId || ''}
            onChange={(e) => setSelectedBlueprintId(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoadingBlueprints}
            required
          >
            <option value="">Select blueprint...</option>
            {blueprints.map(blueprint => (
              <option key={blueprint.id} value={blueprint.id}>
                {blueprint.title} ({blueprint.brand} - {blueprint.model})
              </option>
            ))}
          </select>
        </div>

        {selectedBlueprintId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Print Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPrintProviderId || ''}
              onChange={(e) => setSelectedPrintProviderId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoadingProviders}
              required
            >
              <option value="">Select print provider...</option>
              {printProviders.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.title} {provider.location && `(${provider.location})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Design Placements */}
      {selectedPrintProviderId && printAreas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Design Placements</h3>
          
          {isLoadingAreas ? (
            <div className="text-center py-4 text-gray-500">Loading print areas...</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(placements).map(([areaName, placement]) => {
                const maxDims = getMaxDimensions(areaName);
                return (
                  <div key={areaName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {areaName.replace('_', ' ')}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemovePlacement(areaName)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {maxDims && (
                      <p className="text-xs text-gray-500 mb-3">
                        Max dimensions: {maxDims.maxWidth} × {maxDims.maxHeight} px
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={placement.width}
                          onChange={(e) => handlePlacementChange(areaName, 'width', e.target.value)}
                          max={maxDims?.maxWidth}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          value={placement.height}
                          onChange={(e) => handlePlacementChange(areaName, 'height', e.target.value)}
                          max={maxDims?.maxHeight}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          X Position (px)
                        </label>
                        <input
                          type="number"
                          value={placement.x}
                          onChange={(e) => handlePlacementChange(areaName, 'x', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Y Position (px)
                        </label>
                        <input
                          type="number"
                          value={placement.y}
                          onChange={(e) => handlePlacementChange(areaName, 'y', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSaving || isLoadingBlueprints || isLoadingProviders || isLoadingAreas}
          loading={isSaving}
        >
          {preset ? 'Update Preset' : 'Save Preset'}
        </Button>
      </div>
    </form>
  );
}

