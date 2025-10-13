'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { listPrintifyProducts } from '@/lib/api';
import { PrintifyProduct } from '@/types';
import { ArrowLeft, Calendar, Package, Printer, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

export default function ImportPrintifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenRef = searchParams.get('tokenRef');
  const importId = searchParams.get('importId');

  const [products, setProducts] = useState<PrintifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<PrintifyProduct | null>(null);

  useEffect(() => {
    if (!tokenRef || !importId) {
      setError('Missing required parameters');
      setIsLoading(false);
      return;
    }

    loadProducts();
  }, [tokenRef, importId]);

  const loadProducts = async () => {
    if (!tokenRef || !importId) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Loading Printify products...');
      const data = await listPrintifyProducts(tokenRef, importId);
      console.log('✅ Printify products loaded:', data);
      setProducts(data.products || []);
    } catch (err) {
      console.error('❌ Failed to load Printify products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product: PrintifyProduct) => {
    setSelectedProduct(product);
  };

  const handleImportProduct = () => {
    if (!selectedProduct) return;

    // TODO: Handle product import - navigate back to wizard with selected product
    console.log('🎯 Importing product:', selectedProduct);
    
    // For now, just go back
    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDefaultImage = (product: PrintifyProduct) => {
    const defaultImg = product.images?.find(img => img.is_default);
    return defaultImg?.src || product.images?.[0]?.src || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your Printify products...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={loadProducts} variant="primary">
                  Try Again
                </Button>
                <Button onClick={handleBack} variant="secondary">
                  Go Back
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Import from Printify</h1>
                <p className="text-gray-600">
                  Select a product to copy its configuration ({products.length} products found)
                </p>
              </div>
              <Button onClick={handleBack} variant="secondary" className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-4">
                  No products were found in your Printify account.
                </p>
                <Button onClick={handleBack} variant="secondary">
                  Go Back
                </Button>
              </div>
            ) : (
              <>
                {/* Products Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Blueprint</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Provider</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const defaultImage = getDefaultImage(product);
                        const isSelected = selectedProduct?.id === product.id;
                        
                        return (
                          <tr 
                            key={product.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-green-50 border-green-200' : ''
                            }`}
                          >
                            {/* Product Info with Image */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {defaultImage ? (
                                    <img
                                      src={defaultImage}
                                      alt={product.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-full h-full flex items-center justify-center ${defaultImage ? 'hidden' : ''}`}>
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 truncate" title={product.title}>
                                    {product.title}
                                  </h3>
                                  {product.description && (
                                    <p className="text-sm text-gray-600 truncate mt-1" title={product.description}>
                                      {product.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    ID: {product.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Blueprint */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {product.blueprint_id}
                                </span>
                              </div>
                            </td>

                            {/* Print Provider */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Printer className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {product.print_provider_id}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {product.visible ? (
                                  <>
                                    <Eye className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-700 font-medium">Published</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">Draft</span>
                                  </>
                                )}
                                {product.is_locked && (
                                  <div title="Locked">
                                    <Lock className="w-4 h-4 text-orange-500 ml-1" />
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Created Date */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {formatDate(product.created_at)}
                                </span>
                              </div>
                            </td>

                            {/* Action */}
                            <td className="py-4 px-4">
                              <Button
                                onClick={() => handleProductSelect(product)}
                                variant={isSelected ? "primary" : "secondary"}
                                size="sm"
                                className={isSelected ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Selected Product Summary */}
                {selectedProduct && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-900">
                          Selected: {selectedProduct.title}
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                          Blueprint {selectedProduct.blueprint_id} • Provider {selectedProduct.print_provider_id}
                        </p>
                      </div>
                      <Button
                        onClick={handleImportProduct}
                        variant="primary"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Import Product
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
