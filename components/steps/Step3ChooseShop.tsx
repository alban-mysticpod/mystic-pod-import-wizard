'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { chooseShop } from '@/lib/api';
import { PrintifyShop } from '@/types';
import { Store, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step3Props {
  tokenRef: string;
  shops: PrintifyShop[];
  selectedShopId: number | null;
  onNext: (shopId: number) => void;
}

export function Step3ChooseShop({ tokenRef, shops, selectedShopId, onNext }: Step3Props) {
  const [selected, setSelected] = useState<number | null>(selectedShopId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (!selected) {
      setError('Please select a shop');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🚀 Logging shop selection:', { tokenRef, shopId: selected });
      await chooseShop(tokenRef, selected);
      console.log('✅ Shop selection logged successfully');
      onNext(selected);
    } catch (err) {
      console.error('❌ Failed to log shop selection:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to select shop';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      title="Choose Your Printify Shop"
      description="Select which shop you want to import your designs to."
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className={cn(
                'border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary-300',
                selected === shop.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
              onClick={() => setSelected(shop.id)}
            >
              <div className="flex items-center">
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 mr-3 transition-all duration-200',
                    selected === shop.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  )}
                >
                  {selected === shop.id && (
                    <CheckCircle className="w-full h-full text-white" />
                  )}
                </div>
                <Store className="w-5 h-5 text-gray-400 mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{shop.title}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {shop.sales_channel.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            loading={isLoading}
            disabled={!selected}
            variant="success"
          >
            Continue with Selected Shop
          </Button>
        </div>
      </div>
    </Card>
  );
}
