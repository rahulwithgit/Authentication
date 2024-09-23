const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const activityLogSchema = new mongoose.Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model
    activity: { type: String, required: true },
    // timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String }, // Optional: to store the IP address
}, { timestamps: true });  // Add timestamps option

module.exports = mongoose.model('ActivityLog', activityLogSchema);