// 等待DOM加载完成后执行（避免操作未渲染元素）
document.addEventListener('DOMContentLoaded', function() {
    // 1. 获取页面核心元素（增加判空，避免元素不存在时报错）
    const loginForm = document.getElementById('loginForm'); // 登录表单
    const usernameInput = document.getElementById('username'); // 用户名输入框
    const passwordInput = document.getElementById('password'); // 密码输入框
    const togglePwBtn = document.getElementById('togglePw'); // 密码显示/隐藏按钮
    const rememberMeCheckbox = document.getElementById('rememberMe'); // 记住我复选框
    const errorMsg = document.getElementById('errorMsg'); // 错误提示框
    const loginBtn = loginForm ? loginForm.querySelector('.login-btn') : null; // 登录按钮


    // 安全校验：核心登录元素缺失则终止执行
    if (!loginForm || !usernameInput || !passwordInput || !loginBtn) {
        console.error('核心登录表单元素缺失，请检查HTML结构');
        return;
    }

    // 2. 后端接口基础地址（替换为你的本地后端实际端口）
    const baseUrl = 'http://localhost:3000';

    // 3. 工具函数：带超时的fetch（避免请求挂起）
    function fetchWithTimeout(url, options = {}, timeout = 10000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout (10s)')), timeout)
            )
        ]);
    }

    // 4. 密码显示/隐藏功能（增加元素存在性校验，修复图标切换逻辑）
    if (togglePwBtn) {
        togglePwBtn.addEventListener('click', function() {
            // 切换密码输入框类型（password <-> text）
            const isPwHidden = passwordInput.type === 'password';
            passwordInput.type = isPwHidden ? 'text' : 'password';
            
            // 切换图标（先移除旧类，再添加新类，避免类名叠加）
            togglePwBtn.classList.remove(isPwHidden ? 'uil-eye-slash' : 'uil-eye');
            togglePwBtn.classList.add(isPwHidden ? 'uil-eye' : 'uil-eye-slash');
            
            // 切换图标提示文字
            togglePwBtn.title = isPwHidden ? 'Hide Password' : 'Show Password';
        });
    }

    // 5. 登录表单提交逻辑（核心：对接本地后端/api/auth/login）
    loginForm.addEventListener('submit', function(e) {
        // 阻止表单默认提交行为（避免页面刷新）
        e.preventDefault();

        // 5.1 前端预校验（减少无效后端请求）
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // 校验用户名不为空
        if (!username) {
            errorMsg && (errorMsg.textContent = 'Please enter your username');
            errorMsg && (errorMsg.style.opacity = '1');
            usernameInput.focus();
            return;
        }

        // 校验密码≥8字符
        if (password.length < 8) {
            errorMsg && (errorMsg.textContent = 'Password must be at least 8 characters');
            errorMsg && (errorMsg.style.opacity = '1');
            passwordInput.focus();
            return;
        }

        // 5.2 构造登录请求数据
        const loginData = {
            username: username,
            password: password
        };

        // 5.3 加载状态处理（避免重复点击）
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        errorMsg && (errorMsg.textContent = '');
        errorMsg && (errorMsg.style.opacity = '0');

        // 5.4 发送登录请求到本地后端
        fetchWithTimeout(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(loginData)
        })
        .then(response => {
            // 处理后端非200响应
            if (!response.ok) {
                return response.json().then(err => { 
                    throw new Error(err.message || 'Login failed. Please try again.');
                });
            }
            return response.json();
        })
        .then(loginResult => {
            // 存储token和用户信息（根据Remember Me选择存储方式）
            const storage = rememberMeCheckbox?.checked ? localStorage : sessionStorage;
            storage.setItem('userToken', loginResult.token); // 存储JWT令牌            
            storage.setItem('currentUser', JSON.stringify({
                username: loginResult.username,
                isAdmin: loginResult.isAdmin // 存储角色信息（用于权限控制）
            }));
            console.log(loginResult.username, loginResult.isAdmin, storage.getItem('userToken'))

            // 登录成功跳转首页（路径：LoginPages.html 同目录的 HomePage.html）
            // 若首页路径不同，修改此处即可（比如：./html/HomePage.html）
            window.location.href = '../pages/HomePage.html';
        })
        .catch(error => {
            // 处理登录失败（用户名错误/网络问题等）
            errorMsg && (errorMsg.textContent = error.message);
            errorMsg && (errorMsg.style.opacity = '1');
            
            // 清空密码框，聚焦以便重新输入
            passwordInput.value = '';
            passwordInput.focus();
        })
        .finally(() => {
            // 恢复登录按钮状态（无论成功/失败）
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        });
    });

    // 6. 页面加载初始化：恢复记住的用户名
    window.addEventListener('load', function() {
        if (rememberMeCheckbox && usernameInput) {
            const savedUsername = localStorage.getItem('savedUsername');
            if (savedUsername) {
                usernameInput.value = savedUsername;
                rememberMeCheckbox.checked = true; // 勾选Remember Me
            }
        }
    });

    // 7. 监听Remember Me状态：保存/删除用户名
    if (rememberMeCheckbox && usernameInput) {
        rememberMeCheckbox.addEventListener('change', function() {
            const username = usernameInput.value.trim();
            if (this.checked && username) {
                // 勾选且用户名不为空：保存到localStorage
                localStorage.setItem('savedUsername', username);
            } else {
                // 取消勾选：删除保存的用户名
                localStorage.removeItem('savedUsername');
            }
        });
    }
});