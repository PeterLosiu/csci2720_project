// Frontend can call these APIs:
// /api/auth/register + body:{username, password}-> register new user
// /api/auth/login + body:{username, password}-> login existing user

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.registerUser);
router.post('/login', authController.login);

module.exports = router;