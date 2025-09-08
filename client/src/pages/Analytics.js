import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  RefreshCw,
  Bell,
  Activity,
  Eye,
  Clock,
  Zap
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const queryClient = useQueryClient();

  const getStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(period));
    return date.toISOString();
  };

  // Overview data - always fetch for dashboard
  const { data: overviewData, isLoading: overviewLoading } = useQuery(
    ['analytics-overview'],
    () => api.get('/analytics/dashboard').then(res => res.data),
    { 
      refetchInterval: 60000, // Refresh every minute for overview
      staleTime: 30000, // Consider data stale after 30 seconds
      onSuccess: (data) => {
        setLastRefresh(new Date());
        checkForAlerts(data);
      }
    }
  );

  const { data: salesData, isLoading: salesLoading } = useQuery(
    ['analytics-sales', period],
    () => api.get(`/analytics/sales?startDate=${getStartDate()}&endDate=${new Date().toISOString()}&groupBy=day`).then(res => res.data),
    { 
      enabled: activeTab === 'sales',
      refetchInterval: 180000, // Refresh every 3 minutes
      staleTime: 120000 // Consider data stale after 2 minutes
    }
  );

  const { data: productData, isLoading: productLoading } = useQuery(
    ['analytics-products', period],
    () => api.get(`/analytics/products?startDate=${getStartDate()}&endDate=${new Date().toISOString()}`).then(res => res.data),
    { 
      enabled: activeTab === 'products',
      refetchInterval: 300000,
      staleTime: 240000
    }
  );

  const { data: customerData, isLoading: customerLoading } = useQuery(
    ['analytics-customers', period],
    () => api.get(`/analytics/customers?startDate=${getStartDate()}&endDate=${new Date().toISOString()}`).then(res => res.data),
    { 
      enabled: activeTab === 'customers',
      refetchInterval: 300000,
      staleTime: 240000
    }
  );

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery(
    ['analytics-inventory'],
    () => api.get('/analytics/inventory').then(res => res.data),
    { 
      enabled: activeTab === 'inventory',
      refetchInterval: 120000, // Refresh every 2 minutes for inventory
      staleTime: 60000 // Consider data stale after 1 minute
    }
  );

  // Real-time alerts checker
  const checkForAlerts = (data) => {
    const newNotifications = [];
    
    if (data.lowStockCount > 0) {
      newNotifications.push({
        id: 'low-stock',
        type: 'warning',
        message: `${data.lowStockCount} products are running low on stock`,
        timestamp: new Date()
      });
    }
    
    if (data.overduePayments > 0) {
      newNotifications.push({
        id: 'overdue-payments',
        type: 'error',
        message: `${data.overduePayments} customers have overdue payments`,
        timestamp: new Date()
      });
    }
    
    if (data.todayOrders > data.yesterdayOrders * 1.5) {
      newNotifications.push({
        id: 'high-orders',
        type: 'success',
        message: 'Orders are 50% higher than yesterday!',
        timestamp: new Date()
      });
    }
    
    setNotifications(prev => {
      const existing = prev.map(n => n.id);
      const filtered = newNotifications.filter(n => !existing.includes(n.id));
      return [...prev, ...filtered].slice(-5); // Keep only last 5 notifications
    });
  };

  // Manual refresh function
  const handleRefresh = () => {
    queryClient.invalidateQueries(['analytics-overview']);
    queryClient.invalidateQueries(['analytics-sales']);
    queryClient.invalidateQueries(['analytics-products']);
    queryClient.invalidateQueries(['analytics-customers']);
    queryClient.invalidateQueries(['analytics-inventory']);
    toast.success('Data refreshed successfully!');
  };

  // Auto-dismiss notifications
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => 
        prev.filter(n => Date.now() - n.timestamp.getTime() < 300000) // Remove after 5 minutes
      );
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const MetricCard = ({ title, value, icon: Icon, color = 'blue', trend, subtitle, isLoading = false }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          {isLoading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
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

  const NotificationBadge = ({ notification, onDismiss }) => {
    const getColorClasses = (type) => {
      switch (type) {
        case 'success': return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
        case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
        case 'error': return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
        default: return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
      }
    };

    return (
      <div className={`p-3 rounded-lg border ${getColorClasses(notification.type)} flex items-center justify-between`}>
        <div className="flex items-center">
          <Bell className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    );
  };

  const ChartCard = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );

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

  if (salesLoading || productLoading || customerLoading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Activity className="h-6 w-6 mr-2 text-primary" />
            {t('analytics.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {formatDate(lastRefresh)} • Auto-refresh enabled
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationBadge
              key={notification.id}
              notification={notification}
              onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <TabButton
          id="overview"
          label="Overview"
          active={activeTab === 'overview'}
          onClick={setActiveTab}
        />
        <TabButton
          id="sales"
          label={t('analytics.salesMetrics')}
          active={activeTab === 'sales'}
          onClick={setActiveTab}
        />
        <TabButton
          id="products"
          label={t('analytics.productPerformance')}
          active={activeTab === 'products'}
          onClick={setActiveTab}
        />
        <TabButton
          id="customers"
          label={t('analytics.customerInsights')}
          active={activeTab === 'customers'}
          onClick={setActiveTab}
        />
        <TabButton
          id="inventory"
          label={t('analytics.inventoryIntelligence')}
          active={activeTab === 'inventory'}
          onClick={setActiveTab}
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : overviewData ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Today's Revenue"
                  value={formatCurrency(overviewData.todayRevenue || 0)}
                  icon={DollarSign}
                  color="green"
                  trend={overviewData.revenueTrend}
                  subtitle={`${overviewData.todayOrders || 0} orders today`}
                  isLoading={overviewLoading}
                />
                <MetricCard
                  title="Active Customers"
                  value={overviewData.activeCustomers || 0}
                  icon={Users}
                  color="blue"
                  trend={overviewData.customerTrend}
                  subtitle={`${overviewData.newCustomersToday || 0} new today`}
                  isLoading={overviewLoading}
                />
                <MetricCard
                  title="Low Stock Alerts"
                  value={overviewData.lowStockCount || 0}
                  icon={AlertTriangle}
                  color="yellow"
                  subtitle="Requires attention"
                  isLoading={overviewLoading}
                />
                <MetricCard
                  title="Pending Payments"
                  value={formatCurrency(overviewData.pendingPayments || 0)}
                  icon={Clock}
                  color="red"
                  subtitle={`${overviewData.overduePayments || 0} overdue`}
                  isLoading={overviewLoading}
                />
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Quick Actions">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">View Reports</p>
                    </button>
                    <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Package className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900 dark:text-green-300">Stock Check</p>
                    </button>
                    <button className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                      <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">Alerts</p>
                    </button>
                    <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Analytics</p>
                    </button>
                  </div>
                </ChartCard>

                <ChartCard title="Recent Activity">
                  <div className="space-y-3">
                    {overviewData.recentActivity?.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                            <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                          </div>
                        </div>
                        <Zap className="h-4 w-4 text-gray-400" />
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </ChartCard>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {salesLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : salesData ? (
            <>
              {/* Sales Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Total Revenue"
                  value={formatCurrency(salesData.summary.totalRevenue)}
                  icon={DollarSign}
                  color="green"
                />
                <MetricCard
                  title="Total Orders"
                  value={salesData.summary.totalOrders}
                  icon={ShoppingCart}
                  color="blue"
                />
                <MetricCard
                  title="Average Order Value"
                  value={formatCurrency(salesData.summary.averageOrderValue)}
                  icon={BarChart3}
                  color="purple"
                />
              </div>

              {/* Sales Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Sales Trend">
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mb-2" />
                    <p>Sales trend chart would go here</p>
                  </div>
                </ChartCard>

                <ChartCard title="Payment Methods">
                  <div className="space-y-3">
                    {salesData.paymentBreakdown.map((payment) => (
                      <div key={payment._id} className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white">{payment._id}</span>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(payment.revenue)}</p>
                          <p className="text-sm text-gray-500">{payment.count} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {productLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : productData ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <ChartCard title={t('analytics.topSellingProducts')}>
                  <div className="space-y-3">
                    {productData.productPerformance.slice(0, 10).map((product, index) => (
                      <div key={product._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center mr-3">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.brand}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(product.totalRevenue)}
                          </p>
                          <p className="text-sm text-gray-500">{product.totalQuantitySold} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {/* Slow Moving Products */}
                <ChartCard title={t('analytics.slowMovingProducts')}>
                  <div className="space-y-3">
                    {productData.slowMovingProducts.map((product) => (
                      <div key={product._id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-orange-600">{product.stockQuantity} in stock</p>
                          <p className="text-sm text-gray-500">
                            Last sold: {product.lastSoldDate ? formatDate(product.lastSoldDate) : 'Never'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {customerLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : customerData ? (
            <>
              {/* Customer Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title={t('analytics.newCustomers')}
                  value={customerData.customerRetention.newCustomers}
                  icon={Users}
                  color="green"
                />
                <MetricCard
                  title={t('analytics.returningCustomers')}
                  value={customerData.customerRetention.returningCustomers}
                  icon={Users}
                  color="blue"
                />
                <MetricCard
                  title="Total Customers"
                  value={customerData.customerRetention.totalCustomers}
                  icon={Users}
                  color="purple"
                />
              </div>

              {/* Top Customers */}
              <ChartCard title={t('analytics.topCustomers')}>
                <div className="space-y-3">
                  {customerData.topCustomers.slice(0, 10).map((customer, index) => (
                    <div key={customer._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(customer.totalRevenue)}
                        </p>
                        <p className="text-sm text-gray-500">{customer.orderCount} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>
          ) : null}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {inventoryLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : inventoryData ? (
            <>
              {/* Inventory Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title={t('analytics.lowStockAlerts')}
                  value={inventoryData.summary.totalLowStock}
                  icon={AlertTriangle}
                  color="yellow"
                />
                <MetricCard
                  title={t('analytics.overstockItems')}
                  value={inventoryData.summary.totalOverstock}
                  icon={Package}
                  color="red"
                />
                <MetricCard
                  title="Total Stock Value"
                  value={formatCurrency(inventoryData.summary.totalStockValue)}
                  icon={DollarSign}
                  color="green"
                />
              </div>

              {/* Inventory Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Low Stock Products">
                  <div className="space-y-3">
                    {inventoryData.lowStockProducts.slice(0, 10).map((product) => (
                      <div key={product._id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-yellow-600">{product.stockQuantity} left</p>
                          <p className="text-sm text-gray-500">Reorder at: {product.reorderLevel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                <ChartCard title="Stock Turnover Analysis">
                  <div className="space-y-3">
                    {inventoryData.stockTurnover.slice(0, 10).map((product) => (
                      <div key={product._id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {product.turnoverRate.toFixed(2)}x
                          </p>
                          <p className="text-sm text-gray-500">{product.stockQuantity} in stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Analytics;
