const UserModel = require('../models/userModel');

class userController {
    // 1. Getter methods
    static async getInfoById(req, res) {
        /**
         * Fetch user information by user ID
         */
        const userId = req.params.id;
        try {
            const user = await UserModel.findById(userId).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user);
        } catch (err) {
            console.error('Get user info error:', err);
            res.status(500).json({ message: 'Server error while fetching user info' });
        }
    }
    static async getFavoriteLocationsById(req, res) {
        const userId = req.params.userId;
        try {
            const user = await UserModel.findById(userId).populate('favoriteLocations');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user.favoriteLocations);
        }catch (err) {
            console.error('Get user favorites error:', err);
            res.status(500).json({ message: 'Server error while fetching user favorites' });
        }
    }

}