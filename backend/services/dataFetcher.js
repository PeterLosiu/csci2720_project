const axios = require('axios');
const xml2js = require('xml2js');
const Location = require('../models/Location');
const Event = require('../models/Event');
const mongoose = require('mongoose');

// XML API URL for Cultural Programmes
const XML_URLS = {
  programmes: "https://www.lcsd.gov.hk/datagovhk/event/events.xml", // Event data
  venues: "https://www.lcsd.gov.hk/datagovhk/event/venues.xml"      // Location data
};

// Fetch XML data from API
async function fetchAndParseXML(url) {
  try {
    const response = await axios.get(url, { 
      responseType: 'text', 
      headers: { 'Content-Type': 'application/xml; charset=utf-8' } 
    });
    const parser = new xml2js.Parser({ 
      explicitArray: true,
      trim: true,
      ignoreEmpty: true
    });
    
    return new Promise((resolve, reject) => {
      parser.parseString(response.data, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  } catch (err) {
    console.error(`Fail to download：${url}`, err);
    throw err;
  }
}

async function processData(eventsJSON, venuesJSON) {
  // Mapping venue id to venue information
  const locationMap = new Map(); // key: venueId, value: latitude, name,...
  venuesJSON.venues.venue.forEach(venue => {
    const locationId = parseInt(venue.$.id, 10);
    const nameC = venue.venuec?.[0] || '暫無中文名稱';
    const nameE = venue.venuee?.[0] || 'No English Name';
    const latitude = venue.latitude?.[0] ? parseFloat(venue.latitude[0]) : undefined;
    const longitude = venue.longitude?.[0] ? parseFloat(venue.longitude[0]) : undefined;

    // Skip locations missing required coordinates
    if (latitude === undefined || longitude === undefined) {
      console.warn(`Location(${locationId}) missing coordinates, skipping`);
      return;
    }

    locationMap.set(locationId, {
      locationId,
      nameC,
      nameE,
      latitude,
      longitude,
      events: [],
      eventCount: 0
    });
  });

  // Clear existing data
  await Location.deleteMany({});
  await Event.deleteMany({});

  // Save locations first to get ObjectIds
  const savedLocations = await Location.insertMany(Array.from(locationMap.values()));
  const locationIdToObjectId = new Map(
    savedLocations.map(loc => [loc.locationId, loc._id])
  );
// Process and save events
const events = [];
eventsJSON.events.event.forEach(event => {
  const eventId = parseInt(event.$.id, 10);
  const locationId = event.venueid?.[0] ? parseInt(event.venueid[0], 10) : undefined;
  
  // Validate location existence
  if (!locationId || !locationIdToObjectId.has(locationId)) {
    console.warn(`LocationId(${locationId}) doesn't exist, skip event ${eventId}`);
    return;
  }

  // Parse date (matches Event schema's Date type)
  const dateTimeStr = event.predateE?.[0];
  let dateTime;
  if (dateTimeStr) {
    dateTime = new Date(dateTimeStr);
    if (isNaN(dateTime.getTime())) {
      console.warn(`Invalid date for event ${eventId}, skipping`);
      return;
    }
  } else {
    console.warn(`No date for event ${eventId}, skipping`);
    return;
  }

  events.push({
    eventId,
    titleC: event.titlec?.[0] === '--' ? '暫無中文名稱' : (event.titlec?.[0] || '暫無中文名稱'),
    titleE: event.titlee?.[0] === '--' ? 'No English Title' : (event.titlee?.[0] || 'No English Title'),
    venue: locationIdToObjectId.get(locationId), // Link to Location ObjectId
    dateTime,
    description: event.desce?.[0] || 'No Description',
    presenter: event.presenterorge?.[0] || 'No Presenter',
  });
});

// Save events and map to locations
const savedEvents = await Event.insertMany(events);
const locationEventsMap = new Map(
  savedLocations.map(loc => [loc._id.toString(), []])
);

savedEvents.forEach(event => {
  const locationId = event.venue.toString();
  if (locationEventsMap.has(locationId)) {
    locationEventsMap.get(locationId).push(event._id);
  }
});

// Update locations with event references and counts
for (const [locId, eventIds] of locationEventsMap) {
  await Location.findByIdAndUpdate(locId, {
    events: eventIds,
    eventCount: eventIds.length,
    lastUpdated: new Date()
  });
}

// Apply filtering logic
let allLocations = await Location.find();
let qualifiedLocations = allLocations
  .sort((a,b) => b.eventCount - a.eventCount) // simply sort and choose top10 locations with most event numbers
  .slice(0, 10);

// Final save with qualified locations
await Location.deleteMany({});
await Location.insertMany(qualifiedLocations);
console.log(`Successfully save ${qualifiedLocations.length} locations`);
}

// initiate data when user login
async function initData() {
  // Check if database already has data using correct model
  const locationCount = await Location.countDocuments();
  if (locationCount > 0) {
    console.log("database already contain data, no need to import again");
    return;
  }

  // Download and parse the XML and store in json form
  const [eventsJSON, venuesJSON] = await Promise.all([
    fetchAndParseXML(XML_URLS.programmes),
    fetchAndParseXML(XML_URLS.venues)
  ]);

  await processData(eventsJSON, venuesJSON);
}

// update event list of existing location
async function updateEventList() {
  const locationCount = await Location.countDocuments();
  if (locationCount === 0) {
    console.log("Database has no locations, please initialize first");
    return;
  }

  try {
    // 1. Get current locations from database
    const currentLocations = await Location.find();
    const locationIdMap = new Map(
      currentLocations.map(loc => [loc.locationId, loc._id]) // Map original locationId to MongoDB _id
    );
    const currentLocationIds = currentLocations.map(loc => loc._id); // MongoDB IDs of current locations

    // 2. Fetch latest events data from API
    const eventsJSON = await fetchAndParseXML(XML_URLS.programmes);

    // 3. Get existing events for current locations
    const existingEvents = await Event.find({ venue: { $in: currentLocationIds } });
    const existingEventMap = new Map(
      existingEvents.map(event => [event.eventId, event]) // Map eventId to event document
    );

    // 4. Process new events and track changes
    const newEvents = [];
    const updatedEvents = [];
    const processedEventIds = new Set(); // Track eventIds from new data to find deletions later

    // Parse and validate new events
    eventsJSON.events.event.forEach(event => {
      const eventId = parseInt(event.$.id, 10);
      const locationId = event.venueid?.[0] ? parseInt(event.venueid[0], 10) : undefined;

      // Skip events for locations not in our database
      if (!locationId || !locationIdMap.has(locationId)) {
        return;
      }

      // Validate date
      const dateTimeStr = event.predateE?.[0];
      let dateTime;
      if (dateTimeStr) {
        dateTime = new Date(dateTimeStr);
        if (isNaN(dateTime.getTime())) {
          return;
        }
      } else {
        return;
      }

      // Prepare event data object
      const eventData = {
        eventId,
        titleC: event.titlec?.[0] === '--' ? '暫無中文名稱' : (event.titlec?.[0] || '暫無中文名稱'),
        titleE: event.titlee?.[0] === '--' ? 'No English Title' : (event.titlee?.[0] || 'No English Title'),
        venue: locationIdMap.get(locationId),
        dateTime,
        description: event.desce?.[0] || 'No Description',
        presenter: event.presenterorge?.[0] || 'No Presenter',
      };

      processedEventIds.add(eventId);

      // Check if event exists in database
      if (existingEventMap.has(eventId)) {
        const existingEvent = existingEventMap.get(eventId);
        
        // Compare fields to detect changes
        const isChanged = Object.entries(eventData).some(([key, value]) => {
          // Special handling for Date and ObjectId comparison
          if (key === 'dateTime') {
            return !existingEvent.dateTime.getTime() === value.getTime();
          }
          if (key === 'venue') {
            return !existingEvent.venue.equals(value);
          }
          return existingEvent[key] !== value;
        });

        if (isChanged) {
          updatedEvents.push({ ...eventData, _id: existingEvent._id });
        }
      } else {
        // New event
        newEvents.push(eventData);
      }
    });

    // 5. Find events to delete (existing but not in new data)
    const eventsToDelete = existingEvents.filter(
      event => !processedEventIds.has(event.eventId)
    );
    const deletedCount = eventsToDelete.length;
    if (deletedCount > 0) {
      await Event.deleteMany({ _id: { $in: eventsToDelete.map(e => e._id) } });
    }

    // 6. Insert new events
    const newCount = newEvents.length;
    let savedNewEvents = [];
    if (newCount > 0) {
      savedNewEvents = await Event.insertMany(newEvents);
    }

    // 7. Update existing events
    const updatedCount = updatedEvents.length;
    if (updatedCount > 0) {
      await Promise.all(updatedEvents.map(event => 
        Event.findByIdAndUpdate(event._id, event)
      ));
    }

    // 8. Update locations with latest events
    const allCurrentEvents = [
      ...savedNewEvents,
      ...updatedEvents.map(e => ({ _id: e._id, venue: e.venue })),
      ...existingEvents.filter(e => processedEventIds.has(e.eventId) && !updatedEvents.some(ue => ue.eventId === e.eventId))
    ];

    const locationEventsMap = new Map(
      currentLocationIds.map(id => [id.toString(), []])
    );

    allCurrentEvents.forEach(event => {
      const locationKey = event.venue.toString();
      if (locationEventsMap.has(locationKey)) {
        locationEventsMap.get(locationKey).push(event._id);
      }
    });

    // Update each location's event list, count, and timestamp
    for (const [locationId, eventIds] of locationEventsMap) {
      await Location.findByIdAndUpdate(locationId, {
        events: eventIds,
        eventCount: eventIds.length,
        lastUpdated: new Date()
      });
    }

    // 9. Show update statistics
    console.log(`Event update complete:
      - New events added: ${newCount}
      - Existing events updated: ${updatedCount}
      - Obsolete events deleted: ${deletedCount}
      - Total events after update: ${newCount + (existingEvents.length - deletedCount)}`);

  } catch (err) {
    console.error("Failed to update event list:", err);
    throw err;
  }
}

module.exports = { initData, updateEventList };