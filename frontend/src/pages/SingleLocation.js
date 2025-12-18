import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from './Navbar';
import API_BASE_URL from '../config';
import '../style/SingleLocation.css';

// 修复 Leaflet 默认图标在 React 中不显示的问题
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const SingleLocation = () => {
    const { id: locationId } = useParams();
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);

    // --- State ---
    const [locationData, setLocationData] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');

    // --- 初始化加载 ---
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [locationId, token]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [locRes, favRes, commentRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/locations/${locationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/user/favorites`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/comments/location/${locationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!locRes.ok) throw new Error("Location not found");
            
            const locData = await locRes.json();
            const favorites = await favRes.json();
            const commentData = await commentRes.json();

            setLocationData(locData);
            setIsFavorite(favorites.some(fav => fav._id === locationId));
            setComments(commentData);
        } catch (err) {
            alert(err.message);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    // --- 地图初始化 ---
    useEffect(() => {
        if (!locationData || !mapContainerRef.current || mapRef.current) return;

        const { latitude, longitude, nameE, eventCount } = locationData;

        if (latitude && longitude) {
            mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);

            const popupContent = `
                <div class="location-popup">
                    <h3>${nameE}</h3>
                    <p>Events: ${eventCount || 0}</p>
                    <a href="/events?locationId=${locationId}" class="event-link">View Events</a>
                </div>
            `;
            L.marker([latitude, longitude]).addTo(mapRef.current).bindPopup(popupContent).openPopup();
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [locationData]);

    // --- 交互逻辑 ---
    const handleFavorite = async () => {
        if (isFavorite) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/favorites/locations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ locationId })
            });
            if (res.ok) {
                setIsFavorite(true);
                alert("Added to favorites!");
            }
        } catch (err) {
            alert("Action failed");
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/comments/location/${locationId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newComment })
            });
            if (res.ok) {
                setNewComment("");
                // 重新刷新评论列表
                const updatedComments = await (await fetch(`${API_BASE_URL}/api/comments/location/${locationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })).json();
                setComments(updatedComments);
            }
        } catch (err) {
            alert("Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="detail-container">
                <div className="location-header">
                    <div className="location-title">
                        <h1>{locationData.nameE}</h1>
                        <p className="location-name-c">{locationData.nameC || 'No Chinese Name'}</p>
                    </div>
                    <div className="location-actions">
                        <button 
                            className={`action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={handleFavorite}
                            disabled={isFavorite}
                        >
                            <i className={`uil ${isFavorite ? 'uil-heart' : 'uil-heart-alt'}`}></i>
                            {isFavorite ? ' Favorited' : ' Add to Favorite'}
                        </button>
                    </div>
                </div>

                <div className="detail-content">
                    <div className="detail-info">
                        <div className="info-item">
                            <span className="info-label">Distance from CUHK:</span>
                            <span className="info-value">{locationData.distanceKm?.toFixed(2)} km</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Number of Events:</span>
                            <span className="info-value">{locationData.eventCount || 0}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Last Updated:</span>
                            <span className="info-value">
                                {new Date(locationData.lastUpdated).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="detail-map">
                        <div ref={mapContainerRef} className="map-container" style={{ height: '300px', width: '100%' }}></div>
                    </div>
                </div>

                <div className="comment-section">
                    <h2 className="comment-title">Comments</h2>
                    <div className="comment-input">
                        <textarea 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write your comment..." 
                            rows="3"
                        ></textarea>
                        <button 
                            className="submit-btn" 
                            onClick={handleCommentSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Comment'}
                        </button>
                    </div>
                    <div className="comment-list">
                        {comments.length > 0 ? comments.map(comment => (
                            <div key={comment._id} className="comment-item">
                                <div className="comment-header">
                                    <span className="comment-username">{comment.user.username}</span>
                                    <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="comment-content">{comment.content}</p>
                            </div>
                        )) : (
                            <p className="no-comments">No comments yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleLocation;