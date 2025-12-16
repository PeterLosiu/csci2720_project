const jwt = require('jsonwebtoken');
const UserModel = require('../models/User.js');
const {isDuplicate, validatePassword} = require('../middleware/userAuth.js');


class authController {
    
    static async registerUser(req, res) {
        const { username, password } = req.body;
        try {
            // check if user already exists
            const duplicate = isDuplicate(username, res);
            if(!duplicate.success){res.status(400).json({message: duplicate.message})}
            // check if new password meets criteria
            const validPassword = validatePassword(password, res);
            if(!validPassword.success){res.status(400).json({message: validPassword.message})}
            // create new user
            const newUser = new UserModel({username: username, password: password, isAdmin: false});
            await newUser.save();
            res.status(201).json({ message: 'User registered successfully', userId: newUser._id, username: newUser.username});
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ message: 'Server error during registration' });
        }
    }

    static async login(req, res) {
        /**
         * 1. req.body should contain { username, password }
         * 2. Validate user credentials against the database
         * 3. If valid, generate a JWT token and return it
         * 4. If invalid, return an error response
         */
        const { username, password } = req.body;
        try {
            const user = await UserModel.findOne({ username });
            // check if user not found
            if (!user) {
                return res.status(401).json({ message: 'Authentication failed: User not found' });
            }
            const isMatch = await user.comparePassword(password);
            // check if password does not match
            if (!isMatch) {
                return res.status(401).json({ message: 'Authentication failed: Incorrect password' });
            }
            // generate JWT token if credentials are valid
            const token = jwt.sign(
                { id: user._id, username: user.username, isAdmin: user.isAdmin },
                'dev_jwt_secret',
                { expiresIn: '1h' }     
            );
            // send token in response
            res.status(200).json({
                message: 'Login successful',
                token,
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ message: 'Server error during login' });
        }
    }
}

module.exports = authController;