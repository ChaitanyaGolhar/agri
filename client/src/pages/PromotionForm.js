import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Save, Calendar, Tag, Percent, DollarSign, Gift, Truck } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const PromotionForm = () => {
  const { t, formatCurrency } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'percentage',
    value: '',
    buyQuantity: '',
    getQuantity: '',
    minOrderAmount: '',
    minOrderQuantity: '',
    maxDiscountAmount: '',
    usageLimit: '',
    usageLimitPerCustomer: '',
    startDate: '',
    endDate: '',
    applicableProducts: [],
    applicableCategories: [],
    applicableCustomerGroups: [],
    excludeProducts: [],
    isActive: true,
    isPublic: true
  });

  const [errors, setErrors] = useState({});

  // Fetch promotion data if editing
  const { data: promotion, isLoading } = useQuery(
    ['promotion', id],
    () => api.get(`/promotions/${id}`).then(res => res.data),
    { enabled: isEditing }
  );

  // Fetch products for selection
  const { data: productsData } = useQuery(
    'products-for-promotion',
    () => api.get('/products', { params: { limit: 1000 } }).then(res => res.data)
  );

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        code: promotion.code || '',
        type: promotion.type || 'percentage',
        value: promotion.value || '',
        buyQuantity: promotion.buyQuantity || '',
        getQuantity: promotion.getQuantity || '',
        minOrderAmount: promotion.minOrderAmount || '',
        minOrderQuantity: promotion.minOrderQuantity || '',
        maxDiscountAmount: promotion.maxDiscountAmount || '',
        usageLimit: promotion.usageLimit || '',
        usageLimitPerCustomer: promotion.usageLimitPerCustomer || '',
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().slice(0, 16) : '',
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().slice(0, 16) : '',
        applicableProducts: promotion.applicableProducts?.map(p => p._id) || [],
        applicableCategories: promotion.applicableCategories || [],
        applicableCustomerGroups: promotion.applicableCustomerGroups || [],
        excludeProducts: promotion.excludeProducts?.map(p => p._id) || [],
        isActive: promotion.isActive !== false,
        isPublic: promotion.isPublic !== false
      });
    }
  }, [promotion]);

  const createPromotionMutation = useMutation(
    (data) => api.post('/promotions', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('promotions');
        toast.success('Promotion created successfully');
        navigate('/promotions');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create promotion');
        if (error.response?.data?.errors) {
          const fieldErrors = {};
          error.response.data.errors.forEach(err => {
            fieldErrors[err.path] = err.msg;
          });
          setErrors(fieldErrors);
        }
      },
    }
  );

  const updatePromotionMutation = useMutation(
    (data) => api.put(`/promotions/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('promotions');
        queryClient.invalidateQueries(['promotion', id]);
        toast.success('Promotion updated successfully');
        navigate('/promotions');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update promotion');
        if (error.response?.data?.errors) {
          const fieldErrors = {};
          error.response.data.errors.forEach(err => {
            fieldErrors[err.path] = err.msg;
          });
          setErrors(fieldErrors);
        }
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const submitData = {
      ...formData,
      value: parseFloat(formData.value) || 0,
      buyQuantity: formData.buyQuantity ? parseInt(formData.buyQuantity) : undefined,
      getQuantity: formData.getQuantity ? parseInt(formData.getQuantity) : undefined,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
      minOrderQuantity: formData.minOrderQuantity ? parseInt(formData.minOrderQuantity) : undefined,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      usageLimitPerCustomer: formData.usageLimitPerCustomer ? parseInt(formData.usageLimitPerCustomer) : undefined,
    };

    if (isEditing) {
      updatePromotionMutation.mutate(submitData);
    } else {
      createPromotionMutation.mutate(submitData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: Array.from(value, option => option.value || option)
    }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const promotionTypes = [
    { value: 'percentage', label: 'Percentage Discount', icon: Percent },
    { value: 'fixed_amount', label: 'Fixed Amount Discount', icon: DollarSign },
    { value: 'free_shipping', label: 'Free Shipping', icon: Truck },
    { value: 'buy_x_get_y', label: 'Buy X Get Y', icon: Gift }
  ];

  const categories = ['Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Equipment', 'Irrigation', 'Other'];
  const customerGroups = ['new', 'regular', 'vip', 'wholesale'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/promotions')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Promotion' : 'Create New Promotion'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditing ? 'Update promotion details' : 'Set up a new promotional offer'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Promotion Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter promotion name"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Promotion Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`input w-full ${errors.code ? 'border-red-500' : ''}`}
                    placeholder="e.g., SAVE20"
                    required
                  />
                  {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input w-full"
                  placeholder="Describe your promotion"
                />
              </div>
            </div>

            {/* Promotion Type & Value */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Promotion Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Promotion Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="input w-full"
                    required
                  >
                    {promotionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Value *
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className={`input w-full ${errors.value ? 'border-red-500' : ''}`}
                    placeholder={formData.type === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
                    min="0"
                    step={formData.type === 'percentage' ? '0.01' : '1'}
                    required
                  />
                  {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
                </div>
              </div>

              {formData.type === 'buy_x_get_y' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buy Quantity
                    </label>
                    <input
                      type="number"
                      name="buyQuantity"
                      value={formData.buyQuantity}
                      onChange={handleChange}
                      className="input w-full"
                      placeholder="e.g., 3"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Get Quantity
                    </label>
                    <input
                      type="number"
                      name="getQuantity"
                      value={formData.getQuantity}
                      onChange={handleChange}
                      className="input w-full"
                      placeholder="e.g., 1"
                      min="1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Validity Period */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <Calendar className="h-5 w-5 inline mr-2" />
                Validity Period
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`input w-full ${errors.startDate ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={`input w-full ${errors.endDate ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Conditions */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Conditions
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Discount Amount
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="No limit"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usage Limit Per Customer
                  </label>
                  <input
                    type="number"
                    name="usageLimitPerCustomer"
                    value={formData.usageLimitPerCustomer}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Status
              </h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Public (visible to customers)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/promotions')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createPromotionMutation.isLoading || updatePromotionMutation.isLoading}
            className="btn btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {createPromotionMutation.isLoading || updatePromotionMutation.isLoading
              ? 'Saving...'
              : isEditing
              ? 'Update Promotion'
              : 'Create Promotion'
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromotionForm;
