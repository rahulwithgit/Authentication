const ActivityLog = require('../models/activityLogSchema');

// Function to log user activity by referencing User model
const logActivity = async (userId, activity, ipAddress = '-') => {
  try {
    const log = new ActivityLog({
      user: userId, // Pass the User's ObjectId here
      activity,
      ipAddress
    });
    await log.save();
    console.log('Activity logged:', activity);
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

module.exports = logActivity;