const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// ── Get all users (without passwords)
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
        res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Get only Users (for Company Owner dashboard)
router.get('/seekers', auth, async (req, res) => {
    try {
        const seekers = await User.find({ _id: { $ne: req.user.id }, accountType: 'seeker' })
            .select('-password');
        res.json(seekers);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Get pending ID card verifications (admin/company only)
router.get('/pending-ids', auth, async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (me.accountType !== 'company' && me.role !== 'Company Owner' && me.role !== 'Founder') return res.status(403).json({ error: 'Forbidden' });
        const users = await User.find({ 'idCard.status': 'pending' })
            .select('firstName lastName email role accountType bio skills location idCard');
        res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Get own profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
            .populate('profileViews.viewerId', 'firstName lastName role accountType');
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Get full profile of another user (logs view + includes idCard)
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        // Log profile view (avoid duplicates within 1 hour)
        const recentView = user.profileViews.find(
            v => v.viewerId?.toString() === req.user.id &&
                 new Date() - new Date(v.viewedAt) < 3600000
        );
        if (!recentView && req.user.id !== req.params.id) {
            user.profileViews.push({ viewerId: req.user.id, viewedAt: new Date() });
            await user.save();
        }
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Update own profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { idCard, profileViews, password, ...updates } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
            .select('-password').populate('profileViews.viewerId', 'firstName lastName role');
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Upload ID card (base64)
router.post('/upload-id', auth, async (req, res) => {
    try {
        const { idCardBase64 } = req.body;
        if (!idCardBase64) return res.status(400).json({ error: 'No ID card data provided' });
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { idCard: { url: idCardBase64, status: 'pending', submittedAt: new Date() } },
            { new: true }
        ).select('-password');
        res.json({ message: 'ID card submitted for review', status: user.idCard.status });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Approve or reject ID card (company/admin only)
router.post('/review-id/:userId', auth, async (req, res) => {
    try {
        const me = await User.findById(req.user.id);
        if (me.accountType !== 'company' && me.role !== 'Company Owner' && me.role !== 'Founder') return res.status(403).json({ error: 'Forbidden' });
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { 'idCard.status': status, 'idCard.reviewedAt': new Date() },
            { new: true }
        ).select('firstName lastName idCard');
        res.json({ message: `ID card ${status}`, user });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
