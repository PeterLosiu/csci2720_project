const EventModel = require('../models/Event.js');
const LocationModel = require('../models/Location.js')

const eventUpdateInputAuth = async (inputData, res) => {
    const { title, venue, dateTime, description, presenter } = inputData;
    // Types check:
    if (eventId && typeof eventId !== 'number') {
        return res.status(400).json({ message: 'Event ID must be a number' });
    }
    if (title && typeof title !== 'string') {
        return res.status(400).json({ message: 'English title must be a string' });
    }
    if (venue && typeof venue !== 'string') {
        return res.status(400).json({ message: 'Venue must be a string' });
    }
    if (description && typeof description !== 'string') {
        return res.status(400).json({ message: 'Description must be a string' });
    }
    if (presenter && typeof presenter !== 'string') {
        return res.status(400).json({ message: 'Presenter must be a string' });
    }
    if( dateTime && isNaN(dateTime.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
    }
    // Venue validity
    if (venue) {
        const location = await LocationModel.findOne({$or: [{nameE: venue}, {nameC: venue}]}); 
        if(!location) {
            return res.status(400).json({ message: 'Venue does not exist' });
        }
    }
    return;
}


const eventCreateInputAuth = async (inputData, res) => {
    const { eventId, titleE, titleC, venue, dateTime, description, presenter } = inputData;
    // check input validity
    // Types check:
    if (eventId && typeof eventId !== 'number') {
        return res.status(400).json({ message: 'Event ID must be a number', eventId:eventId });
    }
    if (titleE && typeof titleE !== 'string') {
        return res.status(400).json({ message: 'English title must be a string' });
    }
    if (titleC && typeof titleC !== 'string') {
        return res.status(400).json({ message: 'Chinese title must be a string' });
    }
    if (venue && typeof venue !== 'string') {
        return res.status(400).json({ message: 'Venue must be a string' });
    }
    if (description && typeof description !== 'string') {
        return res.status(400).json({ message: 'Description must be a string' });
    }
    if (presenter && typeof presenter !== 'string') {
        return res.status(400).json({ message: 'Presenter must be a string' });
    }

    // Valid eventId
    // check if eventId is provided
    if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required' });
    }
    // check if eventId already exists
    const existingEvent = await EventModel.findOne({ eventId });
    if (existingEvent) {
        return res.status(400).json({ message: 'Event ID already exists' });
    }

    // Valid titles
    // check if titleE is provided
    if (!titleE) {
        return res.status(400).json({ message: 'At least one of titleE or titleC must be provided' });
    }
    // check if titleE or titleC already exists
    // const titleExists = await EventModel.findOne({ $or: [{ titleE }, { titleC }] });
    // if (titleExists) {
    //     return res.status(400).json({ message: 'Event title already exists' });
    // }

    // Valid dateTime
    // check if dateTime is provided
    if (!dateTime) {
        return res.status(400).json({ message: 'Date and time is required' });
    }

    // 将 dateTime 转换为 Date 对象
    let dateObj;
    
    if (dateTime instanceof Date) {
        dateObj = dateTime;
    } else if (typeof dateTime === 'string') {
        dateObj = new Date(dateTime);
    } else if (typeof dateTime === 'number') {
        dateObj = new Date(dateTime);
    } else {
        return res.status(400).json({ 
            message: 'Invalid dateTime format' 
        });
    }

    // check if dateTime is valid date
    if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ message: 'Invalid date value' });
    }

    // Valid venue
    // check if venue is provided
    if (!venue) {
        return res.status(400).json({ message: 'Venue is required' });
    }
    // check if venue exists (both nameE and nameC)
    const location = await LocationModel.findOne({$or: [{nameE: venue}, {nameC: venue}]});
    if(!location) {
        return res.status(400).json({ message: 'Venue does not exist' });
    }
    return;
}
module.exports = { eventCreateInputAuth, eventUpdateInputAuth };