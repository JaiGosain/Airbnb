const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Property = require('../models/Property');
const { auth, optionalAuth } = require('../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/properties
// @desc    Get all properties with optional filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('city').optional().trim().isLength({ min: 1 }).withMessage('City cannot be empty'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term cannot be empty'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('propertyType').optional().isIn(['apartment', 'house', 'condo', 'villa', 'studio', 'loft', 'other']).withMessage('Invalid property type'),
  query('roomType').optional().isIn(['entire', 'private', 'shared']).withMessage('Invalid room type'),
  query('guests').optional().isInt({ min: 1 }).withMessage('Guests must be a positive integer')
], optionalAuth, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };

    // Enhanced search - search in multiple fields
    if (req.query.city || req.query.search) {
      const searchTerm = req.query.city || req.query.search;
      filter.$or = [
        { 'address.city': new RegExp(searchTerm, 'i') },
        { 'address.state': new RegExp(searchTerm, 'i') },
        { 'address.country': new RegExp(searchTerm, 'i') },
        { title: new RegExp(searchTerm, 'i') },
        { description: new RegExp(searchTerm, 'i') }
      ];
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    if (req.query.propertyType) {
      filter.propertyType = req.query.propertyType;
    }

    if (req.query.roomType) {
      filter.roomType = req.query.roomType;
    }

    if (req.query.guests) {
      filter.maxGuests = { $gte: parseInt(req.query.guests) };
    }

    // Execute query
    const properties = await Property.find(filter)
      .populate('host', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Property.countDocuments(filter);

    res.json({
      properties,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProperties: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/properties/:id
// @desc    Get property by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('host', 'name avatar phone');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ property });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/properties
// @desc    Create a new property
// @access  Private (Host only)
router.post('/', auth, uploadMultiple, handleUploadError, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20, max: 1000 }).withMessage('Description must be between 20 and 1000 characters'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.zipCode').trim().notEmpty().withMessage('ZIP code is required'),
  body('address.country').trim().notEmpty().withMessage('Country is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('propertyType').isIn(['apartment', 'house', 'condo', 'villa', 'studio', 'loft', 'other']).withMessage('Invalid property type'),
  body('roomType').isIn(['entire', 'private', 'shared']).withMessage('Invalid room type'),
  body('maxGuests').isInt({ min: 1 }).withMessage('Max guests must be at least 1'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms cannot be negative'),
  body('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms cannot be negative'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Check if user is a host
    if (!req.user.isHost) {
      return res.status(403).json({ message: 'Only hosts can create properties' });
    }

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const {
      title,
      description,
      address,
      price,
      propertyType,
      roomType,
      maxGuests,
      bedrooms,
      bathrooms,
      latitude,
      longitude,
      amenities
    } = req.body;

    // Create property object
    const propertyData = {
      title,
      description,
      address: JSON.parse(address),
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      price: parseFloat(price),
      propertyType,
      roomType,
      maxGuests: parseInt(maxGuests),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      host: req.user._id,
      images: req.files.map(file => `/uploads/${file.filename}`),
      amenities: amenities ? JSON.parse(amenities) : []
    };

    const property = new Property(propertyData);
    await property.save();

    // Populate host information
    await property.populate('host', 'name avatar');

    res.status(201).json({
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update a property
// @access  Private (Property owner only)
router.put('/:id', auth, uploadMultiple, handleUploadError, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 20, max: 1000 }).withMessage('Description must be between 20 and 1000 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('maxGuests').optional().isInt({ min: 1 }).withMessage('Max guests must be at least 1'),
  body('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms cannot be negative'),
  body('bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms cannot be negative')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user owns the property
    if (property.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    // Update property data
    const updateData = { ...req.body };
    
    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Parse JSON fields if they exist
    if (updateData.address) {
      updateData.address = JSON.parse(updateData.address);
    }
    if (updateData.amenities) {
      updateData.amenities = JSON.parse(updateData.amenities);
    }
    if (updateData.latitude && updateData.longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(updateData.longitude), parseFloat(updateData.latitude)]
      };
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('host', 'name avatar');

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/properties/:id
// @desc    Delete a property
// @access  Private (Property owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user owns the property
    if (property.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/properties/user/:userId
// @desc    Get properties by user ID
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const properties = await Property.find({ 
      host: req.params.userId, 
      isActive: true 
    }).populate('host', 'name avatar');

    res.json({ properties });
  } catch (error) {
    console.error('Get user properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
