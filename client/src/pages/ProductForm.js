import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { ArrowLeft, Save, Package } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: product, isLoading } = useQuery(
    ['product', id],
    () => api.get(`/products/${id}`).then(res => res.data),
    {
      enabled: isEdit,
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      category: 'Seeds',
      subcategory: '',
      brand: '',
      price: '',
      packSize: {
        value: '',
        unit: 'kg'
      },
      stockQuantity: '',
      minimumStock: '10',
      cropTypes: [],
      specifications: {
        composition: '',
        dosage: '',
        applicationMethod: '',
        shelfLife: '',
        storageConditions: ''
      },
      supplier: {
        name: '',
        contact: '',
        address: ''
      }
    }
  });

  const createProductMutation = useMutation(
    (productData) => api.post('/products', productData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Product created successfully!');
        navigate('/products');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create product');
      },
    }
  );

  const updateProductMutation = useMutation(
    (productData) => api.put(`/products/${id}`, productData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product', id]);
        queryClient.invalidateQueries('products');
        toast.success('Product updated successfully!');
        navigate('/products');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update product');
      },
    }
  );

  useEffect(() => {
    if (product && isEdit) {
      reset({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'Seeds',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        price: product.price || '',
        packSize: {
          value: product.packSize?.value || '',
          unit: product.packSize?.unit || 'kg'
        },
        stockQuantity: product.stockQuantity || '',
        minimumStock: product.minimumStock || '10',
        cropTypes: product.cropTypes || [],
        specifications: {
          composition: product.specifications?.composition || '',
          dosage: product.specifications?.dosage || '',
          applicationMethod: product.specifications?.applicationMethod || '',
          shelfLife: product.specifications?.shelfLife || '',
          storageConditions: product.specifications?.storageConditions || ''
        },
        supplier: {
          name: product.supplier?.name || '',
          contact: product.supplier?.contact || '',
          address: product.supplier?.address || ''
        }
      });
    }
  }, [product, isEdit, reset]);

  const onSubmit = (data) => {
    const productData = {
      ...data,
      price: parseFloat(data.price),
      packSize: {
        value: parseFloat(data.packSize.value),
        unit: data.packSize.unit
      },
      stockQuantity: parseInt(data.stockQuantity),
      minimumStock: parseInt(data.minimumStock)
    };

    if (isEdit) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const categories = [
    'Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Equipment', 'Irrigation', 'Other'
  ];

  const packUnits = [
    'kg', 'g', 'L', 'ml', 'pieces', 'packets', 'bags', 'bottles'
  ];

  const cropTypes = [
    'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Vegetables', 'Fruits', 'Spices', 'All Crops'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit ? 'Update product information' : 'Add a new product to your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  {...register('name', { required: 'Product name is required' })}
                  className="mt-1 input w-full"
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 input w-full"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="mt-1 input w-full"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subcategory
                  </label>
                  <input
                    {...register('subcategory')}
                    className="mt-1 input w-full"
                    placeholder="Enter subcategory"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Brand *
                </label>
                <input
                  {...register('brand', { required: 'Brand is required' })}
                  className="mt-1 input w-full"
                  placeholder="Enter brand name"
                />
                {errors.brand && (
                  <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pricing & Inventory</h3>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (₹) *
                </label>
                <input
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  className="mt-1 input w-full"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pack Size Value *
                  </label>
                  <input
                    {...register('packSize.value', { 
                      required: 'Pack size value is required',
                      min: { value: 0, message: 'Value must be positive' }
                    })}
                    type="number"
                    step="0.01"
                    className="mt-1 input w-full"
                    placeholder="1"
                  />
                  {errors.packSize?.value && (
                    <p className="mt-1 text-sm text-red-600">{errors.packSize.value.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit *
                  </label>
                  <select
                    {...register('packSize.unit', { required: 'Unit is required' })}
                    className="mt-1 input w-full"
                  >
                    {packUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  {errors.packSize?.unit && (
                    <p className="mt-1 text-sm text-red-600">{errors.packSize.unit.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock Quantity *
                  </label>
                  <input
                    {...register('stockQuantity', { 
                      required: 'Stock quantity is required',
                      min: { value: 0, message: 'Quantity must be non-negative' }
                    })}
                    type="number"
                    className="mt-1 input w-full"
                    placeholder="0"
                  />
                  {errors.stockQuantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.stockQuantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Stock
                  </label>
                  <input
                    {...register('minimumStock', { 
                      min: { value: 0, message: 'Value must be non-negative' }
                    })}
                    type="number"
                    className="mt-1 input w-full"
                    placeholder="10"
                  />
                  {errors.minimumStock && (
                    <p className="mt-1 text-sm text-red-600">{errors.minimumStock.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crop Compatibility */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Crop Compatibility</h3>
          </div>
          <div className="card-content">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compatible Crops
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {cropTypes.map((crop) => (
                  <label key={crop} className="flex items-center">
                    <input
                      type="checkbox"
                      value={crop}
                      {...register('cropTypes')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{crop}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Product Specifications</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Composition
                </label>
                <input
                  {...register('specifications.composition')}
                  className="mt-1 input w-full"
                  placeholder="Enter composition details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dosage
                </label>
                <input
                  {...register('specifications.dosage')}
                  className="mt-1 input w-full"
                  placeholder="Enter dosage instructions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Application Method
                </label>
                <input
                  {...register('specifications.applicationMethod')}
                  className="mt-1 input w-full"
                  placeholder="Enter application method"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shelf Life
                </label>
                <input
                  {...register('specifications.shelfLife')}
                  className="mt-1 input w-full"
                  placeholder="Enter shelf life"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Storage Conditions
                </label>
                <textarea
                  {...register('specifications.storageConditions')}
                  rows={2}
                  className="mt-1 input w-full"
                  placeholder="Enter storage conditions"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Supplier Information</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supplier Name
                </label>
                <input
                  {...register('supplier.name')}
                  className="mt-1 input w-full"
                  placeholder="Enter supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact
                </label>
                <input
                  {...register('supplier.contact')}
                  className="mt-1 input w-full"
                  placeholder="Enter contact information"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  {...register('supplier.address')}
                  rows={2}
                  className="mt-1 input w-full"
                  placeholder="Enter supplier address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
            className="btn btn-primary"
          >
            {(createProductMutation.isLoading || updateProductMutation.isLoading) ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
