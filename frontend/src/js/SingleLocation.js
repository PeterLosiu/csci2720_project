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

    // 初始化地图
    function initMap() {
        if (!currentLocation.latitude || !currentLocation.longitude) return;

        mapInstance = L.map('locationMap').setView([currentLocation.latitude, currentLocation.longitude], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);

        // 添加场馆标记
        L.marker([currentLocation.latitude, currentLocation.longitude]).addTo(mapInstance)
            .bindPopup(`<b>${currentLocation.nameE}</b>`)
            .openPopup();
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
            addToFavoriteBtn.innerHTML = '<<i class="uil uil-heart"></</i> Favorited';
            addToFavoriteBtn.style.backgroundColor = '#4361ee';
            addToFavoriteBtn.style.color = '#ffffff';
            addToFavoriteBtn.disabled = true;
        } else {
            addToFavoriteBtn.innerHTML = '<<i class="uil uil-heart-alt"></</i> Add to Favorite';
            addToFavoriteBtn.style.backgroundColor = '#f0f2ff';
            addToFavoriteBtn.style.color = '#4361ee';
            addToFavoriteBtn.disabled = false;
        }
    }

    // 添加收藏
    async function addToFavorite() {
        addToFavoriteBtn.disabled = true;
        addToFavoriteBtn.innerHTML = '<<i class="uil uil-spinner rotating"></</i> Adding...';

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
            addToFavoriteBtn.innerHTML = '<<i class="uil uil-heart-alt"></</i> Try Again';
            addToFavoriteBtn.disabled = false;
            alert(error.message);
        }
    }

    // 事件绑定
    submitCommentBtn.addEventListener('click', submitComment);
    addToFavoriteBtn.addEventListener('click', addToFavorite);
    commentContent.addEventListener('keypress', e => e.key === 'Enter' && e.ctrlKey && submitComment());
});