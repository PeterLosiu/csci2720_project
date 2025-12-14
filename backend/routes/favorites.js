// routes/favorites.js
// Add to favourites: POST /api/favorites/locations with { locationId }.
// Remove from favourites: DELETE /api/favorites/locations/:locationId.

const express = require('express');
const router = express.Router();

const favoriteController = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

// User must be logged in for all favourites actions
router.post('/locations', protect, favoriteController.addFavoriteLocation);
router.get('/locations', protect, favoriteController.getFavoriteLocations);
router.delete(
  '/locations/:locationId',
  protect,
  favoriteController.removeFavoriteLocation
);

module.exports = router;