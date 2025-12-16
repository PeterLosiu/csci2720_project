document.addEventListener('DOMContentLoaded', function() {
    const keywordFilter = document.getElementById('keywordFilter');
    const areaFilter = document.getElementById('areaFilter');
    const distanceFilter = document.getElementById('distanceFilter');
    const sortByFilter = document.getElementById('sortByFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const tableBody = document.getElementById('tableBody');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    const locationCountEl = document.getElementById('locationCount');
    const noResultEl = document.getElementById('noResult');

    const token = localStorage.getItem('userToken');
    const baseUrl = 'http://localhost:3000';
    let locationsData = [];
    let favoriteLocationIds = new Set();

    // 初始化
    init();

    async function init() {
        if (!token) {
            window.location.href = '../pages/LoginPage.html';
            return;
        }

        try {
            const [favorites] = await Promise.all([
                loadUserFavorites()
            ]);
            favorites.forEach(item => {
                if (item._id) favoriteLocationIds.add(item._id.toString());
            });
            await loadLocations();
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>`;
            console.error('Init error:', error);
        }
    }

    // 加载收藏列表
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
        .catch(error => {
            console.error('Failed to load favorites:', error);
            return [];
        });
    }

    // 加载场馆数据（修正排序参数、字段映射）
    function loadLocations() {
        tableBody.innerHTML = `<tr class="loading-row"><td colspan="5">Loading locations...</td></tr>`;
        noResultEl.style.display = 'none';

        const queryParams = new URLSearchParams();
        const [sortField, sortOrder] = sortByFilter.value.split('-');
        
        // 传递后端要求的排序参数
        queryParams.append('sortBy', sortField);
        queryParams.append('order', sortOrder);
        
        // 筛选参数
        if (keywordFilter.value.trim()) queryParams.append('keyword', keywordFilter.value.trim());
        if (areaFilter.value) queryParams.append('area', areaFilter.value);
        if (distanceFilter.value) queryParams.append('maxDistance', distanceFilter.value);

        return fetch(`${baseUrl}/api/locations?${queryParams.toString()}`, {
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
            updateStatusBar();
            renderTable();
        })
        .catch(error => {
            tableBody.innerHTML = `<tr><td colspan="5">${error.message}. Please try again later.</td></tr>`;
            console.error('Load locations error:', error);
        });
    }

    // 更新状态栏
    function updateStatusBar() {
        const lastUpdated = locationsData.length > 0 ? locationsData[0].lastUpdated : new Date();
        const date = new Date(lastUpdated);
        lastUpdatedEl.textContent = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}, ${date.toTimeString().slice(0, 8)}`;
        locationCountEl.textContent = locationsData.length;
    }

    // 渲染表格（修正name→nameE，numberOfEvents→eventCount）
    function renderTable() {
        if (locationsData.length === 0) {
            tableBody.innerHTML = '';
            noResultEl.style.display = 'block';
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

        tableBody.innerHTML = tableHtml;
        bindFavoriteEvents();
    }

    // 绑定收藏事件
    function bindFavoriteEvents() {
        document.querySelectorAll('.add-to-favorite:not([disabled])').forEach(btn => {
            btn.addEventListener('click', function() {
                const locationId = this.getAttribute('data-location-id');
                addToFavorite(locationId, this);
            });
        });
    }

    // 添加收藏
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

    // 事件绑定
    applyFiltersBtn.addEventListener('click', loadLocations);
    resetFiltersBtn.addEventListener('click', function() {
        keywordFilter.value = '';
        areaFilter.value = '';
        distanceFilter.value = '';
        sortByFilter.value = 'name-asc';
        loadLocations();
    });
    sortByFilter.addEventListener('change', loadLocations);
    keywordFilter.addEventListener('keypress', e => e.key === 'Enter' && loadLocations());
    distanceFilter.addEventListener('keypress', e => e.key === 'Enter' && loadLocations());
});