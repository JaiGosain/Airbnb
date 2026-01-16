import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiCheckCircle, FiCalendar, FiMapPin } from 'react-icons/fi';

const OrderSuccess = () => {
  const location = useLocation();
  const { order, paymentDetails } = location.state || {};

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // safe helpers
  const safe = (value, fallback = '—') => (value == null ? fallback : value);
  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  const paymentMethodLabel = safe((order.paymentMethod ?? paymentDetails?.method ?? '').toString().replace('_', ' ').toUpperCase(), 'N/A');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your booking has been successfully processed. You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Information */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{safe(order.orderNumber ?? order._id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {safe(order.paymentStatus && `${order.paymentStatus.charAt(0).toUpperCase()}${order.paymentStatus.slice(1)}`, '—')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Status:</span>
                  <span className={`font-medium ${order.orderStatus === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {safe(order.orderStatus && `${order.orderStatus.charAt(0).toUpperCase()}${order.orderStatus.slice(1)}`, '—')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">{safe(paymentDetails.transactionId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{paymentMethodLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium">${safe(order.totalAmount, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid At:</span>
                    <span className="font-medium">{safe(new Date(paymentDetails.paidAt).toLocaleString())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Bookings</h2>

              <div className="space-y-4">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const img = item?.property?.images?.[0] ?? '/api/placeholder/80/80';
                    const title = item?.property?.title ?? 'Untitled property';
                    const city = item?.property?.address?.city ?? '—';
                    const state = item?.property?.address?.state ?? '—';
                    const checkIn = item?.checkIn ? formatDate(item.checkIn) : '—';
                    const checkOut = item?.checkOut ? formatDate(item.checkOut) : '—';
                    const nights = item?.nights ?? '—';
                    const guests = item?.totalGuests ?? item?.guests ?? '—';
                    const price = item?.totalPrice ?? 0;

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <img src={img} alt={title} className="w-16 h-16 object-cover rounded-lg" />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
                            <div className="flex items-center text-gray-600 text-sm mb-2">
                              <FiMapPin className="w-4 h-4 mr-1" />
                              <span>{city}, {state}</span>
                            </div>
                            <div className="flex items-center text-gray-600 text-sm mb-2">
                              <FiCalendar className="w-4 h-4 mr-1" />
                              <span>{checkIn} - {checkOut}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {nights} night{nights !== 1 ? 's' : ''} • {guests} guest{guests !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">${price}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-600">No booking items found.</div>
                )}
              </div>
            </div>

            {/* Total Summary */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Total Summary</h2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${safe(order.subtotal, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fees:</span>
                  <span>${safe(order.totalFees, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes:</span>
                  <span>${safe(order.totalTaxes, 0)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>${safe(order.totalAmount, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-8 space-x-4">
          <Link to="/my-bookings" className="btn-primary">
            View My Bookings
          </Link>
          <Link to="/search" className="btn-outline">
            Book Another Stay
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <div className="card p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your booking, please don't hesitate to contact us.
            </p>
            <div className="flex justify-center space-x-4">
              <a href="mailto:support@airbnb-clone.com" className="text-airbnb-red hover:text-red-600">
                Email Support
              </a>
              <a href="tel:+1-800-123-4567" className="text-airbnb-red hover:text-red-600">
                Call Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
