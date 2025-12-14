// controllers/favoriteController.js
const User = require('../models/user');
const Location = require('../models/Location');

// POST /api/favorites/locations
// Body: { locationId }
exports.addFavoriteLocation = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { locationId } = req.body;

    if (!locationId) {
      return res.status(400).json({ message: 'locationId is required' });
    }

    // ensure location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyFav = user.favoriteLocations.some(
      (id) => id.toString() === locationId
    );

    if (!alreadyFav) {
      user.favoriteLocations.push(locationId);
      await user.save();
    }

    return res.json({
      message: 'Location added to favourites',
      favoriteLocations: user.favoriteLocations,
    });
  } catch (err) {
    console.error('addFavoriteLocation error:', err);
    return res.status(500).json({ message: 'Failed to add favourite location' });
  }
};

// GET /api/favorites/locations
// Return full Location documents for this user
exports.getFavoriteLocations = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('favoriteLocations')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user.favoriteLocations || []);
  } catch (err) {
    console.error('getFavoriteLocations error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to fetch favourite locations' });
  }
};

// DELETE /api/favorites/locations/:locationId
exports.removeFavoriteLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { locationId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.favoriteLocations = user.favoriteLocations.filter(
      (id) => id.toString() !== locationId
    );
    await user.save();

    return res.json({
      message: 'Location removed from favourites',
      favoriteLocations: user.favoriteLocations,
    });
  } catch (err) {
    console.error('removeFavoriteLocation error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to remove favourite location' });
  }
};
