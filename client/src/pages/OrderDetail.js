import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, Package, User, Receipt } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import InvoiceGenerator from '../components/InvoiceGenerator';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showInvoice, setShowInvoice] = useState(false);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery(
    ['order', id],
    () => api.get(`/orders/${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  );

  const updateStatusMutation = useMutation(
    ({ orderStatus, paymentStatus }) =>
      api.put(`/orders/${id}/status`, { orderStatus, paymentStatus }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        toast.success('Order status updated successfully');
      },
      onError: () => {
        toast.error('Failed to update order status');
      },
    }
  );

  const handleStatusUpdate = (newStatus, type) => {
    if (type === 'order') {
      updateStatusMutation.mutate({ orderStatus: newStatus });
    } else {
      updateStatusMutation.mutate({ paymentStatus: newStatus });
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    // Generate PDF download
    const element = document.getElementById('invoice-content');
    if (element) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order?.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice-header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
              .invoice-title { font-size: 24px; font-weight: bold; }
              .invoice-details { display: flex; justify-content: space-between; }
              .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .invoice-table th { background-color: #f2f2f2; }
              .invoice-total { text-align: right; margin-top: 20px; }
              .invoice-total .total { font-size: 18px; font-weight: bold; }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Order not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The order you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link to="/orders" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'items', name: 'Order Items' },
    { id: 'customer', name: 'Customer Info' },
    { id: 'invoice', name: 'Invoice' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-purple-100 text-purple-800';
      case 'Shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/orders"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500">
              {order.invoiceNumber && `Invoice: ${order.invoiceNumber} • `}
              Created on {new Date(order.createdAt).toLocaleDateString()}
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

      {/* Order Status Cards */}
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
                    Total Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₹{order.totalAmount.toLocaleString()}
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
                    Items
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {order.items.length}
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
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Order Status
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
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
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Payment Status
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentStatus === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Controls */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Update Status</h3>
          <p className="card-description">Manage order and payment status</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <div className="flex space-x-2">
                {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status, 'order')}
                    disabled={updateStatusMutation.isLoading}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      order.orderStatus === status
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <div className="flex space-x-2">
                {['Pending', 'Paid', 'Partially Paid', 'Failed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status, 'payment')}
                    disabled={updateStatusMutation.isLoading}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      order.paymentStatus === status
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
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
            {/* Order Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Order Summary</h3>
              </div>
              <div className="card-content space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{order.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tax</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₹{order.taxAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Discount</span>
                  <span className="text-sm font-medium text-gray-900">
                    -₹{order.discountAmount.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">Total</span>
                    <span className="text-base font-medium text-gray-900">
                      ₹{order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Payment Method</span>
                    <span className="text-sm font-medium text-gray-900">
                      {order.paymentMethod}
                    </span>
                  </div>
                  {order.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Delivery Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Order Details</h3>
              </div>
              <div className="card-content space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Order Number</p>
                  <p className="text-sm text-gray-500">{order.orderNumber}</p>
                </div>
                {order.invoiceNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Invoice Number</p>
                    <p className="text-sm text-gray-500">{order.invoiceNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Created Date</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                {order.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Notes</p>
                    <p className="text-sm text-gray-500">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Order Items</h3>
              <p className="card-description">Products in this order</p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {item.product.brand} • {item.product.packSize.value} {item.product.packSize.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {item.quantity} × ₹{item.unitPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          = ₹{item.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Customer Information</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{order.customer.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{order.customer.businessType}</span>
                    </div>
                    {order.customer.phone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{order.customer.phone}</span>
                      </div>
                    )}
                    {order.customer.email && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{order.customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Address</h4>
                  <div className="space-y-1">
                    {order.deliveryAddress?.street && (
                      <p className="text-sm text-gray-900">{order.deliveryAddress.street}</p>
                    )}
                    <p className="text-sm text-gray-900">
                      {order.deliveryAddress?.city && `${order.deliveryAddress.city}, `}
                      {order.deliveryAddress?.state && `${order.deliveryAddress.state} `}
                      {order.deliveryAddress?.pincode && order.deliveryAddress.pincode}
                    </p>
                    {order.deliveryAddress?.landmark && (
                      <p className="text-sm text-gray-500">
                        Near {order.deliveryAddress.landmark}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Invoice
              </h3>
              <p className="card-description">Generate and print invoice for this order</p>
            </div>
            <div className="card-content">
              <div id="invoice-content">
                <InvoiceGenerator 
                  order={order} 
                  onPrint={handlePrintInvoice}
                  onDownload={handleDownloadInvoice}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
