
const router = require('express').Router();

const Feedback = require('../models/Feedback');

const {
  requireAuth,
  requireRole
} = require('../middleware/auth');

// ==========================================
// BASIC RATE LIMITING
// ==========================================

const attempts = new Map();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REVIEWS = 5;

function rateLimit(req, res, next) {
  const now = Date.now();

  // Remove expired entries
  for (const [ip, entry] of attempts) {
    if (entry.expires <= now) {
      attempts.delete(ip);
    }
  }

  const ip = req.ip || req.socket.remoteAddress;

  let entry = attempts.get(ip);

  if (!entry) {
    entry = {
      count: 0,
      expires: now + WINDOW_MS
    };

    attempts.set(ip, entry);
  }

  if (entry.count >= MAX_REVIEWS) {
    return res.status(429).json({
      error: 'Too many submissions. Please try again later.'
    });
  }

  entry.count += 1;
  next();
}

// ==========================================
// PUBLIC — SUBMIT FEEDBACK WITHOUT LOGIN
// ==========================================

router.post('/', rateLimit, async (req, res) => {
  try {
    const {
      name,
      rating,
      comment,
      website
    } = req.body || {};

    // Honeypot spam protection
    if (website) {
      return res.status(201).json({
        ok: true
      });
    }

    const cleanName =
      typeof name === 'string'
        ? name.trim()
        : '';

    const cleanComment =
      typeof comment === 'string'
        ? comment.trim()
        : '';

    // Rating must be an integer between 1 and 5
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        error: 'Please select a rating from 1 to 5.'
      });
    }

    // No minimum character requirement.
    // "Good", "Bad", "Nice" or even one character is accepted.
    // Empty feedback is not accepted.
    if (
      cleanComment.length === 0 ||
      cleanComment.length > 1000
    ) {
      return res.status(400).json({
        error: 'Please write your feedback (maximum 1000 characters).'
      });
    }

    if (cleanName.length > 80) {
      return res.status(400).json({
        error: 'Name must be 80 characters or fewer.'
      });
    }

    // Save submitted feedback in MongoDB
    await Feedback.create({
      name: cleanName || 'Anonymous',
      rating,
      comment: cleanComment,
      status: 'New'
    });

    return res.status(201).json({
      ok: true,
      message: 'Feedback submitted successfully.'
    });

  } catch (err) {
    console.error('Feedback submission error:', err);

    return res.status(500).json({
      error: 'Could not submit feedback.'
    });
  }
});

// ==========================================
// ADMIN-ONLY ROUTES
// ==========================================

// All routes below require a valid Admin account
router.use(requireAuth, requireRole('Admin'));

// ==========================================
// GET ALL FEEDBACK AND STATISTICS
// ==========================================

router.get('/', async (req, res) => {
  try {
    // Newest 200 reviews
    const reviews = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Calculate review statistics
    const summary = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          },
          average: {
            $avg: '$rating'
          },
          newCount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'New'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = summary[0] || {
      total: 0,
      average: 0,
      newCount: 0
    };

    return res.json({
      feedback: reviews.map((item) => ({
        id: String(item._id),
        name: item.name,
        rating: item.rating,
        comment: item.comment,
        status: item.status,
        createdAt: item.createdAt
      })),

      stats: {
        total: stats.total,
        average: Number(
          (stats.average || 0).toFixed(1)
        ),
        newCount: stats.newCount
      }
    });

  } catch (err) {
    console.error('Feedback retrieval error:', err);

    return res.status(500).json({
      error: 'Could not load feedback.'
    });
  }
});

// ==========================================
// MARK FEEDBACK AS REVIEWED
// ==========================================

router.patch('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-f]{24}$/i.test(id)) {
      return res.status(404).json({
        error: 'Feedback not found.'
      });
    }

    const review = await Feedback.findByIdAndUpdate(
      id,
      {
        status: 'Reviewed'
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!review) {
      return res.status(404).json({
        error: 'Feedback not found.'
      });
    }

    return res.json({
      ok: true,
      message: 'Feedback marked as reviewed.'
    });

  } catch (err) {
    console.error('Feedback update error:', err);

    return res.status(500).json({
      error: 'Could not update feedback.'
    });
  }
});

module.exports = router;
