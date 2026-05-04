const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Funding = require('../models/Funding');
const Idea = require('../models/Idea');

// Create a funding (invest in an idea) - authenticated
router.post('/', auth, async (req, res) => {
    const { ideaId, amount, message } = req.body;
    const investorId = req.user.id;
    if (!ideaId || !amount) return res.status(400).json({ error: 'ideaId and amount required' });

    try {
        const idea = await Idea.findById(ideaId);
        if (!idea) return res.status(404).json({ error: 'Idea not found' });
        if (idea.founderId?.toString() === investorId) return res.status(400).json({ error: 'Founder cannot fund own idea' });

        const fund = await Funding.create({ ideaId, investorId, amount, message, status: 'completed' });
        res.json(fund);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create funding' });
    }
});

// List fundings for an idea
router.get('/idea/:ideaId', auth, async (req, res) => {
    try {
        const funds = await Funding.find({ ideaId: req.params.ideaId }).populate('investorId', 'firstName lastName email');
        res.json(funds);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch fundings' }); }
});

// List my fundings
router.get('/my', auth, async (req, res) => {
    try {
        const funds = await Funding.find({ investorId: req.user.id }).populate('ideaId');
        res.json(funds);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch fundings' }); }
});

module.exports = router;
