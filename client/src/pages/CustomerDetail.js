import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../utils/api';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, DollarSign, Package } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const CustomerDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: customerData, isLoading } = useQuery(
    ['customer', id],
    () => api.get(`/customers/${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!customerData?.customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Customer not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The customer you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link to="/customers" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const { customer, orders } = customerData;

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'orders', name: 'Order History' },
    { id: 'contact', name: 'Contact Info' },
  ];

  const totalSpent = orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0;
  const totalOrders = orders?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/customers"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500">
              {customer.businessType} • Customer since {new Date(customer.createdAt).toLocaleDateString()}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Spent
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₹{totalSpent.toLocaleString()}
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
                    Total Orders
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalOrders}
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
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Last Purchase
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {customer.lastPurchaseDate
                      ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                      : 'Never'}
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
            {/* Customer Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Customer Information</h3>
              </div>
              <div className="card-content space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                    <p className="text-xs text-gray-500">Primary Phone</p>
                  </div>
                </div>
                {customer.alternatePhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.alternatePhone}</p>
                      <p className="text-xs text-gray-500">Alternate Phone</p>
                    </div>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                      <p className="text-xs text-gray-500">Email Address</p>
                    </div>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-xs text-gray-500">
                        {customer.address.street && `${customer.address.street}, `}
                        {customer.address.city && `${customer.address.city}, `}
                        {customer.address.state && `${customer.address.state} `}
                        {customer.address.pincode && `- ${customer.address.pincode}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Details */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Business Details</h3>
              </div>
              <div className="card-content space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Business Type</p>
                  <p className="text-sm text-gray-500">{customer.businessType}</p>
                </div>
                {customer.cropTypes && customer.cropTypes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Crop Types</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.cropTypes.map((crop, index) => (
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
                {customer.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Notes</p>
                    <p className="text-sm text-gray-500">{customer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Order History</h3>
              <p className="card-description">Recent orders from this customer</p>
            </div>
            <div className="card-content">
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Order #{order.orderNumber}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ₹{order.totalAmount.toLocaleString()}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            order.orderStatus === 'Delivered' 
                              ? 'bg-green-100 text-green-800'
                              : order.orderStatus === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {order.items.length} item(s) • Payment: {order.paymentMethod}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No orders found for this customer.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Contact Information</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Primary Contact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Address</h4>
                  <div className="space-y-1">
                    {customer.address?.street && (
                      <p className="text-sm text-gray-900">{customer.address.street}</p>
                    )}
                    <p className="text-sm text-gray-900">
                      {customer.address?.city && `${customer.address.city}, `}
                      {customer.address?.state && `${customer.address.state} `}
                      {customer.address?.pincode && customer.address.pincode}
                    </p>
                    {customer.address?.landmark && (
                      <p className="text-sm text-gray-500">
                        Near {customer.address.landmark}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
