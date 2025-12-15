// routes/locations.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// public routes (only users can access)
router.get('/info/userId/:userId', protect, userController.getInfoById);
router.get('/favorites/userId/:userId', protect, userController.getFavoriteLocationsById);

module.exports = router;