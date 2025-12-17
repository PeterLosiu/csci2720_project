document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('azureMap');
    const mapLoading = document.getElementById('mapLoading');
    const mapNoResult = document.getElementById('mapNoResult');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const mapStyleSelect = document.getElementById('mapStyleSelect');

    const token = localStorage.getItem('userToken');
    const baseUrl = 'http://localhost:3000';
    const mapCenter = [114.2045, 22.4148];
    const mapZoom = 13;
    const azureMapsApiKey = 'YOUR_AZURE_MAPS_API_KEY'; // 替换为实际API Key
    let mapInstance = null;
    let dataSource = null;
    let locationsData = [];

    // 初始化地图
    initAzureMap();
    // 加载场馆数据
    loadLocations();

    // 初始化Azure Maps
    function initAzureMap() {
        mapLoading.style.display = 'flex';

        mapInstance = new atlas.Map('azureMap', {
            center: mapCenter,
            zoom: mapZoom,
            authOptions: {
                authType: 'subscriptionKey',
                subscriptionKey: azureMapsApiKey
            }
        });

        mapInstance.events.add('ready', function() {
            mapInstance.controls.add(new atlas.control.ZoomControl(), { position: 'bottom-right' });
            dataSource = new atlas.source.DataSource();
            mapInstance.sources.add(dataSource);

            const symbolLayer = new atlas.layer.SymbolLayer(dataSource, null, {
                iconOptions: {
                    image: 'pin-round-blue',
                    size: 0.8,
                    anchor: 'bottom'
                },
                textOptions: {
                    textField: ['get', 'nameE'], // 修正为nameE
                    offset: [0, 1.2],
                    color: '#2b2d42',
                    font: ['Arial Bold', 12]
                }
            });
            mapInstance.layers.add(symbolLayer);
            mapInstance.events.add('click', symbolLayer, handleMarkerClick);
            mapLoading.style.display = 'none';
        });

        mapInstance.events.add('error', function(err) {
            mapLoading.innerHTML = '<<i class="uil uil-exclamation-circle"></</i> Map load failed';
            mapLoading.style.color = '#e53e3e';
            console.error('Azure Maps error:', err);
        });
    }

    // 加载场馆数据（修正字段映射）
    function loadLocations(filters = {}) {
        const queryParams = new URLSearchParams();
        queryParams.append('sortBy', 'distance');
        queryParams.append('order', 'asc');

        if (filters.keyword) queryParams.append('keyword', filters.keyword);
        if (filters.area) queryParams.append('area', filters.area);
        if (filters.maxDistance) queryParams.append('maxDistance', filters.maxDistance);

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
                }
                throw new Error('Failed to load locations');
            }
            return response.json();
        })
        .then(data => {
            locationsData = data;
            updateMapMarkers();
        })
        .catch(error => {
            mapNoResult.style.display = 'block';
            mapNoResult.querySelector('p').textContent = error.message;
            console.error('Load locations error:', error);
        });
    }

    // 更新地图标记点（修正字段映射）
    function updateMapMarkers() {
        if (dataSource) dataSource.clear();

        if (locationsData.length === 0) {
            mapNoResult.style.display = 'block';
            return;
        }

        mapNoResult.style.display = 'none';

        const features = locationsData.map(location => {
            if (!location.latitude || !location.longitude) return null;
            const coordinate = [location.longitude, location.latitude];
            return new atlas.data.Feature(new atlas.data.Point(coordinate), {
                id: location._id,
                nameE: location.nameE, // 修正为nameE
                nameC: location.nameC || '无',
                distanceKm: location.distanceKm.toFixed(2),
                eventCount: location.eventCount || 0,
                address: location.address || 'Not available'
            });
        }).filter(Boolean);

        dataSource.add(features);

        if (features.length > 0) {
            mapInstance.setCamera({
                bounds: dataSource.getBounds(),
                padding: 50
            });
        }
    }

    // 标记点点击事件
    function handleMarkerClick(e) {
        const properties = e.shapes[0].getProperties();
        if (!properties.id) return;

        const popupContent = `
            <div class="popup-content">
                <h3 class="popup-title">${properties.nameE}</h3>
                <p class="popup-info">中文名称：${properties.nameC}</p>
                <p class="popup-info">Distance: ${properties.distanceKm}km</p>
                <p class="popup-info">Events: ${properties.eventCount}</p>
                <a href="/locations/${properties.id}" class="popup-link">View Details</a>
            </div>
        `;

        const popup = new atlas.Popup({
            position: e.shapes[0].getCoordinates(),
            content: popupContent
        });
        popup.open(mapInstance);
    }

    // 控制按钮事件
    zoomInBtn.addEventListener('click', function() {
        if (mapInstance) mapInstance.setZoom(mapInstance.getZoom() + 1);
    });
    zoomOutBtn.addEventListener('click', function() {
        if (mapInstance) mapInstance.setZoom(mapInstance.getZoom() - 1);
    });
    mapStyleSelect.addEventListener('change', function() {
        const style = this.value;
        let mapStyle = 'road';
        switch (style) {
            case 'satellite':
                mapStyle = 'satellite_road_labels';
                break;
            case 'dark':
                mapStyle = 'grayscale_dark';
                break;
            default:
                mapStyle = 'road';
        }
        if (mapInstance) {
            mapInstance.setStyle(mapStyle);
            const isDarkTheme = document.body.classList.contains('dark');
            if (isDarkTheme && style !== 'dark') {
                mapInstance.setStyle('grayscale_dark');
                this.value = 'dark';
            }
        }
    });

    // 筛选事件监听
    window.addEventListener('filterUpdated', function(e) {
        loadLocations(e.detail);
    });
    document.addEventListener('themeChanged', function(e) {
        const isDark = e.detail.isDark;
        if (mapInstance) {
            mapInstance.setStyle(isDark ? 'grayscale_dark' : 'road');
            mapStyleSelect.value = isDark ? 'dark' : 'road';
        }
    });
});