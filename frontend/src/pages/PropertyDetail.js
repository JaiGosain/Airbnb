import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiMapPin, FiStar, FiHeart, FiShare2, FiUser, FiShoppingCart } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    checkIn: null,
    checkOut: null,
    guests: { adults: 1, children: 0, infants: 0 }
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await propertiesAPI.getProperty(id);
        setProperty(response.data.property);
      } catch (error) {
        console.error('Error fetching property:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!bookingData.checkIn || !bookingData.checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    setCartLoading(true);

    try {
      const totalGuests = bookingData.guests.adults + bookingData.guests.children + bookingData.guests.infants;
      
      if (totalGuests > property.maxGuests) {
        alert(`Maximum ${property.maxGuests} guests allowed for this property`);
        return;
      }

      const cartPayload = {
        propertyId: property._id,
        checkIn: bookingData.checkIn.toISOString(),
        checkOut: bookingData.checkOut.toISOString(),
        guests: bookingData.guests
      };

      const result = await addToCart(cartPayload);
      if (result.success) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!bookingData.checkIn || !bookingData.checkOut || !property) return 0;
    
    const nights = Math.ceil((bookingData.checkOut - bookingData.checkIn) / (1000 * 60 * 60 * 24));
    const subtotal = property.price * nights;
    const cleaningFee = Math.round(subtotal * 0.1);
    const serviceFee = Math.round(subtotal * 0.15);
    const taxes = Math.round(subtotal * 0.08);
    
    return {
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      taxes,
      total: subtotal + cleaningFee + serviceFee + taxes
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-airbnb-red"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property not found</h2>
          <p className="text-gray-600">The property you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const pricing = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery */}
      <div className="relative h-96 md:h-[500px]">
        {property.images && property.images.length > 0 ? (
          <>
            <img
              src={property.images[currentImageIndex]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            {property.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentImageIndex(Math.min(property.images.length - 1, currentImageIndex + 1))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                >
                  →
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {property.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No images available</span>
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex space-x-2">
          <button className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all">
            <FiShare2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all"
          >
            <FiHeart className={`w-5 h-5 ${isFavorite ? 'fill-airbnb-red text-airbnb-red' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Info */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <FiMapPin className="w-4 h-4 mr-1" />
                <span>{property.address.city}, {property.address.state}, {property.address.country}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{property.roomType} • {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''} • {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
                <div className="flex items-center">
                  <FiStar className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span>{property.ratings.average || 'New'} ({property.ratings.count} reviews)</span>
                </div>
              </div>
            </div>

            {/* Host Info */}
            <div className="border-t border-gray-200 pt-8 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Hosted by {property.host?.name}</h3>
                  <p className="text-sm text-gray-600">Superhost</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-gray-200 pt-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About this place</h2>
              <p className="text-gray-700 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="border-t border-gray-200 pt-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-airbnb-red rounded-full mr-3"></span>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${property.price}</span>
                    <span className="text-gray-600"> / night</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiStar className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span>{property.ratings.average || 'New'}</span>
                  </div>
                </div>

                {!showBookingForm ? (
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full btn-primary mb-4"
                  >
                    Check availability
                  </button>
                ) : (
                  <form onSubmit={handleAddToCart} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check-in
                        </label>
                        <DatePicker
                          selected={bookingData.checkIn}
                          onChange={(date) => setBookingData(prev => ({ ...prev, checkIn: date }))}
                          selectsStart
                          startDate={bookingData.checkIn}
                          endDate={bookingData.checkOut}
                          minDate={new Date()}
                          placeholderText="Add date"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check-out
                        </label>
                        <DatePicker
                          selected={bookingData.checkOut}
                          onChange={(date) => setBookingData(prev => ({ ...prev, checkOut: date }))}
                          selectsEnd
                          startDate={bookingData.checkIn}
                          endDate={bookingData.checkOut}
                          minDate={bookingData.checkIn || new Date()}
                          placeholderText="Add date"
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guests
                      </label>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Adults</span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setBookingData(prev => ({
                                ...prev,
                                guests: { ...prev.guests, adults: Math.max(1, prev.guests.adults - 1) }
                              }))}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span>{bookingData.guests.adults}</span>
                            <button
                              type="button"
                              onClick={() => setBookingData(prev => ({
                                ...prev,
                                guests: { ...prev.guests, adults: prev.guests.adults + 1 }
                              }))}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Children</span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setBookingData(prev => ({
                                ...prev,
                                guests: { ...prev.guests, children: Math.max(0, prev.guests.children - 1) }
                              }))}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span>{bookingData.guests.children}</span>
                            <button
                              type="button"
                              onClick={() => setBookingData(prev => ({
                                ...prev,
                                guests: { ...prev.guests, children: prev.guests.children + 1 }
                              }))}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {pricing.total > 0 && (
                      <div className="border-t border-gray-200 pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>${property.price} × {pricing.nights} nights</span>
                          <span>${pricing.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cleaning fee</span>
                          <span>${pricing.cleaningFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service fee</span>
                          <span>${pricing.serviceFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes</span>
                          <span>${pricing.taxes}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                          <span>Total</span>
                          <span>${pricing.total}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={cartLoading || !bookingData.checkIn || !bookingData.checkOut}
                      className="w-full btn-primary flex items-center justify-center"
                    >
                      {cartLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <FiShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
