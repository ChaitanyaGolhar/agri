import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Printer, Download, Search, Tag, Percent } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { printReceipt, printReceiptToPDF } from '../utils/receiptPrinter';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Cart = () => {
    const { t, formatCurrency } = useLanguage();
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [notes, setNotes] = useState('');
    const [createdOrder, setCreatedOrder] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [promotionCode, setPromotionCode] = useState('');
    const [appliedPromotions, setAppliedPromotions] = useState([]);
    const [creditTerms, setCreditTerms] = useState('immediate');
    const [paymentStatus, setPaymentStatus] = useState('Paid');
    const [paidAmount, setPaidAmount] = useState(0);
    const queryClient = useQueryClient();

    const [cartItems, setCartItems] = useState([]);

    const { data: customers } = useQuery(
        'customers-for-cart',
        () => api.get('/customers?limit=100&isActive=true').then(res => res.data.customers)
    );

    const { data: products, isLoading: productsLoading } = useQuery(
        'products-for-cart',
        () => api.get('/products?limit=1000').then(res => res.data.products)
    );

    const validatePromotionMutation = useMutation(
        (code) => api.post('/promotions/validate', { code, cartItems, customer: selectedCustomer }),
        {
            onSuccess: (response) => {
                const promotion = response.data.promotion;
                if (!appliedPromotions.find(p => p._id === promotion._id)) {
                    setAppliedPromotions([...appliedPromotions, promotion]);
                    toast.success(`Promotion "${promotion.name}" applied successfully!`);
                }
                setPromotionCode('');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Invalid promotion code');
            },
        }
    );

    const createOrderMutation = useMutation(
        (orderData) => api.post('/orders', orderData),
        {
            onSuccess: (response) => {
                const order = response.data.order;
                setCreatedOrder(order);
                queryClient.invalidateQueries('orders');
                setCartItems([]);
                setSelectedCustomer('');
                setNotes('');
                toast.success('Order created successfully!');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to create order');
            },
        }
    );

    const addToCart = (product) => {
        const existingItem = cartItems.find(item => item.product._id === product._id);
        if (product.stockQuantity <= (existingItem?.quantity || 0)) {
            toast.error('Cannot add more than available stock.');
            return;
        }
        if (existingItem) {
            setCartItems(cartItems.map(item =>
                item.product._id === product._id
                    ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            setCartItems([...cartItems, {
                product,
                quantity: 1,
                unitPrice: product.price,
                totalPrice: product.price
            }]);
        }
    };

    const updateQuantity = (productId, newQuantity) => {
        const itemInCart = cartItems.find(item => item.product._id === productId);
        if (newQuantity > itemInCart.product.stockQuantity) {
            toast.error('Cannot add more than available stock.');
            return;
        }
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(cartItems.map(item =>
            item.product._id === productId
                ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
                : item
        ));
    };

    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter(item => item.product._id !== productId));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = 0; // Placeholder for tax calculation
    
    // Calculate promotion discounts
    const calculatePromotionDiscount = () => {
        return appliedPromotions.reduce((total, promotion) => {
            let discount = 0;
            if (promotion.discountType === 'percentage') {
                discount = (subtotal * promotion.discountValue) / 100;
                if (promotion.maxDiscountAmount) {
                    discount = Math.min(discount, promotion.maxDiscountAmount);
                }
            } else if (promotion.discountType === 'fixed_amount') {
                discount = promotion.discountValue;
            }
            return total + discount;
        }, 0);
    };
    
    const promotionDiscountAmount = calculatePromotionDiscount();
    const totalAmount = subtotal + taxAmount - promotionDiscountAmount;

    // Auto-set paid amount when payment status or total changes
    useEffect(() => {
        if (paymentStatus === 'Paid') {
            setPaidAmount(totalAmount);
        } else if (paymentStatus === 'Pending') {
            setPaidAmount(0);
        }
    }, [paymentStatus, totalAmount]);

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        if (!selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }

        const orderData = {
            customer: selectedCustomer,
            items: cartItems.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
            })),
            subtotal,
            taxAmount,
            promotionDiscountAmount,
            totalAmount,
            paymentMethod,
            appliedPromotions: appliedPromotions.map(promo => ({
                promotion: promo._id,
                discountAmount: promo.discountType === 'percentage' 
                    ? Math.min((subtotal * promo.discountValue) / 100, promo.maxDiscountAmount || Infinity)
                    : promo.discountValue,
                discountType: promo.discountType
            })),
            ...(paymentMethod === 'Credit' && {
                creditTerms: {
                    paymentTerms: creditTerms
                }
            }),
            paymentStatus,
            paidAmount: paymentStatus === 'Pending' ? 0 : paidAmount,
            remainingAmount: paymentStatus === 'Pending' ? totalAmount : Math.max(0, totalAmount - paidAmount),
            notes
        };
        createOrderMutation.mutate(orderData);
    };
    
    const handlePrintReceipt = () => createdOrder && printReceipt(createdOrder);
    const handleDownloadReceipt = () => createdOrder && printReceiptToPDF(createdOrder);

    const handleNewOrder = () => {
        setCreatedOrder(null);
    };

    const filteredProducts = products
        ? products.filter(product =>
            product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            product.brand?.toLowerCase().includes(productSearch.toLowerCase())
        )
        : [];

    return (
        <div className="space-y-2">
            {/* --- NEW: Style tag to hide scrollbar --- */}
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
                <p className="mt-2 mb-4 text-sm text-gray-500 dark:text-gray-400 ">
                    Create a new order for your customer
                </p>
            </div>

            {/* Order Success Message */}
            {createdOrder && (
                <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-md p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Order Created Successfully!</h3>
                            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                <p>Order #{createdOrder.orderNumber} has been created for {createdOrder.customer?.name}.</p>
                            </div>
                            <div className="mt-4 flex space-x-3">
                                <button onClick={handlePrintReceipt} className="btn btn-outline btn-sm"><Printer className="h-4 w-4 mr-2" />Print Receipt</button>
                                <button onClick={handleDownloadReceipt} className="btn btn-primary btn-sm"><Download className="h-4 w-4 mr-2" />Download PDF</button>
                                <button onClick={handleNewOrder} className="btn btn-secondary btn-sm">Create New Order</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Selection Table */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Add Products</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="input pl-10 w-full sm:w-64" />
                            </div>
                        </div>
                        <div className="card-content p-0">
                            {/* --- MODIFIED: Added hide-scrollbar class --- */}
                            <div className="overflow-y-auto h-96 hide-scrollbar">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-700 dark:text-gray-400 uppercase">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Product</th>
                                            <th className="px-6 py-3 text-left">Stock</th>
                                            <th className="px-6 py-3 text-left">Price</th>
                                            <th className="px-6 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {productsLoading ? (
                                            <tr><td colSpan="4" className="text-center py-12"><LoadingSpinner /></td></tr>
                                        ) : filteredProducts.map((product) => (
                                            <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{product.name} <span className="text-gray-500 dark:text-gray-400">({product.brand})</span></td>
                                                <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{product.stockQuantity} units</td>
                                                <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <button onClick={() => addToCart(product)} disabled={product.stockQuantity === 0} className="btn btn-primary btn-sm disabled:opacity-50">
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Cart Items Table */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Cart Items ({cartItems.length})</h3>
                        </div>
                        <div className="card-content p-0">
                            {cartItems.length > 0 ? (
                               <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-700 dark:text-gray-400 uppercase">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Product</th>
                                            <th className="px-6 py-3 text-center">Quantity</th>
                                            <th className="px-6 py-3 text-right">Total</th>
                                            <th className="px-6 py-3 text-center">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {cartItems.map(item => (
                                            <tr key={item.product._id}>
                                                <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{item.product.name}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><Minus className="h-4 w-4" /></button>
                                                        <span className="font-medium text-gray-900 dark:text-white w-8 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} disabled={item.quantity >= item.product.stockQuantity} className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"><Plus className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">₹{item.totalPrice.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <button onClick={() => removeFromCart(item.product._id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                               </div>
                            ) : (
                                <div className="text-center py-8">
                                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Empty cart</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add products to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-6">
                        <div className="card-header"><h3 className="card-title">Order Summary</h3></div>
                        <div className="card-content space-y-4">
                            <div>
                                <label className="label">Select Customer</label>
                                <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="input w-full" required>
                                    <option value="">Choose a customer</option>
                                    {customers?.map((customer) => (
                                        <option key={customer._id} value={customer._id}>{customer.name} ({customer.phone})</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Promotion Code Section */}
                            <div>
                                <label className="label">Promotion Code</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={promotionCode}
                                        onChange={(e) => setPromotionCode(e.target.value)}
                                        className="input flex-1"
                                        placeholder="Enter promo code"
                                    />
                                    <button
                                        onClick={() => validatePromotionMutation.mutate(promotionCode)}
                                        disabled={!promotionCode || validatePromotionMutation.isLoading}
                                        className="btn btn-outline btn-sm"
                                    >
                                        <Tag className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                {/* Applied Promotions */}
                                {appliedPromotions.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {appliedPromotions.map((promo) => (
                                            <div key={promo._id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm">
                                                <span className="text-green-700 dark:text-green-300">{promo.name}</span>
                                                <button
                                                    onClick={() => setAppliedPromotions(appliedPromotions.filter(p => p._id !== promo._id))}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="label">Payment Method</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input w-full">
                                    <option>Cash</option><option>UPI</option><option>Card</option><option>Cheque</option><option>Credit</option>
                                </select>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className="label">Payment Status</label>
                                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="input w-full">
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Partially Paid">Partially Paid</option>
                                </select>
                            </div>

                            {/* Payment Amount (shown for Paid and Partially Paid) */}
                            {(paymentStatus === 'Paid' || paymentStatus === 'Partially Paid') && (
                                <div>
                                    <label className="label">
                                        {paymentStatus === 'Paid' ? 'Paid Amount' : 'Amount Received'}
                                    </label>
                                    <input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                        className="input w-full"
                                        placeholder="Enter amount"
                                        max={totalAmount}
                                        min={0}
                                        step="0.01"
                                    />
                                    {paymentStatus === 'Partially Paid' && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Remaining: {formatCurrency(Math.max(0, totalAmount - paidAmount))}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Credit Terms (shown only when Credit is selected) */}
                            {paymentMethod === 'Credit' && (
                                <div>
                                    <label className="label">Credit Terms</label>
                                    <select value={creditTerms} onChange={(e) => setCreditTerms(e.target.value)} className="input w-full">
                                        <option value="immediate">Immediate</option>
                                        <option value="7_days">7 Days</option>
                                        <option value="15_days">15 Days</option>
                                        <option value="30_days">30 Days</option>
                                        <option value="45_days">45 Days</option>
                                        <option value="60_days">60 Days</option>
                                        <option value="90_days">90 Days</option>
                                    </select>
                                </div>
                            )}
                            
                            <div>
                                <label className="label">Notes</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input w-full" placeholder="Add order notes..."/>
                            </div>
                            
                            <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(subtotal)}</span>
                                </div>
                                {promotionDiscountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                        <span>Promotion Discount</span>
                                        <span className="font-medium">-{formatCurrency(promotionDiscountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <span>Tax</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(taxAmount)}</span>
                                </div>
                                <div className="border-t dark:border-gray-700 pt-2">
                                    <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                                        <span>Total</span>
                                        <span>{formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleCheckout} disabled={cartItems.length === 0 || !selectedCustomer || createOrderMutation.isLoading} className="w-full btn btn-primary">
                                {createOrderMutation.isLoading ? <LoadingSpinner size="sm" /> : <><CreditCard className="h-4 w-4 mr-2" />Create Order</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;

