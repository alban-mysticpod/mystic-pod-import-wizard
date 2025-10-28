'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store as StoreIcon, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Store } from '@/types';

interface RequirePrintifyShopProps {
  children: React.ReactNode;
}

export function RequirePrintifyShop({ children }: RequirePrintifyShopProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPrintifyShop, setHasPrintifyShop] = useState(false);

  useEffect(() => {
    checkPrintifyShops();
  }, []);

  const checkPrintifyShops = async () => {
    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();
      
      const response = await fetch(`/api/user/stores?userId=${userId}`);
      if (response.ok) {
        const stores: Store[] = await response.json();
        const printifyStores = stores.filter((s) => s.provider === 'printify');
        setHasPrintifyShop(printifyStores.length > 0);
      } else {
        setHasPrintifyShop(false);
      }
    } catch (error) {
      console.error('Error checking Printify shops:', error);
      setHasPrintifyShop(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectShop = () => {
    // Set flag to auto-open connect modal
    sessionStorage.setItem('openConnectShopModal', 'printify');
    router.push('/profile/settings');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPrintifyShop) {
    return (
      <>
        {/* Blurred/disabled content */}
        <div className="pointer-events-none blur-sm opacity-40">
          {children}
        </div>

        {/* Full-screen overlay (fixed positioning to cover entire viewport except sidebar) */}
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Printify Shop Required
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                Before you can start importing designs, you need to connect your Printify shop. 
                This allows us to sync your designs directly to your account.
              </p>

              {/* Button */}
              <Button
                onClick={handleConnectShop}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <StoreIcon className="w-5 h-5" />
                Connect Printify Shop
              </Button>

              {/* Help text */}
              <p className="text-sm text-gray-500 mt-4">
                Don't have a Printify account?{' '}
                <a
                  href="https://printify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Sign up here
                </a>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}

