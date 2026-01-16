import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiTrash2, FiEdit, FiCalendar, FiUsers, FiMapPin, FiCreditCard } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Cart = () => {
  const { cart, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [editingItem, setEditingItem] = useState(null);
  const [editData, setEditData] = useState({});

  const handleEditItem = (item) => {
    setEditingItem(item._id);
    setEditData({
      checkIn: new Date(item.checkIn),
      checkOut: new Date(item.checkOut),
      guests: { ...item.guests }
    });
  };

  const handleSaveEdit = async (itemId) => {
    try {
      await updateCartItem(itemId, {
        checkIn: editData.checkIn.toISOString(),
        checkOut: editData.checkOut.toISOString(),
        guests: editData.guests
      });
      setEditingItem(null);
      setEditData({});
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditData({});
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      await removeFromCart(itemId);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      await clearCart();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your cart</h2>
          <Link to="/login" className="btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-airbnb-red"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCreditCard className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-4">Start exploring amazing places to stay</p>
            <Link to="/search" className="btn-primary">
              Start Exploring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">{cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.items.map((item) => (
              <div key={item._id} className="card p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <img
                    src={item.property.images[0] || '/api/placeholder/200/150'}
                    alt={item.property.title}
                    className="w-full md:w-48 h-32 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.property.title}
                    </h3>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <FiMapPin className="w-4 h-4 mr-1" />
                      <span>
                        {item.property.address.city}, {item.property.address.state}
                      </span>
                    </div>

                    {editingItem === item._id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Check-in
                            </label>
                            <DatePicker
                              selected={editData.checkIn}
                              onChange={(date) => setEditData(prev => ({ ...prev, checkIn: date }))}
                              selectsStart
                              startDate={editData.checkIn}
                              endDate={editData.checkOut}
                              minDate={new Date()}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Check-out
                            </label>
                            <DatePicker
                              selected={editData.checkOut}
                              onChange={(date) => setEditData(prev => ({ ...prev, checkOut: date }))}
                              selectsEnd
                              startDate={editData.checkIn}
                              endDate={editData.checkOut}
                              minDate={editData.checkIn || new Date()}
                              className="input-field"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Guests
                          </label>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">Adults:</span>
                              <button
                                onClick={() => setEditData(prev => ({
                                  ...prev,
                                  guests: { ...prev.guests, adults: Math.max(1, prev.guests.adults - 1) }
                                }))}
                                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span>{editData.guests.adults}</span>
                              <button
                                onClick={() => setEditData(prev => ({
                                  ...prev,
                                  guests: { ...prev.guests, adults: prev.guests.adults + 1 }
                                }))}
                                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">Children:</span>
                              <button
                                onClick={() => setEditData(prev => ({
                                  ...prev,
                                  guests: { ...prev.guests, children: Math.max(0, prev.guests.children - 1) }
                                }))}
                                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span>{editData.guests.children}</span>
                              <button
                                onClick={() => setEditData(prev => ({
                                  ...prev,
                                  guests: { ...prev.guests, children: prev.guests.children + 1 }
                                }))}
                                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveEdit(item._id)}
                            className="btn-primary text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-outline text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          <span>
                            {new Date(item.checkIn).toLocaleDateString()} - {new Date(item.checkOut).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiUsers className="w-4 h-4 mr-1" />
                          <span>{item.totalGuests} guest{item.totalGuests !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.nights} night{item.nights !== 1 ? 's' : ''} • ${item.pricePerNight}/night
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${item.totalPrice}
                      </div>
                      <div className="text-sm text-gray-600">
                        ${item.pricePerNight} × {item.nights} nights
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-2 text-gray-600 hover:text-airbnb-red transition-colors"
                        title="Edit"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Remove"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center">
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Clear Cart
              </button>
              <Link to="/search" className="btn-outline">
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cart.items.reduce((sum, item) => sum + item.subtotal, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning fees</span>
                  <span>${cart.items.reduce((sum, item) => sum + item.cleaningFee, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fees</span>
                  <span>${cart.items.reduce((sum, item) => sum + item.serviceFee, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span>${cart.items.reduce((sum, item) => sum + item.taxes, 0)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${cart.totalAmount}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full btn-primary text-center block"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;



