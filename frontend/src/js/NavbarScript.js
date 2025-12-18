document.addEventListener('DOMContentLoaded', function() {
    // 1. 获取元素（匹配最新Navbar.html）
    const currentUsernameEl = document.getElementById('currentUsername');
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggle = document.getElementById('themeToggle');
    const adminMenus = document.querySelectorAll('.admin-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburgerMenu = document.getElementById('hamburgerMenu'); // 新增：汉堡菜单
    const mainNavMenu = document.getElementById('mainNavMenu'); // 新增：主菜单容器

    // 2. 校验登录状态（修正LoginPage路径：匹配你的文件结构）
    const token = localStorage.getItem('userToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!token || !currentUser) {
        // 关键修正：LoginPage.html 路径（根据Navbar.html所在层级调整）
        // Navbar.html在components目录 → 跳转pages/LoginPage.html需用 '../pages/LoginPage.html'
        window.location.href = '../pages/LoginPage.html';
        return;
    }

    // 3. 显示用户名与权限控制（保持）
    currentUsernameEl.textContent = currentUser.username;
    if (currentUser.isAdmin) {
        adminMenus.forEach(menu => {
            menu.style.display = 'inline-block';
            menu.hidden = false; // 配合HTML的hidden属性
            menu.setAttribute('aria-hidden', 'false');
        });
    }

    // 4. 退出登录功能（修正LoginPage路径）
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('savedUsername');
        window.location.href = '../pages/LoginPage.html'; // 同登录校验路径
    });

    // 5. 深色/浅色主题切换（保持，已修复图标语法）
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
        themeToggle.innerHTML = '<i class="uil uil-sun"></i>';
    } else {
        document.body.classList.remove('dark');
        themeToggle.innerHTML = '<i class="uil uil-moon"></i>';
    }

    themeToggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('dark');
        if (isDark) {
            themeToggle.innerHTML = '<i class="uil uil-sun"></i>';
            localStorage.setItem('appTheme', 'dark');
        } else {
            themeToggle.innerHTML = '<i class="uil uil-moon"></i>';
            localStorage.setItem('appTheme', 'light');
        }
    });

    // 6. 导航栏链接激活状态（核心修正：路径匹配逻辑）
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // 跳过禁用的Map项（href="#"）
        if (linkHref === '#') return;
        
        // 修正匹配逻辑：
        // 1. 提取链接的文件名（如 ../pages/HomePage.html → HomePage.html）
        // 2. 匹配当前路径是否包含该文件名（适配不同服务器/层级）
        const linkFileName = linkHref.split('/').pop();
        if (currentPath.includes(linkFileName)) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });

    // 7. 点击导航链接切换激活状态（修正：兼容JS/JSX文件跳转）
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetHref = this.getAttribute('href');
            // 跳过禁用的Map项
            if (targetHref === '#') {
                e.preventDefault();
                return;
            }

            // 切换激活状态
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // 兼容JS/JSX文件跳转（若为React路由，需额外处理，此处保持原生跳转）
            if (targetHref.endsWith('.js') || targetHref.endsWith('.jsx')) {
                // 若JS/JSX需通过路由加载，可在此处添加路由逻辑，否则原生跳转
                window.location.href = targetHref;
            } else {
                window.location.href = targetHref;
            }
        });
    });

    // 8. 新增：移动端汉堡菜单逻辑（适配Navbar.html的hamburgerMenu）
    if (hamburgerMenu && mainNavMenu) {
        hamburgerMenu.addEventListener('click', function() {
            // 切换菜单显示/隐藏
            mainNavMenu.classList.toggle('show-mobile');
            
            // 切换汉堡菜单图标（菜单/关闭）
            if (mainNavMenu.classList.contains('show-mobile')) {
                hamburgerMenu.innerHTML = '<i class="uil uil-times"></i>';
                hamburgerMenu.setAttribute('aria-label', 'Close Navigation Menu');
            } else {
                hamburgerMenu.innerHTML = '<i class="uil uil-bars"></i>';
                hamburgerMenu.setAttribute('aria-label', 'Toggle Navigation Menu');
            }
        });
    }
});