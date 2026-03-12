// api/logout.js
const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/logout', async (req, res) => {
  console.log('📥 Logout request received:', req.body);
  
  try {
    await connectDB();
    
    const { username, device_token } = req.body;
    
    if (!username || !device_token) {
      return res.status(400).json({
        status: "error",
        message: "Username and device token required"
      });
    }
    
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (user) {
      const deviceIndex = user.devices.findIndex(d => d.token === device_token);
      
      if (deviceIndex >= 0) {
        user.devices[deviceIndex].is_active = false;
        user.devices[deviceIndex].last_active = new Date();
        await user.save();
        
        console.log('✅ Device deactivated for:', username);
      }
    }
    
    res.json({
      status: "success",
      message: "Logout successful"
    });
    
  } catch (error) {
    console.error('🔥 Logout error:', error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = app;