const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/userSchema');
const ActivityLog = require('./models/activityLogSchema');
const logActivity = require('./utils/activity');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken'); 

const app = express();
app.use(express.json());

const JWT_SECRET = 'letsFight'; 


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Check if user is blocked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60)); // Time in minutes
            return res.status(403).json({ message: `User is blocked. Try again in ${lockTimeRemaining} minutes.` });
        }

        // Validate password
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        console.log(isPasswordValid);
        if (!isPasswordValid) {
            user.failedAttempts += 1;
            console.log("wrong password")

            // Block user after 3 failed attempts
            if (user.failedAttempts >= 3) {
                user.lockUntil = Date.now() + 2 * 60 * 1000;  // Block for 2 minutes
                await user.save();
                return res.status(403).json({ message: 'Account locked. Try again after 2 minutes.' });
            }

            await user.save();
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Reset failed attempts if login is successful
        user.failedAttempts = 0;
        user.lockUntil = null;
        await user.save();

        // Log user activity
        logActivity(user._id, 'User logged in', req.ip);
        // Generate a JWT token
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        // Login successful, return token
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create a new user
        user = new User({
            username,
            password: hashedPassword
        });

        // Save the user to the database
        await user.save();

        logActivity(user._id, 'User registered', req.ip);

        // Respond with success message
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/logs', (req,res) =>{
    try{
        const logs = ActivityLog.find();
        res.json(logs);
    }catch(err){
        res.status(500).json({message: err.message})
    }
})
// MongoDB connection
mongoose.connect('mongodb://localhost:27017/winter')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Start server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
