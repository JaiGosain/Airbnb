const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required']
  },
  checkOut: {
    type: Date,
    required: [true, 'Check-out date is required']
  },
  guests: {
    adults: {
      type: Number,
      required: [true, 'Number of adults is required'],
      min: [1, 'At least 1 adult is required']
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Children count cannot be negative']
    },
    infants: {
      type: Number,
      default: 0,
      min: [0, 'Infants count cannot be negative']
    }
  },
  totalGuests: {
    type: Number,
    required: true
  },
  pricePerNight: {
    type: Number,
    required: true
  },
  nights: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  cleaningFee: {
    type: Number,
    default: 0
  },
  serviceFee: {
    type: Number,
    default: 0
  },
  taxes: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot be more than 500 characters']
  },
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'moderate'
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate totals
bookingSchema.pre('save', function(next) {
  if (this.isModified('checkIn') || this.isModified('checkOut') || this.isModified('guests')) {
    // Calculate number of nights
    const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
    this.nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Calculate total guests
    this.totalGuests = this.guests.adults + this.guests.children + this.guests.infants;
    
    // Calculate subtotal
    this.subtotal = this.pricePerNight * this.nights;
    
    // Calculate total price (subtotal + fees + taxes)
    this.totalPrice = this.subtotal + this.cleaningFee + this.serviceFee + this.taxes;
  }
  next();
});

// Validation to ensure check-out is after check-in
bookingSchema.pre('validate', function(next) {
  if (this.checkOut <= this.checkIn) {
    next(new Error('Check-out date must be after check-in date'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);

