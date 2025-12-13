const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  LocationId: {
    type: Number,
    required: true,
    unique: true,
  },
  NameC: {    // Chinese name
    type: String,
    trim: true,
  },
  NameE: {    // English name
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
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
});