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

module.exports = { initData }; // Add export if needed