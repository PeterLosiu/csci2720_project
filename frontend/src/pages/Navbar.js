import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../style/NavbarStyle.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // 用于检测当前路径，实现链接激活状态

    // --- State 状态管理 ---
    const [currentUser, setCurrentUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- 初始化逻辑 (替代 DOMContentLoaded) ---
    useEffect(() => {
        // 1. 检查登录状态
        const token = localStorage.getItem('userToken');
        const user = JSON.parse(localStorage.getItem('currentUser'));

        if (!token || !user) {
            // 如果是在登录页或注册页，不强制跳转
            if (location.pathname !== '/login' && location.pathname !== '/signup') {
                navigate('/login');
            }
        } else {
            setCurrentUser(user);
        }

        // 2. 初始化主题
        const savedTheme = localStorage.getItem('appTheme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark');
            setIsDarkMode(true);
        }
    }, [navigate, location.pathname]);

    // --- 功能函数 ---
    const handleLogout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('currentUser');
        // localStorage.removeItem('savedUsername'); // 如果需要记住用户名则不删
        navigate('/login');
    };

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.body.classList.add('dark');
            localStorage.setItem('appTheme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('appTheme', 'light');
        }
    };

    // 如果未登录且在登录页，可以选择不渲染 Navbar
    if (!currentUser && (location.pathname === '/login' || location.pathname === '/signup')) {
        return null; 
    }

    return (
        <nav className="navbar">
            {/* 左侧Logo与菜单 */}
            <div className="navbar-left">
                <span className="logo">Location & Event App</span>
                
                {/* 汉堡菜单图标 (移动端) */}
                <button 
                    className="hamburger-menu" 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <i className={`uil ${isMobileMenuOpen ? 'uil-times' : 'uil-bars'}`}></i>
                </button>

                <ul className={`nav-menu ${isMobileMenuOpen ? 'show-mobile' : ''}`}>
                    <li className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                        <Link to="/">Home</Link>
                    </li>
                    {/* <li className={`nav-item ${location.pathname === '/LocationList' ? 'active' : ''}`}>
                        <Link to="/LocationList">Location List</Link>
                    </li> */}
                    <li className={`nav-item ${location.pathname === '/Map' ? 'active' : ''}`}>
                        <Link to="/Map">Map</Link>
                    </li>
                    <li className={`nav-item ${location.pathname === '/FavouriteList' ? 'active' : ''}`}>
                        <Link to="/FavouriteList">Favourite List</Link>
                    </li>
                    
                    {/* 管理员专属菜单 */}
                    {currentUser?.isAdmin && (
                        <>
                            <li className={`nav-item ${location.pathname === '/EventList' ? 'active' : ''}`}>
                                <Link to="/EventList">Event List</Link>
                            </li>
                            <li className={`nav-item ${location.pathname === '/UserManager' ? 'active' : ''}`}>
                                <Link to="/UserManager">User Manager</Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* 右侧：主题切换+用户名+退出登录 */}
            <div className="navbar-right">
                <button className="theme-toggle" onClick={toggleTheme}>
                    <i className={`uil ${isDarkMode ? 'uil-sun' : 'uil-moon'}`}></i>
                </button>
                
                <div className="user-info">
                    <span className="username">{currentUser?.username}</span>
                    <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;