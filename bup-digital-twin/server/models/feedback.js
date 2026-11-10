
const mongoose = require('mongoose');

// ==========================================
// FEEDBACK SCHEMA
// ==========================================

const feedbackSchema = new mongoose.Schema(
  {
    // Reviewer name is optional
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Anonymous'
    },

    // Star rating: 1 to 5
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number.'
      }
    },

    // Written feedback
    // No minimum character requirement
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    // Admin review status
    status: {
      type: String,
      enum: ['New', 'Reviewed'],
      default: 'New'
    }
  },
  {
    timestamps: true
  }
);

// Show newest feedback first
feedbackSchema.index({
  createdAt: -1
});

// Export model
module.exports =
  mongoose.models.Feedback ||
  mongoose.model('Feedback', feedbackSchema);
