// controllers/commentController.js
const Comment = require('../models/comment');
const Location = require('../models/Location');

// GET /api/comments/location/:locationId
// List comments for one location
exports.getCommentsForLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    // make sure location exists (optional but nice)
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const comments = await Comment.find({ location: locationId })
      .populate('user', 'username') // include username only
      .sort({ createdAt: -1 }) // newest first
      .lean();

    return res.json(comments);
  } catch (err) {
    console.error('getCommentsForLocation error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to fetch comments for location' });
  }
};

// POST /api/comments/location/:locationId
// Body: { content }
exports.createComment = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { locationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const comment = await Comment.create({
      content: content.trim(),
      user: userId,
      location: locationId,
    });

    // also link comment into Location.comments array
    location.comments.push(comment._id);
    await location.save();

    await comment.populate({ path: 'user', select: 'username' });

    return res.status(201).json(comment);
  } catch (err) {
    console.error('createComment error:', err);
    return res.status(500).json({ message: 'Failed to create comment' });
  }
};

// DELETE /api/comments/:commentId
// only the comment owner OR an admin can delete
exports.deleteCommentIfOwner = async (req, res) => {
  try {
    const { commentId } = req.params;
    const currentUser = req.user;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isOwner = comment.user.toString() === currentUser._id.toString();
    const isAdmin = currentUser.isAdmin;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to delete this comment' });
    }

    await Comment.deleteOne({ _id: commentId });

    // remove from Location.comments
    await Location.findByIdAndUpdate(comment.location, {
      $pull: { comments: commentId },
    });

    return res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('deleteCommentIfOwner error:', err);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
};