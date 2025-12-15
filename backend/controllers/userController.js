const UserModel = require('../models/userModel');
const {isExist, validatePassword} = require('../middleware/userAuth.js');


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

    // CRUD Users
    // Create
    static async createUser(req, res) {
        const { username, password, isAdmin } = req.body;
        try {
            // check if user already exists
            isExist(username, res);
            // check if new password meets criteria
            validatePassword(password, res);
            // create new user
            const newUser = new UserModel({ username, password, isAdmin });
            await newUser.save();
            res.status(201).json({ message: 'User created successfully', userId: newUser._id });
        }catch (error) {
            res.status(500).json({ message: 'Error creating user', error });
        }
    }
    // Read
    static async getAllUsers(req, res) {
        try {
            const users = await UserModel.find({});
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching users', error });
        }
    }
    static async getUserByName(req, res) {
        const { username } = req.params;
        try {
            const user = await UserModel.findOne({ username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching user', error });
        }
    }
    // Update
    static async updateUser(req, res) {
        const { userId } = req.params;
        const updates = req.body;
        try {
            // validate updates
            isExist(updates.username, res);
            validatePassword(updates.password, res);
            // perform update
            const updatedUser = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ message: 'User updated successfully', updatedUser });
        } catch (error) {
            res.status(500).json({ message: 'Error updating user', error });
        }
    }
    // Delete
    static async deleteUser(req, res) {
        const { userId } = req.params;
        try {
            const deletedUser = await UserModel.findByIdAndDelete(userId);
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {   
            res.status(500).json({ message: 'Error deleting user', error });
        }
    }
}

module.exports = userController;