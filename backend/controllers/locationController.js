// controllers/locationController.js
const Location = require('../models/Location');

const CUHK_LAT = 22.41961;
const CUHK_LNG = 114.20725;

// Haversine distance in km
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/locations
// Query params (all optional):
//   sortBy=name|distance|events
//   order=asc|desc
//   keyword=string           (search in nameE / nameC / area)
//   area=areaCodeOrName     (filter by venue area)
//   maxDistance=numberKm    (only locations within this distance from CUHK)
exports.getLocationList = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'name'; // name | distance | events
    const order = req.query.order === 'desc' ? -1 : 1;

    const keyword = req.query.keyword ? req.query.keyword.trim() : '';
    const areaFilter = req.query.area ? req.query.area.trim() : '';
    const maxDistanceStr = req.query.maxDistance;
    const maxDistanceKm = maxDistanceStr
      ? parseFloat(maxDistanceStr)
      : null;

    let locations = await Location.find().lean();

    // 1. enrich with distance + eventCount
    locations = locations.map((loc) => {
      const distanceKm = calcDistanceKm(
        CUHK_LAT,
        CUHK_LNG,
        loc.latitude,
        loc.longitude
      );

      const eventCount =
        typeof loc.eventCount === 'number'
          ? loc.eventCount
          : Array.isArray(loc.events)
          ? loc.events.length
          : 0;

      return {
        ...loc,
        distanceKm: Number(distanceKm.toFixed(2)),
        eventCount,
      };
    });

    // 2. apply filters (keyword, area, distance)

    // keyword filter: match on nameE / nameC / area (adjust fields if needed)
    if (keyword) {
      const kw = keyword.toLowerCase();
      locations = locations.filter((loc) => {
        const nameE = (loc.nameE || '').toLowerCase();
        const nameC = (loc.nameC || '').toLowerCase();
        const area = (loc.area || '').toLowerCase(); // adjust field name if different

        return (
          nameE.includes(kw) ||
          nameC.includes(kw) ||
          area.includes(kw)
        );
      });
    }

    // area filter: exact match
    if (areaFilter) {
      locations = locations.filter(
        (loc) => loc.area && loc.area === areaFilter
      );
    }

    // distance filter: only locations within maxDistanceKm of CUHK
    if (!Number.isNaN(maxDistanceKm) && maxDistanceKm !== null) {
      locations = locations.filter(
        (loc) => loc.distanceKm <= maxDistanceKm
      );
    }

    // 3. sort after filtering
    if (sortBy === 'name') {
      locations.sort((a, b) => a.nameE.localeCompare(b.nameE) * order);
    } else if (sortBy === 'distance') {
      locations.sort((a, b) => (a.distanceKm - b.distanceKm) * order);
    } else if (sortBy === 'events') {
      locations.sort((a, b) => (a.eventCount - b.eventCount) * order);
    }

    return res.json(locations);
  } catch (err) {
    console.error('getLocationList error:', err);
    return res.status(500).json({ message: 'Failed to fetch locations' });
  }
};

// GET /api/locations/:id
// single location details + distance (for the single-location page)
exports.getLocationById = async (req, res) => {
  try {
    const loc = await Location.findById(req.params.id).lean();
    if (!loc) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const distanceKm = calcDistanceKm(
      CUHK_LAT,
      CUHK_LNG,
      loc.latitude,
      loc.longitude
    );

    return res.json({
      ...loc,
      distanceKm: Number(distanceKm.toFixed(2)),
    });
  } catch (err) {
    console.error('getLocationById error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to fetch location details' });
  }
};