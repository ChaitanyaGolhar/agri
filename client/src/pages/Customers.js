import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Plus, Search, Edit, Trash2, Users, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// --- NEW: Helper function for styling business type badges ---
const getBusinessTypeBadgeClass = (businessType) => {
    switch (businessType) {
        case 'Farmer': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case 'Retailer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case 'Wholesaler': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
        case 'Cooperative': return 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const Customers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [businessTypeFilter, setBusinessTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const queryClient = useQueryClient();

    const { data: customersData, isLoading, refetch } = useQuery(
        ['customers', currentPage, searchTerm, businessTypeFilter],
        () => api.get('/customers', {
            params: {
                page: currentPage,
                limit: 10,
                search: searchTerm,
                businessType: businessTypeFilter,
                isActive: true
            }
        }).then(res => res.data),
        { refetchOnWindowFocus: false }
    );

    const deleteCustomerMutation = useMutation(
        (customerId) => api.delete(`/customers/${customerId}`),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('customers');
                toast.success('Customer deactivated successfully');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to deactivate customer');
            },
        }
    );

    const handleDelete = (customerId) => {
        // In a real app, you'd use a styled modal instead of window.confirm
        if (window.confirm('Are you sure you want to deactivate this customer?')) {
            deleteCustomerMutation.mutate(customerId);
        }
    };

    const businessTypeOptions = [
        { value: '', label: 'All Types' },
        { value: 'Farmer', label: 'Farmer' },
        { value: 'Retailer', label: 'Retailer' },
        { value: 'Wholesaler', label: 'Wholesaler' },
        { value: 'Cooperative', label: 'Cooperative' },
        { value: 'Other', label: 'Other' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your customer database
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button onClick={() => refetch()} className="btn btn-outline" disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <Link to="/customers/new" className="btn btn-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Link>
                </div>
            </div>

            {/* --- MODIFIED: Main container for filters and table --- */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-4 border-b dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input pl-10 w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <select
                                value={businessTypeFilter}
                                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                                className="input w-full"
                            >
                                {businessTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-700 dark:text-gray-400 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Customer</th>
                                <th scope="col" className="px-6 py-3">Contact</th>
                                <th scope="col" className="px-6 py-3">Business Type</th>
                                <th scope="col" className="px-6 py-3">Total Spent</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-12"><LoadingSpinner size="lg" /></td></tr>
                            ) : customersData?.customers?.length > 0 ? (
                                customersData.customers.map((customer) => (
                                    <tr key={customer._id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {customer.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            <div>{customer.phone}</div>
                                            {customer.email && <div className="text-xs">{customer.email}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBusinessTypeBadgeClass(customer.businessType)}`}>
                                                {customer.businessType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            ₹{customer.totalPurchases?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-3">
                                                <Link to={`/customers/${customer._id}/edit`} className="text-gray-400 hover:text-blue-500" title="Edit Customer">
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button onClick={() => handleDelete(customer._id)} className="text-gray-400 hover:text-red-500" title="Deactivate Customer">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="text-center py-12">
                                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No customers found</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or add a new customer.</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {customersData?.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(currentPage * 10, customersData.total)}</span> of <span className="font-medium">{customersData.total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(customersData.totalPages, currentPage + 1))}
                                    disabled={currentPage === customersData.totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
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

export default Customers;
