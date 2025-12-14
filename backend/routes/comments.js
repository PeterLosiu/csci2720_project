// routes/comments.js
//GET /api/locations/:id → location details + distance (backend).
// GET /api/comments/location/:id → comments (backend).
// When user posts a comment:
// POST /api/comments/location/:id with { content }.
// Allow delete button → DELETE /api/comments/:commentId.

const express = require('express');
const router = express.Router();

const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// all app contents are for authenticated users
router.get(
  '/location/:locationId',
  protect,
  commentController.getCommentsForLocation
);
router.post(
  '/location/:locationId',
  protect,
  commentController.createComment
);
router.delete(
  '/:commentId',
  protect,
  commentController.deleteCommentIfOwner
);

module.exports = router;