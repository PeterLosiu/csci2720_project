// routes/user.js
// Frontend can access user info and favorite locations:
// GET /api/user/info/userId/:userId
// GET /api/user/favorites/userId/:userId
// Admin can manage users:


const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// public routes (only users can access)
router.get('/info/userId/:userId', protect, userController.getInfoById);
router.get('/favorites/userId/:userId', protect, userController.getFavoriteLocationsById);

// admin routes (only admins can access)
router.post('/', protect, adminOnly, userController.createUser);
router.get('/', protect, adminOnly, userController.getAllUsers);
router.get('/:id', protect, adminOnly, userController.getUserById);
router.put('/:id', protect, adminOnly, userController.updateUser);
router.delete('/:id', protect, adminOnly, userController.deleteUser);


module.exports = router;