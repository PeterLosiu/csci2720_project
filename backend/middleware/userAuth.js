const UserModel = require('../models/User.js');

const isDuplicate = async (userId, username) => {
    const existingUser = await UserModel.findOne({ username });
    if (existingUser && existingUser._id != userId) {
        console.log('User name already exists!')
        return { 
            success: false, 
            message: 'User name already exists!' 
        };
    }
    return { success: true };
}

const validatePassword = (password) => {
    if (password.length < 8) {
        console.log('User name already exists!')
        return { 
                success: false, 
                message: 'Password must be at least 8 characters long' 
            };    
    }
    return { success: true };
}

module.exports = { isDuplicate, validatePassword };