// routes/locations.js
// Now your frontend can call:
// /api/locations?sortBy=name&order=asc
// /api/locations?sortBy=distance&order=asc
// /api/locations?sortBy=events&order=desc
// to build the table and sort columns.
//Use /api/locations to get all markers for the map.
//Use /api/locations/:id for the single-location view (details + distance).

// routes/locations.js
const express = require('express');
const router = express.Router();

const locationController = require('../controllers/locationController');
const { protect } = require('../middleware/auth');

// According to spec, usually only authenticated users see app contents,
// so I'm using protect here.
router.get('/', protect, locationController.getLocationList);
router.get('/:id', protect, locationController.getLocationById);

module.exports = router;