import React, { useState, useEffect } from 'react';
import { useNavigate, Link} from 'react-router-dom';
import Navbar from './Navbar';
import '../style/LoginPage.css'
import API_BASE_URL from '../config';


const LoginPage = () => {

    // 关键连接点 2: 替代 getElementById，使用 State 管理数据
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 替代 togglePw 逻辑
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const baseUrl = API_BASE_URL;

    // 关键连接点 3: 替代 window.onload，页面加载时执行一次
    useEffect(() => {
        const savedUsername = localStorage.getItem('savedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    // 关键连接点 4: 替代 fetchWithTimeout 工具函数
    const fetchWithTimeout = (url, options, timeout = 10000) => {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 5.1 前端校验逻辑 (逻辑保持不变)
        if (!username) return setError('Please enter your username');
        if (password.length < 8) return setError('Password must be at least 8 characters');

        setLoading(true);

        try {
            const response = await fetchWithTimeout(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed');

            // 关键连接点 5: 存储逻辑
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('userToken', data.token);
            storage.setItem('currentUser', JSON.stringify({ 
                username: data.username, 
                isAdmin: data.isAdmin 
            }));

            if (rememberMe) {
                localStorage.setItem('savedUsername', username);
            } else {
                localStorage.removeItem('savedUsername');
            }

            // 关键连接点 6: 替代 window.location.href (SPA 内部跳转)
            navigate('/home'); 

        } catch (err) {
            setError(err.message);
            setPassword(''); // 清空密码
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="login-container">
                <h1 className="login-title">Login</h1>
                
                {/* 关键连接点 7: 动态显示错误信息 */}
                {error && <div id="errorMsg" style={{ opacity: 1, color: 'red' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label><i className="uil uil-user"></i> Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            className="form-input" required 
                        />
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                        <label><i className="uil uil-lock"></i> Password</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input" required 
                        />
                        {/* 关键连接点 8: 密码切换图标 */}
                        <i 
                            className={`uil ${showPassword ? 'uil-eye' : 'uil-eye-slash'} toggle-pw`}
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide Password" : "Show Password"}
                            style={{ cursor: 'pointer', position: 'absolute', right: '10px', top: '35px' }}
                        ></i>
                    </div>

                    <div className="form-group-checkbox">
                        <input 
                            type="checkbox" 
                            checked={rememberMe} 
                            onChange={(e) => setRememberMe(e.target.checked)} 
                        />
                        <label> Remember Me</label>
                    </div>

                    <div>
                        <Link to="/signup">Sign up</Link>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );

    // return(
    //     <div className="page-wrapper">
    //         <Navbar />
    //         {/* <!-- 登录页主体内容（示例，可替换为你的原表单） --> */}
    //         <div class="login-container">
    //             <h1 class="login-title">Login to Location & Event App</h1>
    //             <form id="loginForm" class="login-form">
    //                 <div class="form-group">
    //                     <label for="username" class="form-label">
    //                         <i class="uil uil-user"></i> Username
    //                     </label>
    //                     <input type="text" id="username" class="form-input" placeholder="Enter your username" required />
    //                 </div>
    //                 <div class="form-group">
    //                     <label for="password" class="form-label">
    //                         <i class="uil uil-lock"></i> Password
    //                     </label>
    //                     <input type="password" id="password" class="form-input" placeholder="Enter your password" required />
    //                 </div>
    //                 <button type="submit" class="login-btn">Login</button>
    //             </form>
    //         </div>
    //     </div>
    // );
};

export default LoginPage;