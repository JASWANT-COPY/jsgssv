// api/login.js
const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');

const app = express();
app.use(cors());
app.use(express.json());

// ============ ROOT ENDPOINT ============
app.get('/api/', (req, res) => {
  res.json({
    status: "success",
    message: "Login API is running",
    endpoints: [
      "/test - Test API",
      "/login_with_device - Login with device token",
      "/login - Simple login",
      "/logout - Logout",
      "/verify_device - Verify device",
      "/create_user - Create user (admin)",
      "/get_users - Get all users (admin)",
      "/update_user/:username - Update user (admin)",
      "/delete_user/:username - Delete user (admin)"
    ]
  });
});

// ============ TEST ENDPOINT ============
app.get('/api/test', (req, res) => {
  res.json({
    status: "success",
    message: "API is working!",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? "Vercel" : "Local"
  });
});

// ============ LOGIN WITH DEVICE ============
app.post('/api/login_with_device', async (req, res) => {
  console.log('📥 Login request received:', JSON.stringify(req.body));
  
  try {
    await connectDB();
    
    const { username, password, device_token, user_agent, ip_address } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required"
      });
    }
    
    if (!device_token) {
      return res.status(400).json({
        status: "error",
        message: "Device token is required"
      });
    }
    
    // Find user (case insensitive)
    const user = await User.findOne({
      username: username.toLowerCase()
    });
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        status: "error",
        message: "Invalid username or password"
      });
    }
    
    // Check password (plain text as per your requirement)
    if (user.password !== password) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({
        status: "error",
        message: "Invalid username or password"
      });
    }
    
    // Check if device already exists
    const existingDeviceIndex = user.devices.findIndex(d => d.token === device_token);
    
    if (existingDeviceIndex >= 0) {
      // Update existing device
      user.devices[existingDeviceIndex].last_active = new Date();
      user.devices[existingDeviceIndex].login_count += 1;
      user.devices[existingDeviceIndex].is_active = true;
      if (user_agent) user.devices[existingDeviceIndex].user_agent = user_agent;
      if (ip_address) user.devices[existingDeviceIndex].ip_address = ip_address;
      
      console.log('🔄 Updated existing device for:', username);
    } else {
      // Add new device
      user.devices.push({
        token: device_token,
        first_seen: new Date(),
        last_active: new Date(),
        login_count: 1,
        is_active: true,
        user_agent: user_agent || 'Unknown',
        ip_address: ip_address || 'Unknown'
      });
      
      console.log('🆕 Added new device for:', username);
    }
    
    await user.save();
    
    console.log('✅ Login successful for:', username);
    
    // EXACT RESPONSE FORMAT as requested
    res.json({
      status: "success",
      message: "Login successful",
      allowed_batches: user.allowed_batches || []
    });
    
  } catch (error) {
    console.error('🔥 Login error:', error);
    res.status(500).json({
      status: "error",
      message: "Server error: " + error.message
    });
  }
});

// ============ SIMPLE LOGIN ============
app.post('/api/login', async (req, res) => {
  try {
    await connectDB();
    
    const { username, password } = req.body;
    
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user || user.password !== password) {
      return res.status(401).json({
        status: "error",
        message: "Invalid username or password"
      });
    }
    
    res.json({
      status: "success",
      message: "Login successful",
      allowed_batches: user.allowed_batches || []
    });
    
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = app;
