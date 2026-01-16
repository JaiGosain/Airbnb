import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { propertiesAPI } from '../utils/api';
import { FiMapPin, FiStar, FiHeart } from 'react-icons/fi';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertiesAPI.getProperties({ limit: 12 });
        setProperties(response.data.properties);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const toggleFavorite = (propertyId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(propertyId)) {
      newFavorites.delete(propertyId);
    } else {
      newFavorites.add(propertyId);
    }
    setFavorites(newFavorites);
  };

  const PropertyCard = ({ property }) => (
    <div className="card-hover group">
      <Link to={`/property/${property._id}`}>
        <div className="relative">
          <img
            src={property.images[0] || '/api/placeholder/300/200'}
            alt={property.title}
            className="w-full h-64 object-cover"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(property._id);
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <FiHeart
              className={`w-5 h-5 ${
                favorites.has(property._id) ? 'fill-airbnb-red text-airbnb-red' : 'text-gray-600'
              }`}
            />
          </button>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-airbnb-red transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center">
              <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">
                {property.ratings.average || 'New'}
              </span>
            </div>
          </div>
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <FiMapPin className="w-4 h-4 mr-1" />
            <span>{property.address.city}, {property.address.state}</span>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            {property.roomType} • {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''} • {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">
              ${property.price}
              <span className="text-gray-600 font-normal"> / night</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-airbnb-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-airbnb-red to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find your next adventure
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-red-100">
            Discover unique places to stay around the world
          </p>
          <Link
            to="/search"
            className="inline-block bg-white text-airbnb-red font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Start Exploring
          </Link>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-lg text-gray-600">
              Handpicked places to stay for your next trip
            </p>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No properties available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/search"
              className="btn-primary"
            >
              View All Properties
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why choose our platform?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-airbnb-red rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Unique Locations
              </h3>
              <p className="text-gray-600">
                Discover amazing places to stay that you won't find anywhere else.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-airbnb-red rounded-full flex items-center justify-center mx-auto mb-4">
                <FiStar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Quality Assured
              </h3>
              <p className="text-gray-600">
                All properties are verified and reviewed by our community.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-airbnb-red rounded-full flex items-center justify-center mx-auto mb-4">
                <FiHeart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Local Experience
              </h3>
              <p className="text-gray-600">
                Get insider tips and recommendations from local hosts.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;



