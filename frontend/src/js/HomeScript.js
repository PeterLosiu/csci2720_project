document.addEventListener('DOMContentLoaded', function() {
    // 筛选相关
    const keywordFilter = document.getElementById('keywordFilter');
    const areaFilter = document.getElementById('areaFilter');
    const distanceFilter = document.getElementById('distanceFilter');
    const applyFilterBtn = document.getElementById('applyFilter');
    const resetFilterBtn = document.getElementById('resetFilter');
    // 排序相关
    const sortBySelect = document.getElementById('sortBy');
    // 视图切换相关
    const listViewBtn = document.getElementById('listViewBtn');
    const mapViewBtn = document.getElementById('mapViewBtn');
    const listView = document.getElementById('listView');
    const mapView = document.getElementById('mapView');
    // 数据渲染相关
    const locationTableBody = document.getElementById('locationTableBody');
    const lastUpdatedTimeEl = document.getElementById('lastUpdatedTime');
    const locationMap = document.getElementById('locationMap');

    // 全局变量
    const token = localStorage.getItem('userToken');
    const baseUrl = 'http://localhost:3000';
    let locationsData = [];
    let mapInstance = null;
    let favoriteLocationIds = new Set();

    // 初始化：加载收藏列表 + 场馆数据
    loadUserFavorites().then(() => {
        loadLocations();
    });

    // 加载用户收藏列表
    function loadUserFavorites() {
        return fetch(`${baseUrl}/api/user/favorites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) return [];
            return response.json();
        })
        .then(favorites => {
            favorites.forEach(item => {
                if (item._id) favoriteLocationIds.add(item._id.toString());
            });
        })
        .catch(() => []);
    }

    // 加载场馆数据（修正排序参数、字段映射）
    function loadLocations() {
        const queryParams = new URLSearchParams();
        const [sortField, sortOrder] = sortBySelect.value.split('-');
        
        // 传递后端要求的排序参数
        queryParams.append('sortBy', sortField);
        queryParams.append('order', sortOrder);
        
        // 筛选参数
        if (keywordFilter.value.trim()) queryParams.append('keyword', keywordFilter.value.trim());
        if (areaFilter.value) queryParams.append('area', areaFilter.value);
        if (distanceFilter.value) queryParams.append('maxDistance', distanceFilter.value);

        locationTableBody.innerHTML = `<tr class="loading-row"><td colspan="5">Loading locations...</td></tr>`;

        fetch(`${baseUrl}/api/locations?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(async response => {
            if (!response.ok) {
                if (response.status === 401) {
                    const error = await response.json();
                    alert(error.message);
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('currentUser');
                    window.location.href = '../pages/LoginPage.html';
                    return;
                }
                throw new Error('Failed to load locations');
            }
            return response.json();
        })
        .then(data => {
            locationsData = data; // 后端直接返回数组，无需提取locations字段
            // 处理最后更新时间（取第一条数据的lastUpdated）
            const lastUpdated = locationsData.length > 0 ? locationsData[0].lastUpdated : new Date();
            const date = new Date(lastUpdated);
            lastUpdatedTimeEl.textContent = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}, ${date.toTimeString().slice(0, 8)}`;
            
            renderLocationList();
            initMap();
        })
        .catch(error => {
            locationTableBody.innerHTML = `<tr><td colspan="5">${error.message}. Please try again later.</td></tr>`;
            console.error('Error loading locations:', error);
        });
    }

    // 渲染场馆列表（修正name→nameE，numberOfEvents→eventCount）
    function renderLocationList() {
        if (locationsData.length === 0) {
            locationTableBody.innerHTML = `<tr><td colspan="5">No locations found matching your filters.</td></tr>`;
            return;
        }

        let tableHtml = '';
        locationsData.forEach((location, index) => {
            const isFavorite = favoriteLocationIds.has(location._id.toString());
            tableHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td><a href="../pages/SingleLocation.html?id=${location._id}" class="location-link">${location.nameE}</a></td>
                    <td>${location.distanceKm.toFixed(2)}km</td>
                    <td>${location.eventCount || 0}</td>
                    <td>
                        <button class="action-btn add-to-favorite" data-location-id="${location._id}" ${isFavorite ? 'disabled' : ''}>
                            <<i class="uil ${isFavorite ? 'uil-heart' : 'uil-heart-alt'}"></</i> ${isFavorite ? 'Favorited' : 'Add to Favorite'}
                        </button>
                    </td>
                </tr>
            `;
        });
        locationTableBody.innerHTML = tableHtml;

        // 绑定收藏事件
        document.querySelectorAll('.add-to-favorite:not([disabled])').forEach(btn => {
            btn.addEventListener('click', function() {
                const locationId = this.getAttribute('data-location-id');
                addToFavorite(locationId, this);
            });
        });
    }

    // 添加收藏（修正返回格式处理）
    function addToFavorite(locationId, btnElement) {
        if (favoriteLocationIds.has(locationId)) {
            alert('This location is already in your favorites');
            return;
        }

        btnElement.disabled = true;
        btnElement.innerHTML = '<<i class="uil uil-spinner rotating"></</i> Adding...';

        fetch(`${baseUrl}/api/favorites/locations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ locationId: locationId })
        })
        .then(async response => {
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }
            return response.json();
        })
        .then(data => {
            favoriteLocationIds.add(locationId);
            btnElement.innerHTML = '<<i class="uil uil-heart"></</i> Favorited';
            btnElement.style.backgroundColor = '#4361ee';
            btnElement.style.color = '#ffffff';
            alert(data.message);
        })
        .catch(error => {
            btnElement.innerHTML = '<<i class="uil uil-heart-alt"></</i> Try Again';
            btnElement.disabled = false;
            alert(error.message);
        });
    }

    // 初始化地图（修正字段映射）
    function initMap() {
        if (mapInstance) return;

        mapInstance = L.map('locationMap').setView([22.4148, 114.2045], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(mapInstance);

        locationsData.forEach(location => {
            if (!location.latitude || !location.longitude) return;
            const marker = L.marker([location.latitude, location.longitude]).addTo(mapInstance);
            marker.bindPopup(`
                <div class="map-popup">
                    <h3 class="popup-title"><a href="../pages/SingleLocation.html?id=${location._id}" class="location-link">${location.nameE}</a></h3>
                    <p class="popup-distance">Distance: ${location.distanceKm.toFixed(2)}km</p>
                    <p class="popup-events">Events: ${location.eventCount || 0}</p>
                </div>
            `);
        });
    }

    // 事件绑定
    applyFilterBtn.addEventListener('click', loadLocations);
    resetFilterBtn.addEventListener('click', function() {
        keywordFilter.value = '';
        areaFilter.value = '';
        distanceFilter.value = '';
        sortBySelect.value = 'name-asc';
        loadLocations();
    });
    sortBySelect.addEventListener('change', loadLocations);
    listViewBtn.addEventListener('click', function() {
        listView.classList.add('active');
        mapView.classList.remove('active');
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');
        if (locationsData.length > 0 && !mapInstance) initMap();
    });
    mapViewBtn.addEventListener('click', function() {
        mapView.classList.add('active');
        listView.classList.remove('active');
        mapViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        if (locationsData.length > 0 && !mapInstance) initMap();
    });
    keywordFilter.addEventListener('keypress', e => e.key === 'Enter' && loadLocations());
    distanceFilter.addEventListener('keypress', e => e.key === 'Enter' && loadLocations());
});