const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reviews/:propertyId
// @desc    Get reviews for a property
// @access  Public
router.get('/:propertyId', async (req, res) => {
  try {
    const reviews = await Review.find({ 
      property: req.params.propertyId,
      isPublic: true 
    })
      .populate('guest', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', auth, [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('rating.overall').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('rating.cleanliness').optional().isInt({ min: 1, max: 5 }).withMessage('Cleanliness rating must be between 1 and 5'),
  body('rating.communication').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('rating.checkIn').optional().isInt({ min: 1, max: 5 }).withMessage('Check-in rating must be between 1 and 5'),
  body('rating.accuracy').optional().isInt({ min: 1, max: 5 }).withMessage('Accuracy rating must be between 1 and 5'),
  body('rating.location').optional().isInt({ min: 1, max: 5 }).withMessage('Location rating must be between 1 and 5'),
  body('rating.value').optional().isInt({ min: 1, max: 5 }).withMessage('Value rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters')
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

    const { bookingId, rating, comment } = req.body;

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('property', 'title host');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the guest of this booking
    if (booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own bookings' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ 
        message: 'You can only review completed bookings' 
      });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this booking' 
      });
    }

    // Create review
    const review = new Review({
      property: booking.property._id,
      booking: bookingId,
      guest: req.user._id,
      host: booking.property.host,
      rating,
      comment
    });

    await review.save();

    // Populate review details
    await review.populate([
      { path: 'guest', select: 'name avatar' },
      { path: 'property', select: 'title' }
    ]);

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (Review author only)
router.put('/:id', auth, [
  body('rating.overall').optional().isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('rating.cleanliness').optional().isInt({ min: 1, max: 5 }).withMessage('Cleanliness rating must be between 1 and 5'),
  body('rating.communication').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
  body('rating.checkIn').optional().isInt({ min: 1, max: 5 }).withMessage('Check-in rating must be between 1 and 5'),
  body('rating.accuracy').optional().isInt({ min: 1, max: 5 }).withMessage('Accuracy rating must be between 1 and 5'),
  body('rating.location').optional().isInt({ min: 1, max: 5 }).withMessage('Location rating must be between 1 and 5'),
  body('rating.value').optional().isInt({ min: 1, max: 5 }).withMessage('Value rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters')
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

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the author of the review
    if (review.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Update review
    const updateData = {};
    if (req.body.rating) updateData.rating = { ...review.rating, ...req.body.rating };
    if (req.body.comment) updateData.comment = req.body.comment;

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('guest', 'name avatar');

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (Review author only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the author of the review
    if (review.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews/:id/response
// @desc    Add host response to a review
// @access  Private (Property host only)
router.post('/:id/response', auth, [
  body('text').trim().isLength({ min: 10, max: 1000 }).withMessage('Response must be between 10 and 1000 characters')
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

    const { text } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the host of the property
    if (review.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the property host can respond to reviews' });
    }

    // Check if response already exists
    if (review.response.text) {
      return res.status(400).json({ message: 'Response already exists for this review' });
    }

    // Add response
    review.response = {
      text,
      respondedAt: new Date()
    };

    await review.save();

    // Populate review details
    await review.populate([
      { path: 'guest', select: 'name avatar' },
      { path: 'property', select: 'title' }
    ]);

    res.json({
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews by user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ guest: req.params.userId })
      .populate('property', 'title images address')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



