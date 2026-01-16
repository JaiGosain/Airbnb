const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
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
  rating: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    cleanliness: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    communication: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    checkIn: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    accuracy: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    location: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    value: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    }
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [1000, 'Review comment cannot be more than 1000 characters']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  response: {
    text: {
      type: String,
      maxlength: [1000, 'Response cannot be more than 1000 characters']
    },
    respondedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
reviewSchema.index({ property: 1, createdAt: -1 });
reviewSchema.index({ guest: 1, createdAt: -1 });

// Pre-save middleware to update property ratings
reviewSchema.post('save', async function() {
  try {
    const Property = mongoose.model('Property');
    const property = await Property.findById(this.property);
    
    if (property) {
      // Calculate new average rating
      const reviews = await mongoose.model('Review').find({ property: this.property });
      const totalRating = reviews.reduce((sum, review) => sum + review.rating.overall, 0);
      const averageRating = totalRating / reviews.length;
      
      // Update property ratings
      property.ratings.average = Math.round(averageRating * 10) / 10; // Round to 1 decimal
      property.ratings.count = reviews.length;
      
      await property.save();
    }
  } catch (error) {
    console.error('Error updating property ratings:', error);
  }
});

// Pre-remove middleware to update property ratings when review is deleted
reviewSchema.post('remove', async function() {
  try {
    const Property = mongoose.model('Property');
    const property = await Property.findById(this.property);
    
    if (property) {
      // Recalculate average rating
      const reviews = await mongoose.model('Review').find({ property: this.property });
      
      if (reviews.length === 0) {
        property.ratings.average = 0;
        property.ratings.count = 0;
      } else {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating.overall, 0);
        const averageRating = totalRating / reviews.length;
        
        property.ratings.average = Math.round(averageRating * 10) / 10;
        property.ratings.count = reviews.length;
      }
      
      await property.save();
    }
  } catch (error) {
    console.error('Error updating property ratings after review deletion:', error);
  }
});

module.exports = mongoose.model('Review', reviewSchema);

