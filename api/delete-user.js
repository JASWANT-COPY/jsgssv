// api/delete-user.js
const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_KEY = process.env.ADMIN_KEY || 'Jaswant06-8090';

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