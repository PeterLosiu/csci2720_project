// js/NavbarScript.js
document.addEventListener('DOMContentLoaded', function() {
    // 1. 获取元素
    const currentUsernameEl = document.getElementById('currentUsername');
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggle = document.getElementById('themeToggle');
    const adminMenus = document.querySelectorAll('.admin-menu');
    const token = localStorage.getItem('userToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // 2. 校验登录状态（未登录自动跳转登录页）
    if (!token || !currentUser) {
        window.location.href = '../pages/LoginPage.html';
        return;
    }

    // 3. 显示用户名与权限控制
    currentUsernameEl.textContent = currentUser.username;
    if (currentUser.isAdmin) {
        adminMenus.forEach(menu => menu.style.display = 'block'); // 管理员显示专属菜单
    }

    // 4. 退出登录功能
    logoutBtn.addEventListener('click', function() {
        // 清除localStorage/sessionStorage中的token和用户信息
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('savedUsername'); // 清除保存的用户名

        // SPA无刷新跳转登录页
        window.location.href = '../pages/LoginPage.html';
    });

    // 5. 深色/浅色主题切换（额外功能）
    const savedTheme = localStorage.getItem('appTheme');
    // 初始化主题（优先使用保存的主题，无则适配系统主题）
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
        themeToggle.innerHTML = '<<i class="uil uil-sun"></</i>';
    } else {
        document.body.classList.remove('dark');
        themeToggle.innerHTML = '<<i class="uil uil-moon"></</i>';
    }

    // 切换主题
    themeToggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('dark');
        if (isDark) {
            themeToggle.innerHTML = '<<i class="uil uil-sun"></</i>';
            localStorage.setItem('appTheme', 'dark');
        } else {
            themeToggle.innerHTML = '<<i class="uil uil-moon"></</i>';
            localStorage.setItem('appTheme', 'light');
        }
    });

    // 6. 导航栏链接激活状态（根据当前URL切换）
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.hash || '#home';
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 点击导航链接切换激活状态（SPA无刷新）
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetHref = this.getAttribute('href');
            window.location.hash = targetHref; // 更新URL hash，保留浏览器历史

            // 切换激活状态
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // 后续可添加页面内容切换逻辑（如加载对应组件）
        });
    });
});