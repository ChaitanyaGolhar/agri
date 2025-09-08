import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Tag, 
  Users, 
  TrendingUp,
  Copy,
  Eye,
  EyeOff,
  BarChart3
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const PromotionDetail = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: promotion, isLoading } = useQuery(
    ['promotion', id],
    () => api.get(`/promotions/${id}`).then(res => res.data)
  );

  const { data: analytics } = useQuery(
    ['promotion-analytics', id],
    () => api.get(`/promotions/analytics/${id}`).then(res => res.data),
    { enabled: !!promotion }
  );

  const deletePromotionMutation = useMutation(
    () => api.delete(`/promotions/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('promotions');
        toast.success('Promotion deleted successfully');
        navigate('/promotions');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete promotion');
      },
    }
  );

  const togglePromotionMutation = useMutation(
    (isActive) => api.put(`/promotions/${id}`, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['promotion', id]);
        queryClient.invalidateQueries('promotions');
        toast.success('Promotion status updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update promotion');
      },
    }
  );

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) {
      deletePromotionMutation.mutate();
    }
  };

  const copyPromotionCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Promotion code copied to clipboard');
  };

  const getPromotionStatus = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (!promotion.isActive) {
      return { label: 'Inactive', color: 'gray' };
    }
    if (now < startDate) {
      return { label: 'Scheduled', color: 'blue' };
    }
    if (now > endDate) {
      return { label: 'Expired', color: 'red' };
    }
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return { label: 'Limit Reached', color: 'orange' };
    }
    return { label: 'Active', color: 'green' };
  };

  const getPromotionTypeLabel = (type) => {
    const types = {
      percentage: 'Percentage Discount',
      fixed_amount: 'Fixed Amount Discount',
      free_shipping: 'Free Shipping',
      buy_x_get_y: 'Buy X Get Y'
    };
    return types[type] || type;
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors[status.color]}`}>
        {status.label}
      </span>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!promotion) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Promotion not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">The promotion you're looking for doesn't exist.</p>
        <Link to="/promotions" className="btn btn-primary mt-4">
          Back to Promotions
        </Link>
      </div>
    );
  }

  const status = getPromotionStatus(promotion);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/promotions')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {promotion.name}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <StatusBadge status={status} />
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">
                  {promotion.code}
                </code>
                <button
                  onClick={() => copyPromotionCode(promotion.code)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => togglePromotionMutation.mutate(!promotion.isActive)}
            className={`btn ${promotion.isActive ? 'btn-secondary' : 'btn-primary'}`}
            disabled={togglePromotionMutation.isLoading}
          >
            {promotion.isActive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {promotion.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <Link to={`/promotions/${id}/edit`} className="btn btn-secondary">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
            disabled={deletePromotionMutation.isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Promotion Details */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Promotion Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {getPromotionTypeLabel(promotion.type)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Value</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {promotion.type === 'percentage' 
                    ? `${promotion.value}%`
                    : promotion.type === 'fixed_amount'
                    ? formatCurrency(promotion.value)
                    : promotion.type === 'buy_x_get_y'
                    ? `Buy ${promotion.buyQuantity} Get ${promotion.getQuantity}`
                    : 'Free Shipping'
                  }
                </p>
              </div>

              {promotion.minOrderAmount > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Minimum Order Amount
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(promotion.minOrderAmount)}
                  </p>
                </div>
              )}

              {promotion.maxDiscountAmount && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Maximum Discount
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(promotion.maxDiscountAmount)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Start Date
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatDate(promotion.startDate)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  End Date
                </label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatDate(promotion.endDate)}
                </p>
              </div>
            </div>

            {promotion.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Description
                </label>
                <p className="text-gray-900 dark:text-white">
                  {promotion.description}
                </p>
              </div>
            )}
          </div>

          {/* Usage Limits */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Usage Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Usage
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {promotion.usageCount || 0}
                  {promotion.usageLimit && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      / {promotion.usageLimit}
                    </span>
                  )}
                </p>
                {promotion.usageLimit && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((promotion.usageCount / promotion.usageLimit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {promotion.usageLimitPerCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Per Customer Limit
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {promotion.usageLimitPerCustomer}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <div className="mt-2">
                  <StatusBadge status={status} />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <BarChart3 className="h-5 w-5 inline mr-2" />
                Performance Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Orders
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.analytics.totalUsage}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Revenue
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(analytics.analytics.totalRevenue)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Discount Given
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(analytics.analytics.totalDiscount)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Avg Order Value
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(analytics.analytics.averageOrderValue)}
                  </p>
                </div>
              </div>

              {/* Customer Breakdown */}
              {Object.keys(analytics.analytics.customerBreakdown).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Customer Group Usage
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analytics.analytics.customerBreakdown).map(([group, count]) => (
                      <div key={group} className="text-center">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{count}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{group}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={() => copyPromotionCode(promotion.code)}
                className="w-full btn btn-secondary text-left"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Promotion Code
              </button>
              
              <Link to={`/promotions/${id}/edit`} className="w-full btn btn-secondary">
                <Edit className="h-4 w-4 mr-2" />
                Edit Promotion
              </Link>
              
              <button
                onClick={() => togglePromotionMutation.mutate(!promotion.isActive)}
                className={`w-full btn ${promotion.isActive ? 'btn-secondary' : 'btn-primary'}`}
                disabled={togglePromotionMutation.isLoading}
              >
                {promotion.isActive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {promotion.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>

          {/* Applicable Products */}
          {promotion.applicableProducts?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Applicable Products
              </h2>
              <div className="space-y-2">
                {promotion.applicableProducts.map((product) => (
                  <div key={product._id} className="text-sm text-gray-600 dark:text-gray-400">
                    {product.name} - {product.brand}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applicable Categories */}
          {promotion.applicableCategories?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Applicable Categories
              </h2>
              <div className="flex flex-wrap gap-2">
                {promotion.applicableCategories.map((category) => (
                  <span 
                    key={category}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Customer Groups */}
          {promotion.applicableCustomerGroups?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Customer Groups
              </h2>
              <div className="flex flex-wrap gap-2">
                {promotion.applicableCustomerGroups.map((group) => (
                  <span 
                    key={group}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm rounded capitalize"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionDetail;
