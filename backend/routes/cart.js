const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Property = require('../models/Property');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.property', 'title images address price maxGuests');

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    res.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', auth, [
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  body('guests.adults').isInt({ min: 1 }).withMessage('At least 1 adult is required'),
  body('guests.children').optional().isInt({ min: 0 }).withMessage('Children count cannot be negative'),
  body('guests.infants').optional().isInt({ min: 0 }).withMessage('Infants count cannot be negative'),
  body('specialRequests').optional().isLength({ max: 500 }).withMessage('Special requests cannot exceed 500 characters')
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

    const { propertyId, checkIn, checkOut, guests, specialRequests } = req.body;

    // Get property details
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if property is active
    if (!property.isActive) {
      return res.status(400).json({ message: 'Property is not available' });
    }

    // Check guest capacity
    const totalGuests = guests.adults + (guests.children || 0) + (guests.infants || 0);
    if (totalGuests > property.maxGuests) {
      return res.status(400).json({ 
        message: `Maximum ${property.maxGuests} guests allowed for this property` 
      });
    }

    // Calculate pricing
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    const subtotal = property.price * nights;
    const cleaningFee = Math.round(subtotal * 0.1); // 10% cleaning fee
    const serviceFee = Math.round(subtotal * 0.15); // 15% service fee
    const taxes = Math.round(subtotal * 0.08); // 8% tax
    const totalPrice = subtotal + cleaningFee + serviceFee + taxes;

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.property.toString() === propertyId
    );

    const cartItem = {
      property: propertyId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalGuests,
      nights,
      pricePerNight: property.price,
      subtotal,
      cleaningFee,
      serviceFee,
      taxes,
      totalPrice,
      specialRequests
    };

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex] = cartItem;
    } else {
      // Add new item
      cart.items.push(cartItem);
    }

    await cart.save();

    // Populate cart with property details
    await cart.populate('items.property', 'title images address price maxGuests');

    res.json({
      message: 'Item added to cart successfully',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cart/update/:itemId
// @desc    Update cart item
// @access  Private
router.put('/update/:itemId', auth, [
  body('checkIn').optional().isISO8601().withMessage('Valid check-in date is required'),
  body('checkOut').optional().isISO8601().withMessage('Valid check-out date is required'),
  body('guests.adults').optional().isInt({ min: 1 }).withMessage('At least 1 adult is required'),
  body('guests.children').optional().isInt({ min: 0 }).withMessage('Children count cannot be negative'),
  body('guests.infants').optional().isInt({ min: 0 }).withMessage('Infants count cannot be negative'),
  body('specialRequests').optional().isLength({ max: 500 }).withMessage('Special requests cannot exceed 500 characters')
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

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const item = cart.items[itemIndex];
    const property = await Property.findById(item.property);

    // Update item data
    if (req.body.checkIn) item.checkIn = new Date(req.body.checkIn);
    if (req.body.checkOut) item.checkOut = new Date(req.body.checkOut);
    if (req.body.guests) {
      item.guests = { ...item.guests, ...req.body.guests };
      item.totalGuests = item.guests.adults + (item.guests.children || 0) + (item.guests.infants || 0);
    }
    if (req.body.specialRequests !== undefined) {
      item.specialRequests = req.body.specialRequests;
    }

    // Recalculate pricing
    const nights = Math.ceil((item.checkOut - item.checkIn) / (1000 * 60 * 60 * 24));
    item.nights = nights;
    item.subtotal = property.price * nights;
    item.cleaningFee = Math.round(item.subtotal * 0.1);
    item.serviceFee = Math.round(item.subtotal * 0.15);
    item.taxes = Math.round(item.subtotal * 0.08);
    item.totalPrice = item.subtotal + item.cleaningFee + item.serviceFee + item.taxes;

    await cart.save();

    // Populate cart with property details
    await cart.populate('items.property', 'title images address price maxGuests');

    res.json({
      message: 'Cart item updated successfully',
      cart
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/remove/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    // Populate cart with property details
    await cart.populate('items.property', 'title images address price maxGuests');

    res.json({
      message: 'Item removed from cart successfully',
      cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({
      message: 'Cart cleared successfully',
      cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



