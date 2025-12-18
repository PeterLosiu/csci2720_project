import React, { useEffect, useState } from 'react';

export default function EventList() {
  const [locations, setLocations] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [keyword, setKeyword] = useState('');
  const [area, setArea] = useState('');
  const [maxDistance, setMaxDistance] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');

        const params = new URLSearchParams({
          sortBy,
          order,
          ...(keyword.trim() && { keyword: keyword.trim() }),
          ...(area.trim() && { area: area.trim() }),
          ...(maxDistance.trim() && { maxDistance: maxDistance.trim() })
        });

        const res = await fetch(`http://localhost:3000/api/locations?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error(err);
        setLocations([]);
      }
    }
    load();
  }, [sortBy, order, keyword, area, maxDistance]);

  // add favouritelist
  const addFav = async (locId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/favorites/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ locationId: locId })
      });
      if (!res.ok) throw new Error(res.statusText);
      alert('Added to favourites!');
    } catch (err) {
      console.error(err);
      alert('Failed to add');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">All Locations & Events</h2>

      {/*filter*/}
      <div className="flex flex-wrap gap-3 mb-4">
        {/*keyword*/}
        <input
          type="text"
          placeholder="Keyword (venue/location name)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="px-3 py-2 border rounded"
        />

        {/*area*/}
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="px-3 py-2 border rounded"
        >
        </select>

        {/*maxdistance*/}
        <input
          type="number"
          placeholder="Max Distance (km)"
          value={maxDistance}
          onChange={(e) => setMaxDistance(e.target.value)}
          className="px-3 py-2 border rounded"
          min="0"
          step="0.1"
        />

        {/*sort*/}
        {['name', 'distance', 'events'].map((key) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1 mr-2 border rounded ${sortBy === key ? 'bg-blue-600 text-white' : ''}`}
          >
            Sort by {key}
          </button>
        ))}

        {/*order*/}
        <button
          onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-1 border rounded"
        >
          Order: {order}
        </button>

        {/*reset*/}
        <button
          onClick={() => {
            setKeyword('');
            setArea('');
            setMaxDistance('');
          }}
          className="px-3 py-1 border rounded bg-gray-200 hover:bg-gray-300"
        >
          Reset
        </button>
      </div>

      {/**/}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Location</th>
            <th className="border p-2">Distance (km)</th>
            <th className="border p-2">Event Count</th>
            <th className="border p-2">Quota</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc._id} className="hover:bg-gray-50">
              <td className="border p-2">
                <a href={`/location/${loc._id}`} className="text-blue-600 hover:underline">
                  {loc.name}
                </a>
              </td>
              <td className="border p-2 text-center">{loc.distanceKm || 0}</td>
              <td className="border p-2 text-center">{loc.eventCount || 0}</td>
              <td className="border p-2 text-center">{loc.quota}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => addFav(loc._id)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  title="Add to favourites"
                >
                  ⭐
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}