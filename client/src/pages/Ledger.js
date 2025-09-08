import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Plus, 
  Search, 
  Eye, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Receipt
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Ledger = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: ledgerSummary, isLoading: summaryLoading } = useQuery(
    'ledger-summary',
    () => api.get('/ledger/summary').then(res => res.data)
  );

  const { data: overdueCustomers, isLoading: overdueLoading } = useQuery(
    'overdue-customers',
    () => api.get('/ledger/overdue').then(res => res.data)
  );

  const { data: customers } = useQuery(
    'customers-for-ledger',
    () => api.get('/customers?limit=100&isActive=true').then(res => res.data.customers)
  );

  const { data: customerLedger, isLoading: ledgerLoading } = useQuery(
    ['customer-ledger', selectedCustomer],
    () => selectedCustomer ? api.get(`/ledger/customer/${selectedCustomer}`).then(res => res.data) : null,
    { enabled: !!selectedCustomer && activeTab === 'customer' }
  );

  const recordPaymentMutation = useMutation(
    (paymentData) => api.post('/ledger/payment', paymentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ledger-summary');
        queryClient.invalidateQueries('overdue-customers');
        queryClient.invalidateQueries(['customer-ledger', selectedCustomer]);
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentReference('');
        setPaymentNotes('');
        toast.success(t('messages.success.paymentRecorded'));
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || t('messages.error.somethingWentWrong'));
      },
    }
  );

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) {
      toast.error(t('messages.error.requiredFields'));
      return;
    }

    recordPaymentMutation.mutate({
      customer: selectedCustomer,
      amount: parseFloat(paymentAmount),
      paymentMethod,
      paymentReference,
      description: `Payment received - ${paymentMethod}${paymentReference ? ` (Ref: ${paymentReference})` : ''}`,
      notes: paymentNotes
    });
  };

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );

  const MetricCard = ({ title, value, icon: Icon, color = 'blue', trend }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('ledger.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('ledger.subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('ledger.recordPayment')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          id="overview"
          label="Overview"
          active={activeTab === 'overview'}
          onClick={setActiveTab}
        />
        <TabButton
          id="overdue"
          label={t('ledger.overdueCustomers')}
          active={activeTab === 'overdue'}
          onClick={setActiveTab}
        />
        <TabButton
          id="customer"
          label={t('ledger.customerLedger')}
          active={activeTab === 'customer'}
          onClick={setActiveTab}
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {summaryLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : ledgerSummary ? (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title={t('ledger.totalReceivables')}
                  value={formatCurrency(ledgerSummary.totalReceivables)}
                  icon={DollarSign}
                  color="green"
                />
                <MetricCard
                  title={t('ledger.totalOverdue')}
                  value={formatCurrency(ledgerSummary.totalOverdue)}
                  icon={AlertTriangle}
                  color="red"
                />
                <MetricCard
                  title="Payments Received"
                  value={formatCurrency(ledgerSummary.paymentsReceived.totalPayments)}
                  icon={Receipt}
                  color="blue"
                />
                <MetricCard
                  title="Credit Sales"
                  value={formatCurrency(ledgerSummary.creditSales.totalCreditSales)}
                  icon={CreditCard}
                  color="purple"
                />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Payment Activity (Last {ledgerSummary.period} days)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Payments</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ledgerSummary.paymentsReceived.paymentCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Credit Sales</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ledgerSummary.creditSales.creditSaleCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Collection Rate</span>
                      <span className="font-medium text-green-600">
                        {ledgerSummary.creditSales.totalCreditSales > 0 
                          ? ((ledgerSummary.paymentsReceived.totalPayments / ledgerSummary.creditSales.totalCreditSales) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveTab('overdue')}
                      className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                        <span className="font-medium text-red-900 dark:text-red-100">View Overdue</span>
                      </div>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(ledgerSummary.totalOverdue)}
                      </span>
                    </button>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full flex items-center justify-center p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Record New Payment
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Overdue Tab */}
      {activeTab === 'overdue' && (
        <div className="space-y-6">
          {overdueLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : overdueCustomers?.overdueCustomers?.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('ledger.overdueCustomers')} ({overdueCustomers.count})
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Total overdue amount: {formatCurrency(overdueCustomers.totalOverdue)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs text-gray-700 dark:text-gray-400 uppercase">
                    <tr>
                      <th scope="col" className="px-6 py-3">Customer</th>
                      <th scope="col" className="px-6 py-3">Overdue Amount</th>
                      <th scope="col" className="px-6 py-3">Oldest Due Date</th>
                      <th scope="col" className="px-6 py-3">Transactions</th>
                      <th scope="col" className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueCustomers.overdueCustomers.map((customer) => (
                      <tr key={customer._id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {customer.customerName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.customerPhone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-red-600">
                            {formatCurrency(customer.totalOverdue)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 dark:text-white">
                            {formatDate(customer.oldestDueDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 dark:text-white">
                            {customer.transactionCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer._id);
                                setActiveTab('customer');
                              }}
                              className="text-gray-400 hover:text-primary"
                              title="View Ledger"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer._id);
                                setShowPaymentModal(true);
                              }}
                              className="text-gray-400 hover:text-green-500"
                              title="Record Payment"
                            >
                              <Receipt className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No overdue customers</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All customers are up to date with their payments.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Customer Ledger Tab */}
      {activeTab === 'customer' && (
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose a customer</option>
                  {customers?.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>
              {selectedCustomer && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn btn-primary mt-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </button>
              )}
            </div>
          </div>

          {/* Customer Ledger Details */}
          {selectedCustomer && (
            <>
              {ledgerLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : customerLedger ? (
                <>
                  {/* Customer Summary */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {customerLedger.customer.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customerLedger.customer.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Balance</p>
                        <p className={`text-2xl font-bold ${
                          customerLedger.customer.currentBalance > 0 
                            ? 'text-red-600' 
                            : customerLedger.customer.currentBalance < 0 
                            ? 'text-green-600' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {formatCurrency(Math.abs(customerLedger.customer.currentBalance))}
                          {customerLedger.customer.currentBalance > 0 && ' (Due)'}
                          {customerLedger.customer.currentBalance < 0 && ' (Advance)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Credit Limit</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(customerLedger.customer.creditLimit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Credit</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(Math.max(0, customerLedger.customer.creditLimit - customerLedger.customer.currentBalance))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Entries */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Transaction History
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs text-gray-700 dark:text-gray-400 uppercase">
                          <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3">Description</th>
                            <th scope="col" className="px-6 py-3">Amount</th>
                            <th scope="col" className="px-6 py-3">Balance</th>
                            <th scope="col" className="px-6 py-3">Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerLedger.ledgerEntries.map((entry) => (
                            <tr key={entry._id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                              <td className="px-6 py-4">
                                {formatDate(entry.createdAt, 'withTime')}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  entry.transactionType === 'credit_sale' 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                    : entry.transactionType === 'payment'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                }`}>
                                  {entry.transactionType.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-gray-900 dark:text-white">{entry.description}</p>
                                  {entry.order && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Order: #{entry.order.orderNumber}
                                    </p>
                                  )}
                                  {entry.paymentMethod && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Method: {entry.paymentMethod}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-medium ${
                                  entry.amount > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {entry.amount > 0 ? '+' : ''}{formatCurrency(entry.amount)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-medium ${
                                  entry.balance > 0 ? 'text-red-600' : entry.balance < 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {formatCurrency(entry.balance)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {entry.dueDate ? (
                                  <span className={entry.isOverdue ? 'text-red-600 font-medium' : 'text-gray-900 dark:text-white'}>
                                    {formatDate(entry.dueDate)}
                                    {entry.isOverdue && ' (Overdue)'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('ledger.recordPayment')}
              </h3>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers?.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} ({customer.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input w-full"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input w-full"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="input w-full"
                    placeholder="Transaction ID, Cheque number, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="input w-full"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="btn btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={recordPaymentMutation.isLoading}
                    className="btn btn-primary"
                  >
                    {recordPaymentMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      t('common.save')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
