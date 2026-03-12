// api/update-user.js
const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_KEY = process.env.ADMIN_KEY || 'Jaswant06-8090';

app.put('/api/update_user/:username', async (req, res) => {
  try {
    await connectDB();
    
    const admin_key = req.headers['admin-key'];
    const username = req.params.username.toLowerCase();
    const updates = req.body;
    
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized"
      });
    }
    
    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.username;
    delete updates.devices;
    delete updates.created_at;
    
    const user = await User.findOneAndUpdate(
      { username },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }
    
    res.json({
      status: "success",
      message: "User updated successfully",
      user: user
    });
    
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = app;