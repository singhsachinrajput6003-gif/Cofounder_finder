const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 'company' = Company Owner  |  'seeker' = User
    accountType: { type: String, enum: ['company', 'seeker', 'investor'], default: 'seeker' },
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    lookingFor: { type: [String], default: [] },
    experience: { type: String, default: '' },
        // 'company' = Company Owner  |  'seeker' = User
        role: { type: String, default: 'User' },
    location: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ID card verification
    idCard: {
        url: { type: String, default: '' },           // base64 or URL
        status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
        submittedAt: { type: Date },
        reviewedAt: { type: Date }
    },

    // Profile views — who viewed this profile
    profileViews: [{
        viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
