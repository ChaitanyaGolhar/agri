import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Cart = () => {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Mock cart data - in a real app, this would come from a cart context or local storage
  const [cartItems, setCartItems] = useState([]);

  const { data: customers } = useQuery(
    'customers-for-cart',
    () => api.get('/customers?limit=100').then(res => res.data.customers)
  );

  const { data: products } = useQuery(
    'products-for-cart',
    () => api.get('/products?limit=1000').then(res => res.data.products)
  );

  const createOrderMutation = useMutation(
    (orderData) => api.post('/orders', orderData),
    {
      onSuccess: () => {
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
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
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
  const taxAmount = 0; // Can be calculated based on GST rules
  const totalAmount = subtotal + taxAmount;

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
        quantity: item.quantity
      })),
      paymentMethod,
      notes
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new order for your customer
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Add Products</h3>
              <p className="card-description">Search and add products to the order</p>
            </div>
            <div className="card-content">
              {products ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {products.slice(0, 8).map((product) => (
                    <div key={product._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {product.brand} • {product.packSize.value} {product.packSize.unit}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            ₹{product.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Stock: {product.stockQuantity} units
                          </p>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stockQuantity === 0}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="card-title">Cart Items</h3>
              <p className="card-description">
                {cartItems.length} item(s) in cart
              </p>
            </div>
            <div className="card-content">
              {cartItems.length > 0 ? (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.product._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {item.product.brand} • ₹{item.unitPrice.toLocaleString()} each
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium text-gray-900 w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ₹{item.totalPrice.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product._id)}
                          className="p-1 rounded-md text-red-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Empty cart</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add products to create an order
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <div className="card-header">
              <h3 className="card-title">Order Summary</h3>
            </div>
            <div className="card-content space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Choose a customer</option>
                  {customers?.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <option value="Credit">Credit</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input w-full"
                  placeholder="Add order notes..."
                />
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-base font-medium">
                    <span>Total</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || !selectedCustomer || createOrderMutation.isLoading}
                className="w-full btn btn-primary"
              >
                {createOrderMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
