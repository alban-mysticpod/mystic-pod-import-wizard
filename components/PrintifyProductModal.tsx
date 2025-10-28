'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { listPrintifyProducts, createPresetFromPrintifyProduct } from '@/lib/api';
import { PrintifyProduct } from '@/types';
import { X, Calendar, Package, Printer, Eye, EyeOff, Lock } from 'lucide-react';

interface PrintifyProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: PrintifyProduct) => void;
  importId: string;
}

export function PrintifyProductModal({ 
  isOpen, 
  onClose, 
  onSelectProduct, 
  importId 
}: PrintifyProductModalProps) {
  const [products, setProducts] = useState<PrintifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<PrintifyProduct | null>(null);
  const [paginationInfo, setPaginationInfo] = useState<{
    totalProducts: number;
    currentPage: number;
    nextPage: number | null;
    lastPage: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen && importId) {
      loadProducts();
    }
  }, [isOpen, importId]);

  const loadProducts = async (page: number = 1, append: boolean = false) => {
    console.log('🔄 PrintifyModal: loadProducts called', {
      page,
      append,
      importId,
      isOpen,
      currentProductsCount: products.length
    });
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setProducts([]); // Reset products for first page
      setPaginationInfo(null);
    }
    setError('');

    try {
      console.log(`🔄 Loading Printify products page ${page}...`);
      const data = await listPrintifyProducts(importId, page);
      console.log('✅ Printify products loaded:', data);
      
      if (data.products && Array.isArray(data.products)) {
        console.log('🔍 Using data.products, length:', data.products.length);
        
        // Update products (append or replace)
        if (append) {
          setProducts(prev => [...prev, ...data.products]);
        } else {
          setProducts(data.products);
        }
        
        // Update pagination info
        setPaginationInfo({
          totalProducts: data.total_number_of_products || 0,
          currentPage: data.current_page || page,
          nextPage: data.next_page || null,
          lastPage: data.last_page || 1
        });
      } else {
        console.log('🔍 No valid products array found');
        if (!append) {
          setProducts([]);
        }
      }
    } catch (err) {
      console.error('❌ Failed to load Printify products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleProductSelect = (product: PrintifyProduct) => {
    setSelectedProduct(product);
  };

  const handleImportProduct = async () => {
    if (!selectedProduct) return;

    setIsImporting(true);
    setError('');

    try {
      console.log('🔄 Creating preset from Printify product:', selectedProduct.id);
      const result = await createPresetFromPrintifyProduct(selectedProduct.id, importId);
      console.log('✅ Preset created from Printify product:', result);
      
      // Call the original onSelectProduct callback with the product
      onSelectProduct(selectedProduct);
      onClose();
    } catch (err) {
      console.error('❌ Failed to create preset from Printify product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to import product settings';
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadMore = () => {
    if (paginationInfo?.nextPage) {
      loadProducts(paginationInfo.nextPage, true);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import from Printify</h2>
            <p className="text-gray-600 text-sm mt-1">
              Select a product to copy its configuration ({products.length} products found)
            </p>
          </div>
          <Button onClick={onClose} variant="secondary" size="sm" className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your Printify products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => loadProducts()} variant="primary">
                Try Again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600">No products were found in your Printify account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-2/5" /> {/* Product - 40% */}
                  <col className="w-16" />   {/* Blueprint - 64px */}
                  <col className="w-16" />   {/* Provider - 64px */}
                  <col className="w-24" />   {/* Status - 96px */}
                  <col className="w-20" />   {/* Created - 80px */}
                  <col className="w-20" />   {/* Action - 80px */}
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">Product</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900">Blueprint</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900">Provider</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900">Created</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900">Action</th>
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
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm truncate" title={product.title}>
                                {product.title}
                              </h3>
                              {product.description && (
                                <p className="text-xs text-gray-500 truncate mt-1" title={product.description.replace(/<[^>]*>/g, '')}>
                                  {product.description.replace(/<[^>]*>/g, '').substring(0, 60)}...
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                ID: {product.id.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Blueprint */}
                        <td className="py-3 px-2 text-center">
                          <span className="text-xs font-medium text-gray-900" title={`Blueprint ID: ${product.blueprint_id}`}>
                            {product.blueprint_id}
                          </span>
                        </td>

                        {/* Print Provider */}
                        <td className="py-3 px-2 text-center">
                          <span className="text-xs font-medium text-gray-900" title={`Provider ID: ${product.print_provider_id}`}>
                            {product.print_provider_id}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-1">
                            {product.visible ? (
                              <div title="Published">
                                <Eye className="w-3 h-3 text-green-500" />
                              </div>
                            ) : (
                              <div title="Draft">
                                <EyeOff className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                            {product.is_locked && (
                              <div title="Locked">
                                <Lock className="w-3 h-3 text-orange-500" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="py-3 px-2 text-center">
                          <span className="text-xs text-gray-600" title={formatDate(product.created_at)}>
                            {new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-2 text-center">
                          <Button
                            onClick={() => handleProductSelect(product)}
                            variant={isSelected ? "primary" : "secondary"}
                            size="sm"
                            className={`text-xs px-2 py-1 ${isSelected ? "bg-green-600 hover:bg-green-700" : ""}`}
                          >
                            {isSelected ? '✓' : 'Select'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Info and Load More Button */}
          {!isLoading && !error && products.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="text-sm text-gray-600 text-center">
                Showing {products.length} of {paginationInfo?.totalProducts || products.length} products
                {paginationInfo && paginationInfo.totalProducts > products.length && (
                  <span className="ml-2 text-blue-600">
                    (Page {paginationInfo.currentPage} of {paginationInfo.lastPage})
                  </span>
                )}
              </div>
              
              {paginationInfo?.nextPage && (
                <Button
                  onClick={handleLoadMore}
                  variant="secondary"
                  disabled={isLoadingMore}
                  className="flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Products
                      <span className="text-xs text-gray-500">
                        ({paginationInfo.totalProducts - products.length} remaining)
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedProduct && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Selected: {selectedProduct.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Blueprint {selectedProduct.blueprint_id} • Provider {selectedProduct.print_provider_id}
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary">
                  Cancel
                </Button>
                <Button
                  onClick={handleImportProduct}
                  variant="primary"
                  disabled={isImporting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    'Import Product'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
