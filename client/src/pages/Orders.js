import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Plus, Search, Eye, Trash2, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Helper function for styling order status badges with dark mode support
const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'Delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
        case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
        case 'Confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        case 'Processing': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
        case 'Shipped': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
        case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
};

// Helper function for styling payment status badges with dark mode support
const getPaymentStatusBadgeClass = (status) => {
    switch(status) {
        case 'Paid': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
        case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
        case 'Partially Paid': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        case 'Failed': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
        case 'Refunded': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
}

const Orders = () => {
    const [orderSearch, setOrderSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const queryClient = useQueryClient();

    const { data: ordersData, isLoading } = useQuery(
        ['orders', currentPage, statusFilter, paymentStatusFilter, orderSearch],
        () => api.get('/orders', {
            params: {
                page: currentPage,
                limit: 10,
                status: statusFilter,
                paymentStatus: paymentStatusFilter,
                search: orderSearch,
            }
        }).then(res => res.data)
    );
    
    // --- FIX: Removed the useEffect causing race conditions ---

    const cancelOrderMutation = useMutation(
        (orderId) => api.delete(`/orders/${orderId}`),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('orders');
                toast.success('Order cancelled successfully');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to cancel order');
            },
        }
    );

    const handleCancel = (orderId) => {
        if (window.confirm('Are you sure you want to cancel this order?')) {
            cancelOrderMutation.mutate(orderId);
        }
    };

    // --- FIX: Handlers to reset page on filter change ---
    const handleSearchChange = (e) => {
        setOrderSearch(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const handlePaymentStatusChange = (e) => {
        setPaymentStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Confirmed', label: 'Confirmed' },
        { value: 'Processing', label: 'Processing' },
        { value: 'Shipped', label: 'Shipped' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Cancelled', label: 'Cancelled' },
    ];

    const paymentStatusOptions = [
        { value: '', label: 'All Payment' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Paid', label: 'Paid' },
        { value: 'Partially Paid', label: 'Partially Paid' },
        { value: 'Failed', label: 'Failed' },
        { value: 'Refunded', label: 'Refunded' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage customer orders and track fulfillment
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link to="/cart" className="btn btn-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                    </Link>
                </div>
            </div>

            {/* Main container for filters and table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID or Customer..."
                                    value={orderSearch}
                                    onChange={handleSearchChange} // Use new handler
                                    className="input pl-10 w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <select value={statusFilter} onChange={handleStatusChange} className="input w-full"> {/* Use new handler */}
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select value={paymentStatusFilter} onChange={handlePaymentStatusChange} className="input w-full"> {/* Use new handler */}
                                {paymentStatusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs text-gray-700 dark:text-gray-400 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Order</th>
                                <th scope="col" className="px-6 py-3">Customer</th>
                                <th scope="col" className="px-6 py-3">Total</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Payment</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-12"><LoadingSpinner size="lg" /></td></tr>
                            ) : ordersData?.orders?.length > 0 ? (
                                ordersData.orders.map((order) => (
                                    <tr key={order._id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-300">{order.customer?.name}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">₹{order.totalAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.orderStatus)}`}>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-3">
                                                <Link to={`/orders/${order._id}`} className="text-gray-400 hover:text-primary" title="View Order">
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                                                    <button onClick={() => handleCancel(order._id)} className="text-gray-400 hover:text-red-500" title="Cancel Order">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="text-center py-12">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No orders found</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new order.</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {ordersData?.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 px-4 py-3 sm:px-6">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(currentPage * 10, ordersData.total)}</span> of <span className="font-medium">{ordersData.total}</span> results
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
                                    onClick={() => setCurrentPage(Math.min(ordersData.totalPages, currentPage + 1))}
                                    disabled={currentPage === ordersData.totalPages}
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

export default Orders;

