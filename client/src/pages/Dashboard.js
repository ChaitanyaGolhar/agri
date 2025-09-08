import React from 'react';
import { useQuery } from 'react-query';
import { api } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  MoreHorizontal, // Added for the options icon
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Area, 
  PieChart, Pie, Cell // Added for Donut Chart
} from 'recharts';

// Custom Tooltip for the Sales Analytics Chart (no change)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-2 rounded-md shadow-lg border border-gray-700">
        <p className="text-sm">{`Day ${label}: ₹${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

// Colors for the donut chart segments
const COLORS = ['#0f172a', '#3b82f6', '#a855f7', '#f97316', '#14b8a6'];

const Dashboard = () => {
  const { isDark } = useTheme(); 
  
  // Data fetching hooks with automatic refresh
  const { data: overview, isLoading: overviewLoading } = useQuery(
    'dashboard-overview', 
    () => api.get('/dashboard/overview').then(res => res.data),
    { 
      refetchInterval: 300000, // Refresh every 5 minutes
      staleTime: 240000 // Consider data stale after 4 minutes
    }
  );
  const { data: salesData, isLoading: salesLoading } = useQuery(
    'dashboard-sales-chart', 
    () => api.get('/dashboard/sales-chart?period=30&groupBy=day').then(res => res.data),
    { 
      refetchInterval: 300000,
      staleTime: 240000
    }
  );
  const { data: topProducts, isLoading: productsLoading } = useQuery(
    'dashboard-top-products', 
    () => api.get('/dashboard/top-products?period=30&limit=5').then(res => res.data),
    { 
      refetchInterval: 300000,
      staleTime: 240000
    }
  );
  const { data: lowStockAlerts, isLoading: alertsLoading } = useQuery(
    'dashboard-low-stock-alerts', 
    () => api.get('/dashboard/low-stock-alerts').then(res => res.data),
    { 
      refetchInterval: 180000, // Refresh every 3 minutes for stock alerts
      staleTime: 120000
    }
  );
  const { data: recentOrders, isLoading: ordersLoading } = useQuery(
    'dashboard-recent-orders', 
    () => api.get('/dashboard/recent-orders?limit=5').then(res => res.data),
    { 
      refetchInterval: 120000, // Refresh every 2 minutes for recent orders
      staleTime: 60000
    }
  );

  if (overviewLoading) {
    return ( <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div> );
  }

  // Data for the 4 top cards
  const stats = [
    { name: 'Total Customers', value: (overview?.customers?.total || 0).toLocaleString(), change: `+${overview?.customers?.new || 0}`, changeType: 'positive', icon: Users, color: 'blue' },
    { name: 'Total Products', value: (overview?.products?.total || 0).toLocaleString(), change: `${overview?.products?.lowStock || 0} low`, changeType: 'negative', icon: Package, color: 'purple' },
    { name: 'Total Orders', value: (overview?.orders?.total || 0).toLocaleString(), change: `${overview?.orders?.pending || 0} pending`, changeType: 'positive', icon: ShoppingCart, color: 'emerald' },
    { name: 'Total Revenue', value: `₹${(overview?.revenue?.total || 0).toLocaleString()}`, change: `+${Math.round(overview?.revenue?.average || 0)} avg`, changeType: 'positive', icon: DollarSign, color: 'amber' },
  ];

  // Helper for status badge colors
  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'Processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Helper for top card colors
  const colorVariants = {
    blue: { bar: 'border-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-500 dark:text-blue-400' },
    purple: { bar: 'border-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-500 dark:text-purple-400' },
    emerald: { bar: 'border-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-500 dark:text-emerald-400' },
    amber: { bar: 'border-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-500 dark:text-amber-400' }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
      
      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* ... (this code is unchanged) ... */}
           {stats.map((stat) => (
            <div key={stat.name} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center border-l-4 ${colorVariants[stat.color].bar}`}>
                <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <div className="flex items-center text-xs mt-1">
                    <span className={stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{stat.change}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">since last week</span>
                </div>
                </div>
                <div className={`ml-4 p-2 rounded-full ${colorVariants[stat.color].bg}`}>
                <stat.icon className={`h-6 w-6 ${colorVariants[stat.color].text}`} />
                </div>
            </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Analytics Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
             {/* ... (this code is unchanged) ... */}
             <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Sales Analytics</h3>
            <div className="h-72">
                 {salesLoading ? ( <div className="flex items-center justify-center h-full"><LoadingSpinner /></div> ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData.map(d => ({...d, totalSales: d.totalSales || 0}))} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="_id.day" tick={{ fontSize: 12 }} stroke={isDark ? '#4b5563' : '#9ca3af'} />
                            <YAxis tick={{ fontSize: 12 }} stroke={isDark ? '#4b5563' : '#9ca3af'} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="totalSales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            <Area type="monotone" dataKey="totalSales" stroke={false} fill="url(#salesGradient)" />
                        </LineChart>
                    </ResponsiveContainer>
                 )}
            </div>
        </div>

        {/* --- START: MODIFIED Top Products Card --- */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">Top Products by Revenue</h3>
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </div>
            {productsLoading ? ( <div className="flex items-center justify-center h-full"><LoadingSpinner /></div> ) : (
                <div className="flex items-center h-[280px]">
                    <div className="w-1/2 h-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topProducts}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    innerRadius={60}
                                    outerRadius={85}
                                    fill="#8884d8"
                                    dataKey="totalRevenue"
                                    paddingAngle={5}
                                >
                                    {topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {topProducts.length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Products</p>
                        </div>
                    </div>
                    <div className="w-1/2 pl-4 space-y-3">
                        {topProducts.map((product, index) => (
                            <div key={product._id} className="flex items-center">
                                <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{product.productName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">₹{product.totalRevenue.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        {/* --- END: MODIFIED Top Products Card --- */}

      </div>
      
      {/* Low Stock Alerts & Recent Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ... (this code is unchanged) ... */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Low Stock Alerts</h3>
                </div>
                <div className="p-4">
                    {alertsLoading ? ( <div className="flex items-center justify-center h-32"><LoadingSpinner /></div> ) : lowStockAlerts?.length > 0 ? (
                        <div className="space-y-3">
                        {lowStockAlerts.slice(0, 5).map((product) => (
                            <div key={product._id} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{product.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">{product.stockQuantity} left</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Min: {product.minimumStock}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : ( <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No low stock alerts</p> )}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm lg:col-span-2">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Recent Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                    {ordersLoading ? ( <div className="flex items-center justify-center h-48"><LoadingSpinner /></div> ) : (
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Order ID</th>
                                <th scope="col" className="px-6 py-3">Customer</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders?.map((order) => (
                                <tr key={order._id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{order.orderNumber}</td>
                                    <td className="px-6 py-4">{order.customer?.name}</td>
                                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(order.orderStatus)}`}>
                                            {order.orderStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">₹{order.totalAmount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
      </div>
    </div>
  );
};

export default Dashboard;