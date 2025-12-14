const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  locationId: {
    type: Number,
    required: true,
    unique: true,
  },
  nameC: {    // Chinese name
    type: String,
    trim: true,
  },
  nameE: {    // English name
    type: String,
    required: true,
    trim: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  eventCount: {
    type: Number,
    default: 0
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const Location = mongoose.model('Location', locationSchema); // Add missing model export

module.exports = Location;