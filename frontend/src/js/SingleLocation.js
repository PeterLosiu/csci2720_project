document.addEventListener('DOMContentLoaded', function() {
    // 获取URL中的场馆ID
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('id');
    if (!locationId) {
        alert('Location ID not found');
        window.location.href = '../pages/HomePage.html';
        return;
    }

    // 元素获取
    const locationNameE = document.getElementById('locationNameE');
    const locationNameC = document.getElementById('locationNameC');
    const locationDistance = document.getElementById('locationDistance');
    const locationEventCount = document.getElementById('locationEventCount');
    const locationLastUpdated = document.getElementById('locationLastUpdated');
    const addToFavoriteBtn = document.getElementById('addToFavorite');
    const locationMap = document.getElementById('locationMap');
    const commentContent = document.getElementById('commentContent');
    const submitCommentBtn = document.getElementById('submitComment');
    const commentList = document.getElementById('commentList');
    const viewEventsLink = document.getElementById('viewEventsLink'); // 新增：事件链接元素

    // 全局变量
    const token = localStorage.getItem('userToken');
    const baseUrl = 'http://localhost:3000';
    let currentLocation = null;
    let isFavorite = false;
    let mapInstance = null;

    // 初始化：加载场馆详情 + 收藏状态 + 评论
    init();

    async function init() {
        if (!token) {
            window.location.href = '../pages/LoginPage.html';
            return;
        }

        try {
            // 并行加载数据
            const [locationData, favoriteIds] = await Promise.all([
                loadLocationDetails(),
                loadFavoriteIds()
            ]);
            currentLocation = locationData;
            isFavorite = favoriteIds.includes(locationId);
            
            // 渲染页面
            renderLocationDetails();
            initMap();
            loadComments();
            updateFavoriteBtn();
            // 初始化事件跳转链接（新页面打开）
            initEventsLink();
        } catch (error) {
            alert(error.message);
            window.location.href = '../pages/HomePage.html';
        }
    }

    // 加载场馆详情
    async function loadLocationDetails() {
        const response = await fetch(`${baseUrl}/api/locations/${locationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                const error = await response.json();
                throw new Error(error.message);
            }
            throw new Error('Failed to load location details');
        }

        return response.json();
    }

    // 加载用户收藏ID列表
    async function loadFavoriteIds() {
        const response = await fetch(`${baseUrl}/api/user/favorites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return [];
        const favorites = await response.json();
        return favorites.map(item => item._id.toString());
    }

    // 渲染场馆详情
    function renderLocationDetails() {
        locationNameE.textContent = currentLocation.nameE;
        locationNameC.textContent = currentLocation.nameC || 'No Chinese Name';
        locationDistance.textContent = `${currentLocation.distanceKm.toFixed(2)}km`;
        locationEventCount.textContent = currentLocation.eventCount || 0;
        
        const lastUpdated = new Date(currentLocation.lastUpdated);
        locationLastUpdated.textContent = `${lastUpdated.getDate().toString().padStart(2, '0')}/${(lastUpdated.getMonth() + 1).toString().padStart(2, '0')}/${lastUpdated.getFullYear()}, ${lastUpdated.toTimeString().slice(0, 8)}`;
    }

    // 初始化事件跳转链接（新页面打开）
    function initEventsLink() {
        // 设置事件页面跳转URL（根据你的项目结构调整）
        const eventsPageUrl = `../pages/EventPage.html?locationId=${locationId}`;
        // 绑定链接跳转（新标签页打开）
        viewEventsLink.href = eventsPageUrl;
        viewEventsLink.onclick = function(e) {
            // 强制在新标签页打开（即使target="_blank"被覆盖）
            window.open(this.href, '_blank');
            e.preventDefault(); // 阻止默认跳转
        };
        // 无事件时隐藏链接
        if (currentLocation.eventCount === 0 || currentLocation.eventCount === '0') {
            viewEventsLink.parentElement.style.display = 'none';
        }
    }

    // 初始化地图
    function initMap() {
        // 校验地图容器是否存在 + 经纬度是否有效
        if (!locationMap) {
            console.error('地图容器#locationMap不存在');
            return;
        }
        if (!currentLocation.latitude || !currentLocation.longitude) {
            console.error('场馆经纬度缺失:', currentLocation);
            locationMap.innerHTML = '<p style="text-align:center; padding:20px; color:#8d99ae;">No location coordinates available</p>';
            return;
        }

        // 强制设置地图容器样式（避免样式缺失导致点击失效）
        locationMap.style.width = '100%';
        locationMap.style.height = '100%';
        locationMap.style.borderRadius = '8px';
        locationMap.style.overflow = 'hidden';

        // 初始化地图
        mapInstance = L.map('locationMap').setView([currentLocation.latitude, currentLocation.longitude], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(mapInstance);

        // 创建标记并显式绑定点击事件
        const marker = L.marker([currentLocation.latitude, currentLocation.longitude])
            .addTo(mapInstance);

        // 弹窗添加事件（event）相关信息和新页面跳转链接
        const eventsPageUrl = `../pages/EventPage.html?locationId=${locationId}`;
        const popupContent = `
            <div class="location-popup">
                <h3>${currentLocation.nameE}</h3>
                <p>Events: ${currentLocation.eventCount || 0}</p>
                ${currentLocation.eventCount > 0 ? 
                    `<a href="${eventsPageUrl}" class="event-link" target="_blank">View All Events (New Page)</a>` : 
                    '<p>No events available</p>'
                }
            </div>
        `;
        marker.bindPopup(popupContent);

        // 显式绑定标记点击事件（确保弹窗弹出）
        marker.on('click', function() {
            this.openPopup();
            console.log('Marker clicked - Popup opened');
        });

        // 自动打开弹窗（可选）
        marker.openPopup();

        // 绑定地图点击事件（调试用）
        mapInstance.on('click', function(e) {
            console.log('Map clicked at:', e.latlng);
        });
    }

    // 加载评论
    async function loadComments() {
        const response = await fetch(`${baseUrl}/api/comments/location/${locationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            commentList.innerHTML = '<p class="comment-error">Failed to load comments</p>';
            return;
        }

        const comments = await response.json();
        if (comments.length === 0) {
            commentList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        const commentHtml = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-username">${comment.user.username}</span>
                    <span class="comment-time">${new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p class="comment-content">${comment.content}</p>
            </div>
        `).join('');
        commentList.innerHTML = commentHtml;
    }

    // 提交评论
    async function submitComment() {
        const content = commentContent.value.trim();
        if (!content) {
            alert('Comment content is required');
            return;
        }

        submitCommentBtn.disabled = true;
        submitCommentBtn.textContent = 'Submitting...';

        try {
            const response = await fetch(`${baseUrl}/api/comments/location/${locationId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: content })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            // 重置输入框并刷新评论
            commentContent.value = '';
            loadComments();
        } catch (error) {
            alert(error.message);
        } finally {
            submitCommentBtn.disabled = false;
            submitCommentBtn.textContent = 'Submit Comment';
        }
    }

    // 更新收藏按钮状态
    function updateFavoriteBtn() {
        if (isFavorite) {
            addToFavoriteBtn.innerHTML = '<i class="uil uil-heart"></i> Favorited';
            addToFavoriteBtn.style.backgroundColor = '#4361ee';
            addToFavoriteBtn.style.color = '#ffffff';
            addToFavoriteBtn.disabled = true;
        } else {
            addToFavoriteBtn.innerHTML = '<i class="uil uil-heart-alt"></i> Add to Favorite';
            addToFavoriteBtn.style.backgroundColor = '#f0f2ff';
            addToFavoriteBtn.style.color = '#4361ee';
            addToFavoriteBtn.disabled = false;
        }
    }

    // 添加收藏
    async function addToFavorite() {
        addToFavoriteBtn.disabled = true;
        addToFavoriteBtn.innerHTML = '<i class="uil uil-spinner rotating"></i> Adding...';

        try {
            const response = await fetch(`${baseUrl}/api/favorites/locations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ locationId: locationId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            const data = await response.json();
            isFavorite = true;
            updateFavoriteBtn();
            alert(data.message);
        } catch (error) {
            addToFavoriteBtn.innerHTML = '<i class="uil uil-heart-alt"></i> Try Again';
            addToFavoriteBtn.disabled = false;
            alert(error.message);
        }
    }

    // 事件绑定
    submitCommentBtn.addEventListener('click', submitComment);
    addToFavoriteBtn.addEventListener('click', addToFavorite);
    commentContent.addEventListener('keypress', e => e.key === 'Enter' && e.ctrlKey && submitComment());
});