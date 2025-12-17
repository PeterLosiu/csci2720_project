// src/pages/LocationList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';  // React Router跳转
import '../css/LocationList.css';
import { UilSearch, UilMapMarker, UilDistance, UilSort, UilHeart, UilHeartAlt, UilSpinner } from '@iconscout/react-unicons';

const LocationList = () => {
  // 状态管理
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  // 筛选/排序状态
  const [filters, setFilters] = useState({
    keyword: '',
    area: '',
    maxDistance: '',
    sortBy: 'name-asc'  // 格式：字段-排序方向（name/distance/events + asc/desc）
  });
  // 最后更新时间
  const [lastUpdated, setLastUpdated] = useState('Loading...');

  // React Router导航函数（无刷新跳转）
  const navigate = useNavigate();
  // 获取token
  const token = localStorage.getItem('userToken');
  const baseUrl = 'http://localhost:3000';  // 后端基础URL（已明确）

  // 1. 初始化：加载收藏列表 + 场馆数据
  useEffect(() => {
    const initData = async () => {
      try {
        // 并行加载收藏列表和场馆数据
        const [favoritesData] = await Promise.all([
          loadFavorites(),
        ]);
        // 存储已收藏的场馆ID
        setFavoriteIds(new Set(favoritesData.map(item => item.locationId)));
        // 加载场馆数据
        await loadLocations();
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    initData();
  }, [filters]);  // 筛选条件变化时重新加载数据

  // 2. 加载用户收藏列表（对接/api/user/favorites）
  const loadFavorites = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/user/favorites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok ? await response.json() : [];
    } catch (err) {
      console.error('Load favorites error:', err);
      return [];
    }
  };

  // 3. 加载场馆数据（对接/api/locations）
  const loadLocations = async () => {
    setLoading(true);
    setError('');

    // 构建查询参数（与后端接口对齐）
    const queryParams = new URLSearchParams();
    const [sortField, sortOrder] = filters.sortBy.split('-');  // 拆分排序字段和方向

    // 添加排序参数
    queryParams.append('sortBy', sortField);
    queryParams.append('order', sortOrder);

    // 添加筛选参数（有值才添加）
    if (filters.keyword.trim()) queryParams.append('keyword', filters.keyword.trim());
    if (filters.area) queryParams.append('area', filters.area);
    if (filters.maxDistance) queryParams.append('maxDistance', filters.maxDistance);

    try {
      const response = await fetch(`${baseUrl}/api/locations?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Token过期 → 跳转登录页（无刷新）
        if (response.status === 401) {
          localStorage.removeItem('userToken');
          localStorage.removeItem('currentUser');
          navigate('/login', { replace: true });
          return;
        }
        throw new Error('Failed to load locations');
      }

      const data = await response.json();
      setLocations(data.locations || []);
      // 更新最后更新时间（转换为Demo格式：24/10/2025, 14:05:51）
      if (data.lastUpdated) {
        const date = new Date(data.lastUpdated);
        setLastUpdated(
          `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}, ${date.toTimeString().slice(0, 8)}`
        );
      } else {
        setLastUpdated('Not available');
      }
    } catch (err) {
      setError(err.message);
      console.error('Load locations error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 4. 筛选条件变化处理
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 5. 重置筛选条件
  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      area: '',
      maxDistance: '',
      sortBy: 'name-asc'
    });
  };

  // 6. 添加收藏（对接/api/favorites/locations）
  const handleAddFavorite = async (locationId, e) => {
    e.preventDefault();  // 阻止Link跳转
    if (favoriteIds.has(locationId)) {
      alert('This location is already in your favorites');
      return;
    }

    // 加载状态按钮（临时替换）
    const btn = e.target.closest('.action-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<UilSpinner className="rotating" /> Adding...`;
    }

    try {
      const response = await fetch(`${baseUrl}/api/favorites/locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ locationId })  // 后端要求的请求体格式
      });

      if (!response.ok) throw new Error('Failed to add to favorites');

      // 更新收藏状态
      setFavoriteIds(prev => new Set(prev).add(locationId));
      if (btn) {
        btn.innerHTML = `<UilHeart /> Favorited`;
        btn.style.backgroundColor = '#4361ee';
        btn.style.color = '#ffffff';
      }
    } catch (err) {
      if (btn) {
        btn.innerHTML = `<UilHeartAlt /> Try Again`;
        btn.disabled = false;
      }
      alert(err.message);
    }
  };

  // 渲染表格数据
  const renderTable = () => {
    if (locations.length === 0 && !loading) {
      return (
        <div className="no-result">
          <UilFolderOpen size={48} color="#e2e8f0" />
          <p>No locations found matching your filters.</p>
        </div>
      );
    }

    return (
      <div className="table-container">
        <table className="location-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>LOCATION</th>
              <th>DISTANCE (KM)</th>
              <th>NUMBER OF EVENTS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row">
                <td colspan="5">Loading locations...</td>
              </tr>
            ) : (
              locations.map((location, index) => {
                const isFavorite = favoriteIds.has(location._id);
                const distance = (location.distanceKm || 0).toFixed(2);
                const eventCount = location.numberOfEvents || 0;

                return (
                  <tr key={location._id}>
                    <td>{index + 1}</td>
                    {/* SPA无刷新跳转：使用Link组件，路径为/locations/:id */}
                    <td>
                      <Link to={`/locations/${location._id}`} className="location-link">
                        {location.name}
                      </Link>
                    </td>
                    <td>{distance}km</td>
                    <td>{eventCount}</td>
                    <td>
                      <button 
                        className="action-btn add-to-favorite"
                        disabled={isFavorite}
                        onClick={(e) => handleAddFavorite(location._id, e)}
                      >
                        {isFavorite ? (
                          <>
                            <UilHeart /> Favorited
                          </>
                        ) : (
                          <>
                            <UilHeartAlt /> Add to Favorite
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="location-list-container">
      {/* 页面标题与筛选区 */}
      <div className="page-header">
        <h1 className="page-title">Location List</h1>
        <div className="filter-bar">
          {/* 关键词筛选 */}
          <div className="filter-item">
            <div className="input-wrapper">
              <UilSearch className="input-icon" />
              <input
                type="text"
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                className="filter-input"
                placeholder="Search by location name"
              />
            </div>
          </div>

          {/* 区域筛选 */}
          <div className="filter-item">
            <div className="input-wrapper">
              <UilMapMarker className="input-icon" />
              <select
                name="area"
                value={filters.area}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Areas</option>
                {/* 【待确认：需替换为后端数据集支持的真实区域列表】 */}
                <option value="Sha Tin">Sha Tin</option>
                <option value="Kowloon">Kowloon</option>
                <option value="Hong Kong Island">Hong Kong Island</option>
                <option value="New Territories">New Territories</option>
              </select>
            </div>
          </div>

          {/* 距离筛选 */}
          <div className="filter-item">
            <div className="input-wrapper">
              <UilDistance className="input-icon" />
              <input
                type="number"
                name="maxDistance"
                value={filters.maxDistance}
                onChange={handleFilterChange}
                className="filter-input"
                placeholder="Max Distance (km)"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* 排序筛选 */}
          <div className="filter-item">
            <div className="input-wrapper">
              <UilSort className="input-icon" />
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="distance-asc">Distance (Near → Far)</option>
                <option value="distance-desc">Distance (Far → Near)</option>
                <option value="events-desc">Events (More → Less)</option>
                <option value="events-asc">Events (Less → More)</option>
              </select>
            </div>
          </div>

          {/* 筛选/重置按钮 */}
          <div className="filter-actions">
            <button className="filter-btn" onClick={loadLocations}>
              Apply
            </button>
            <button className="reset-btn" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 数据状态提示 */}
      <div className="status-bar">
        <div className="update-time">Last Updated: {lastUpdated}</div>
        <div className="total-count">Total Locations: {locations.length}</div>
      </div>

      {/* 错误提示 */}
      {error && <div className="error-msg">{error}</div>}

      {/* 表格/无数据提示 */}
      {renderTable()}
    </div>
  );
};

export default LocationList;