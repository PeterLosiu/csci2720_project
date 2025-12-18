const UserModel = require('../models/User.js');
const jwt = require('jsonwebtoken');
const {isDuplicate, validatePassword} = require('../middleware/userAuth.js');


class userController {
    // Getter methods (public)
    static async getTokenInfo(req, res) {
        let token;
        // Expect header: Authorization: Bearer <token>
        // get token from header
        if (  
          req.headers.authorization && 
            req.headers.authorization.startsWith('Bearer ')
        ) {
          token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
          return res.status(401).json({ message: 'Not authorized, no token provided' });
        }
        return token;
    }
    
    static async getInfo(req, res) {
        // get token from request
        let token = await userController.getTokenInfo(req, res);
        try {
            // token has to be verified
            const decoded = jwt.verify(
              token,
              process.env.JWT_SECRET || 'dev_jwt_secret' // use env var in production
            );
            const user = await UserModel.findById(decoded.id).select('-password'); // exclude password
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user);
        } catch (err) {
            console.error('Get user info error:', err);
            res.status(500).json({ message: 'Server error while fetching user info' });
        }   
    }

    static async getInfoById(req, res) {
        /**
         * Fetch user information by user ID
         */
        const userId = req.params.userId;
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
    static async getFavoriteLocations(req, res) {
        // get token infor from request
        let token = await userController.getTokenInfo(req, res);
        try {
            // token has to be verified
            const decoded = jwt.verify(
              token,
              process.env.JWT_SECRET || 'dev_jwt_secret' // use env var in production
            );
            const user = await UserModel.findById(decoded.id).populate('favoriteLocations'); // exclude password
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user.favoriteLocations);
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
    // CRUD Users (admin)
    // Create
    static async createUser(req, res) {
        const { username, password, isAdmin } = req.body;
        try {
            // check if user already exists
            const duplicate = isDuplicate(username, res);
            if(!duplicate.success){res.status(400).json({message: duplicate.message})}
            // check if new password meets criteria
            const validPassword = validatePassword(password, res);
            if(!validPassword.success){res.status(400).json({message: validPassword.message})}
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
            // check if updates are provided
            if(!updates){
                return res.status(400).json({message: 'Request body is required'});
            }
            // validate updates
            const duplicate = await isDuplicate(userId, updates.username, res);
            if(!duplicate.success){
                return res.status(400).json({ message: duplicate.message });
            }
            if(updates.password){
                const validPassword = await validatePassword(updates.password);
                if(!validPassword){
                    return res.status(400).json({ message: validPassword.message });
                }
            }
            // perform update
            const updatedUser = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ message: 'User updated successfully', updatedUser });
        } catch (error) {
            console.log(error)
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