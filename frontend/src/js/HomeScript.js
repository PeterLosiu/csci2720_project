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
    // const token = localStorage.getItem('userToken');
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const baseUrl = 'http://localhost:3000';
    let locationsData = [];
    let mapInstance = null;
    let favoriteLocationIds = new Set();

    // 修复2：token为空拦截
    if (!token) {
        alert('Please login first');
        window.location.href = '../pages/LoginPage.html';
        return;
    }

    // 修复8：新增超时fetch封装
    function fetchWithTimeout(url, options = {}, timeout = 10000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout (10s)')), timeout)
            )
        ]);
    }

    // 初始化：加载收藏列表 + 场馆数据
    loadUserFavorites().then(() => {
        loadLocations();
    });

    // 修复3：优化收藏加载逻辑
    function loadUserFavorites() {
        return fetchWithTimeout(`${baseUrl}/api/user/favorites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                console.error('Failed to load favorites:', response.status);
                return [];
            }
            return response.json();
        })
        .then(favorites => {
            favorites.forEach(item => {
                const locId = item._id || item.locationId;
                if (locId) favoriteLocationIds.add(locId.toString());
            });
        })
        .catch(error => {
            console.error('Error loading favorites:', error);
        });
    }

    // 修复8：使用超时fetch，优化排序/筛选逻辑
    function loadLocations() {
        const queryParams = new URLSearchParams();
        const [sortField, sortOrder] = sortBySelect.value.split('-');
        
        queryParams.append('sortBy', sortField);
        queryParams.append('order', sortOrder);
        
        if (keywordFilter.value.trim()) queryParams.append('keyword', keywordFilter.value.trim());
        if (areaFilter.value) queryParams.append('area', areaFilter.value);
        if (distanceFilter.value) queryParams.append('maxDistance', distanceFilter.value);

        locationTableBody.innerHTML = `<tr class="loading-row"><td colspan="5">Loading locations...</td></tr>`;

        fetchWithTimeout(`${baseUrl}/api/locations?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(async response => {
            if (!response.ok) {
                if (response.status === 401) {
                    const error = await response.json().catch(() => ({ message: 'Unauthorized' }));
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
            locationsData = data;
            // 修复7：容错时间解析
            const lastUpdated = locationsData.length > 0 ? locationsData[0].lastUpdated : new Date();
            let date = new Date(lastUpdated);
            if (isNaN(date.getTime())) date = new Date();
            lastUpdatedTimeEl.textContent = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}, ${date.toTimeString().slice(0, 8)}`;
            
            renderLocationList();
            initMap();
        })
        .catch(error => {
            locationTableBody.innerHTML = `<tr><td colspan="5">${error.message}. Please try again later.</td></tr>`;
            console.error('Error loading locations:', error);
        });
    }

    // 修复1：修正标签语法；修复4：distanceKm空值保护；修复6：事件委托
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
                    <td>${location.nameE}</td>
                    <td>${(location.distanceKm || 0).toFixed(2)}km</td>
                    <td>${location.eventCount || 0}</td>
                    <td>
                        <button class="action-btn add-to-favorite" data-location-id="${location._id}" ${isFavorite ? 'disabled' : ''}>
                            <i class="uil ${isFavorite ? 'uil-heart' : 'uil-heart-alt'}"></i> ${isFavorite ? 'Favorited' : 'Add to Favorite'}
                        </button>
                    </td>
                </tr>
            `;
        });
        locationTableBody.innerHTML = tableHtml;
    }

    // 修复1：修正标签语法；优化错误处理
    function addToFavorite(locationId, btnElement) {
        if (favoriteLocationIds.has(locationId)) {
            alert('This location is already in your favorites');
            return;
        }

        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="uil uil-spinner rotating"></i> Adding...';

        fetchWithTimeout(`${baseUrl}/api/favorites/locations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ locationId: locationId })
        })
        .then(async response => {
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Failed to add favorite' }));
                throw new Error(error.message);
            }
            return response.json();
        })
        .then(data => {
            favoriteLocationIds.add(locationId);
            btnElement.innerHTML = '<i class="uil uil-heart"></i> Favorited';
            btnElement.style.backgroundColor = '#4361ee';
            btnElement.style.color = '#ffffff';
            alert(data.message || 'Added to favorite successfully');
        })
        .catch(error => {
            btnElement.innerHTML = '<i class="uil uil-heart-alt"></i> Try Again';
            btnElement.disabled = false;
            alert(error.message);
        });
    }

    // 修复5：优化地图初始化逻辑（防重复/空容器）
    function initMap() {
        if (!locationMap || locationsData.length === 0) return;
        if (mapInstance) {
            // 清空旧标记
            mapInstance.eachLayer(layer => {
                if (layer instanceof L.Marker) mapInstance.removeLayer(layer);
            });
        } else {
            mapInstance = L.map('locationMap').setView([22.4148, 114.2045], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy;  contributors',
                maxZoom: 18
            }).addTo(mapInstance);
        }

        locationsData.forEach(location => {
            if (!location.latitude || !location.longitude) return;
            const marker = L.marker([location.latitude, location.longitude]).addTo(mapInstance);
            // marker.bindPopup(`
            //     <div class="map-popup">
            //         <h3 class="popup-title">${location.nameE}</h3>
            //         <p class="popup-distance">Distance: ${(location.distanceKm || 0).toFixed(2)}km</p >
            //         <p class="popup-events">Events: ${location.eventCount || 0}</p >
            //     </div>
            // `);
            // --- 修复交互逻辑 ---
            const popupContent = `
                <div class="map-popup">
                    <h3 class="popup-title">${location.nameE}</h3>
                    <p class="popup-distance">Distance: ${(location.distanceKm || 0).toFixed(2)}km</p>
                    <p class="popup-events">Events: ${location.eventCount || 0}</p>
                    <p style="font-size: 11px; color: #666;">(Click marker to view details)</p>
                </div>`;

            // 绑定弹窗
            marker.bindPopup(popupContent, { closeButton: false });

            // A. Hover 事件：鼠标移入显示，移出隐藏
            marker.on('mouseover', function(e) {
                this.openPopup();
            });
            marker.on('mouseout', function(e) {
                // 注意：如果想让用户点击弹窗里的链接，这里可以不关闭，或加延时
                this.closePopup();
            });

            // B. Click 事件：直接跳转页面
            marker.on('click', function() {
                window.location.href = `../pages/SingleLocation.html?id=${location._id}`;
            });
        });
    }

    // 修复6：事件委托（只绑定一次）
    locationTableBody.addEventListener('click', function(e) {
        const btn = e.target.closest('.add-to-favorite');
        if (btn && !btn.disabled) {
            const locationId = btn.getAttribute('data-location-id');
            addToFavorite(locationId, btn);
        }
    });

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
        if (locationsData.length > 0) initMap();
    });
    mapViewBtn.addEventListener('click', function() {
        mapView.classList.add('active');
        listView.classList.remove('active');
        mapViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        if (locationsData.length > 0) initMap();
    });
    keywordFilter.addEventListener('keypress', e => e.key === 'Enter' && loadLocations());
    distanceFilter.addEventListener('keypress', e => e.key === 'Enter' && loadLocations());
});