// backend/routes/events.js
// Perform CRUD operations on events
// GET /api/events/ -> get all events
// GET /api/events/title/:title -> get event by title (case-insensitive, partial match)
// POST /api/events/ + body:{ eventId, titleE, titleC, venue, dateTime, description, presenter } -> create event
// GET /api/events/:id -> get event by id
// PUT /api/events/:id + body:{title, venue, dateTime, description, presenter} -> update event
// DELETE /api/events/:id -> delete event

const express = require('express');
const router = express.Router();
const EventModel = require('../models/Event.js');
const eventController = require('../controllers/eventController.js')
const {protect, adminOnly} = require('../middleware/auth.js')

// Public routes
router.get('/',eventController.getAllEvents)
router.get('/:title',eventController.getEventByTitle)
router.get('/:id',eventController.getEventById)

// Admin routes
router.post('/', protect, adminOnly, eventController.createEvent)
router.put('/:id', protect, adminOnly, eventController.updateEvent)
router.delete('/:id',protect,adminOnly, eventController.deleteEvent)

module.exports = router;
