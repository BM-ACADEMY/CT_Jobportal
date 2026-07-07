const Review = require('../models/Review');

// @desc  Submit or update user review
// @route POST /api/reviews
const submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // User can only have one active review, update if exists
    let review = await Review.findOne({ user: req.user.id });
    
    if (review) {
      review.rating = rating;
      review.comment = comment;
      review.status = 'pending'; // Reset status to pending after edit
      await review.save();
    } else {
      review = await Review.create({
        user: req.user.id,
        rating,
        comment
      });
    }
    
    res.status(201).json(review);
  } catch (err) {
    console.error('Submit Review Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc  Get current user's review
// @route GET /api/reviews/my
const getMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({ user: req.user.id });
    res.json(review);
  } catch (err) {
    console.error('Get My Review Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc  Get all reviews (Admin only)
// @route GET /api/reviews/admin/all
const getAllReviews = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const reviews = await Review.find(query)
      .populate('user', 'name avatar role display_id')
      .populate({
        path: 'user',
        populate: { path: 'role', select: 'name' }
      })
      .sort({ createdAt: -1 });
      
    res.json(reviews);
  } catch (err) {
    console.error('Get All Reviews Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc  Approve/Reject review (Admin only)
// @route PATCH /api/reviews/admin/:id
const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name avatar role');
    
    if (!review) return res.status(404).json({ msg: 'Review not found' });
    
    res.json(review);
  } catch (err) {
    console.error('Update Review Status Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc  Get approved reviews for homepage
// @route GET /api/reviews/approved
const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .populate('user', 'name avatar role')
      .populate({
        path: 'user',
        populate: { path: 'role', select: 'name' }
      })
      .sort({ updatedAt: -1 })
      .limit(20); // Limit to top 20 recent approved reviews
      
    res.json(reviews);
  } catch (err) {
    console.error('Get Approved Reviews Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = {
  submitReview,
  getMyReview,
  getAllReviews,
  updateReviewStatus,
  getApprovedReviews
};
