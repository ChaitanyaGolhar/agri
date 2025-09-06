import React from 'react';
import { useQuery } from 'react-query';
import { api } from '../utils/api';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery(
    'dashboard-overview',
    () => api.get('/dashboard/overview').then(res => res.data)
  );

  const { data: salesData, isLoading: salesLoading } = useQuery(
    'dashboard-sales-chart',
    () => api.get('/dashboard/sales-chart?period=30&groupBy=day').then(res => res.data)
  );

  const { data: topProducts, isLoading: productsLoading } = useQuery(
    'dashboard-top-products',
    () => api.get('/dashboard/top-products?period=30&limit=5').then(res => res.data)
  );

  const { data: lowStockAlerts, isLoading: alertsLoading } = useQuery(
    'dashboard-low-stock-alerts',
    () => api.get('/dashboard/low-stock-alerts').then(res => res.data)
  );

  const { data: recentOrders, isLoading: ordersLoading } = useQuery(
    'dashboard-recent-orders',
    () => api.get('/dashboard/recent-orders?limit=5').then(res => res.data)
  );

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Customers',
      value: overview?.customers?.total || 0,
      change: `+${overview?.customers?.new || 0} this month`,
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Total Products',
      value: overview?.products?.total || 0,
      change: `${overview?.products?.lowStock || 0} low stock`,
      changeType: overview?.products?.lowStock > 0 ? 'negative' : 'neutral',
      icon: Package,
    },
    {
      name: 'Total Orders',
      value: overview?.orders?.total || 0,
      change: `${overview?.orders?.pending || 0} pending`,
      changeType: overview?.orders?.pending > 0 ? 'warning' : 'neutral',
      icon: ShoppingCart,
    },
    {
      name: 'Total Revenue',
      value: `₹${(overview?.revenue?.total || 0).toLocaleString()}`,
      change: `Avg: ₹${Math.round(overview?.revenue?.average || 0)}`,
      changeType: 'positive',
      icon: DollarSign,
    },
  ];

  // const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your agribusiness performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon
                    className={`h-8 w-8 ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : stat.changeType === 'warning'
                        ? 'text-yellow-600'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center text-sm">
                  <span
                    className={`${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : stat.changeType === 'warning'
                        ? 'text-yellow-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales Overview (Last 30 Days)</h3>
            <p className="card-description">Daily sales performance</p>
          </div>
          <div className="card-content">
            {salesLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id.day" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Bar dataKey="totalSales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Selling Products</h3>
            <p className="card-description">Best performers this month</p>
          </div>
          <div className="card-content">
            {productsLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts?.slice(0, 5).map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.productBrand} • {product.productCategory}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {product.totalQuantity} sold
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹{product.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              Low Stock Alerts
            </h3>
            <p className="card-description">Products needing restocking</p>
          </div>
          <div className="card-content">
            {alertsLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : lowStockAlerts?.length > 0 ? (
              <div className="space-y-3">
                {lowStockAlerts.slice(0, 5).map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.brand} • {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {product.stockQuantity} left
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {product.minimumStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No low stock alerts
              </p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="card-title">Recent Orders</h3>
            <p className="card-description">Latest customer orders</p>
          </div>
          <div className="card-content">
            {ordersLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : recentOrders?.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.customer?.name} • {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
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
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent orders
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
