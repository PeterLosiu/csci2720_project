import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  // State for filters
  const [keyword, setKeyword] = useState('');
  const [area, setArea] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const params = new URLSearchParams({
          ...(keyword && { keyword }),
          ...(area && { area }),
          ...(maxDistance && { maxDistance })
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
  }, [keyword, area, maxDistance, token, navigate]);

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

  return (
    <div className="home-container">
      {/* Filter Section */}
      <div className="filter-section">
        <input
          type="text"
          placeholder="Search by location name"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="filter-input"
        />
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="filter-select"
        >
          <option value="">All Areas</option>
          <option value="Sha Tin">Sha Tin</option>
          {/* Add other areas */}
        </select>
        <input
          type="number"
          placeholder="Max Distance (km)"
          value={maxDistance}
          onChange={(e) => setMaxDistance(e.target.value)}
          min="0"
          step="0.1"
        />
        <button className="filter-btn" onClick={() => {}}>
          Apply Filters
        </button>
      </div>

      {/* Location Table */}
      {loading ? (
        <p>Loading locations...</p>
      ) : (
        <table className="location-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>LOCATION</th>
              <th>DISTANCE (KM)</th>
              <th>EVENTS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc, index) => (
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HomePage;