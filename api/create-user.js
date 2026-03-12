// api/create-user.js
const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_KEY = process.env.ADMIN_KEY || 'Jaswant06-8090';

app.post('/api/create_user', async (req, res) => {
  console.log('📥 Create user request received');
  
  try {
    await connectDB();
    
    const { username, password, name, allowed_batches, admin_key, is_admin } = req.body;
    
    // Check admin key
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized - Invalid admin key"
      });
    }
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password required"
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username already exists"
      });
    }
    
    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      password: password,
      name: name || '',
      allowed_batches: allowed_batches || [],
      is_admin: is_admin || false,
      devices: []
    });
    
    console.log('✅ User created:', username);
    
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
    console.error('🔥 Create user error:', error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = app;