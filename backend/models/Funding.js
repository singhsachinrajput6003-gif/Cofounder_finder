const mongoose = require('mongoose');

const fundingSchema = new mongoose.Schema({
    ideaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Funding', fundingSchema);
