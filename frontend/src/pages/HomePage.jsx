import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/HomeStyle.css';

const HomePage = () => {
  // State for filters
  const [keyword, setKeyword] = useState('');
  const [area, setArea] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name-asc');

  const navigate = useNavigate();
  const token = localStorage.getItem('userToken');

  // Load locations on component mount or filter change
  useEffect(() => {
    const fetchLocations = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        const [sortField, sortOrder] = sortBy.split('-');
        const params = new URLSearchParams({
          ...(keyword && { keyword }),
          ...(area && { area }),
          ...(maxDistance && { maxDistance }),
          sortBy: sortField,
          order: sortOrder
        });

        const response = await fetch(`http://localhost:3000/api/locations?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load locations');
        const data = await response.json();
        setLocations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [keyword, area, maxDistance, token, navigate, sortBy]);

  // Handle "Add to Favorite"
  const addToFavorite = async (locationId) => {
    try {
      const response = await fetch('http://localhost:3000/api/favorites/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ locationId })
      });

      if (!response.ok) throw new Error('Failed to add favorite');
      alert('Added to favorites!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetFilters = () => {
    setKeyword('');
    setArea('');
    setMaxDistance('');
  };

  return (
    <div className="home-container">
      {/* Filter Section */}
      <div className="filter-section">
      <div class="filter-title">Filter Locations</div>
        <div class="filter-group">
          <div class="filter-item">
            <label for="keywordFilter" class="filter-label">Keyword</label>
            <div class="input-wrapper">
              <i class="uil uil-search input-icon"></i>
              <input
                type="text"
                placeholder="Search by location name"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div class="filter-item">
            <label for="areaFilter" class="filter-label">Area</label>
            <div class="input-wrapper">
              <i class="uil uil-map-marker input-icon"></i>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="filter-select"
              >
                <option value="">All Areas</option>
                <option value="Sha Tin">Sha Tin</option>
                {/* Add other areas */}
              </select>
            </div>
          </div>

          <div class="filter-item">
            <label for="distanceFilter" class="filter-label">Max Distance (km)</label>
            <div class="input-wrapper">
              <i class="uil uil-distance input-icon"></i>
              <input
                type="number"
                placeholder="Max Distance (km)"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          </div>
          
          <div class="filter-action">
            {/* <button id="applyFilter" class="filter-btn">Apply Filters</button> */}
            <button id="resetFilter" class="reset-btn" onClick={handleResetFilters}>Reset</button>
          </div>
        </div>
      </div>

      <div class="control-section">
            <div class="sort-control">
                <label for="sortBy" class="sort-label">Sort By:</label>
                <select id="sortBy" class="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="distance-asc">Distance (Near → Far)</option>
                    <option value="distance-desc">Distance (Far → Near)</option>
                    <option value="events-asc">Events (Less → More)</option>
                    <option value="events-desc">Events (More → Less)</option>
                </select>
            </div>

            <div class="view-control">
                <button id="listViewBtn" class="view-btn active">
                    <i class="uil uil-list-ul"></i> List View
                </button>
                <button id="mapViewBtn" class="view-btn">
                    <i class="uil uil-map"></i> Map View
                </button>
            </div>

            <div class="update-time">
                Last Updated: <span id="lastUpdatedTime">Loading...</span>
            </div>
        </div>

      {/* Location Table */}
      <div id="listView" className="content-view active">
        <div className="location-table-container">
          <table className="location-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>LOCATION</th>
                <th>DISTANCE (KM)</th>
                <th>NUMBER OF EVENTS</th> {/* Updated from "EVENTS" to match target */}
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody id="locationTableBody">
              {/* Loading state inside table row (instead of separate p tag) */}
              {loading ? (
                <tr className="loading-row">
                  <td colSpan={5}>Loading locations...</td> {/* React uses colSpan (camelCase) */}
                </tr>
              ) : (
                locations.map((loc, index) => (
                  <tr key={loc._id}>
                    <td>{index + 1}</td>
                    <td>{loc.nameE}</td>
                    <td>{loc.distanceKm.toFixed(2)}</td>
                    <td>{loc.eventCount}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => addToFavorite(loc._id)}
                      >
                        Add to Favorite
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HomePage;