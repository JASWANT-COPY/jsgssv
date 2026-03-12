// models/User.js
const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  },
  first_seen: {
    type: Date,
    default: Date.now
  },
  last_active: {
    type: Date,
    default: Date.now
  },
  login_count: {
    type: Number,
    default: 1
  },
  is_active: {
    type: Boolean,
    default: true
  },
  user_agent: {
    type: String,
    default: 'Unknown'
  },
  ip_address: {
    type: String,
    default: 'Unknown'
  }
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  allowed_batches: [{
    type: String
  }],
  devices: [DeviceSchema],
  is_admin: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Remove password from JSON responses
UserSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
