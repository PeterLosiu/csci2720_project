const UserModel = require('../models/user.js');

const isExist = async (username, res) => {
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
    }
}

const validatePassword = (password, res) => {
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
}

module.exports = { isExist, validatePassword };