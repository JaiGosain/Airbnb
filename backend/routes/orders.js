const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// helper to generate a unique-ish order number
const genOrderNumber = () => {
  const now = Date.now().toString(); // ms since epoch
  const suffix = Math.floor(Math.random() * 9000) + 1000; // 4-digit random
  return `ORD-${now.slice(-6)}-${suffix}`; // e.g. ORD-543210-4821
};

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.property', 'title images address')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.property', 'title images address')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/create
// @desc    Create order from cart
// @access  Private
router.post('/create', auth, [
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay']).withMessage('Valid payment method is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('ZIP code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('billingAddress.street').notEmpty().withMessage('Billing street address is required'),
  body('billingAddress.city').notEmpty().withMessage('Billing city is required'),
  body('billingAddress.state').notEmpty().withMessage('Billing state is required'),
  body('billingAddress.zipCode').notEmpty().withMessage('Billing ZIP code is required'),
  body('billingAddress.country').notEmpty().withMessage('Billing country is required')
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

    const { paymentMethod, shippingAddress, billingAddress } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.property');

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalFees = cart.items.reduce((sum, item) => sum + ((item.cleaningFee || 0) + (item.serviceFee || 0)), 0);
    const totalTaxes = cart.items.reduce((sum, item) => sum + (item.taxes || 0), 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    // Create order — ensure orderNumber always present (server-side generation)
    const orderPayload = {
      orderNumber: genOrderNumber(),
      user: req.user._id,
      items: cart.items,
      totalItems: cart.items.length,
      subtotal,
      totalFees,
      totalTaxes,
      totalAmount,
      paymentMethod,
      shippingAddress,
      billingAddress,
      paymentStatus: 'pending',
      orderStatus: 'pending'
    };

    const order = new Order(orderPayload);
    await order.save();

    // Create bookings for each item
    for (const item of cart.items) {
      const booking = new Booking({
        property: item.property._id,
        guest: req.user._id,
        host: item.property.host,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        guests: item.guests,
        totalGuests: item.totalGuests,
        pricePerNight: item.pricePerNight,
        nights: item.nights,
        subtotal: item.subtotal,
        cleaningFee: item.cleaningFee,
        serviceFee: item.serviceFee,
        taxes: item.taxes,
        totalPrice: item.totalPrice,
        specialRequests: item.specialRequests,
        status: 'pending',
        paymentStatus: 'pending'
      });

      await booking.save();
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Populate order with property details
    await order.populate('items.property', 'title images address');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/:id/create-razorpay-order
// @desc    Create Razorpay order
// @access  Private
router.post('/:id/create-razorpay-order', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create payment for this order' });
    }

    // Check if order is pending
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Order payment has already been processed' });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // Convert to paise (multiply by 100)
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      }
    });

    res.json({
      message: 'Razorpay order created successfully',
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.totalAmount
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/orders/:id/verify-razorpay-payment
// @desc    Verify Razorpay payment
// @access  Private
router.post('/:id/verify-razorpay-payment', auth, [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required')
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to verify payment for this order' });
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      order.paymentStatus = 'failed';
      await order.save();

      return res.status(400).json({
        message: 'Payment verification failed. Invalid signature.',
        order
      });
    }

    // Payment verified successfully
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.paymentDetails = {
      transactionId: razorpay_payment_id,
      paymentIntentId: razorpay_order_id,
      paidAt: new Date(),
      paymentMethod: 'razorpay'
    };

    await order.save();

    // Update bookings
    await Booking.updateMany(
      { guest: req.user._id, status: 'pending' },
      { 
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    );

    res.json({
      message: 'Payment verified and processed successfully',
      order,
      paymentDetails: order.paymentDetails
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/orders/:id/payment
// @desc    Process payment for order (for non-Razorpay methods)
// @access  Private
router.post('/:id/payment', auth, [
  body('paymentDetails').isObject().withMessage('Payment details are required')
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

    const { paymentDetails } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to process payment for this order' });
    }

    // Check if order is pending
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Order payment has already been processed' });
    }

    // If payment method is Razorpay, redirect to Razorpay flow
    if (order.paymentMethod === 'razorpay') {
      return res.status(400).json({ 
        message: 'Please use Razorpay payment flow. Use /create-razorpay-order endpoint first.' 
      });
    }

    // Simulate payment processing for other methods
    // In a real application, you would integrate with Stripe, PayPal, etc.
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

    if (paymentSuccess) {
      // Update order
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.paymentDetails = {
        transactionId: `TXN-${Date.now()}`,
        paymentIntentId: `PI-${Date.now()}`,
        paidAt: new Date()
      };

      await order.save();

      // Update bookings
      await Booking.updateMany(
        { guest: req.user._id, status: 'pending' },
        { 
          status: 'confirmed',
          paymentStatus: 'paid'
        }
      );

      res.json({
        message: 'Payment processed successfully',
        order,
        paymentDetails: order.paymentDetails
      });
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      await order.save();

      res.status(400).json({
        message: 'Payment failed. Please try again.',
        order
      });
    }
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled
    if (order.orderStatus === 'completed') {
      return res.status(400).json({ message: 'Completed orders cannot be cancelled' });
    }

    // Update order
    order.orderStatus = 'cancelled';
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    await order.save();

    // Update bookings
    await Booking.updateMany(
      { guest: req.user._id, status: { $in: ['pending', 'confirmed'] } },
      { 
        status: 'cancelled',
        paymentStatus: order.paymentStatus
      }
    );

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



