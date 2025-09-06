import React from 'react';
import { Printer, Download } from 'lucide-react';

const InvoiceGenerator = ({ order, onPrint, onDownload }) => {
  if (!order) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Invoice Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-gray-600 mt-2">
              Invoice #: {order.invoiceNumber || order.orderNumber}
            </p>
            <p className="text-gray-600">
              Date: {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">AgriBusiness Manager</h2>
            <p className="text-gray-600">Agricultural Supplies</p>
            <p className="text-gray-600">India</p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
          <p className="text-gray-900 font-medium">{order.customer?.name}</p>
          <p className="text-gray-600">{order.customer?.phone}</p>
          {order.customer?.email && (
            <p className="text-gray-600">{order.customer.email}</p>
          )}
          {order.deliveryAddress && (
            <div className="mt-2">
              <p className="text-gray-600">{order.deliveryAddress.street}</p>
              <p className="text-gray-600">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}
              </p>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Details:</h3>
          <p className="text-gray-600">Order #: {order.orderNumber}</p>
          <p className="text-gray-600">Status: {order.orderStatus}</p>
          <p className="text-gray-600">Payment: {order.paymentMethod}</p>
          {order.deliveryDate && (
            <p className="text-gray-600">Delivery: {formatDate(order.deliveryDate)}</p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pack Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.product?.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.product?.packSize?.value} {item.product?.packSize?.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-end">
          <div className="w-64">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-gray-900">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Payment Information</h4>
        <p className="text-sm text-gray-600">
          Payment Method: {order.paymentMethod}
        </p>
        <p className="text-sm text-gray-600">
          Payment Status: {order.paymentStatus}
        </p>
        {order.notes && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <strong>Notes:</strong> {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={onPrint}
          className="btn btn-outline flex items-center"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </button>
        <button
          onClick={onDownload}
          className="btn btn-primary flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default InvoiceGenerator;



