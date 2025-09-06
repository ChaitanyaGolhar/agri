import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { ArrowLeft, Save, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: customer, isLoading } = useQuery(
    ['customer', id],
    () => api.get(`/customers/${id}`).then(res => res.data.customer),
    {
      enabled: isEdit,
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      businessType: 'Farmer',
      cropTypes: [],
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
      },
      creditLimit: '0',
      notes: ''
    }
  });

  const createCustomerMutation = useMutation(
    (customerData) => {
      console.log('Creating customer with data:', customerData);
      return api.post('/customers', customerData);
    },
    {
      onSuccess: (response) => {
        console.log('Customer created successfully:', response.data);
        // Invalidate all customer-related queries
        queryClient.invalidateQueries(['customers']);
        queryClient.invalidateQueries('customers');
        queryClient.invalidateQueries('dashboard-overview');
        // Force refetch of customers
        queryClient.refetchQueries(['customers']);
        toast.success('Customer created successfully!');
        navigate('/customers');
      },
      onError: (error) => {
        console.error('Customer creation error:', error);
        toast.error(error.response?.data?.message || 'Failed to create customer');
      },
    }
  );

  const updateCustomerMutation = useMutation(
    (customerData) => api.put(`/customers/${id}`, customerData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer', id]);
        queryClient.invalidateQueries(['customers']);
        toast.success('Customer updated successfully!');
        navigate('/customers');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update customer');
      },
    }
  );

  useEffect(() => {
    if (customer && isEdit) {
      reset({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        alternatePhone: customer.alternatePhone || '',
        businessType: customer.businessType || 'Farmer',
        cropTypes: customer.cropTypes || [],
        address: {
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          pincode: customer.address?.pincode || '',
          landmark: customer.address?.landmark || ''
        },
        creditLimit: customer.creditLimit?.toString() || '0',
        notes: customer.notes || ''
      });
    }
  }, [customer, isEdit, reset]);

  const onSubmit = (data) => {
    const customerData = {
      ...data,
      creditLimit: parseFloat(data.creditLimit) || 0
    };

    if (isEdit) {
      updateCustomerMutation.mutate(customerData);
    } else {
      createCustomerMutation.mutate(customerData);
    }
  };

  const businessTypes = [
    'Farmer', 'Retailer', 'Wholesaler', 'Cooperative', 'Other'
  ];

  const cropTypes = [
    'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Vegetables', 'Fruits', 'Spices', 'Other'
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
          onClick={() => navigate('/customers')}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit ? 'Update customer information' : 'Add a new customer to your database'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center">
                <User className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer Name *
                </label>
                <input
                  {...register('name', { required: 'Customer name is required' })}
                  className="mt-1 input w-full"
                  placeholder="Enter customer name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="mt-1 input w-full"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    {...register('phone', { required: 'Phone number is required' })}
                    type="tel"
                    className="mt-1 input w-full"
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Alternate Phone
                  </label>
                  <input
                    {...register('alternatePhone')}
                    type="tel"
                    className="mt-1 input w-full"
                    placeholder="Enter alternate phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Type
                </label>
                <select
                  {...register('businessType')}
                  className="mt-1 input w-full"
                >
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Address Information</h3>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  {...register('address.street')}
                  className="mt-1 input w-full"
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    {...register('address.city')}
                    className="mt-1 input w-full"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    {...register('address.state')}
                    className="mt-1 input w-full"
                    placeholder="Enter state"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pincode
                  </label>
                  <input
                    {...register('address.pincode')}
                    className="mt-1 input w-full"
                    placeholder="Enter pincode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Landmark
                  </label>
                  <input
                    {...register('address.landmark')}
                    className="mt-1 input w-full"
                    placeholder="Enter landmark"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crop Types */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Crop Types</h3>
          </div>
          <div className="card-content">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crops Grown
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

        {/* Additional Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Additional Information</h3>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Credit Limit (₹)
              </label>
              <input
                {...register('creditLimit', { 
                  min: { value: 0, message: 'Credit limit must be non-negative' }
                })}
                type="number"
                step="0.01"
                className="mt-1 input w-full"
                placeholder="0.00"
              />
              {errors.creditLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 input w-full"
                placeholder="Enter any additional notes about the customer"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createCustomerMutation.isLoading || updateCustomerMutation.isLoading}
            className="btn btn-primary"
          >
            {(createCustomerMutation.isLoading || updateCustomerMutation.isLoading) ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update Customer' : 'Create Customer'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
