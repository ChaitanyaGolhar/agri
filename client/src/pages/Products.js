import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// --- NEW: Helper function to get consistent colors for category badges ---
const getCategoryBadgeClass = (category) => {
    switch (category) {
        case 'Seeds': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case 'Fertilizers': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case 'Pesticides': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        case 'Tools': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
        case 'Equipment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
        case 'Irrigation': return 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const Products = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const queryClient = useQueryClient();

    const { data: productsData, isLoading } = useQuery(
        ['products', currentPage, searchTerm, categoryFilter, brandFilter],
        () => api.get('/products', {
            params: {
                page: currentPage,
                limit: 10, // Adjusted for table view
                search: searchTerm,
                category: categoryFilter,
                brand: brandFilter,
            }
        }).then(res => res.data)
    );
    
    // This query can be simplified or removed if brands/categories are static
    const { data: filterOptions } = useQuery('product-filters', () => api.get('/products/categories/list').then(res => res.data));
    
    const deleteProductMutation = useMutation((productId) => api.delete(`/products/${productId}`), {
        onSuccess: () => {
            queryClient.invalidateQueries('products');
            toast.success('Product deactivated successfully');
        },
        onError: () => { toast.error('Failed to deactivate product'); },
    });

    const handleDelete = (productId) => {
        if (window.confirm('Are you sure you want to deactivate this product?')) {
            deleteProductMutation.mutate(productId);
        }
    };

    const categoryOptions = [
        { value: '', label: 'All Categories' },
        { value: 'Seeds', label: 'Seeds' },
        { value: 'Fertilizers', label: 'Fertilizers' },
        { value: 'Pesticides', label: 'Pesticides' },
        { value: 'Tools', label: 'Tools' },
        { value: 'Equipment', label: 'Equipment' },
        { value: 'Irrigation', label: 'Irrigation' },
        { value: 'Other', label: 'Other' },
    ];
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your product catalog and inventory</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link to="/products/new" className="btn btn-primary"><Plus className="h-4 w-4 mr-2" />Add Product</Link>
                </div>
            </div>

            {/* --- MODIFIED: Filters are now part of the table card --- */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-4 border-b dark:border-gray-700">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input type="text" placeholder="Search by name or brand..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10 w-full" />
                            </div>
                        </div>
                        <div>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input w-full">
                                {categoryOptions.map((option) => ( <option key={option.value} value={option.value}>{option.label}</option> ))}
                            </select>
                        </div>
                        <div>
                            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="input w-full">
                                <option value="">All Brands</option>
                                {filterOptions?.brands?.map((brand) => ( <option key={brand} value={brand}>{brand}</option> ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- MODIFIED: Products Table --- */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-700 dark:text-gray-400 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">S.No</th>
                                <th scope="col" className="px-6 py-3">Product Name</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Stock</th>
                                <th scope="col" className="px-6 py-3">Price</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center py-12"><LoadingSpinner size="lg" /></td></tr>
                            ) : productsData?.products?.length > 0 ? (
                                productsData.products.map((product, index) => (
                                    <tr key={product._id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{(currentPage - 1) * 10 + index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div>{product.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeClass(product.category)}`}>
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {product.isLowStock && <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />}
                                                <span className={`font-medium ${product.stockQuantity === 0 ? 'text-red-500' : product.isLowStock ? 'text-yellow-500' : 'text-green-500'}`}>
                                                    {product.stockQuantity} units
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-3">
                                                <Link to={`/products/${product._id}/edit`} className="text-gray-400 hover:text-blue-500" title="Edit Product"><Edit className="h-4 w-4" /></Link>
                                                <button onClick={() => handleDelete(product._id)} className="text-gray-400 hover:text-red-500" title="Deactivate Product"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center py-12">
                                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                 {/* Pagination (kept as is, but styled to match the new container) */}
                 {productsData?.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(currentPage * 10, productsData.total)}</span> of <span className="font-medium">{productsData.total}</span> results
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
                                    onClick={() => setCurrentPage(Math.min(productsData.totalPages, currentPage + 1))}
                                    disabled={currentPage === productsData.totalPages}
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

export default Products;