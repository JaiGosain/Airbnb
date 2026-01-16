import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../utils/api';
import { FiLock } from 'react-icons/fi';

const Checkout = () => {
  const { cart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'razorpay',
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    cardDetails: {
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    }
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('shippingAddress.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: value
        }
      }));
    } else if (name.startsWith('billingAddress.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }));
    } else if (name.startsWith('cardDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        cardDetails: {
          ...prev.cardDetails,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSameAsShippingChange = (e) => {
    const checked = e.target.checked;
    setSameAsShipping(checked);
    
    if (checked) {
      setFormData(prev => ({
        ...prev,
        billingAddress: prev.shippingAddress
      }));
    }
  };

  const handleRazorpayPayment = async (order) => {
    try {
      // Create Razorpay order
      const razorpayOrderResponse = await ordersAPI.createRazorpayOrder(order._id);
      const { razorpayOrderId, key, amount } = razorpayOrderResponse.data;
      
      const options = {
        key: key,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'Airbnb Clone',
        description: `Order ${order.orderNumber}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await ordersAPI.verifyRazorpayPayment(order._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.data.order.paymentStatus === 'paid') {
              navigate('/order-success', { 
                state: { 
                  order: verifyResponse.data.order,
                  paymentDetails: verifyResponse.data.paymentDetails
                }
              });
            } else {
              alert('Payment verification failed. Please try again.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#FF385C'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      alert('Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Create order
      const orderData = {
        paymentMethod: formData.paymentMethod,
        shippingAddress: formData.shippingAddress,
        billingAddress: sameAsShipping ? formData.shippingAddress : formData.billingAddress
      };

      const orderResponse = await ordersAPI.createOrder(orderData);
      const order = orderResponse.data.order;

      // Handle Razorpay payment
      if (formData.paymentMethod === 'razorpay') {
        await handleRazorpayPayment(order);
        return; // Don't set processing to false here, it will be set in the Razorpay handler
      }

      // Process payment for other methods
      const paymentResponse = await ordersAPI.processPayment(order._id, {
        paymentDetails: {
          method: formData.paymentMethod,
          cardNumber: formData.cardDetails.number,
          expiry: formData.cardDetails.expiry,
          cvv: formData.cardDetails.cvv,
          name: formData.cardDetails.name
        }
      });

      if (paymentResponse.data.order.paymentStatus === 'paid') {
        navigate('/order-success', { 
          state: { 
            order: paymentResponse.data.order,
            paymentDetails: paymentResponse.data.paymentDetails
          }
        });
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-airbnb-red"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/search')}
            className="btn-primary"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your booking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-8">
              {/* Shipping Address */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="shippingAddress.street"
                      value={formData.shippingAddress.street}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="shippingAddress.city"
                        value={formData.shippingAddress.city}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="shippingAddress.state"
                        value={formData.shippingAddress.state}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="Enter state"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="shippingAddress.zipCode"
                        value={formData.shippingAddress.zipCode}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        name="shippingAddress.country"
                        value={formData.shippingAddress.country}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Billing Address</h2>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={handleSameAsShippingChange}
                      className="h-4 w-4 text-airbnb-red focus:ring-airbnb-red border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Same as shipping</span>
                  </label>
                </div>

                {!sameAsShipping && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="billingAddress.street"
                        value={formData.billingAddress.street}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          name="billingAddress.city"
                          value={formData.billingAddress.city}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          name="billingAddress.state"
                          value={formData.billingAddress.state}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Enter state"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          name="billingAddress.zipCode"
                          value={formData.billingAddress.zipCode}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Enter ZIP code"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country *
                        </label>
                        <input
                          type="text"
                          name="billingAddress.country"
                          value={formData.billingAddress.country}
                          onChange={handleChange}
                          required
                          className="input-field"
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="razorpay">Razorpay (Recommended)</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="stripe">Stripe</option>
                    </select>
                  </div>

                  {formData.paymentMethod === 'razorpay' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        You will be redirected to Razorpay's secure payment gateway to complete your payment.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          name="cardDetails.number"
                          value={formData.cardDetails.number}
                          onChange={handleChange}
                          required={formData.paymentMethod !== 'razorpay'}
                          className="input-field"
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            name="cardDetails.expiry"
                            value={formData.cardDetails.expiry}
                            onChange={handleChange}
                            required={formData.paymentMethod !== 'razorpay'}
                            className="input-field"
                            placeholder="MM/YY"
                            maxLength="5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            name="cardDetails.cvv"
                            value={formData.cardDetails.cvv}
                            onChange={handleChange}
                            required={formData.paymentMethod !== 'razorpay'}
                            className="input-field"
                            placeholder="123"
                            maxLength="4"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          name="cardDetails.name"
                          value={formData.cardDetails.name}
                          onChange={handleChange}
                          required={formData.paymentMethod !== 'razorpay'}
                          className="input-field"
                          placeholder="Enter cardholder name"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => (
                    <div key={item._id} className="flex items-center space-x-3">
                      <img
                        src={item.property.images[0] || '/api/placeholder/60/60'}
                        alt={item.property.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.property.title}</h4>
                        <p className="text-xs text-gray-600">
                          {item.nights} night{item.nights !== 1 ? 's' : ''} • {item.totalGuests} guest{item.totalGuests !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">${item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${cart.items.reduce((sum, item) => sum + item.subtotal, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fees</span>
                    <span>${cart.items.reduce((sum, item) => sum + item.cleaningFee + item.serviceFee, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxes</span>
                    <span>${cart.items.reduce((sum, item) => sum + item.taxes, 0)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span>${cart.totalAmount}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full btn-primary mt-6 flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiLock className="w-4 h-4 mr-2" />
                      Complete Booking
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
