const EventModel = require('../models/Event.js');
const LocationModel = require('../models/Location.js');
const {eventCreateInputAuth,eventUpdateInputAuth} = require('../middleware/eventAuth.js');

class eventController {
    // Get all events
    static async getAllEvents(req, res) {
        try {
            const events = await EventModel.find({});
            res.status(200).json(events);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching events', error });
        }
    }
    // Get event by Title: return the events whose name contains the given title (case-insensitive)
    static async getEventByTitle(req, res) {
        const { title } = req.params;
        try {
            // consider both chinese and english titles
            const events = await EventModel.find({ $or: [{titleE: { $regex: title, $options: 'i' }}, {titleC: { $regex: title, $options: 'i' }}] });
            res.status(200).json(events);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching event by title', error });
        }
    }
    // Get event by ID
    static async getEventById(req, res) {
        const eventId = req.params.id;
        try {
            const event = await EventModel.findById(eventId);
            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }
            res.status(200).json(event);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching event by ID', error });
        }
    }
    // Create new event
    static async createEvent(req, res) {
        const { titleE, titleC, venue, dateTime, description, presenter } = req.body;
        let {eventId} = req.body;
        try {
            // check input validity
            eventCreateInputAuth(req.body, res);
            // manually create new eventId if not provided: find the largest existing eventId and add 1
            if (!eventId) {
                const lastEventId = await EventModel.findOne({}).sort({ eventId: -1 }).select('eventId');
                const newId = lastEventId ? lastEventId + 1 : 1;
                eventId = newId
            }
            // get venue
            const location = await LocationModel.findOne({$or: [{nameE: venue}, {nameC: venue}]});
            // create new event
            const newEvent = new EventModel({eventId, titleE, titleC, location, dateTime, description, presenter });
            await newEvent.save();
            res.status(201).json({ message: 'Event created successfully', eventId: newEvent._id });
        } catch (error) {
            res.status(500).json({ message: 'Error creating event', error });
        }
    }
    // update event by ID
    static async updateEvent(req, res) {
        const eventId = req.params.id;
        const updateData = req.body;
        try {
            // check input validity
            eventUpdateInputAuth(updateData, res);
            // update event
            const updatedEvent = await EventModel.findByIdAndUpdate(eventId, updateData, { new: true });
            if (!updatedEvent) {
                return res.status(404).json({ message: 'Event not found' });
            }
            res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
        } catch (error) {
            res.status(500).json({ message: 'Error updating event', error });
        }
    }
    // delete event by ID
    static async deleteEvent(req, res) {
        const eventId = req.params.id;
        try {
            const deletedEvent = await EventModel.findByIdAndDelete(eventId);
            if (!deletedEvent) {
                return res.status(404).json({ message: 'Event not found' });
            }
            res.status(200).json({ message: 'Event deleted successfully', deletedEvent});
        } catch (error) {
            res.status(500).json({ message: 'Error deleting event', error });
        }
    }
}

module.exports = eventController;