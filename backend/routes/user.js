// routes/user.js
// Frontend can access user info and favorite locations:
// GET /api/user/info/:userId
// GET /api/user/favorites/:userId
// Admin can manage users:
// POST /api/user/ + body:{username, password, isAdmin} -> create user
// GET /api/user/ -> get all users
// GET /api/user/:username -> get user by username
// PUT /api/user/:id + body:{username, password, isAdmin} -> update user
// DELETE /api/user/:id -> delete user


const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// public routes (only users can access)
router.get('/info/:userId', protect, userController.getInfoById);
router.get('/favorites/:userId', protect, userController.getFavoriteLocationsById);

// admin routes (only admins can access)
router.post('/', protect, adminOnly, userController.createUser);
router.get('/', protect, adminOnly, userController.getAllUsers);
router.get('/:username', protect, adminOnly, userController.getUserByName);
router.put('/:userId', protect, adminOnly, userController.updateUser);
router.delete('/:userId', protect, adminOnly, userController.deleteUser);


module.exports = router;