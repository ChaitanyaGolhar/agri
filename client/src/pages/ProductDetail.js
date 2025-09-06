import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { ArrowLeft, Edit, Package, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery(
    ['product', id],
    () => api.get(`/products/${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  );

  const updateStockMutation = useMutation(
    ({ productId, quantity, operation, reason }) =>
      api.put(`/products/${productId}/stock`, { quantity, operation, reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product', id]);
        toast.success('Stock updated successfully');
      },
      onError: () => {
        toast.error('Failed to update stock');
      },
    }
  );

  const handleStockUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const quantity = parseInt(formData.get('quantity'));
    const operation = formData.get('operation');
    const reason = formData.get('reason');

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    updateStockMutation.mutate({ productId: id, quantity, operation, reason });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Product not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The product you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link to="/products" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'inventory', name: 'Inventory' },
    { id: 'specifications', name: 'Specifications' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/products"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500">
              {product.brand} • {product.category}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn btn-outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {/* Product Info Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Price
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pack Size
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {product.packSize.value} {product.packSize.unit}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Stock
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {product.stockQuantity} units
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className={`h-8 w-8 ${
                  product.isLowStock ? 'text-yellow-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Status
                  </dt>
                  <dd className={`text-lg font-medium ${
                    product.stockQuantity === 0
                      ? 'text-red-600'
                      : product.isLowStock
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {product.stockQuantity === 0
                      ? 'Out of Stock'
                      : product.isLowStock
                      ? 'Low Stock'
                      : 'In Stock'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Basic Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Product Information</h3>
              </div>
              <div className="card-content space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Description</p>
                  <p className="text-sm text-gray-500">
                    {product.description || 'No description available'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Category</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                {product.subcategory && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Subcategory</p>
                    <p className="text-sm text-gray-500">{product.subcategory}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Brand</p>
                  <p className="text-sm text-gray-500">{product.brand}</p>
                </div>
                {product.cropTypes && product.cropTypes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Compatible Crops</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.cropTypes.map((crop, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Inventory Details</h3>
              </div>
              <div className="card-content space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Current Stock</p>
                  <p className="text-sm text-gray-500">{product.stockQuantity} units</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Minimum Stock</p>
                  <p className="text-sm text-gray-500">{product.minimumStock} units</p>
                </div>
                {product.batchNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Batch Number</p>
                    <p className="text-sm text-gray-500">{product.batchNumber}</p>
                  </div>
                )}
                {product.expiryDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expiry Date</p>
                    <p className="text-sm text-gray-500">
                      {new Date(product.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {product.supplier?.name && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Supplier</p>
                    <p className="text-sm text-gray-500">{product.supplier.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Stock Management</h3>
              <p className="card-description">Update product stock levels</p>
            </div>
            <div className="card-content">
              <form onSubmit={handleStockUpdate} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Operation
                    </label>
                    <select
                      name="operation"
                      required
                      className="mt-1 input w-full"
                    >
                      <option value="add">Add Stock</option>
                      <option value="subtract">Subtract Stock</option>
                      <option value="set">Set Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      min="1"
                      className="mt-1 input w-full"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reason
                    </label>
                    <input
                      type="text"
                      name="reason"
                      className="mt-1 input w-full"
                      placeholder="Reason for change"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateStockMutation.isLoading}
                    className="btn btn-primary"
                  >
                    {updateStockMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Update Stock'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Product Specifications</h3>
            </div>
            <div className="card-content">
              {product.specifications ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-gray-500">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No specifications available for this product.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
