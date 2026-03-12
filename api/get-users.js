// api/get-users.js
const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_KEY = process.env.ADMIN_KEY || 'Jaswant06-8090';

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

module.exports = app;