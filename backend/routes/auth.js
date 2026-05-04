const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, accountType } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = new User({
            firstName, lastName, email, password,
            accountType: accountType || 'seeker',
            role: accountType === 'company' ? 'Company Owner' : 'User'
        });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.status(201).json({
            token,
            user: { id: user._id, firstName, lastName, email, accountType: user.accountType }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ token, user: { 
            id: user._id, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email, 
            profileImage: user.profileImage,
            accountType: user.accountType,
            role: user.role
        } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
