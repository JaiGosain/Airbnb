const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id })
      .populate('property', 'title images address price')
      .populate('host', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/host
// @desc    Get bookings for host's properties
// @access  Private (Host only)
router.get('/host', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ host: req.user._id })
      .populate('property', 'title images address')
      .populate('guest', 'name avatar email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get host bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property', 'title images address price host')
      .populate('guest', 'name avatar email')
      .populate('host', 'name avatar email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the guest or host
    if (booking.guest._id.toString() !== req.user._id.toString() && 
        booking.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', auth, [
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

    // Check if user is trying to book their own property
    if (property.host.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot book your own property' });
    }

    // Check if property is active
    if (!property.isActive) {
      return res.status(400).json({ message: 'Property is not available for booking' });
    }

    // Check guest capacity
    const totalGuests = guests.adults + (guests.children || 0) + (guests.infants || 0);
    if (totalGuests > property.maxGuests) {
      return res.status(400).json({ 
        message: `Maximum ${property.maxGuests} guests allowed for this property` 
      });
    }

    // Check for overlapping bookings
    const existingBooking = await Booking.findOne({
      property: propertyId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) }
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ 
        message: 'Property is not available for the selected dates' 
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

    // Create booking
    const booking = new Booking({
      property: propertyId,
      guest: req.user._id,
      host: property.host,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalGuests,
      pricePerNight: property.price,
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      taxes,
      totalPrice,
      specialRequests
    });

    await booking.save();

    // Populate booking details
    await booking.populate([
      { path: 'property', select: 'title images address' },
      { path: 'guest', select: 'name avatar email' },
      { path: 'host', select: 'name avatar email' }
    ]);

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (confirm/cancel)
// @access  Private
router.put('/:id/status', auth, [
  body('status').isIn(['confirmed', 'cancelled']).withMessage('Status must be confirmed or cancelled')
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

    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    const isGuest = booking.guest.toString() === req.user._id.toString();
    const isHost = booking.host.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Business logic for status changes
    if (status === 'confirmed') {
      // Only host can confirm bookings
      if (!isHost) {
        return res.status(403).json({ message: 'Only the host can confirm bookings' });
      }
      if (booking.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending bookings can be confirmed' });
      }
    } else if (status === 'cancelled') {
      // Both guest and host can cancel, but with different rules
      if (booking.status === 'completed') {
        return res.status(400).json({ message: 'Completed bookings cannot be cancelled' });
      }
    }

    // Update booking status
    booking.status = status;
    if (status === 'cancelled') {
      booking.paymentStatus = 'refunded';
    }
    
    await booking.save();

    // Populate booking details
    await booking.populate([
      { path: 'property', select: 'title images address' },
      { path: 'guest', select: 'name avatar email' },
      { path: 'host', select: 'name avatar email' }
    ]);

    res.json({
      message: `Booking ${status} successfully`,
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete a booking (only if pending)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the guest
    if (booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    // Only allow deletion of pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending bookings can be deleted' 
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



