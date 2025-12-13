const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventId: {
    type: Number,
    required: true,
    unique: true
  },
  titleC: {     // Chinese title
    type: String,
    trim: true,
  },
  titleE: {     // English title
    type: String,
    required: true,
    trim: true,
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  presenter: {
    type: String,
    trim: true,
  },
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;