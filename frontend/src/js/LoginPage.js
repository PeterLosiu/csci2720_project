// 等待DOM加载完成后执行（避免操作未渲染元素）
document.addEventListener('DOMContentLoaded', function() {
    // 1. 获取页面核心元素
    const loginForm = document.getElementById('loginForm'); // 登录表单
    const usernameInput = document.getElementById('username'); // 用户名输入框
    const passwordInput = document.getElementById('password'); // 密码输入框
    const togglePwBtn = document.getElementById('togglePw'); // 密码显示/隐藏按钮
    const rememberMeCheckbox = document.getElementById('rememberMe'); // 记住我复选框
    const errorMsg = document.getElementById('errorMsg'); // 错误提示框
    const goToRegisterBtn = document.getElementById('goToRegister'); // 注册入口按钮
    const loginBtn = loginForm.querySelector('.login-btn'); // 登录按钮

    // 2. 密码显示/隐藏功能（切换input类型+图标）
    togglePwBtn.addEventListener('click', function() {
        // 切换密码输入框类型（password <-> text）
        const isPwHidden = passwordInput.type === 'password';
        passwordInput.type = isPwHidden ? 'text' : 'password';
        
        // 切换图标（隐藏 <-> 显示）
        togglePwBtn.classList.toggle('uil-eye-slash');
        togglePwBtn.classList.toggle('uil-eye');
        
        // 切换图标提示文字
        togglePwBtn.title = isPwHidden ? 'Hide Password' : 'Show Password';
    });

    // 3. 登录表单提交逻辑（核心：对接后端/api/auth/login）
    loginForm.addEventListener('submit', function(e) {
        // 阻止表单默认提交行为（避免页面刷新，符合SPA要求）
        e.preventDefault();

        // 3.1 前端预校验（减少无效后端请求）
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // 校验用户名不为空（已通过HTML required属性，但额外做trim校验）
        if (!username) {
            errorMsg.textContent = 'Please enter your username';
            usernameInput.focus(); // 聚焦到用户名输入框，提升体验
            return;
        }

        // 校验密码≥8字符（后端要求，前端预校验）
        if (password.length < 8) {
            errorMsg.textContent = 'Password must be at least 8 characters';
            passwordInput.focus(); // 聚焦到密码输入框
            return;
        }

        // 3.2 构造登录请求数据（与后端接口参数对齐）
        const loginData = {
            username: username,
            password: password
        };

        // 3.3 加载状态处理（避免重复点击，提升体验）
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        errorMsg.textContent = ''; // 清空之前的错误提示
        errorMsg.style.opacity = '0'; // 隐藏错误提示（过渡动画）

        // 3.4 发送登录请求到后端（对接/api/auth/login）
        fetch('https://api.example.com/api/auth/login', { // 【注意：替换为真实后端域名】
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // 后端要求JSON格式
                'Accept': 'application/json' // 告知后端期望返回JSON
            },
            body: JSON.stringify(loginData), // 将登录数据转为JSON字符串
            credentials: 'include' // 若后端需要跨域Cookie，需添加此配置
        })
        .then(response => {
            // 处理后端响应（根据HTTP状态码判断是否成功）
            if (!response.ok) {
                // 响应状态码非200-299（如401：用户名密码错误，400：参数错误）
                return response.json().then(err => { 
                    // 抛出后端返回的错误信息（如{ message: "Invalid username or password" }）
                    throw new Error(err.message || 'Login failed. Please try again.');
                });
            }
            // 登录成功：解析后端返回的token和用户信息
            return response.json();
        })
        .then(loginResult => {
            // 后端返回结果格式（与后端接口对齐）：
            // loginResult = { 
            //   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT令牌
            //   username: "admin", // 用户名
            //   isAdmin: true/false // 是否为管理员（后端通过token区分角色）
            // }

            // 3.4.1 存储token和用户信息（根据Remember Me选择存储方式）
            const storage = rememberMeCheckbox.checked ? localStorage : sessionStorage;
            storage.setItem('userToken', loginResult.token); // 存储JWT令牌
            storage.setItem('currentUser', JSON.stringify({
                username: loginResult.username,
                isAdmin: loginResult.isAdmin // 存储角色信息（用于后续页面权限控制）
            }));

            // 3.4.2 SPA无刷新跳转（跳转到首页，避免页面刷新）
            // 方式1：若使用前端路由（如React Router/Vue Router），使用路由跳转
            // 示例（React Router）：navigate('/pages/HomePage');
            // 示例（Vue Router）：this.$router.push('/pages/HomePage');
            
            // 方式2：无路由框架时，修改URL并加载首页内容（符合SPA要求）
            // 【注意：替换为项目实际的首页路径】
            window.location.href = '../pages/HomePage.html';
        })
        .catch(error => {
            // 处理登录失败（如用户名密码错误、后端异常、网络错误）
            errorMsg.textContent = error.message;
            errorMsg.style.opacity = '1'; // 显示错误提示（过渡动画）
            
            // 清空输入框（提升体验，方便用户重新输入）
            passwordInput.value = '';
            passwordInput.focus();
        })
        .finally(() => {
            // 恢复登录按钮状态（无论成功/失败）
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        });
    });

    // 4. 注册入口跳转（SPA无刷新跳转预留）
    goToRegisterBtn.addEventListener('click', function() {
        // 方式1：路由跳转（如React Router/Vue Router）
        // 示例（React Router）：navigate('/pages/RegisterPage');
        // 示例（Vue Router）：this.$router.push('/pages/RegisterPage');
        
        // 方式2：无路由框架时，跳转至注册页面
        // 【注意：替换为项目实际的注册页面路径】
        window.location.href = '../pages/RegisterPage.html';
    });

    // 5. 页面加载时的初始化（可选：从storage中恢复用户名，提升体验）
    window.addEventListener('load', function() {
        const savedUsername = localStorage.getItem('savedUsername');
        if (savedUsername) {
            usernameInput.value = savedUsername;
            rememberMeCheckbox.checked = true; // 勾选Remember Me
        }
    });

    // 6. 监听Remember Me状态（可选：保存用户名到localStorage，提升下次登录体验）
    rememberMeCheckbox.addEventListener('change', function() {
        if (this.checked && usernameInput.value.trim()) {
            // 勾选且用户名不为空：保存用户名到localStorage
            localStorage.setItem('savedUsername', usernameInput.value.trim());
        } else {
            // 取消勾选：删除保存的用户名
            localStorage.removeItem('savedUsername');
        }
    });
});