import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { propertiesAPI } from '../utils/api';
import { FiMapPin, FiStar, FiFilter, FiHeart } from 'react-icons/fi';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: searchParams.get('q') || '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    roomType: '',
    guests: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  // Update filters when URL search params change
  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    setFilters(prev => ({
      ...prev,
      city: queryParam
    }));
  }, [searchParams]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const params = { ...filters };
        // Remove empty values
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });
        
        const response = await propertiesAPI.getProperties(params);
        setProperties(response.data.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      propertyType: '',
      roomType: '',
      guests: ''
    });
  };

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {filters.city ? `Properties in ${filters.city}` : 'All Properties'}
          </h1>
          <p className="text-gray-600">
            {properties.length} properties found
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiFilter className="w-5 h-5" />
                </button>
              </div>

              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, state, or country"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="input-field"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                    <option value="loft">Loft</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => handleFilterChange('roomType', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="entire">Entire place</option>
                    <option value="private">Private room</option>
                    <option value="shared">Shared room</option>
                  </select>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guests
                  </label>
                  <input
                    type="number"
                    placeholder="Number of guests"
                    min="1"
                    value={filters.guests}
                    onChange={(e) => handleFilterChange('guests', e.target.value)}
                    className="input-field"
                  />
                </div>

                <button
                  onClick={clearFilters}
                  className="w-full btn-outline"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="flex-1">
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property._id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMapPin className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or browse all properties.
                </p>
                <button
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;



