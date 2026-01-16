import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../utils/api';
import { FiCalendar, FiMapPin, FiUsers, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingsAPI.getBookings();
        setBookings(response.data.bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'pending':
        return <FiClock className="w-4 h-4" />;
      case 'cancelled':
        return <FiXCircle className="w-4 h-4" />;
      case 'completed':
        return <FiCheckCircle className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-airbnb-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Manage your trips and reservations</p>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <img
                        src={booking.property.images[0] || '/api/placeholder/150/100'}
                        alt={booking.property.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {booking.property.title}
                        </h3>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <FiMapPin className="w-4 h-4 mr-1" />
                          <span>
                            {booking.property.address.city}, {booking.property.address.state}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-1" />
                            <span>
                              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FiUsers className="w-4 h-4 mr-1" />
                            <span>{booking.totalGuests} guest{booking.totalGuests !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-900">
                        ${booking.totalPrice}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {booking.nights} night{booking.nights !== 1 ? 's' : ''} • ${booking.pricePerNight}/night
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Link
                        to={`/property/${booking.property._id}`}
                        className="btn-outline text-sm"
                      >
                        View Property
                      </Link>
                      {booking.status === 'pending' && (
                        <button className="btn-secondary text-sm">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCalendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-4">Start exploring amazing places to stay</p>
            <Link to="/search" className="btn-primary">
              Start Exploring
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;



