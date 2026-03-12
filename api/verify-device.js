// api/verify-device.js
const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/verify_device', async (req, res) => {
  try {
    await connectDB();
    
    const { username, device_token } = req.body;
    
    if (!username || !device_token) {
      return res.json({
        status: "error",
        valid: false,
        message: "Username and device token required"
      });
    }
    
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.json({
        status: "error",
        valid: false,
        message: "User not found"
      });
    }
    
    const device = user.devices.find(d => d.token === device_token);
    
    if (device) {
      res.json({
        status: "success",
        valid: true,
        device: {
          token: device.token,
          first_seen: device.first_seen,
          last_active: device.last_active,
          login_count: device.login_count,
          is_active: device.is_active
        }
      });
    } else {
      res.json({
        status: "error",
        valid: false,
        message: "Device not found"
      });
    }
    
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = app;