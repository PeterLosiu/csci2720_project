document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('azureMap');
    const mapLoading = document.getElementById('mapLoading');
    const mapNoResult = document.getElementById('mapNoResult');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const mapStyleSelect = document.getElementById('mapStyleSelect');

    const token = localStorage.getItem('userToken');
    const baseUrl = 'http://localhost:3000';
    const mapCenter = [114.2045, 22.4148]; // Azure Maps要求：[longitude, latitude]（正确）
    const mapZoom = 13;
    const azureMapsApiKey = '9R4Zofs0CoJZXjwifmIOQ4wKIzAWggNDH8qpv0eqFAYzivvACdh4JQQJ99BLACYeBjFLXhVXAAAgAZMP2LEh'; // 替换为你的实际API Key
    let mapInstance = null;
    let dataSource = null;
    let locationsData = [];

    // 【新增】先校验容器是否存在+样式是否正确
    if (!mapContainer) {
        console.error('地图容器#azureMap不存在');
        return;
    }
    // 强制触发容器尺寸计算
    mapContainer.style.display = 'block';

    // 初始化地图 + 加载数据
    initAzureMap();
    loadLocations();

    // 初始化Azure Maps（修复容器适配+错误处理）
    function initAzureMap() {
        mapLoading.style.display = 'flex';

        // 【修复】初始化时显式设置容器尺寸
        mapInstance = new atlas.Map('azureMap', {
            center: mapCenter,
            zoom: mapZoom,
            authOptions: {
                authType: 'subscriptionKey',
                subscriptionKey: azureMapsApiKey
            },
            // 【新增】强制适配容器
            view: 'Auto'
        });

        mapInstance.events.add('ready', function() {
            // 【新增】确保地图加载完成后适配容器
            mapInstance.resize();
            
            // 添加缩放控件
            mapInstance.controls.add(new atlas.control.ZoomControl(), { position: 'bottom-right' });
            dataSource = new atlas.source.DataSource();
            mapInstance.sources.add(dataSource);

            // 标记点图层配置（保持原逻辑）
            const symbolLayer = new atlas.layer.SymbolLayer(dataSource, null, {
                iconOptions: {
                    image: 'pin-round-blue',
                    size: 0.8,
                    anchor: 'bottom'
                },
                textOptions: {
                    textField: ['get', 'nameE'],
                    offset: [0, 1.2],
                    color: '#2b2d42',
                    font: ['Arial Bold', 12]
                }
            });
            mapInstance.layers.add(symbolLayer);
            // 1. 鼠标移入：显示弹窗并改变鼠标样式
            mapInstance.events.add('mouseenter', symbolLayer, (e) => {
                mapInstance.getCanvas().style.cursor = 'pointer';
                handleMarkerHover(e);
            });
            // 2. 鼠标移出：关闭弹窗 (可选)
            mapInstance.events.add('mouseleave', symbolLayer, () => {
                mapInstance.getCanvas().style.cursor = '';
                popup.close()
                // 如果你希望鼠标离开就关闭，可以在这里调用 popup.close()
            });
            mapInstance.events.add('click', symbolLayer, handleMarkerClick);
            
            mapLoading.style.display = 'none';
        });

        // 【增强】更详细的错误处理
        mapInstance.events.add('error', function(err) {
            mapLoading.innerHTML = '<<i class="uil uil-exclamation-circle"></</i> Map load failed';
            mapLoading.style.color = '#e53e3e';
            console.error('Azure Maps加载失败:', err);
        });
    }

    // 加载场馆数据（保持原逻辑，补充无数据处理）
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
            console.error('加载场馆数据失败:', error);
        });
    }

    // 更新地图标记点（保持原逻辑）
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
                nameE: location.nameE,
                nameC: location.nameC || '无',
                distanceKm: location.distanceKm.toFixed(2),
                eventCount: location.eventCount || 0,
                address: location.address || 'Not available'
            });
        }).filter(Boolean);

        dataSource.add(features);

        // 自动适配所有标记点的边界
        if (features.length > 0) {
            mapInstance.setCamera({
                bounds: dataSource.getBounds(),
                padding: 50
            });
        }
    }

    // 标记点hover事件（修复链接路径）
    function handleMarkerHover(e) {
        // close other popups first
        if (activePopup) activePopup.close();

        const properties = e.shapes[0].getProperties();
        const coordinate = e.shapes[0].getCoordinates();
        if (!properties.id) return;

        const popupContent = `
            <div class="popup-content">
                <h3 class="popup-title">${properties.nameE}</h3>
                <p class="popup-info">中文名称：${properties.nameC}</p>
                <p class="popup-info">Distance: ${properties.distanceKm}km</p>
                <p class="popup-info">Events: ${properties.eventCount}</p>
                <!-- 【修复】链接路径改为相对路径，匹配你的项目结构 -->
                <a href="../pages/SingleLocation.html?id=${properties.id}" class="popup-link">View Details</a>
            </div>
        `;

        const popup = new atlas.Popup({
            position: coordinate,
            content: popupContent
        });
        popup.open(mapInstance);
    }

    // 标记点点击事件
    function handleMarkerClick(e) {
        const properties = e.shapes[0].getProperties();
        if (!properties.id) return;
        window.location.href = `../pages/SingleLocation.html?id=${properties.id}`;
    }


    // 控制按钮事件（保持原逻辑）
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

    // 筛选事件监听（保持原逻辑）
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