import React, { useEffect, useState } from 'react';
import '../../css/AdminEvents.css';

const API = 'http://localhost:3001/api';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...opts.headers
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...opts, headers });
};

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [keyword, setKeyword] = useState('');
  const [isSearch, setIsSearch] = useState(false);

  const emptyEvent = {
    eventId: Date.now(),
    titleE: '',
    titleC: '',
    venue: '',
    dateTime: new Date().toISOString().slice(0,16),
    description: '',
    presenter: ''
  };

  /* 初始拉全表：Word 示例 GET /api/events/  Admin */
  const initList = () => {
    setLoading(true); setError(null);
    authFetch(`${API}/events`)
      .then(res => res.json())
      .then(data => { setEvents(Array.isArray(data)?data:[]); setLoading(false); })
      .catch(() => { setError('Fetch events failed'); setLoading(false); });
  };

  /* ---------- Read 2. 按标题模糊搜索 ---------- */
  const searchByTitle = async () => {
    if (!keyword.trim()) {        
      setIsSearch(false); initList(); return;
    }
    setLoading(true); setError(null);
    try {
      const res = await authFetch(`${API}/events/byTitle/${encodeURIComponent(keyword)}`);
      if (!res.ok) throw await res.json();
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
      setIsSearch(true);
    } catch (e) {
      setError('Search failed: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  /* 创建：Word 示例 POST /api/events/  Admin */
  const createEvent = async () => {
    if (!emptyEvent.titleE && !emptyEvent.titleC) {
      return alert('Title (E) or Title (C) is required!');
    }
    try {
      const res = await authFetch(`${API}/events`, {
        method: 'POST',
        body: JSON.stringify(emptyEvent)
      });
      if (!res.ok) throw await res.json();
      const data = await res.json();
      setEvents([data, ...events]);
      /* 重置空模板 */
      emptyEvent.eventId = Date.now();
      emptyEvent.titleE = emptyEvent.titleC = emptyEvent.venue = emptyEvent.description = emptyEvent.presenter = '';
      emptyEvent.dateTime = new Date().toISOString().slice(0,16);
    } catch (e) {
      alert('Create failed: ' + (e.message || e));
    }
  };

  /* 更新： PUT /api/events/byId/:id  Admin */
  const updateEvent = async (id, payload) => {
    if (!payload.titleE && !payload.titleC) {
      return alert('Title (E) or Title (C) is required!');
    }
    try {
      const res = await authFetch(`${API}/events/byId/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
});
      if (!res.ok) throw await res.json();
      const data = await res.json();
      setEvents(events.map(ev => ev._id === id ? data : ev));
    } catch (e) {
      alert('Update failed: ' + (e.message || e));
    }
  };

  /* 删除： DELETE /api/events/:id  Admin */
  const deleteEvent = async id => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await authFetch(`${API}/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw await res.json();
      setEvents(events.filter(ev => ev._id !== id));
    } catch (e) {
      alert('Delete failed: ' + (e.message || e));
    }
  };

  useEffect(() => { initList(); }, []);

  /* 骨架 */
  if (loading) return <p>Loading events…</p>;
  if (error)   return <p style={{color:'red'}}>{error}</p>;

  /* 渲染 */
  return (
    <div className="admin-events">
      <h2>Events CRUD (Admin)</h2>
        <div style={{marginBottom: 12}}>
            <input
            placeholder="Search by title (fuzzy)"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && searchByTitle()}
         />
        <button onClick={searchByTitle} style={{marginLeft: 8}}>Search</button>
        <button onClick={() => { setKeyword(''); setIsSearch(false); initList(); }} style={{marginLeft: 4}}>Reset</button>
        {isSearch && <span style={{marginLeft: 8, color: '#666'}}>(Search mode)</span>}
        </div>

      <table className="event-table">
        <thead>
          <tr>
            <th>eventId<br/><small>(Number)</small></th>
            <th>titleE</th><th>titleC</th>
            <th>venue</th><th>dateTime</th>
            <th>description</th><th>presenter</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{emptyEvent.eventId}</td>
            <td><input value={emptyEvent.titleE}
                       onChange={e => emptyEvent.titleE = e.target.value}/></td>
            <td><input value={emptyEvent.titleC}
                       onChange={e => emptyEvent.titleC = e.target.value}/></td>
            <td><input value={emptyEvent.venue}
                       onChange={e => emptyEvent.venue = e.target.value}/></td>
            <td><input type="datetime-local" value={emptyEvent.dateTime}
                       onChange={e => emptyEvent.dateTime = e.target.value}/></td>
            <td><input value={emptyEvent.description}
                       onChange={e => emptyEvent.description = e.target.value}/></td>
            <td><input value={emptyEvent.presenter}
                       onChange={e => emptyEvent.presenter = e.target.value}/></td>
            <td><button className="btn-create" onClick={createEvent}>Create</button></td>
          </tr>
        </tbody>
      </table>

      <table className="event-table">
        <thead>
          <tr>
            <th>eventId</th><th>titleE</th><th>titleC</th>
            <th>venue</th><th>dateTime</th>
            <th>description</th><th>presenter</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map(ev => {
            const [payload, setPayload] = useState({
              eventId: ev.eventId,
              titleE: ev.titleE || '',
              titleC: ev.titleC || '',
              venue: ev.venue || '',
              dateTime: new Date(ev.dateTime).toISOString().slice(0,16),
              description: ev.description || '',
              presenter: ev.presenter || ''
            });
            return (
              <tr key={ev._id}>
                <td>{payload.eventId}</td>
                <td><input value={payload.titleE}
                           onChange={e => setPayload({...payload, titleE: e.target.value})}/></td>
                <td><input value={payload.titleC}
                           onChange={e => setPayload({...payload, titleC: e.target.value})}/></td>
                <td><input value={payload.venue}
                           onChange={e => setPayload({...payload, venue: e.target.value})}/></td>
                <td><input type="datetime-local" value={payload.dateTime}
                           onChange={e => setPayload({...payload, dateTime: e.target.value})}/></td>
                <td><input value={payload.description}
                           onChange={e => setPayload({...payload, description: e.target.value})}/></td>
                <td><input value={payload.presenter}
                           onChange={e => setPayload({...payload, presenter: e.target.value})}/></td>
                <td>
                  <button className="btn-update" onClick={() => updateEvent(ev._id, payload)}>Save</button>
                  <button className="btn-delete" onClick={() => deleteEvent(ev._id)}>Del</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
