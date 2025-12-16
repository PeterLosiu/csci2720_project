// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../css/Navbar.css';
import { UilMoon, UilSun, UilSignOut } from '@iconscout/react-unicons';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();  // 获取当前路由信息

  // 初始化：获取登录状态和主题偏好
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);

    // 主题初始化（优先本地存储，其次系统主题）
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkTheme(true);
      document.body.classList.add('dark');
    } else {
      setIsDarkTheme(false);
      document.body.classList.remove('dark');
    }
  }, []);

  // 切换主题
  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
    document.body.classList.toggle('dark');
    localStorage.setItem('appTheme', isDarkTheme ? 'light' : 'dark');
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('savedUsername');
    navigate('/login', { replace: true });  // 无刷新跳转登录页
  };

  // 判断当前路由是否匹配（用于导航栏激活状态）
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      {/* 左侧Logo与菜单 */}
      <div className="navbar-left">
        <Link to="/" className="logo">Location & Event App</Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/locations" className={`nav-link ${isActive('/locations') ? 'active' : ''}`}>
              Location List
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}>
              Favourite List
            </Link>
          </li>
          {/* 管理员专属菜单（仅管理员显示） */}
          {currentUser?.isAdmin && (
            <>
              <li className="nav-item">
                <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>
                  User Manager
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/admin/events" className={`nav-link ${isActive('/admin/events') ? 'active' : ''}`}>
                  Event Manager
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* 右侧：主题切换+用户信息+退出登录 */}
      <div className="navbar-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkTheme ? <UilSun /> : <UilMoon />}
        </button>
        {currentUser && (
          <div className="user-info">
            <span className="username">{currentUser.username}</span>
            <button className="logout-btn" onClick={handleLogout}>
              <UilSignOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;