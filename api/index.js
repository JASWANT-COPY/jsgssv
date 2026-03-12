// api/index.js - Main entry point for Vercel
const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_KEY = process.env.ADMIN_KEY || 'Jaswant06-8090';

// ============ ROOT ENDPOINT ============
app.get('/api', (req, res) => {
  res.json({
    status: "success",
    message: "Login API is running",
    endpoints: [
      "/api/test - Test API",
      "/api/login_with_device - Login with device token",
      "/api/login - Simple login",
      "/api/logout - Logout",
      "/api/verify_device - Verify device",
      "/api/create_user - Create user (admin)",
      "/api/get_users - Get all users (admin)",
      "/api/update_user/:username - Update user (admin)",
      "/api/delete_user/:username - Delete user (admin)"
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
    
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid username or password"
      });
    }
    
    if (user.password !== password) {
      return res.status(401).json({
        status: "error",
        message: "Invalid username or password"
      });
    }
    
    const existingDeviceIndex = user.devices.findIndex(d => d.token === device_token);
    
    if (existingDeviceIndex >= 0) {
      user.devices[existingDeviceIndex].last_active = new Date();
      user.devices[existingDeviceIndex].login_count += 1;
      user.devices[existingDeviceIndex].is_active = true;
      if (user_agent) user.devices[existingDeviceIndex].user_agent = user_agent;
      if (ip_address) user.devices[existingDeviceIndex].ip_address = ip_address;
    } else {
      user.devices.push({
        token: device_token,
        first_seen: new Date(),
        last_active: new Date(),
        login_count: 1,
        is_active: true,
        user_agent: user_agent || 'Unknown',
        ip_address: ip_address || 'Unknown'
      });
    }
    
    await user.save();
    
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

// ============ LOGOUT ============
app.post('/api/logout', async (req, res) => {
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
      }
    }
    
    res.json({
      status: "success",
      message: "Logout successful"
    });
    
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ============ VERIFY DEVICE ============
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

// ============ CREATE USER (Admin) ============
app.post('/api/create_user', async (req, res) => {
  try {
    await connectDB();
    
    const { username, password, name, allowed_batches, admin_key, is_admin } = req.body;
    
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized - Invalid admin key"
      });
    }
    
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password required"
      });
    }
    
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username already exists"
      });
    }
    
    const user = await User.create({
      username: username.toLowerCase(),
      password: password,
      name: name || '',
      allowed_batches: allowed_batches || [],
      is_admin: is_admin || false,
      devices: []
    });
    
    res.status(201).json({
      status: "success",
      message: "User created successfully",
      user: {
        username: user.username,
        name: user.name,
        allowed_batches: user.allowed_batches,
        is_admin: user.is_admin
      }
    });
    
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ============ GET ALL USERS (Admin) ============
app.get('/api/get_users', async (req, res) => {
  try {
    await connectDB();
    
    const admin_key = req.headers['admin-key'];
    
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized"
      });
    }
    
    const users = await User.find({}).select('-password');
    
    res.json({
      status: "success",
      total_users: users.length,
      users: users
    });
    
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ============ UPDATE USER (Admin) ============
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

// ============ DELETE USER (Admin) ============
app.delete('/api/delete_user/:username', async (req, res) => {
  try {
    await connectDB();
    
    const admin_key = req.headers['admin-key'];
    const username = req.params.username.toLowerCase();
    
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized"
      });
    }
    
    const result = await User.deleteOne({ username });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }
    
    res.json({
      status: "success",
      message: "User deleted successfully"
    });
    
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = app;
