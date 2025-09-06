import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Plus, Search, Eye, Trash2, Package, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cropTypeFilter, setCropTypeFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery(
    ['products', currentPage, searchTerm, categoryFilter, cropTypeFilter, brandFilter, lowStockFilter],
    () => api.get('/products', {
      params: {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        category: categoryFilter,
        cropType: cropTypeFilter,
        brand: brandFilter,
        lowStock: lowStockFilter,
      }
    }).then(res => res.data)
  );

  const { data: filterOptions } = useQuery(
    'product-filters',
    () => api.get('/products/categories/list').then(res => res.data)
  );

  const deleteProductMutation = useMutation(
    (productId) => api.delete(`/products/${productId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Product deactivated successfully');
      },
      onError: () => {
        toast.error('Failed to deactivate product');
      },
    }
  );

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to deactivate this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Seeds', label: 'Seeds' },
    { value: 'Fertilizers', label: 'Fertilizers' },
    { value: 'Pesticides', label: 'Pesticides' },
    { value: 'Tools', label: 'Tools' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Irrigation', label: 'Irrigation' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/products/new"
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input w-full"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={cropTypeFilter}
                onChange={(e) => setCropTypeFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Crops</option>
                {filterOptions?.cropTypes?.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Brands</option>
                {filterOptions?.brands?.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Show low stock only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : productsData?.products?.length > 0 ? (
          productsData.products.map((product) => (
            <div key={product._id} className="card group hover:shadow-lg transition-shadow">
              <div className="card-content">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {product.brand} • {product.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Link
                      to={`/products/${product._id}`}
                      className="text-gray-400 hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.packSize.value} {product.packSize.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Stock</span>
                    <div className="flex items-center space-x-2">
                      {product.isLowStock && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        product.stockQuantity === 0
                          ? 'text-red-600'
                          : product.isLowStock
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {product.stockQuantity} units
                      </span>
                    </div>
                  </div>
                </div>

                {product.cropTypes && product.cropTypes.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {product.cropTypes.slice(0, 2).map((crop, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {crop}
                        </span>
                      ))}
                      {product.cropTypes.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{product.cropTypes.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first product.
            </p>
            <div className="mt-6">
              <Link
                to="/products/new"
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {productsData?.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(productsData.totalPages, currentPage + 1))}
              disabled={currentPage === productsData.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * 20 + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 20, productsData.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{productsData.total}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(productsData.totalPages, currentPage + 1))}
                  disabled={currentPage === productsData.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
