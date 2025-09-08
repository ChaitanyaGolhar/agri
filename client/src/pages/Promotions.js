import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Tag, 
  Calendar, 
  Users, 
  TrendingUp,
  Copy,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Promotions = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: promotionsData, isLoading } = useQuery(
    ['promotions', currentPage, search, typeFilter, statusFilter],
    () => api.get('/promotions', {
      params: {
        page: currentPage,
        limit: 10,
        search,
        type: typeFilter,
        isActive: statusFilter
      }
    }).then(res => res.data)
  );

  const deletePromotionMutation = useMutation(
    (promotionId) => api.delete(`/promotions/${promotionId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('promotions');
        toast.success(t('messages.success.promotionDeleted'));
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || t('messages.error.somethingWentWrong'));
      },
    }
  );

  const handleDelete = (promotionId) => {
    if (window.confirm(t('messages.confirmation.deletePromotion'))) {
      deletePromotionMutation.mutate(promotionId);
    }
  };

  const copyPromotionCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Promotion code copied to clipboard');
  };

  const getPromotionTypeLabel = (type) => {
    const types = {
      percentage: t('promotions.types.percentage'),
      fixed_amount: t('promotions.types.fixedAmount'),
      free_shipping: t('promotions.types.freeShipping'),
      buy_x_get_y: t('promotions.types.buyXGetY')
    };
    return types[type] || type;
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

  const StatusBadge = ({ status }) => {
    const colors = {
      green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status.color]}`}>
        {status.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('promotions.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('promotions.subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/promotions/new" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            {t('promotions.addPromotion')}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search promotions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)} 
                className="input w-full"
              >
                <option value="">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
                <option value="buy_x_get_y">Buy X Get Y</option>
              </select>
            </div>
            <div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="input w-full"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Promotions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs text-gray-700 dark:text-gray-400 uppercase">
              <tr>
                <th scope="col" className="px-6 py-3">Promotion</th>
                <th scope="col" className="px-6 py-3">Code</th>
                <th scope="col" className="px-6 py-3">Type</th>
                <th scope="col" className="px-6 py-3">Value</th>
                <th scope="col" className="px-6 py-3">Usage</th>
                <th scope="col" className="px-6 py-3">Period</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <LoadingSpinner size="lg" />
                  </td>
                </tr>
              ) : promotionsData?.promotions?.length > 0 ? (
                promotionsData.promotions.map((promotion) => {
                  const status = getPromotionStatus(promotion);
                  return (
                    <tr key={promotion._id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {promotion.name}
                          </div>
                          {promotion.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {promotion.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {getPromotionTypeLabel(promotion.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {promotion.type === 'percentage' 
                            ? `${promotion.value}%`
                            : promotion.type === 'fixed_amount'
                            ? formatCurrency(promotion.value)
                            : promotion.type === 'buy_x_get_y'
                            ? `Buy ${promotion.buyQuantity} Get ${promotion.getQuantity}`
                            : 'Free Shipping'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white">
                          {promotion.usageCount || 0}
                          {promotion.usageLimit && ` / ${promotion.usageLimit}`}
                        </div>
                        {promotion.usageLimit && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min((promotion.usageCount / promotion.usageLimit) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white">
                            {formatDate(promotion.startDate)}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            to {formatDate(promotion.endDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <Link 
                            to={`/promotions/${promotion._id}`} 
                            className="text-gray-400 hover:text-primary" 
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link 
                            to={`/promotions/${promotion._id}/edit`} 
                            className="text-gray-400 hover:text-primary" 
                            title="Edit Promotion"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(promotion._id)} 
                            className="text-gray-400 hover:text-red-500" 
                            title="Delete Promotion"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <Tag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No promotions found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Get started by creating a new promotion.
                    </p>
                    <div className="mt-6">
                      <Link to="/promotions/new" className="btn btn-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('promotions.addPromotion')}
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {promotionsData?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 px-4 py-3 sm:px-6">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-400">
                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, promotionsData.total)}
                </span>{' '}
                of <span className="font-medium">{promotionsData.total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(promotionsData.totalPages, currentPage + 1))}
                  disabled={currentPage === promotionsData.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Promotions;
